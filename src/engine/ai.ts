import { DIST, NODES, templeOf } from './board';
import { CARDS } from './cards';
import { GODS } from './data';
import { apply, canBuyRelic, canEffect, canTempleAction, costFor, currentPlayer, freePowers, moveOptions, others, placeAllows } from './game';
import { rand, shuffle } from './rng';
import type { Answer, Command, GameState, Op, Player, Res } from './types';

const WEIGHT: Record<Res, number> = { gloria: 10, dracmas: 1, favor: 1.5, hubris: -1.5 };

function hubrisRisk(h: number): number {
  return h * 1.5 + (h >= 2 ? 1.5 : 0) + (h >= 4 ? 7 : 0) + (h >= 6 ? 8 : 0);
}

/** Avaliação da situação de um jogador. */
function worth(state: GameState, p: Player): number {
  return p.gloria * 10 + Math.min(p.dracmas, 8) + Math.min(Math.max(0, p.dracmas - 8), 6) * 0.4 + p.favor * 1.5 - hubrisRisk(p.hubris)
    + p.relics.length * 7 + p.hand.length * 0.8 - (p.jailed ? 9 : 0) + (state.oracle.holder === p.id ? 2 : 0);
}

/** Valor aproximado de uma lista de passos para quem decide (usado nas escolhas). */
function opsValue(state: GameState, me: number, ops: Op[]): number {
  let v = 0;
  for (const op of ops) {
    switch (op.t) {
      case 'res': {
        const p = state.players[op.p];
        const real = op.n < 0 ? -Math.min(p[op.res], -op.n) : op.n;
        const w = op.res === 'hubris' ? -(hubrisRisk(p.hubris + real) - hubrisRisk(p.hubris)) : real * WEIGHT[op.res];
        v += op.p === me ? w : -w * 0.5;
        break;
      }
      case 'transfer': v += Math.min(state.players[op.from >= 0 ? op.from : 0].dracmas, op.n) * 1.5; break;
      case 'draw': v += op.n * 0.8; break;
      case 'discard': v -= op.n * 0.5; break;
      case 'jail': v -= op.p === me ? 9 : -4; break;
      case 'endTurn': v -= 5; break;
      case 'buy': v += 3; break;
      case 'altar': v += 1.5 - op.bet; break;
      case 'shield': v += 2; break;
      case 'peek': v += 0.3; break;
      case 'advance': case 'teleport': v += 1; break;
      case 'duel': v += state.players[me].favor >= 2 && state.players[op.d].dracmas >= 2 ? 1.5 : -1; break;
      case 'target': v += opsValue(state, me, op.ops.map((o) => JSON.parse(JSON.stringify(o).replace(/-1/g, String(others(state, me)[0]))))); break;
      default: break;
    }
  }
  return v;
}

function keepValue(p: Player, cardId: number): number {
  const card = CARDS[cardId];
  return card.cost + (card.use === 'U' ? 1 : 0) + card.move / 10 - Math.max(0, costFor(p, card) - p.dracmas) * 0.3;
}

/** Resposta heurística a qualquer decisão pendente (serve à IA e às simulações). */
export function autoAnswer(state: GameState): Answer {
  const pending = state.pending!;
  const me = state.players[pending.player];
  const op = state.queue[0];
  switch (pending.kind) {
    case 'choice': {
      if (op.t !== 'choice') return 0;
      let best = 0;
      let bestValue = -Infinity;
      op.options.forEach((o, i) => {
        if (o.disabled) return;
        const v = opsValue(state, me.id, o.ops);
        if (v > bestValue) [best, bestValue] = [i, v];
      });
      return best;
    }
    case 'target': {
      const list = pending.players!.map((id) => state.players[id]);
      const good = op.t === 'target' && op.good;
      const dracmas = op.t === 'target' && op.ops.some((o) => o.t === 'transfer');
      const key = (p: Player): number => (good ? -p.gloria : dracmas ? Math.min(p.dracmas, 3) * 10 + p.gloria : p.gloria * 10 + p.dracmas);
      return list.reduce((a, b) => (key(b) > key(a) ? b : a)).id;
    }
    case 'discard':
      return [...pending.cards!].sort((a, b) => keepValue(me, a) - keepValue(me, b)).slice(0, pending.count);
    case 'pickCard':
      return [...pending.cards!].sort((a, b) => keepValue(me, a) - keepValue(me, b))[0];
    case 'reorder':
      return pending.cards!;
    case 'view':
      return null;
    case 'dest': {
      const mine = op.t !== 'advance' || op.who === me.id;
      const temples = GODS.map((_, r) => templeOf(r));
      const near = (n: number): number => Math.min(...temples.map((t) => (DIST[n][t] === 0 ? 0 : DIST[n][t])));
      const sorted = [...pending.nodes!].sort((a, b) => near(a) - near(b));
      return mine ? sorted[0] : sorted[sorted.length - 1];
    }
    case 'bid': {
      const max = pending.max!;
      return Math.min(max, Math.floor(rand(state) * 3) + (me.favor >= 4 ? 1 : 0));
    }
  }
}

