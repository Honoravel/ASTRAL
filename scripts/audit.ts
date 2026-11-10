// Auditoria de balanceamento: roda simulações instrumentadas e gera docs/AUDITORIA_BALANCEAMENTO.md.
//
//   tsx scripts/audit.ts run <A|B|C|D>   roda uma parte das medições e grava docs/auditoria/dados-<parte>.json
//   tsx scripts/audit.ts report          monta o relatório e os gráficos a partir dos dados gravados
//
// O script só observa: usa o gancho `telemetry` do motor e não altera nenhuma regra do jogo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { aiChoose, DEFAULT_POLICY, type AiPolicy } from '../src/engine/ai';
import { HOUSES, NODES, RETURNS, SHORTCUTS } from '../src/engine/board';
import { cardName, CARDS, useLabel } from '../src/engine/cards';
import { RULES } from '../src/engine/config';
import { ELEMENT_NAME, GODS, SIGNS } from '../src/engine/data';
import { apply, moveOptions, newGame, telemetry } from '../src/engine/game';
import type { Command, GameState, Player } from '../src/engine/types';

const DIR = 'docs/auditoria';
/** Fração da amostra (1 = completa); use AUDIT_SCALE=0.05 para um teste rápido. */
const SCALE = Number(process.env.AUDIT_SCALE ?? 1);
type Res4 = { g: number; d: number; f: number; h: number };
const snap = (p: Player): Res4 => ({ g: p.gloria, d: p.dracmas, f: p.favor, h: p.hubris });
const zero4 = (): Res4 => ({ g: 0, d: 0, f: 0, h: 0 });

interface Collector {
  label: string;
  seats: number;
  goal: number;
  games: number;
  unfinished: number;
  rounds: number[];
  cards: { drawn: number; move: number; effect: number; arrival: number; trap: number; cost: number; gain: Res4; seatUse: number[]; seatEffect: number[] }[];
  temples: { visits: number; noOption: number; cats: Record<string, number>; actions: Record<string, number>; spent: number; gain: Res4; relics: number; invest: number }[];
  turns: Record<string, { n: number; gain: Res4 }>;
  byRound: { n: number; sum: Res4; hub4: number; hub6: number }[];
  events: Record<string, number>;
  stops: number[];
  forks: Record<number, { alt: number; normal: number }>;
  signs: { games: number; wins: number; seatGames: number[]; seatWins: number[] }[];
  seatWins: number[];
  moves: number;
  effects: number;
  finalDracmas: number;
  winnerGlorySources: Record<string, number>;
}

function collector(label: string, seats: number, goal: number): Collector {
  return {
    label, seats, goal, games: 0, unfinished: 0, rounds: [],
    cards: CARDS.map(() => ({ drawn: 0, move: 0, effect: 0, arrival: 0, trap: 0, cost: 0, gain: zero4(), seatUse: [0, 0, 0, 0], seatEffect: [0, 0, 0, 0] })),
    temples: GODS.map(() => ({ visits: 0, noOption: 0, cats: {}, actions: {}, spent: 0, gain: zero4(), relics: 0, invest: 0 })),
    turns: {}, byRound: [], events: {}, stops: NODES.map(() => 0), forks: {},
    signs: SIGNS.map(() => ({ games: 0, wins: 0, seatGames: [0, 0, 0, 0], seatWins: [0, 0, 0, 0] })),
    seatWins: [0, 0, 0, 0], moves: 0, effects: 0, finalDracmas: 0, winnerGlorySources: {},
  };
}

/** Gerador próprio do script, para sortear signos sem tocar na semente das partidas. */
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function templeCategory(region: number, label: string): string {
  if (label.startsWith('Comprar ')) return 'relíquia';
  if (label.startsWith('Jogar ')) return 'carta';
  if (label.startsWith('Nenhuma')) return 'nada';
  if (label.startsWith('Aceitar contrato')) return 'contrato';
  const name = label.split(':')[0];
  if (name === GODS[region].primary.name) return 'principal';
  if (name === GODS[region].secondary.name) return 'secundária';
  return 'política';
}