/** Simula o comando numa cópia (com baralhos reembaralhados: a IA não espia o futuro) e avalia o resultado. */
function simulate(state: GameState, cmd: Command): number {
  const me = state.current;
  const copy: GameState = JSON.parse(JSON.stringify(state));
  copy.sim = true;
  copy.seed = (copy.seed ^ 0x9e3779b9) | 0;
  shuffle(copy, copy.deck);
  shuffle(copy, copy.destiny);
  const before = copy.players.map((p) => worth(copy, p));
  try {
    apply(copy, cmd);
    let guard = 0;
    while (copy.pending && guard++ < 60) apply(copy, { type: 'ANSWER', value: autoAnswer(copy) });
  } catch {
    return -Infinity;
  }
  const delta = copy.players.map((p, i) => worth(copy, p) - before[i]);
  const rivals = Math.max(...others(state, me).map((id) => delta[id]));
  return delta[me] - rivals * 0.4 + (copy.winner === me ? 1000 : 0);
}

/** Bônus por terminar perto de um templo onde há carta ou ação valiosa. */
function approach(state: GameState, p: Player, dest: number, spent: number): number {
  let best = 0;
  for (const id of p.hand) {
    if (id === spent) continue;
    const card = CARDS[id];
    if (card.use === 'U') continue;
    const temples = GODS.map((_, r) => r).filter((r) => (card.use === 'D' ? r === card.god : GODS[r].element === { Paus: 'fogo', Copas: 'agua', Espadas: 'ar', Ouros: 'terra' }[card.suit]));
    const d = Math.min(...temples.map((r) => DIST[dest][templeOf(r)]));
    best = Math.max(best, (card.cost * 2.5) / (d + 2));
  }
  return best + (NODES[dest].type === 'templo' ? 1 : 0);
}

/** Executa uma única decisão da IA (para a interface poder animar passo a passo). */
export function aiStep(state: GameState): void {
  if (state.phase === 'GAME_OVER') return;
  if (state.pending) {
    apply(state, { type: 'ANSWER', value: autoAnswer(state) });
    return;
  }
  const p = currentPlayer(state);
  const free = freePowers(state);
  if (free.includes('taca')) return apply(state, { type: 'FREE_POWER', power: 'taca' });
  if (free.includes('raio') && (p.hubris <= 1 || p.gloria + 3 >= state.goal)) return apply(state, { type: 'FREE_POWER', power: 'raio' });

  const options: { cmd: Command; bias: number }[] = [{ cmd: { type: 'END_TURN' }, bias: -3 }];
  for (const card of p.hand) {
    for (const dest of moveOptions(state, card).keys()) {
      options.push({ cmd: { type: 'PLAY_CARD_MOVE', card, dest }, bias: approach(state, p, dest, card) - keepValue(p, card) * 0.25 });
    }
    if (canEffect(state, card)) options.push({ cmd: { type: 'PLAY_CARD_EFFECT', card }, bias: placeAllows(p, CARDS[card]) && CARDS[card].use !== 'U' ? 1 : 0 });
  }
  if (canTempleAction(state)) options.push({ cmd: { type: 'TEMPLE_ACTION' }, bias: 0 });
  if (canBuyRelic(state)) options.push({ cmd: { type: 'BUY_RELIC' }, bias: 0 });

  let best = options[0].cmd;
  let bestValue = -Infinity;
  for (const o of options) {
    const v = simulate(state, o.cmd) + o.bias;
    if (v > bestValue) [best, bestValue] = [o.cmd, v];
  }
  apply(state, best);
}