/** Joga uma partida só de IA. `full` liga a coleta detalhada; sem ela, só duração e vencedor. */
function playGame(c: Collector, seed: number, signs: number[], policies: AiPolicy[], full: boolean): GameState {
  RULES.goal = c.goal;
  let turn: { player: number; start: Res4; type: string; card: number; cost: number; temple: { region: number; label: string; start: Res4 } | null; cardStart: Res4 | null } | null = null;
  let state!: GameState;
  const bump = (key: string, n = 1): void => void (c.events[key] = (c.events[key] ?? 0) + n);
  const add = (into: Res4, a: Res4, b: Res4): void => {
    into.g += a.g - b.g;
    into.d += a.d - b.d;
    into.f += a.f - b.f;
    into.h += a.h - b.h;
  };

  telemetry.emit = !full ? null : (event, data) => {
    switch (event) {
      case 'draw':
        c.cards[data.card as number].drawn++;
        break;
      case 'effect':
        if (turn && turn.player === data.player) {
          turn.card = data.card as number;
          turn.cost = data.cost as number;
          turn.cardStart = turn.temple ? turn.temple.start : turn.start;
          if (turn.temple) c.cards[turn.card].arrival++;
          else c.cards[turn.card].effect++;
          c.cards[turn.card].seatUse[turn.player]++;
          c.cards[turn.card].seatEffect[turn.player]++;
        }
        break;
      case 'trap_set':
        c.cards[data.card as number].trap++;
        c.cards[data.card as number].seatUse[data.player as number]++;
        bump('armadilhas armadas');
        break;
      case 'trap_hit':
        bump('armadilhas disparadas');
        break;
      case 'jail':
        bump('prisões');
        break;
      case 'sabotage':
        bump('sabotagens');
        bump(`sabotagem: ${data.kind}`);
        if (data.blocked) bump('sabotagens anuladas por Decreto');
        break;
      case 'duel':
        bump('duelos');
        bump(data.winner === -1 ? 'duelos: empate' : data.winner === data.a ? 'duelos: atacante vence' : 'duelos: defensor vence');
        if (data.stake === 'gloria') bump('duelos por Glória (Ares)');
        break;
      case 'relic':
        bump('relíquias compradas');
        c.temples[data.relic as number].relics++;
        break;
      case 'invest':
        bump('investimentos');
        c.temples[data.kind === 'forge' ? 6 : 9].invest++;
        break;
      case 'election':
        bump('eleições');
        if (data.winner === -1) bump('eleições: cargo vago');
        break;
      case 'destiny':
        bump('Arcanos Maiores revelados');
        break;
      case 'round_end': {
        const r = data.round as number;
        const row = (c.byRound[r] ??= { n: 0, sum: zero4(), hub4: 0, hub6: 0 });
        for (const p of state.players) {
          row.n++;
          row.sum.g += p.gloria;
          row.sum.d += p.dracmas;
          row.sum.f += p.favor;
          row.sum.h += p.hubris;
          if (p.hubris >= 4) row.hub4++;
          if (p.hubris >= 6) row.hub6++;
        }
        break;
      }
      case 'turn_end': {
        if (!turn || turn.player !== data.player) break;
        const after = snap(state.players[turn.player]);
        const t = (c.turns[turn.type] ??= { n: 0, gain: zero4() });
        t.n++;
        add(t.gain, after, turn.start);
        if (turn.card >= 0 && turn.cardStart) {
          const card = c.cards[turn.card];
          card.cost += turn.cost;
          add(card.gain, after, turn.cardStart);
          card.gain.d += turn.cost; // benefício bruto: devolve o custo pago
        }
        if (turn.temple) {
          const tp = c.temples[turn.temple.region];
          const cat = templeCategory(turn.temple.region, turn.temple.label);
          tp.cats[cat] = (tp.cats[cat] ?? 0) + 1;
          const name = cat === 'carta' ? 'Jogar carta' : turn.temple.label.split(/[:(]/)[0].trim();
          tp.actions[name] = (tp.actions[name] ?? 0) + 1;
          if (cat !== 'nada') {
            add(tp.gain, after, turn.temple.start);
            tp.spent += Math.max(0, turn.temple.start.d - after.d);
          }
        }
        turn = null;
        break;
      }
    }
  };

  state = newGame(signs.map((sign, i) => ({ name: `IA${i + 1}`, sign, isAI: true })), seed);
  let steps = 0;
  while (state.phase !== 'GAME_OVER' && steps++ < 40000) {
    const actor = state.pending ? state.pending.player : state.current;
    const cmd: Command = aiChoose(state, policies[actor]);
    if (full) {
      const p = state.players[state.current];
      if (!turn) turn = { player: p.id, start: snap(p), type: p.jailed ? 'Tártaro' : '', card: -1, cost: 0, temple: null, cardStart: null };
      if (cmd.type === 'PLAY_CARD_MOVE') {
        const path = moveOptions(state, cmd.card, cmd.mod ?? 0).get(cmd.dest)!;
        const seq = [p.pos, ...path];
        for (let i = 0; i < seq.length - 1; i++) {
          const n = NODES[seq[i]];
          if (n.next.length === 2) {
            const f = (c.forks[n.id] ??= { alt: 0, normal: 0 });
            if (seq[i + 1] === n.next[1]) f.alt++;
            else f.normal++;
          }
        }
        const dest = NODES[cmd.dest];
        c.stops[cmd.dest]++;
        c.cards[cmd.card].move++;
        c.cards[cmd.card].seatUse[p.id]++;
        turn.type = `Mover → ${dest.type === 'templo' ? 'Templo' : HOUSES[dest.type].name}`;
        if (dest.type === 'templo') {
          c.temples[dest.region].visits++;
          c.temples[dest.region].noOption++; // desfeito abaixo se o templo oferecer escolha
        }
      } else if (cmd.type === 'PLAY_CARD_EFFECT') turn.type = 'Efeito de carta';
      else if (cmd.type === 'PLACE_TRAP') turn.type = 'Armar armadilha';
      else if (cmd.type === 'BUY_RELIC') turn.type = 'Comprar relíquia (parado)';
      else if (cmd.type === 'END_TURN') turn.type = 'Encerrar sem agir';
      else if (cmd.type === 'ANSWER' && state.pending?.kind === 'choice' && state.pending.prompt.startsWith('Templo de ') && state.queue[0]?.t === 'choice') {
        const region = NODES[state.players[actor].pos].region;
        turn.temple = { region, label: state.queue[0].options[cmd.value as number].label, start: snap(state.players[actor]) };
        c.temples[region].noOption--;
      } else if (cmd.type === 'ANSWER' && state.pending?.prompt === 'Você está no Tártaro' && state.queue[0]?.t === 'choice') {
        bump(`Tártaro: ${state.queue[0].options[cmd.value as number].label.split(':')[0]}`);
      }
    }
    apply(state, cmd);
  }
  telemetry.emit = null;

  c.games++;
  if (state.winner === null) {
    c.unfinished++;
    return state;
  }
  c.rounds.push(state.round);
  c.seatWins[state.winner]++;
  c.moves += state.stats.moves;
  c.effects += state.stats.effects;
  c.finalDracmas += state.players.reduce((a, p) => a + p.dracmas, 0) / state.players.length;
  state.players.forEach((p, seat) => {
    const s = c.signs[p.sign];
    s.games++;
    s.seatGames[seat]++;
    if (state.winner === seat) {
      s.wins++;
      s.seatWins[seat]++;
    }
  });
  return state;
}

function randomSigns(next: () => number, seats: number): number[] {
  const pool = SIGNS.map((_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, seats);
}

function runConfig(label: string, seats: number, goal: number, games: number, seedBase: number, full: boolean, policy: AiPolicy = DEFAULT_POLICY): Collector {
  games = Math.max(4, Math.round(games * SCALE));
  const c = collector(label, seats, goal);
  const next = rng(seedBase);
  const started = Date.now();
  for (let g = 0; g < games; g++) playGame(c, seedBase + g * 7919, randomSigns(next, seats), Array(seats).fill(policy), full);
  console.log(`${label}: ${games} partidas em ${((Date.now() - started) / 1000).toFixed(0)} s`);
  return c;
}

const ALT: Record<string, AiPolicy> = {
  'Efeito+': { effectBias: 4, approachWeight: 2 },
  'Efeito++': { effectBias: 10, approachWeight: 3 },
};

/** Confronto direto: metade dos assentos com a política alternativa, alternando a cada partida. */
function headToHead(name: string, seats: number, games: number, seedBase: number): { name: string; seats: number; games: number; altWins: number; altSeats: number; rounds: number; effectRate: number } {
  games = Math.max(4, Math.round(games * SCALE));
  const c = collector(name, seats, 30);
  const next = rng(seedBase);
  let altWins = 0;
  for (let g = 0; g < games; g++) {
    const policies = Array.from({ length: seats }, (_, i) => ((i + g) % 2 === 0 ? ALT[name] : DEFAULT_POLICY));
    const state = playGame(c, seedBase + g * 7919, randomSigns(next, seats), policies, false);
    if (state.winner !== null && policies[state.winner] !== DEFAULT_POLICY) altWins++;
  }
  console.log(`confronto ${name} ${seats}j: ${games} partidas`);
  return { name, seats, games: c.rounds.length, altWins, altSeats: seats / 2, rounds: mean(c.rounds), effectRate: c.effects / (c.moves + c.effects) };
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

function run(part: string): void {
  mkdirSync(DIR, { recursive: true });
  let data: unknown;
  if (part === 'A') {
    data = [runConfig('2 jogadores · 25 Glórias', 2, 25, 500, 101, true), runConfig('2 jogadores · 30 Glórias', 2, 30, 500, 202, true), runConfig('4 jogadores · 25 Glórias', 4, 25, 500, 303, true)];
  } else if (part === 'B') {
    data = [runConfig('4 jogadores · 30 Glórias', 4, 30, 500, 404, true)];
  } else if (part === 'C') {
    data = [runConfig('signos 4j', 4, 30, 1900, 505, false), runConfig('signos 2j', 2, 30, 1900, 606, false)];
  } else if (part === 'D') {
    const all = Object.entries(ALT).map(([name, policy]) => runConfig(`todas as IAs com ${name}`, 4, 30, 200, 707, true, policy));
    const duels = [headToHead('Efeito+', 4, 400, 808), headToHead('Efeito++', 4, 400, 909), headToHead('Efeito+', 2, 600, 1010), headToHead('Efeito++', 2, 600, 1111)];
    // Comparação de movimento: distribuição anterior (da referência v1.5), só para medir o acesso às casas.
    const old = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 2, 5, 3, 6];
    const current = CARDS.map((card) => card.move);
    CARDS.forEach((card) => (card.move = old[card.id % 14]));
    const oldMoves = runConfig('movimento antigo (1–6 mais espalhado)', 4, 30, 300, 404, true);
    CARDS.forEach((card, i) => (card.move = current[i]));
    data = { all, duels, oldMoves };
  } else throw new Error('Parte desconhecida: use A, B, C ou D.');
  writeFileSync(`${DIR}/dados-${part}.json`, JSON.stringify(data));
}

// ---------------------------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------------------------

const fmt = (n: number, digits = 1): string => (Number.isFinite(n) ? n.toFixed(digits).replace('.', ',') : '—');
const pct = (n: number, digits = 0): string => (Number.isFinite(n) ? `${(n * 100).toFixed(digits).replace('.', ',')}%` : '—');
const pad = (n: number): string => String(n).padStart(2, '0');
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const quantile = (sorted: number[], q: number): number => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];

// Gráficos: SVG estático, superfície clara, paleta categórica validada (azul, laranja, água, amarelo).
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const INK = '#0b0b0b';
const INK2 = '#52514e';
const GRID = '#e4e3de';
const FONT = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif"';
const svgOpen = (w: number, h: number, title: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}"><rect width="${w}" height="${h}" fill="#fcfcfb"/><text x="16" y="24" ${FONT} font-size="15" font-weight="600" fill="${INK}">${title}</text>`;
const text = (x: number, y: number, s: string | number, anchor = 'start', size = 11, fill = INK2): string =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;

function chartDurations(configs: Collector[]): string {
  const W = 880, PH = 120, top = 44, left = 150, right = 30;
  const max = Math.max(...configs.flatMap((c) => c.rounds));
  const min = Math.min(...configs.flatMap((c) => c.rounds));
  const x = (r: number): number => left + ((r - min) / (max - min + 1)) * (W - left - right);
  const bw = (W - left - right) / (max - min + 1);
  let out = svgOpen(W, top + configs.length * PH + 36, 'Duração das partidas (rodadas), 500 partidas por configuração');
  configs.forEach((c, i) => {
    const y0 = top + i * PH;
    const counts = new Map<number, number>();
    for (const r of c.rounds) counts.set(r, (counts.get(r) ?? 0) + 1);
    const peak = Math.max(...counts.values());
    const sorted = [...c.rounds].sort((a, b) => a - b);
    out += text(16, y0 + 40, c.label.split(' · ')[0], 'start', 12, INK) + text(16, y0 + 56, c.label.split(' · ')[1], 'start', 12, INK);
    out += text(16, y0 + 74, `mediana ${quantile(sorted, 0.5)} · máx. ${sorted[sorted.length - 1]}`);
    out += `<line x1="${left}" y1="${y0 + PH - 20}" x2="${W - right}" y2="${y0 + PH - 20}" stroke="${GRID}"/>`;
    for (const [r, n] of counts) {
      const h = (n / peak) * (PH - 44);
      out += `<rect x="${(x(r) + 1).toFixed(1)}" y="${(y0 + PH - 20 - h).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${SERIES[0]}"><title>${r} rodadas: ${n} partidas</title></rect>`;
    }
    const m = x(quantile(sorted, 0.5)) + bw / 2;
    out += `<line x1="${m}" y1="${y0 + 18}" x2="${m}" y2="${y0 + PH - 20}" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  });
  const yAxis = top + configs.length * PH;
  for (let r = Math.ceil(min / 5) * 5; r <= max; r += 5) out += text(x(r) + bw / 2, yAxis - 4, r, 'middle');
  out += text((left + W - right) / 2, yAxis + 16, 'rodadas até a vitória (linha tracejada: mediana)', 'middle');
  return out + '</svg>';
}

function chartResources(c: Collector): string {
  const W = 880, H = 360, left = 46, right = 120, top = 44, bottom = 40;
  const rows = c.byRound.map((r, i) => ({ i, r })).filter(({ r }) => r && r.n >= c.seats * c.games * 0.5);
  const series: [string, (s: Res4) => number][] = [['Glória', (s) => s.g], ['Dracmas', (s) => s.d], ['Favor', (s) => s.f], ['Húbris', (s) => s.h]];
  const maxY = Math.ceil(Math.max(...rows.flatMap(({ r }) => series.map(([, f]) => f(r.sum) / r.n))) / 5) * 5;
  const maxX = rows[rows.length - 1].i;
  const x = (i: number): number => left + ((i - 1) / (maxX - 1)) * (W - left - right);
  const y = (v: number): number => top + (1 - v / maxY) * (H - top - bottom);
  let out = svgOpen(W, H, `Recursos médios por jogador ao fim de cada rodada (${c.label})`);
  for (let v = 0; v <= maxY; v += 5) out += `<line x1="${left}" y1="${y(v)}" x2="${W - right}" y2="${y(v)}" stroke="${GRID}"/>` + text(left - 6, y(v) + 4, v, 'end');
  for (let i = 5; i <= maxX; i += 5) out += text(x(i), H - bottom + 16, i, 'middle');
  out += text((left + W - right) / 2, H - 6, 'rodada', 'middle');
  series.forEach(([name, f], k) => {
    const pts = rows.map(({ i, r }) => `${x(i).toFixed(1)},${y(f(r.sum) / r.n).toFixed(1)}`);
    const last = rows[rows.length - 1];
    out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${SERIES[k]}" stroke-width="2" stroke-linejoin="round"/>`;
    out += `<circle cx="${x(last.i)}" cy="${y(f(last.r.sum) / last.r.n)}" r="4" fill="${SERIES[k]}" stroke="#fcfcfb" stroke-width="2"/>`;
    out += text(x(last.i) + 10, y(f(last.r.sum) / last.r.n) + 4, `${name} ${fmt(f(last.r.sum) / last.r.n)}`, 'start', 12, INK);
  });
  return out + '</svg>';
}

function chartBars(title: string, rows: { label: string; value: number; note?: string; mark?: boolean }[], unit: string, maxValue?: number): string {
  const W = 880, RH = 17, top = 40, left = 190, right = 150;
  const max = maxValue ?? Math.max(...rows.map((r) => r.value));
  let out = svgOpen(W, top + rows.length * RH + 30, title);
  rows.forEach((r, i) => {
    const y0 = top + i * RH;
    const w = Math.max(0, (r.value / max) * (W - left - right));
    out += text(left - 8, y0 + 12, r.label, 'end', 11, INK);
    out += `<rect x="${left}" y="${y0 + 2}" width="${Math.max(1, w).toFixed(1)}" height="${RH - 5}" rx="3" fill="${r.mark ? SERIES[1] : SERIES[0]}"><title>${r.label}: ${r.note ?? r.value}</title></rect>`;
    out += text(left + w + 6, y0 + 12, r.note ?? fmt(r.value));
  });
  out += text(left, top + rows.length * RH + 18, unit);
  return out + '</svg>';
}

function chartStops(c: Collector): string {
  const W = 880, H = 300, left = 46, right = 16, top = 44, bottom = 56;
  const max = Math.max(...c.stops);
  const bw = (W - left - right) / 96;
  const y = (v: number): number => top + (1 - v / max) * (H - top - bottom);
  let out = svgOpen(W, H, `Paradas por casa (${c.label}); templos em laranja`);
  const avg = mean(c.stops);
  out += `<line x1="${left}" y1="${y(avg)}" x2="${W - right}" y2="${y(avg)}" stroke="${INK}" stroke-dasharray="3 3"/>` + text(W - right, y(avg) - 4, `média ${fmt(avg / c.games, 2)} por partida`, 'end');
  c.stops.forEach((n, id) => {
    const node = NODES[id];
    out += `<rect x="${(left + id * bw + 1).toFixed(1)}" y="${y(n).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(H - bottom - y(n)).toFixed(1)}" rx="1.5" fill="${node.type === 'templo' ? SERIES[1] : SERIES[0]}"><title>Casa ${pad(id)} (${HOUSES[node.type].name}): ${fmt(n / c.games, 2)} paradas por partida</title></rect>`;
  });
  GODS.forEach((g, r) => {
    out += text(left + (r * 8 + 4) * bw, H - bottom + 14, g.name, 'middle', 10);
    out += text(left + r * 8 * bw + 2, H - bottom + 28, pad(r * 8), 'start', 9);
    if (r) out += `<line x1="${left + r * 8 * bw}" y1="${top}" x2="${left + r * 8 * bw}" y2="${H - bottom + 4}" stroke="${GRID}"/>`;
  });
  out += text((left + W - right) / 2, H - 8, 'casa (00 a 95), agrupada por região', 'middle');
  return out + '</svg>';
}

function chartSigns(c4: Collector, c2: Collector): string {
  const W = 880, RH = 26, top = 60, left = 170, right = 40;
  const x = (ratio: number): number => left + ((ratio - 0.4) / 1.2) * (W - left - right);
  let out = svgOpen(W, top + 12 * RH + 40, 'Taxa de vitória por signo, em relação ao esperado (1,0 = equilibrado)');
  out += `<circle cx="${left}" cy="40" r="5" fill="${SERIES[0]}"/>` + text(left + 10, 44, '4 jogadores', 'start', 12, INK) + `<rect x="${left + 96}" y="35" width="10" height="10" fill="${SERIES[1]}"/>` + text(left + 112, 44, '2 jogadores (barra: intervalo de 95%)', 'start', 12, INK);
  for (const v of [0.6, 0.8, 1, 1.2, 1.4]) out += `<line x1="${x(v)}" y1="${top}" x2="${x(v)}" y2="${top + 12 * RH}" stroke="${v === 1 ? INK : GRID}" ${v === 1 ? 'stroke-dasharray="3 3"' : ''}/>` + text(x(v), top + 12 * RH + 16, fmt(v), 'middle');
  SIGNS.forEach((s, i) => {
    const y0 = top + i * RH;
    out += text(left - 8, y0 + 16, `${s.name} · ${GODS[s.patron].name}`, 'end', 11, INK);
    [[c4, 4, 9, SERIES[0]] as const, [c2, 2, 18, SERIES[1]] as const].forEach(([c, seats, dy, color]) => {
      const st = c.signs[i];
      const p = st.wins / st.games;
      const se = Math.sqrt((p * (1 - p)) / st.games);
      const r = p * seats;
      const lo = Math.max(0.4, (p - 1.96 * se) * seats);
      const hi = Math.min(1.6, (p + 1.96 * se) * seats);
      out += `<line x1="${x(lo)}" y1="${y0 + dy}" x2="${x(hi)}" y2="${y0 + dy}" stroke="${color}" stroke-width="2"/>`;
      out += seats === 4
        ? `<circle cx="${x(r)}" cy="${y0 + dy}" r="4.5" fill="${color}" stroke="#fcfcfb" stroke-width="1.5"><title>${s.name}, 4 jogadores: ${pct(p, 1)} de vitórias</title></circle>`
        : `<rect x="${x(r) - 4}" y="${y0 + dy - 4}" width="8" height="8" fill="${color}" stroke="#fcfcfb" stroke-width="1.5"><title>${s.name}, 2 jogadores: ${pct(p, 1)} de vitórias</title></rect>`;
    });
  });
  return out + '</svg>';
}

function merge(a: Collector, b: Collector): Collector {
  const out: Collector = JSON.parse(JSON.stringify(a));
  out.games += b.games;
  out.rounds.push(...b.rounds);
  b.signs.forEach((s, i) => {
    out.signs[i].games += s.games;
    out.signs[i].wins += s.wins;
    s.seatGames.forEach((n, k) => (out.signs[i].seatGames[k] += n));
    s.seatWins.forEach((n, k) => (out.signs[i].seatWins[k] += n));
  });
  b.seatWins.forEach((n, k) => (out.seatWins[k] += n));
  return out;
}

function report(): void {
  const load = <T>(part: string): T => JSON.parse(readFileSync(`${DIR}/dados-${part}.json`, 'utf8')) as T;
  const [c2a, c2b, c4a] = load<Collector[]>('A');
  const [main] = load<Collector[]>('B');
  const [s4, s2] = load<Collector[]>('C');
  const D = load<{ all: Collector[]; duels: ReturnType<typeof headToHead>[]; oldMoves: Collector }>('D');
  const configs = [c2a, c2b, c4a, main];
  const out: string[] = [];
  const h = (title: string, body: string): void => void out.push(`## ${title}\n\n${body}\n`);
  const save = (name: string, svg: string): string => {
    writeFileSync(`${DIR}/${name}.svg`, svg);
    return `![${name}](auditoria/${name}.svg)`;
  };
  const G = main.games;
  const perGame = (n: number): string => fmt(n / G, 2);

  out.push(`# ASTRAL — Auditoria de balanceamento v2

Medições da branch \`claude/ecstatic-planck-s4ja14\` com os valores atuais do jogo, sem alterar custos,
efeitos, movimentos ou condições de vitória. Todas as partidas são IA contra IA, com signos sorteados.
Gerado por \`npm run audit\` (dados brutos em \`docs/auditoria/\`).
`);
  if (existsSync('scripts/audit-conclusoes.md')) out.push(readFileSync('scripts/audit-conclusoes.md', 'utf8'));

  // 1. Simulações
  h('1. Duração das partidas', table(['Configuração', 'Partidas', 'Média', 'Mediana', 'P10', 'P90', 'Máxima', 'Inacabadas'],
    configs.map((c) => {
      const s = [...c.rounds].sort((a, b) => a - b);
      return [c.label, c.games, fmt(mean(s)), quantile(s, 0.5), quantile(s, 0.1), quantile(s, 0.9), s[s.length - 1], c.unfinished];
    })) + `\n\n${save('duracao', chartDurations(configs))}\n\nDuração em rodadas completas (cada jogador joga uma vez por rodada).`);

  // 2. Cartas
  const totalEffects = main.cards.reduce((a, c) => a + c.effect + c.arrival, 0);
  const cardRows = CARDS.map((card) => {
    const c = main.cards[card.id];
    const eff = c.effect + c.arrival;
    const used = c.move + eff + c.trap;
    const value = eff ? (c.gain.g * 4 + c.gain.d + c.gain.f * 1.5 - c.gain.h * 1.5) / eff : NaN;
    return { card, c, eff, used, rate: eff / Math.max(1, used), cost: c.cost / Math.max(1, eff), value };
  });
  h('2. Auditoria das 56 cartas', `Configuração: ${main.label}, ${G} partidas. "Compras" conta cada vez que a carta entrou numa mão. `
    + 'O benefício médio é a variação dos recursos de quem jogou, do momento do efeito até o fim do turno, com o custo devolvido '
    + '(bruto). "Valor" converte o benefício em Dracmas equivalentes (Glória 4, Favor 1,5, Húbris −1,5) para comparar com o custo.\n\n'
    + table(['Carta', 'Uso', 'Custo', 'Compras', 'Movimento', 'Efeito', 'Armadilha', '% efeito', 'Custo pago', 'ΔGlória', 'ΔDracmas', 'ΔFavor', 'ΔHúbris', 'Valor', '% efeito por IA (1–4)'],
      cardRows.map(({ card, c, eff, rate, cost, value }) => [
        cardName(card), useLabel(card), card.cost, c.drawn, c.move, eff, c.trap, pct(rate), eff ? fmt(cost) : '—',
        eff ? fmt(c.gain.g / eff, 2) : '—', eff ? fmt(c.gain.d / eff, 1) : '—', eff ? fmt(c.gain.f / eff, 2) : '—', eff ? fmt(c.gain.h / eff, 2) : '—',
        eff ? fmt(value) : '—', c.seatUse.map((n, i) => pct(c.seatEffect[i] / Math.max(1, n))).join(' · '),
      ]))
    + `\n\n${save('cartas-efeito', chartBars('Frequência de uso pelo efeito, por carta (laranja: abaixo de 5%)',
      [...cardRows].sort((a, b) => b.rate - a.rate).map((r) => ({ label: cardName(r.card), value: r.rate, note: `${pct(r.rate)} · ${r.eff} de ${r.used} usos`, mark: r.rate < 0.05 })), 'parcela dos usos da carta que foram pelo efeito', 1))}\n\n`
    + `**Cartas quase nunca usadas pelo efeito (menos de 5% dos usos):** ${cardRows.filter((r) => r.rate < 0.05).map((r) => `${cardName(r.card)} (${pct(r.rate, 1)})`).join(', ') || 'nenhuma'}.\n\n`
    + `**Cartas mais jogadas pelo efeito:** ${[...cardRows].sort((a, b) => b.eff - a.eff).slice(0, 8).map((r) => `${cardName(r.card)} (${pct(r.eff / totalEffects, 1)} de todos os efeitos)`).join(', ')}.\n\n`
    + `**Melhor relação valor/custo:** ${[...cardRows].filter((r) => r.eff >= 20).sort((a, b) => (b.value - b.cost) - (a.value - a.cost)).slice(0, 6).map((r) => `${cardName(r.card)} (valor ${fmt(r.value)} por custo ${fmt(r.cost)})`).join(', ')}.\n\n`
    + `Por naipe: ${['Paus', 'Copas', 'Espadas', 'Ouros'].map((suit) => {
      const rs = cardRows.filter((r) => r.card.suit === suit);
      return `${suit} ${pct(rs.reduce((a, r) => a + r.eff, 0) / rs.reduce((a, r) => a + r.used, 0))}`;
    }).join(' · ')}. Por tipo: ${(['U', 'E', 'D'] as const).map((u) => {
      const rs = cardRows.filter((r) => r.card.use === u);
      return `${{ U: 'universais', E: 'elementais', D: 'divinas' }[u]} ${pct(rs.reduce((a, r) => a + r.eff, 0) / rs.reduce((a, r) => a + r.used, 0))}`;
    }).join(' · ')}.`);

  // 3. Templos
  h('3. Auditoria dos 12 templos', `Configuração: ${main.label}. "Visitas" são paradas no templo por movimento; "sem opção" são visitas em que nada era pagável. `
    + 'Dracmas gastos e Glória obtida somam a variação do jogador da escolha até o fim do turno.\n\n'
    + table(['Templo', 'Visitas/partida', 'Sem opção', 'Principal', 'Secundária', 'Política', 'Carta', 'Relíquia', 'Nada', 'Dracmas gastos/visita', 'Glória/visita', 'Relíquias/partida', 'Investimentos/partida'],
      GODS.map((g, r) => {
        const t = main.temples[r];
        const acted = t.visits - t.noOption;
        const share = (k: string): string => pct((t.cats[k] ?? 0) / Math.max(1, t.visits));
        return [g.name, fmt(t.visits / G, 2), pct(t.noOption / Math.max(1, t.visits)), share('principal'), share('secundária'), share('política'), share('carta'), share('relíquia'), share('nada'),
          fmt(t.spent / Math.max(1, acted)), fmt(t.gain.g / Math.max(1, t.visits), 2), fmt(t.relics / G, 2), r === 6 || r === 9 ? fmt(t.invest / G, 2) : '—'];
      }))
    + '\n\nAções escolhidas, em vezes por partida:\n\n'
    + table(['Templo', 'Ações (vezes por partida)'], GODS.map((g, r) => [g.name, Object.entries(main.temples[r].actions).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${fmt(n / G, 2)}`).join(' · ') || '—'])));

  // 4. Economia e interação
  const rounds = main.byRound.map((r, i) => ({ r, i })).filter(({ r }) => r && r.n >= main.seats * G * 0.5);
  const pick = [1, 5, 10, 15, 20, 25, 30, 35].filter((i) => rounds.some((x) => x.i === i));
  const allHub = main.byRound.filter(Boolean).reduce((a, r) => ({ n: a.n + r.n, h4: a.h4 + r.hub4, h6: a.h6 + r.hub6 }), { n: 0, h4: 0, h6: 0 });
  const turnRows = Object.entries(main.turns).filter(([k]) => k).sort((a, b) => b[1].n - a[1].n);
  const totalTurns = turnRows.reduce((a, [, t]) => a + t.n, 0);
  const ev = (k: string): number => main.events[k] ?? 0;
  h('4. Economia e interação', `${save('recursos', chartResources(main))}\n\n`
    + table(['Rodada', 'Glória', 'Dracmas', 'Favor', 'Húbris', 'Jogadores com Húbris ≥ 4'], pick.map((i) => {
      const r = main.byRound[i];
      return [i, fmt(r.sum.g / r.n), fmt(r.sum.d / r.n), fmt(r.sum.f / r.n), fmt(r.sum.h / r.n, 2), pct(r.hub4 / r.n, 1)];
    }))
    + `\n\nHúbris elevada: ${pct(allHub.h4 / allHub.n, 1)} das posições de fim de rodada têm Húbris ≥ 4 e ${pct(allHub.h6 / allHub.n, 2)} têm ≥ 6.\n\n`
    + '**Interação, por partida:**\n\n'
    + table(['Evento', 'Por partida', 'Por jogador'], [
      'prisões', 'duelos', 'duelos: atacante vence', 'duelos: defensor vence', 'duelos: empate', 'duelos por Glória (Ares)', 'sabotagens', 'sabotagens anuladas por Decreto',
      'armadilhas armadas', 'armadilhas disparadas', 'relíquias compradas', 'investimentos', 'eleições', 'eleições: cargo vago', 'Arcanos Maiores revelados',
    ].map((k) => [k[0].toUpperCase() + k.slice(1), perGame(ev(k)), fmt(ev(k) / G / main.seats, 2)]))
    + `\n\nSabotagens por tipo: ${Object.entries(main.events).filter(([k]) => k.startsWith('sabotagem: ')).map(([k, n]) => `${k.slice(11)} ${perGame(n)}`).join(' · ') || 'nenhuma'}. `
    + `Saídas do Tártaro: ${Object.entries(main.events).filter(([k]) => k.startsWith('Tártaro: ')).map(([k, n]) => `${k.slice(9)} ${perGame(n)}`).join(' · ') || 'nenhuma'}.\n\n`
    + '**Retorno médio por tipo de turno** (variação dos recursos de quem jogou, do início ao fim do turno):\n\n'
    + table(['Turno', '% dos turnos', 'ΔGlória', 'ΔDracmas', 'ΔFavor', 'ΔHúbris', 'Valor em Dracmas equivalentes'], turnRows.map(([k, t]) => [
      k, pct(t.n / totalTurns, 1), fmt(t.gain.g / t.n, 2), fmt(t.gain.d / t.n, 2), fmt(t.gain.f / t.n, 2), fmt(t.gain.h / t.n, 2),
      fmt((t.gain.g * 4 + t.gain.d + t.gain.f * 1.5 - t.gain.h * 1.5) / t.n, 1),
    ]))
    + `\n\nOs jogadores terminam a partida com ${fmt(main.finalDracmas / main.rounds.length)} Dracmas em média.`);

  // 5. Movimento
  const stopsPer = main.stops.map((n) => n / G);
  const avgStop = mean(stopsPer);
  const low = NODES.filter((n) => stopsPer[n.id] < avgStop * 0.5);
  const high = NODES.filter((n) => stopsPer[n.id] > avgStop * 1.6).sort((a, b) => stopsPer[b.id] - stopsPer[a.id]);
  const byType = Object.keys(HOUSES).map((t) => {
    const ns = NODES.filter((n) => n.type === t);
    return [HOUSES[t as keyof typeof HOUSES].name, ns.length, fmt(mean(ns.map((n) => stopsPer[n.id])), 2), fmt(mean(ns.map((n) => stopsPer[n.id])) / avgStop, 2)];
  });
  const gini = (xs: number[]): number => {
    const s = [...xs].sort((a, b) => a - b);
    const n = s.length;
    return s.reduce((a, v, i) => a + (2 * (i + 1) - n - 1) * v, 0) / (n * s.reduce((a, b) => a + b, 0));
  };
  const old = D.oldMoves;
  const oldPer = old.stops.map((n) => n / old.games);
  const moveDist = [1, 2, 3, 4, 5, 6].map((m) => CARDS.filter((c) => c.move === m).length);
  const forkRow = (id: number, to: number, kind: string): (string | number)[] => {
    const f = main.forks[id] ?? { alt: 0, normal: 0 };
    return [pad(id), kind, `${pad(id + 1)} / ${pad(to)}`, fmt((f.alt + f.normal) / G, 2), pct(f.alt / Math.max(1, f.alt + f.normal))];
  };
  h('5. Movimento', `Distribuição atual de movimento nas 56 cartas: ${moveDist.map((n, i) => `${n} cartas de ${i + 1}`).join(' · ')}.\n\n`
    + `${save('paradas', chartStops(main))}\n\n`
    + table(['Tipo de casa', 'Casas', 'Paradas por casa por partida', 'Em relação à média'], byType)
    + `\n\n**Casas mais visitadas** (acima de 1,6× a média): ${high.map((n) => `${pad(n.id)} ${n.type === 'templo' ? `Templo de ${GODS[n.region].name}` : HOUSES[n.type].name} (${fmt(stopsPer[n.id], 2)})`).join(', ') || 'nenhuma'}.\n\n`
    + `**Casas menos visitadas** (abaixo de metade da média): ${low.map((n) => `${pad(n.id)} ${HOUSES[n.type].name} (${fmt(stopsPer[n.id], 2)})`).join(', ') || 'nenhuma'}.\n\n`
    + '**Concentração em 3 passos contra a distribuição anterior** (300 partidas com o movimento antigo, 2 cartas de cada naipe por valor extremo):\n\n'
    + table(['Medida', 'Movimento atual', 'Movimento anterior'], [
      ['Rodadas (média)', fmt(mean(main.rounds)), fmt(mean(old.rounds))],
      ['Desigualdade das paradas entre casas (Gini; 0 = uniforme)', fmt(gini(stopsPer), 3), fmt(gini(oldPer), 3)],
      ['Casas com menos de metade da média de paradas', low.length, NODES.filter((n) => oldPer[n.id] < mean(oldPer) * 0.5).length],
      ['Visitas a templos por jogador por partida', fmt(main.temples.reduce((a, t) => a + t.visits, 0) / G / main.seats), fmt(old.temples.reduce((a, t) => a + t.visits, 0) / old.games / old.seats)],
      ['Cartas usadas pelo efeito', pct(main.effects / (main.moves + main.effects)), pct(old.effects / (old.moves + old.effects))],
    ])
    + '\n\n**Atalhos e retornos** (vezes em que um movimento saiu da casa com duas saídas):\n\n'
    + table(['Casa', 'Tipo', 'Saída normal / alternativa', 'Passagens por partida', 'Escolheu a alternativa'],
      [...Object.entries(SHORTCUTS).map(([a, b]) => forkRow(+a, b, +b > +a ? 'Atalho para dentro' : 'Volta ao início')), ...Object.entries(RETURNS).map(([a, b]) => forkRow(+a, b, 'Retorno para fora'))]));

  // 6. IA
  const base = main.effects / (main.moves + main.effects);
  h('6. Inteligência artificial', 'A política atual simula cada comando possível e escolhe o de maior valor. As alternativas somam um prêmio explícito ao valor de jogar '
    + 'uma carta pelo efeito e pesam mais a aproximação aos templos onde as cartas da mão valem: **Efeito+** (prêmio 4, aproximação ×2) e **Efeito++** (prêmio 10, aproximação ×3).\n\n'
    + '**Todas as IAs com a mesma política** (4 jogadores, 30 Glórias):\n\n'
    + table(['Política', 'Partidas', 'Cartas pelo efeito', 'Rodadas (média)', 'Visitas a templos por jogador', 'Prisões por jogador'], [
      ['Atual', main.games, pct(base), fmt(mean(main.rounds)), fmt(main.temples.reduce((a, t) => a + t.visits, 0) / G / 4), fmt(ev('prisões') / G / 4, 2)],
      ...D.all.map((c) => [c.label.replace('todas as IAs com ', ''), c.games, pct(c.effects / (c.moves + c.effects)), fmt(mean(c.rounds)), fmt(c.temples.reduce((a, t) => a + t.visits, 0) / c.games / 4), fmt((c.events['prisões'] ?? 0) / c.games / 4, 2)]),
    ])
    + '\n\n**Confronto direto** (metade dos assentos com a política alternativa, alternando os assentos a cada partida; 50% = políticas equivalentes):\n\n'
    + table(['Alternativa', 'Jogadores', 'Partidas', 'Vitórias da alternativa', 'Intervalo de 95%'], D.duels.map((d) => {
      const p = d.altWins / d.games;
      const se = Math.sqrt((p * (1 - p)) / d.games);
      return [d.name, d.seats, d.games, pct(p, 1), `${pct(p - 1.96 * se, 1)} a ${pct(p + 1.96 * se, 1)}`];
    })));

  // 7. Signos
  const all4 = merge(main, s4);
  const all2 = merge(c2b, s2);
  const signRow = (c: Collector, i: number, seats: number): string[] => {
    const s = c.signs[i];
    const p = s.wins / s.games;
    const se = Math.sqrt((p * (1 - p)) / s.games);
    return [String(s.games), pct(p, 1), `${pct(p - 1.96 * se, 1)}–${pct(p + 1.96 * se, 1)}`, ...Array.from({ length: seats }, (_, k) => pct(s.seatWins[k] / Math.max(1, s.seatGames[k])))];
  };
  const chi = (c: Collector, seats: number): number => c.signs.reduce((a, s) => a + (s.wins - s.games / seats) ** 2 / (s.games / seats), 0);
  h('7. Equilíbrio entre personagens', `Signos sorteados sem repetição a cada partida, com a meta de 30 Glórias: ${all4.games} partidas com 4 jogadores e ${all2.games} com 2. `
    + 'Como o signo é sorteado independentemente do assento, cada signo ocupa todos os assentos com a mesma frequência; as colunas por assento mostram o efeito da ordem do turno.\n\n'
    + `${save('signos', chartSigns(all4, all2))}\n\n`
    + '**4 jogadores** (esperado: 25%)\n\n'
    + table(['Signo', 'Elemento', 'Patrono (casa inicial)', 'Partidas', 'Vitórias', 'IC 95%', '1º', '2º', '3º', '4º'], SIGNS.map((s, i) => [s.name, ELEMENT_NAME[s.element], `${GODS[s.patron].name} (${pad(s.patron * 8 + 3)})`, ...signRow(all4, i, 4)]))
    + '\n\n**2 jogadores** (esperado: 50%)\n\n'
    + table(['Signo', 'Elemento', 'Patrono (casa inicial)', 'Partidas', 'Vitórias', 'IC 95%', '1º', '2º'], SIGNS.map((s, i) => [s.name, ELEMENT_NAME[s.element], `${GODS[s.patron].name} (${pad(s.patron * 8 + 3)})`, ...signRow(all2, i, 2)]))
    + `\n\n**Ordem do turno:** com 4 jogadores os assentos vencem ${all4.seatWins.map((n) => pct(n / all4.rounds.length, 1)).join(' · ')}; com 2 jogadores, ${all2.seatWins.slice(0, 2).map((n) => pct(n / all2.rounds.length, 1)).join(' · ')}.\n\n`
    + `**Por elemento (4 jogadores):** ${(['fogo', 'agua', 'ar', 'terra'] as const).map((e) => {
      const ss = SIGNS.map((s, i) => ({ s, st: all4.signs[i] })).filter(({ s }) => s.element === e);
      return `${ELEMENT_NAME[e]} ${pct(ss.reduce((a, x) => a + x.st.wins, 0) / ss.reduce((a, x) => a + x.st.games, 0), 1)}`;
    }).join(' · ')}.\n\n`
    + `Teste qui-quadrado da hipótese "todos os signos vencem igual" (11 graus de liberdade; acima de 19,7 rejeita a 5%): ${fmt(chi(all4, 4), 1)} com 4 jogadores e ${fmt(chi(all2, 2), 1)} com 2.`);

  h('Método e limites', [
    '- Todas as partidas são IA contra IA com a política do jogo; jogadores humanos se comportam de outra forma, em especial quanto a risco (Húbris) e a ataques.',
    '- Sementes fixas: os números se reproduzem ao rodar o script de novo.',
    '- O benefício atribuído a uma carta ou a um templo é a variação total dos recursos do jogador até o fim do turno, o que inclui efeitos da casa e de duelos no mesmo turno.',
    '- A conversão em "Dracmas equivalentes" (Glória 4, Favor 1,5, Húbris −1,5) é uma régua de comparação, não uma regra do jogo.',
    '- O módulo de contratos e a sabotagem direta estão desligados, como no jogo.',
  ].join('\n'));

  writeFileSync('docs/AUDITORIA_BALANCEAMENTO.md', out.join('\n'));
  console.log(`docs/AUDITORIA_BALANCEAMENTO.md gerado (${out.join('\n').split('\n').length} linhas).`);
}

const [mode, part] = process.argv.slice(2);
if (mode === 'run') run(part);
else if (mode === 'report') report();
else console.log('Uso: tsx scripts/audit.ts run <A|B|C|D> | report');
