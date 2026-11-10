import { COMMON, NODES, reach, TARTARUS, templeOf } from './board';
import { altarFavor, RULES, TABLES } from './config';
import { cardName, CARDS, effectOps, T } from './cards';
import { ELEMENT_SUIT, G, GODS, SIGNS, SUIT_ELEMENT } from './data';
import { DESTINIES } from './destiny';
import { d6, rand, shuffle } from './rng';
import type { Answer, Card, ChoiceOption, Command, EffectDefinition, FreePower, GameState, MovementResult, Op, Player, PlayerConfig, Res } from './types';

export { RULES };

export const SAVE_VERSION = 2;
const RES_NAME: Record<Res, string> = { gloria: 'Glória', dracmas: 'Dracmas', favor: 'Favor', hubris: 'Húbris' };

export function newGame(configs: PlayerConfig[], seed: number = Date.now() | 0): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    players: configs.map((c, id) => ({
      id, name: c.name, sign: c.sign, isAI: c.isAI,
      pos: templeOf(SIGNS[c.sign].patron),
      gloria: 0, dracmas: RULES.startDracmas, favor: RULES.startFavor, hubris: 0,
      hand: [], relics: [], jailed: false, shield: false, discountNext: false, duelDone: false, used: {},
    })),
    current: 0,
    phase: 'RESOLVE_EFFECTS',
    round: 1,
    deck: [], discard: [], destiny: [], destinyDiscard: [], lastDestiny: null,
    stock: GODS.map(() => true),
    oracle: { holder: null, weaveUsed: false, protectUsed: false },
    queue: [], pending: null, answer: null,
    log: [], winner: null, seed, goal: RULES.goal,
    stats: { duels: 0, jails: configs.map(() => 0) },
    lastMove: null,
  };
  state.deck = shuffle(state, CARDS.map((c) => c.id));
  state.destiny = shuffle(state, DESTINIES.map((d) => d.id));
  for (const p of state.players) drawCards(state, p, RULES.hand);
  say(state, null, 'Os mortais partem dos templos de seus patronos. A disputa pela ascensão começa.');
  state.queue = [{ t: 'turnStart', p: 0 }];
  run(state);
  return state;
}

// ---------- utilitários ----------

export const currentPlayer = (state: GameState): Player => state.players[state.current];
export const has = (p: Player, relic: number): boolean => p.relics.includes(relic);

function say(state: GameState, player: number | null, text: string): void {
  state.log.push({ player, text });
  if (state.log.length > 400) state.log.splice(0, state.log.length - 400);
}

/** Demais jogadores, na ordem do turno a partir de `id`. */
export function others(state: GameState, id: number): number[] {
  const n = state.players.length;
  return Array.from({ length: n - 1 }, (_, i) => (id + 1 + i) % n);
}

/** Altera um recurso sem deixá-lo negativo; devolve a variação real. */
function change(p: Player, res: Res, n: number): number {
  const before = p[res];
  p[res] = Math.max(0, before + n);
  return p[res] - before;
}

/** Garante `n` cartas no baralho, reembaralhando o descarte por baixo se preciso. */
function ensure(state: GameState, which: 'minor' | 'destiny', n: number): void {
  if (which === 'minor' && state.deck.length < n && state.discard.length > 0) {
    state.deck = [...shuffle(state, state.discard), ...state.deck];
    state.discard = [];
  } else if (which === 'destiny' && state.destiny.length < n && state.destinyDiscard.length > 0) {
    state.destiny = [...shuffle(state, state.destinyDiscard), ...state.destiny];
    state.destinyDiscard = [];
  }
}

function drawCards(state: GameState, p: Player, n: number): void {
  for (let i = 0; i < n; i++) {
    ensure(state, 'minor', 1);
    if (state.deck.length === 0) return;
    p.hand.push(state.deck.pop()!);
  }
}

function discardCard(state: GameState, p: Player, cardId: number): void {
  const at = p.hand.indexOf(cardId);
  if (at >= 0) {
    p.hand.splice(at, 1);
    state.discard.push(cardId);
  }
}

function jail(state: GameState, p: Player): void {
  if (p.jailed) return;
  p.jailed = true;
  p.pos = TARTARUS;
  state.stats.jails[p.id]++;
  say(state, p.id, `${p.name} é lançado ao Tártaro.`);
}

/** Égide de Atena (1 vez/rodada) ou escudo absorvem uma perda de Glória. */
function gloryBlocked(state: GameState, p: Player): boolean {
  if (has(p, G.atena) && !p.used.egide) {
    p.used.egide = 1;
    say(state, p.id, `A Égide de Atena protege a Glória de ${p.name}.`);
    return true;
  }
  if (p.shield) {
    p.shield = false;
    say(state, p.id, `O escudo de ${p.name} absorve a perda de Glória.`);
    return true;
  }
  return false;
}

function arco(state: GameState, p: Player): boolean {
  if (!has(p, G.artemis) || p.used.arco) return false;
  p.used.arco = 1;
  say(state, p.id, `O Arco de Ártemis livra ${p.name} do efeito negativo da casa.`);
  return true;
}

function firstBy(state: GameState, from: number, key: (p: Player) => number): Player {
  let best = state.players[from];
  for (const id of others(state, from)) if (key(state.players[id]) > key(best)) best = state.players[id];
  return best;
}

/** Substitui o marcador de alvo pelo jogador escolhido. */
function subst(ops: Op[], id: number): Op[] {
  return JSON.parse(JSON.stringify(ops), (key, value) => (value === T && ['p', 'from', 'to', 'of', 'who', 'a', 'd'].includes(key) ? id : value));
}

// ---------- regras consultáveis pela interface e pela IA ----------

function martelo(p: Player, card: Card): boolean {
  return card.use === 'D' && has(p, G.hefesto) && !p.used.martelo;
}

/** Custo do efeito: −1 no naipe do elemento do signo; descontos de carta/relíquia não acumulam entre si. */
export function costFor(p: Player, card: Card): number {
  let cost = card.cost;
  if (ELEMENT_SUIT[SIGNS[p.sign].element] === card.suit) cost--;
  if (p.discountNext || martelo(p, card)) cost--;
  return Math.max(0, cost);
}

/** A carta pode ter o efeito usado na casa atual? (U: qualquer casa; E: templo do elemento; D: templo nomeado.) */
export function placeAllows(p: Player, card: Card): boolean {
  if (card.use === 'U') return true;
  const node = NODES[p.pos];
  if (node.type !== 'templo') return false;
  return card.use === 'D' ? node.region === card.god : GODS[node.region].element === SUIT_ELEMENT[card.suit];
}

const acting = (state: GameState): boolean => state.phase === 'CHOOSE_ACTION' && !currentPlayer(state).jailed;

export function canEffect(state: GameState, cardId: number): boolean {
  const p = currentPlayer(state);
  const card = CARDS[cardId];
  return acting(state) && p.hand.includes(cardId) && placeAllows(p, card) && p.dracmas >= costFor(p, card);
}

export function moveOptions(state: GameState, cardId: number, mod = 0): Map<number, number[]> {
  return reach(currentPlayer(state).pos, Math.max(1, CARDS[cardId].move + mod));
}

export const canUseSandals = (state: GameState): boolean => {
  const p = currentPlayer(state);
  return acting(state) && has(p, G.hermes) && !p.used.sandals;
};

function templeAffordable(p: Player, region: number): boolean {
  const { cost, res } = GODS[region].action;
  return !p.used.temple && p[res] >= cost;
}

function relicAffordable(state: GameState, p: Player, region: number): boolean {
  return state.stock[region] && p.dracmas >= GODS[region].relic.price;
}

export function canBuyRelic(state: GameState): boolean {
  const p = currentPlayer(state);
  const node = NODES[p.pos];
  return acting(state) && node.type === 'templo' && relicAffordable(state, p, node.region);
}

export function freePowers(state: GameState): FreePower[] {
  if (!acting(state)) return [];
  const p = currentPlayer(state);
  const list: FreePower[] = [];
  if (state.oracle.holder === p.id) {
    if (!p.used.vision) list.push('vision');
    if (!state.oracle.weaveUsed && p.favor >= 2) list.push('weave');
  }
  if (has(p, G.apolo) && !p.used.lira) list.push('lira');
  if (has(p, G.dionisio) && !p.used.taca && p.hubris >= 1) list.push('taca');
  if (has(p, G.zeus)) list.push('raio');
  return list;
}

export function votes(p: Player): number {
  return p.favor + (has(p, G.hera) ? 1 : 0);
}

// ---------- ações de templo e Destino ----------

function templeActionOps(region: number, p: number): Op[] {
  const g = (res: Res, n: number): Op => ({ t: 'res', p, res, n });
  const effect: Op[][] = [
    [g('gloria', 2)],
    [g('favor', 2)],
    [{ t: 'peek', p, deck: 'destiny', n: 3, reorder: false }],
    [{ t: 'advance', p, who: p, min: 0, max: 3 }],
    [{ t: 'draw', p, n: 2 }, { t: 'discard', p, n: 2 }],
    [{ t: 'target', p, prompt: 'De quem roubar até 2 Dracmas?', ops: [{ t: 'transfer', from: T, to: p, res: 'dracmas', n: 2 }] }],
    [{ t: 'shield', p }],
    [g('gloria', 2), g('hubris', 1)],
    [{ t: 'draw', p, n: 2 }, { t: 'discard', p, n: 1 }],
    [g('dracmas', 4)],
    [g('gloria', 2)],
    [{ t: 'teleport', p, kind: 'adjacent' }],
  ];
  return [{ t: 'payTemple', p, region }, ...effect[region]];
}

/** Jogadores prejudicados pessoalmente pelo Arcano (para a Proteção do Destino do Oráculo). */
function harmedBy(state: GameState, id: number, active: number): number[] {
  const all = state.players;
  switch (id) {
    case 4: return [firstBy(state, active, (p) => p.gloria).id];
    case 8: return all.filter((p) => p.hubris >= 3 && p.dracmas > 0).map((p) => p.id);
    case 12: return [active];
    case 13: return all.filter((p) => p.hand.length > 0).map((p) => p.id);
    case 16: return all.filter((p) => p.dracmas > 0).map((p) => p.id);
    case 20: return all.filter((p) => p.hubris >= 4 && !p.jailed).map((p) => p.id);
    default: return [];
  }
}

function destinyOps(state: GameState, id: number, a: number, exempt: number): Op[] {
  const order = [a, ...others(state, a)];
  const each = (make: (p: number) => Op[], skipExempt = false): Op[] => order.filter((p) => !skipExempt || p !== exempt).flatMap(make);
  const g = (p: number, res: Res, n: number): Op => ({ t: 'res', p, res, n });
  switch (id) {
    case 0: return each((p) => [{ t: 'draw', p, n: 1 }, { t: 'discard', p, n: 1 }]);
    case 1: return [g(a, 'dracmas', 2), g(a, 'favor', 1)];
    case 2: return [{ t: 'peek', p: a, deck: 'destiny', n: 3, reorder: true }];
    case 3: return each((p) => [g(p, 'dracmas', 3)]);
    case 4: {
      const leader = firstBy(state, a, (p) => p.gloria).id;
      return each((p) => (p === leader ? (p === exempt ? [] : [g(p, 'hubris', 1)]) : [g(p, 'dracmas', 1)]));
    }
    case 5: return each((p) => [g(p, 'hubris', -1)]);
    case 6: return [{ t: 'target', p: a, prompt: 'Com quem dividir 1 Favor?', good: true, ops: [g(T, 'favor', 1), g(a, 'favor', 1)] }];
    case 7: return [{ t: 'advance', p: a, who: a, min: 3, max: 3 }];
    case 8: return each((p) => (state.players[p].hubris >= 3 ? [g(p, 'dracmas', -2)] : []), true);
    case 9: return [{ t: 'draw', p: a, n: 2 }, { t: 'discard', p: a, n: 2 }];
    case 10: return [{ t: 'redraw' }];
    case 11: return [g(a, 'gloria', 2), g(a, 'hubris', 1)];
    case 12: return a === exempt ? [] : [{ t: 'enforcado', p: a }];
    case 13: return each((p) => [{ t: 'discardRandom', p, n: 1 }], true);
    case 14: return each((p) => [g(p, 'hubris', -2)]);
    case 15: return [g(a, 'dracmas', 5), g(a, 'hubris', 2)];
    case 16: return each((p) => [g(p, 'dracmas', -3)], true);
    case 17: return [g(firstBy(state, a, (p) => -p.gloria).id, 'gloria', 2)];
    case 18: return [{ t: 'revealRandom' }, g(a, 'favor', 1)];
    case 19: return each((p) => [g(p, 'gloria', 1)]);
    case 20: return each((p) => (state.players[p].hubris >= 4 ? [{ t: 'jail', p }] : []), true);
    case 21: return [g(a, 'gloria', 3), g(a, 'favor', 1)];
    default: throw new Error(`Arcano desconhecido: ${id}`);
  }
}

// ---------- casas: passagem e parada ----------

const pad = (id: number): string => String(id).padStart(2, '0');

/** Paga até `n` Dracmas; sem saldo suficiente, paga o que tiver e ganha Húbris. Devolve o texto do ocorrido. */
function toll(p: Player, n: number): string {
  const paid = -change(p, 'dracmas', -n);
  if (paid === n) return `−${n} Dracma${n > 1 ? 's' : ''}`;
  change(p, 'hubris', RULES.tollHubris);
  return `paga ${paid} de ${n} Dracmas e ganha ${RULES.tollHubris} Húbris`;
}

/** Efeito de passagem de uma casa (sempre automático). Devolve o texto, ou '' se nada ocorreu. */
function passEffect(p: Player, def: EffectDefinition): string {
  if (def.k === 'res') {
    change(p, def.res, def.n);
    return `${def.n > 0 ? '+' : '−'}${Math.abs(def.n)} ${RES_NAME[def.res]}`;
  }
  if (def.k === 'toll') return toll(p, def.n);
  if (def.k === 'hubrisToll') return p.hubris >= def.min ? `Nêmesis fiscaliza: ${toll(p, def.n)}` : '';
  return '';
}

/**
 * Percorre o caminho: aplica a passagem de cada casa intermediária, na ordem, e deixa o peão
 * na última casa sem resolver a parada. A casa inicial não é ativada.
 */
export function walk(state: GameState, p: Player, path: number[]): MovementResult {
  const result: MovementResult = { player: p.id, path: [...path], passedNodes: path.slice(0, -1), destination: path[path.length - 1], events: [] };
  let region = NODES[p.pos].region;
  path.forEach((id, i) => {
    const node = NODES[id];
    p.pos = id;
    if (i < path.length - 1) {
      for (const def of node.onPass) {
        const text = passEffect(p, def);
        if (text) result.events.push({ node: id, text });
      }
    }
    // Bônus de relíquia de passagem vêm depois do efeito da casa.
    if (node.region !== region && has(p, G.poseidon) && (p.used.trident ?? 0) < 2) {
      p.used.trident = (p.used.trident ?? 0) + 1;
      change(p, 'dracmas', 1);
      result.events.push({ node: id, text: 'Tridente de Poseidon: +1 Dracma' });
    }
    region = node.region;
  });
  state.lastMove = result;
  return result;
}

function judgement(state: GameState, p: Player): Op[] {
  const id = p.id;
  if (p.hubris <= 1) {
    say(state, id, `Nêmesis nada tem contra ${p.name}.`);
    return [];
  }
  say(state, id, `Nêmesis julga ${p.name} (Húbris ${p.hubris}).`);
  if (arco(state, p)) return [];
  if (p.hubris <= 3) return [{ t: 'res', p: id, res: 'dracmas', n: -2 }];
  if (p.hubris >= 6 || p.dracmas < RULES.nemesisFine) return [{ t: 'jail', p: id }];
  return [{
    t: 'choice', p: id, prompt: 'Nêmesis exige reparação', options: [
      { label: `Pagar ${RULES.nemesisFine} Dracmas`, ops: [{ t: 'res', p: id, res: 'dracmas', n: -RULES.nemesisFine }] },
      { label: 'Ir ao Tártaro', ops: [{ t: 'jail', p: id }] },
    ],
  }];
}

/** Efeito de parada da casa onde o movimento terminou. */
function land(state: GameState, p: Player): Op[] {
  const node = NODES[p.pos];
  const id = p.id;
  const ops: Op[] = [];
  for (const def of node.onStop) {
    switch (def.k) {
      case 'res':
        change(p, def.res, def.n);
        say(state, id, `Casa ${pad(node.id)}: ${p.name} ganha ${def.n} ${RES_NAME[def.res]}.`);
        break;
      case 'toll':
        if (!arco(state, p)) say(state, id, `Pedágio divino na casa ${pad(node.id)}: ${p.name} ${toll(p, def.n)}.`);
        break;
      case 'hubrisToll':
        break;
      case 'roll': {
        const roll = d6(state);
        const row = TABLES[def.table][roll - 1];
        say(state, id, `${def.table === 'provacao' ? 'Provação' : 'Evento'}: ${p.name} tira ${roll}: ${row.text}.`);
        const negative = row.changes.some(([res, n]) => (res === 'hubris' ? n > 0 : n < 0));
        if (negative && arco(state, p)) break;
        for (const [res, n] of row.changes) change(p, res, n);
        break;
      }
      case 'treasure': {
        const n = def.min + Math.floor(rand(state) * (def.max - def.min + 1));
        change(p, 'dracmas', n);
        say(state, id, `Tesouro: ${p.name} encontra ${n} Dracmas.`);
        break;
      }
      case 'altar': {
        if (p.dracmas < 1) break;
        const bets = Array.from({ length: RULES.altarMaxBet }, (_, i) => i + 1);
        ops.push({
          t: 'choice', p: id, prompt: 'Altar: apostar Dracmas por Favor?', options: [
            ...bets.map((bet) => ({ label: `Apostar ${bet} Dracma${bet > 1 ? `s (+${bet - 1} no dado)` : ''}`, ops: [{ t: 'altar', p: id, bet } as Op], disabled: p.dracmas < bet })),
            { label: 'Não apostar', ops: [] },
          ],
        });
        break;
      }
      case 'destiny':
        ops.push({ t: 'destiny', p: id });
        break;
      case 'judgement':
        ops.push(...judgement(state, p));
        break;
      case 'temple': {
        const god = GODS[node.region];
        const cost = god.action.cost === 0 ? 'grátis' : `${god.action.cost} ${god.action.res === 'favor' ? 'Favores' : 'Dracmas'}`;
        const options: ChoiceOption[] = [
          { label: `${god.action.label} (${cost})`, ops: templeActionOps(node.region, id), disabled: !templeAffordable(p, node.region) },
          { label: `Comprar ${god.relic.name} (${god.relic.price} Dracmas)`, ops: [{ t: 'buy', p: id, relic: node.region }], disabled: !relicAffordable(state, p, node.region) },
          { label: 'Nenhuma ação', ops: [] },
        ];
        if (!(options[0].disabled && options[1].disabled)) ops.push({ t: 'choice', p: id, prompt: `Templo de ${god.name}`, options });
        break;
      }
      case 'delphi':
        ops.push({
          t: 'choice', p: id, prompt: 'Delfos', options: [
            { label: 'Ver 2 cartas do Destino (grátis)', ops: [{ t: 'peek', p: id, deck: 'destiny', n: 2, reorder: false }] },
            { label: 'Pagar 2 Dracmas: +1 Favor', ops: [{ t: 'res', p: id, res: 'dracmas', n: -2 }, { t: 'res', p: id, res: 'favor', n: 1 }], disabled: p.dracmas < 2 },
            { label: 'Pagar 3 Dracmas: comprar 2 e descartar 2', ops: [{ t: 'res', p: id, res: 'dracmas', n: -3 }, { t: 'draw', p: id, n: 2 }, { t: 'discard', p: id, n: 2 }], disabled: p.dracmas < 3 },
          ],
        });
        break;
    }
  }
  return ops;
}

// ---------- fim de turno, rodada e eleição ----------

function victory(state: GameState): boolean {
  const best = firstBy(state, state.current, (p) => p.gloria);
  if (best.gloria < state.goal) return false;
  state.winner = best.id;
  state.phase = 'GAME_OVER';
  state.queue = [];
  state.pending = null;
  say(state, best.id, `${best.name} alcança ${best.gloria} de Glória e ascende ao Olimpo!`);
  return true;
}

function election(state: GameState): void {
  const ranked = [...state.players].sort((a, b) => votes(b) - votes(a) || a.hubris - b.hubris || a.gloria - b.gloria);
  const [first, second] = ranked;
  const tied = votes(first) === votes(second) && first.hubris === second.hubris && first.gloria === second.gloria;
  const tally = state.players.map((p) => `${p.name} ${votes(p)}`).join(', ');
  state.oracle = { holder: tied ? null : first.id, weaveUsed: false, protectUsed: false };
  if (tied) {
    say(state, null, `Eleição em Delfos (${tally}): empate. O cargo de Oráculo fica vago.`);
  } else {
    change(first, 'gloria', 1);
    say(state, first.id, `Eleição em Delfos (${tally}): ${first.name} é o Oráculo e ganha 1 Glória.`);
  }
}

function roundEnd(state: GameState): void {
  if (state.round % RULES.electionEvery === 0) {
    election(state);
    if (victory(state)) return;
  }
  const cinto = state.round % 3 === 0;
  state.round++;
  for (const p of state.players) {
    p.used = {};
    if (has(p, G.demeter)) change(p, 'dracmas', 1);
    if (cinto && has(p, G.afrodite)) change(p, 'favor', 1);
  }
}

// ---------- fila de efeitos ----------

function take(state: GameState): Answer {
  const a = state.answer!.v;
  state.answer = null;
  return a;
}

/** Executa um passo. Devolve os passos que o substituem, ou null se aguarda uma decisão. */
function exec(state: GameState, op: Op): Op[] | null {
  const P = (id: number): Player => state.players[id];
  switch (op.t) {
    case 'turnStart': {
      const p = P(op.p);
      p.duelDone = false;
      if (!p.jailed) return [{ t: 'refill', p: p.id }];
      const id = p.id;
      return [{
        t: 'choice', p: id, prompt: 'Você está no Tártaro', options: [
          { label: 'Penitência: perde a ação, remove 2 Húbris e sai ao fim do turno', ops: [{ t: 'res', p: id, res: 'hubris', n: -2 }, { t: 'log', p: id, text: `${p.name} faz penitência no Tártaro.` }, { t: 'release', p: id }, { t: 'endTurn' }] },
          { label: `Suborno: paga ${RULES.bail} Dracmas, sai e age`, disabled: p.dracmas < RULES.bail, ops: [{ t: 'res', p: id, res: 'dracmas', n: -RULES.bail }, { t: 'log', p: id, text: `${p.name} suborna Caronte e deixa o Tártaro.` }, { t: 'release', p: id }, { t: 'refill', p: id }] },
          { label: 'Pacto Sombrio: perde 1 Glória, ganha 2 Húbris, sai e age', disabled: p.gloria < 1, ops: [{ t: 'res', p: id, res: 'gloria', n: -1, raw: true }, { t: 'res', p: id, res: 'hubris', n: 2 }, { t: 'log', p: id, text: `${p.name} sela um Pacto Sombrio e deixa o Tártaro.` }, { t: 'release', p: id }, { t: 'refill', p: id }] },
        ],
      }];
    }
    case 'refill': {
      const p = P(op.p);
      drawCards(state, p, Math.max(0, RULES.hand - p.hand.length));
      return [];
    }
    case 'res': {
      const p = P(op.p);
      if (op.res === 'gloria' && op.n < 0 && !op.raw && p.gloria > 0 && gloryBlocked(state, p)) return [];
      change(p, op.res, op.n);
      return [];
    }
    case 'transfer': {
      const taken = -change(P(op.from), op.res, -op.n);
      change(P(op.to), op.res, taken);
      say(state, op.to, `${P(op.to).name} toma ${taken} ${RES_NAME[op.res]} de ${P(op.from).name}.`);
      return [];
    }
    case 'target': {
      const list = others(state, op.p);
      if (list.length === 1) return subst(op.ops, list[0]);
      if (!state.answer) {
        state.pending = { player: op.p, kind: 'target', prompt: op.prompt, players: list };
        return null;
      }
      const a = take(state);
      return subst(op.ops, list.includes(a as number) ? (a as number) : list[0]);
    }
    case 'choice': {
      const open = op.options.filter((o) => !o.disabled);
      if (open.length === 1) return open[0].ops;
      if (!state.answer) {
        state.pending = { player: op.p, kind: 'choice', prompt: op.prompt, options: op.options.map(({ label, disabled }) => ({ label, disabled })) };
        return null;
      }
      const chosen = op.options[take(state) as number];
      return chosen && !chosen.disabled ? chosen.ops : open[0].ops;
    }
    case 'draw':
      drawCards(state, P(op.p), op.n);
      return [];
    case 'discard': {
      const p = P(op.p);
      const n = Math.min(op.n, p.hand.length);
      if (n === 0) return [];
      let picked = [...p.hand];
      if (n < p.hand.length) {
        if (!state.answer) {
          state.pending = { player: p.id, kind: 'discard', prompt: `Descarte ${n} carta${n > 1 ? 's' : ''}`, count: n, cards: [...p.hand] };
          return null;
        }
        const a = take(state);
        const valid = Array.isArray(a) && a.length === n && new Set(a).size === n && a.every((c) => p.hand.includes(c));
        picked = valid ? (a as number[]) : p.hand.slice(0, n);
      }
      for (const c of picked) discardCard(state, p, c);
      return [];
    }
    case 'discardRandom': {
      const p = P(op.p);
      for (let i = 0; i < op.n && p.hand.length > 0; i++) {
        const c = p.hand[Math.floor(rand(state) * p.hand.length)];
        discardCard(state, p, c);
        say(state, p.id, `${p.name} descarta ${cardName(CARDS[c])}.`);
      }
      return [];
    }
    case 'peek': {
      ensure(state, op.deck, op.n);
      const deck = op.deck === 'minor' ? state.deck : state.destiny;
      const n = Math.min(op.n, deck.length);
      if (n === 0) return [];
      const top = deck.slice(-n).reverse();
      if (!state.answer) {
        const what = op.deck === 'minor' ? 'do baralho de jogadores' : 'do Destino';
        state.pending = { player: op.p, kind: op.reorder ? 'reorder' : 'view', prompt: `Próximas cartas ${what} (a primeira é a do topo)`, cards: top, deck: op.deck };
        return null;
      }
      const a = take(state);
      if (op.reorder && Array.isArray(a) && a.length === n && [...a].sort().join() === [...top].sort().join()) {
        deck.splice(deck.length - n, n, ...[...a].reverse());
      }
      return [];
    }
    case 'viewHand': {
      const of = P(op.of);
      if (of.hand.length === 0) return [];
      if (!state.answer) {
        state.pending = { player: op.p, kind: 'view', prompt: `Mão de ${of.name}`, cards: [...of.hand], deck: 'minor' };
        return null;
      }
      take(state);
      return [];
    }
    case 'swap': {
      const p = P(op.p);
      const of = P(op.of);
      if (p.hand.length === 0 || of.hand.length === 0) return [];
      if (!state.answer) {
        state.pending = { player: p.id, kind: 'pickCard', prompt: `Escolha a carta que vai para ${of.name}`, cards: [...p.hand] };
        return null;
      }
      const a = take(state);
      const mine = p.hand.includes(a as number) ? (a as number) : p.hand[0];
      const theirs = of.hand[Math.floor(rand(state) * of.hand.length)];
      p.hand.splice(p.hand.indexOf(mine), 1, theirs);
      of.hand.splice(of.hand.indexOf(theirs), 1, mine);
      say(state, p.id, `${p.name} troca uma carta com ${of.name}.`);
      return [];
    }
    case 'advance':
    case 'teleport': {
      const who = P(op.t === 'advance' ? op.who : op.p);
      if (who.jailed) return [];
      let nodes: number[];
      if (op.t === 'advance') {
        const set = new Set<number>();
        for (let k = op.min; k <= op.max; k++) for (const n of k === 0 ? [who.pos] : reach(who.pos, k).keys()) set.add(n);
        nodes = [...set];
      } else if (op.kind === 'common') {
        nodes = COMMON.filter((n) => n !== who.pos);
      } else {
        const r = NODES[who.pos].region;
        nodes = COMMON.filter((n) => [(r + 1) % 12, (r + 11) % 12].includes(NODES[n].region));
      }
      if (nodes.length === 0) return [];
      let dest = nodes[0];
      if (nodes.length > 1) {
        if (!state.answer) {
          state.pending = { player: op.p, kind: 'dest', prompt: who.id === op.p ? 'Escolha a casa de destino no mapa' : `Escolha para onde mover ${who.name}`, nodes };
          return null;
        }
        const a = take(state);
        if (nodes.includes(a as number)) dest = a as number;
      }
      if (dest !== who.pos) {
        who.pos = dest;
        say(state, op.p, `${who.name} vai para a casa ${String(dest).padStart(2, '0')} sem ativar o destino.`);
      }
      return [];
    }
    case 'jail':
      jail(state, P(op.p));
      return [];
    case 'release':
      P(op.p).jailed = false;
      return [];
    case 'shield':
      P(op.p).shield = true;
      return [];
    case 'discountNext':
      P(op.p).discountNext = true;
      return [];
    case 'paus9': {
      const p = P(op.p);
      change(p, 'gloria', p.hubris >= 3 ? 3 : 2);
      return [];
    }
    case 'behind': {
      const p = P(op.p);
      const leader = Math.max(...others(state, p.id).map((id) => P(id).gloria));
      change(p, 'gloria', p.gloria < leader ? 2 : 1);
      return [];
    }
    case 'enforcado': {
      const p = P(op.p);
      if (p.favor > 0) change(p, 'favor', -1);
      else change(p, 'dracmas', -2);
      return [];
    }
    case 'redraw':
      for (const p of state.players) {
        state.discard.push(...p.hand);
        p.hand = [];
      }
      for (const p of state.players) drawCards(state, p, RULES.hand);
      return [];
    case 'revealRandom':
      for (const p of state.players) {
        if (p.hand.length === 0) continue;
        const c = CARDS[p.hand[Math.floor(rand(state) * p.hand.length)]];
        say(state, p.id, `${p.name} revela ${cardName(c)}.`);
      }
      return [];
    case 'destiny': {
      ensure(state, 'destiny', 1);
      if (state.destiny.length === 0) return [];
      const id = state.destiny.pop()!;
      state.destinyDiscard.push(id);
      state.lastDestiny = id;
      const d = DESTINIES[id];
      say(state, op.p, `Destino revelado: ${d.numeral} · ${d.name}. ${d.text}`);
      const h = state.oracle.holder;
      const apply: Op = { t: 'destinyApply', p: op.p, id, exempt: -2 };
      if (h !== null && !P(h).jailed && !state.oracle.protectUsed && P(h).favor >= 3 && harmedBy(state, id, op.p).includes(h)) {
        return [{
          t: 'choice', p: h, prompt: `Proteção do Destino contra ${d.name}?`, options: [
            { label: 'Ignorar o evento (3 Favores)', ops: [{ t: 'res', p: h, res: 'favor', n: -3 }, { t: 'protect', p: h }, { ...apply, exempt: h }] },
            { label: 'Aceitar o Destino', ops: [apply] },
          ],
        }];
      }
      return [apply];
    }
    case 'destinyApply':
      return destinyOps(state, op.id, op.p, op.exempt);
    case 'protect':
      state.oracle.protectUsed = true;
      say(state, op.p, `${P(op.p).name}, o Oráculo, usa a Proteção do Destino.`);
      return [];
    case 'land':
      return P(op.p).jailed ? [] : land(state, P(op.p));
    case 'encounter': {
      const p = P(op.p);
      if (p.jailed || p.duelDone) return [];
      const foes = others(state, p.id).filter((id) => P(id).pos === p.pos && !P(id).jailed);
      if (foes.length === 0) return [];
      return [{
        t: 'choice', p: p.id, prompt: 'Encontro: desafiar para um duelo?', options: [
          ...foes.map((id) => ({ label: `Duelar com ${P(id).name}`, ops: [{ t: 'duel', a: p.id, d: id } as Op] })),
          { label: 'Não duelar', ops: [] },
        ],
      }];
    }
    case 'duel': {
      const a = P(op.a);
      const d = P(op.d);
      for (const [key, who] of [['bidA', a], ['bidD', d]] as const) {
        if (op[key] !== undefined) continue;
        const max = Math.min(RULES.maxBid, who.favor);
        if (max === 0) {
          op[key] = 0;
        } else if (!state.answer) {
          state.pending = { player: who.id, kind: 'bid', prompt: `Duelo ${a.name} × ${d.name}: aposte Favores em segredo`, max, secret: true };
          return null;
        } else {
          op[key] = Math.max(0, Math.min(max, Math.floor(Number(take(state)) || 0)));
        }
      }
      a.duelDone = true;
      state.stats.duels++;
      change(a, 'favor', -op.bidA!);
      change(d, 'favor', -op.bidD!);
      const fa = op.bidA! + (has(a, G.ares) ? 1 : 0);
      const fd = op.bidD! + (has(d, G.ares) ? 1 : 0);
      let result = 'Empate: o defensor resiste, sem prêmio.';
      if (fa > fd) result = `${a.name} vence e toma ${change(a, 'dracmas', -change(d, 'dracmas', -2))} Dracmas.`;
      else if (fd > fa) result = `${d.name} vence e recebe ${change(d, 'favor', -change(a, 'favor', -1))} Favor.`;
      say(state, a.id, `Duelo: ${a.name} (força ${fa}) × ${d.name} (força ${fd}). ${result}`);
      return [];
    }
    case 'payTemple': {
      const p = P(op.p);
      const god = GODS[op.region];
      change(p, god.action.res, -god.action.cost);
      p.used.temple = 1;
      say(state, p.id, `${p.name} usa o Templo de ${god.name}: ${god.action.label.toLowerCase()}.`);
      return [];
    }
    case 'buy': {
      const p = P(op.p);
      const relic = GODS[op.relic].relic;
      if (!state.stock[op.relic] || p.dracmas < relic.price) return [];
      if (p.relics.length >= RULES.maxRelics) {
        if (!state.answer) {
          state.pending = { player: p.id, kind: 'choice', prompt: `Substituir qual relíquia por ${relic.name}?`, options: p.relics.map((r) => ({ label: GODS[r].relic.name })) };
          return null;
        }
        const old = p.relics[take(state) as number] ?? p.relics[0];
        p.relics.splice(p.relics.indexOf(old), 1);
        state.stock[old] = true;
      }
      change(p, 'dracmas', -relic.price);
      state.stock[op.relic] = false;
      p.relics.push(op.relic);
      say(state, p.id, `${p.name} adquire ${relic.name}.`);
      return [];
    }
    case 'altar': {
      const p = P(op.p);
      const bet = -change(p, 'dracmas', -op.bet);
      const roll = d6(state);
      const favor = altarFavor(roll, bet);
      change(p, 'favor', favor);
      say(state, p.id, `Altar: ${p.name} aposta ${bet} Dracma${bet > 1 ? 's' : ''} e tira ${roll}: ${favor ? `+${favor} Favor${favor > 1 ? 'es' : ''}` : 'perde a aposta'}.`);
      return [];
    }
    case 'log':
      say(state, op.p, op.text);
      return [];
    case 'endTurn': {
      if (victory(state)) return [];
      const ending = P(state.current);
      if (!ending.jailed && ending.hubris >= RULES.wrathHubris) {
        say(state, ending.id, `A soberba de ${ending.name} (Húbris ${ending.hubris}) desperta a ira de Nêmesis.`);
        jail(state, ending);
        ending.hubris = RULES.wrathReset;
      }
      if (state.sim) {
        state.queue = [];
        return [];
      }
      state.current = (state.current + 1) % state.players.length;
      if (state.current === 0) {
        roundEnd(state);
        if (state.winner !== null) return [];
      }
      return [{ t: 'turnStart', p: state.current }];
    }
  }
}

function run(state: GameState): void {
  while (state.phase !== 'GAME_OVER' && !state.pending && state.queue.length > 0) {
    const op = state.queue.shift()!;
    const result = exec(state, op);
    if ((state.phase as string) === 'GAME_OVER') return;
    if (result === null) state.queue.unshift(op);
    else state.queue.unshift(...result);
  }
  if (state.phase !== 'GAME_OVER') state.phase = state.pending || state.queue.length > 0 ? 'RESOLVE_EFFECTS' : 'CHOOSE_ACTION';
}

// ---------- comandos ----------

/** Aplica um comando ao estado. Lança erro se o comando for inválido no momento. */
export function apply(state: GameState, cmd: Command): void {
  if (state.phase === 'GAME_OVER') throw new Error('A partida terminou.');
  if (cmd.type === 'ANSWER') {
    if (!state.pending) throw new Error('Não há decisão pendente.');
    state.answer = { v: cmd.value };
    state.pending = null;
    run(state);
    return;
  }
  if (state.phase !== 'CHOOSE_ACTION') throw new Error('Há efeitos ou decisões pendentes.');
  const p = currentPlayer(state);
  switch (cmd.type) {
    case 'PLAY_CARD_MOVE': {
      const mod = cmd.mod ?? 0;
      if (!p.hand.includes(cmd.card)) throw new Error('A carta não está na mão.');
      if (mod !== 0 && !canUseSandals(state)) throw new Error('Sandálias de Hermes indisponíveis.');
      const path = moveOptions(state, cmd.card, mod).get(cmd.dest);
      if (!path) throw new Error('Destino inválido para esta carta.');
      if (mod !== 0) p.used.sandals = 1;
      discardCard(state, p, cmd.card);
      const from = p.pos;
      const move = walk(state, p, path);
      const node = NODES[p.pos];
      say(state, p.id, `${p.name} descarta ${cardName(CARDS[cmd.card])} e anda ${path.length} da casa ${pad(from)} até a ${pad(node.id)} (${GODS[node.region].name}).`);
      if (move.events.length > 0) say(state, p.id, `No caminho: ${move.events.map((e) => `${e.text} (casa ${pad(e.node)})`).join('; ')}.`);
      state.queue = [{ t: 'land', p: p.id }, { t: 'encounter', p: p.id }, { t: 'endTurn' }];
      break;
    }
    case 'PLAY_CARD_EFFECT': {
      if (!canEffect(state, cmd.card)) throw new Error('O efeito desta carta não pode ser usado agora.');
      const card = CARDS[cmd.card];
      change(p, 'dracmas', -costFor(p, card));
      if (martelo(p, card)) p.used.martelo = 1;
      else p.discountNext = false;
      discardCard(state, p, cmd.card);
      say(state, p.id, `${p.name} joga ${cardName(card)}: ${card.text}`);
      state.queue = [...effectOps(cmd.card, p.id), { t: 'endTurn' }];
      break;
    }
    case 'BUY_RELIC':
      if (!canBuyRelic(state)) throw new Error('Não é possível comprar a relíquia.');
      state.queue = [{ t: 'buy', p: p.id, relic: NODES[p.pos].region }, { t: 'endTurn' }];
      break;
    case 'FREE_POWER': {
      if (!freePowers(state).includes(cmd.power)) throw new Error('Poder indisponível.');
      if (cmd.power === 'vision') {
        p.used.vision = 1;
        state.queue = [{ t: 'peek', p: p.id, deck: 'destiny', n: 3, reorder: false }];
      } else if (cmd.power === 'weave') {
        change(p, 'favor', -2);
        state.oracle.weaveUsed = true;
        say(state, p.id, `${p.name}, o Oráculo, tece o Destino.`);
        state.queue = [{ t: 'peek', p: p.id, deck: 'destiny', n: 3, reorder: true }];
      } else if (cmd.power === 'lira') {
        p.used.lira = 1;
        state.queue = [{ t: 'peek', p: p.id, deck: 'destiny', n: 1, reorder: false }];
      } else if (cmd.power === 'taca') {
        p.used.taca = 1;
        change(p, 'hubris', -1);
        change(p, 'dracmas', 2);
        say(state, p.id, `${p.name} bebe da Taça de Dionísio: −1 Húbris, +2 Dracmas.`);
      } else {
        p.relics.splice(p.relics.indexOf(G.zeus), 1);
        change(p, 'gloria', 3);
        change(p, 'hubris', 2);
        say(state, p.id, `${p.name} desfere o Raio de Zeus: +3 Glórias, +2 Húbris.`);
      }
      break;
    }
    case 'END_TURN':
      state.queue = [{ t: 'endTurn' }];
      break;
    default:
      throw new Error('Comando desconhecido.');
  }
  run(state);
}

// ---------- persistência ----------

export const serialize = (state: GameState): string => JSON.stringify(state);

/** Carrega uma partida salva, migrando versões anteriores. */
export function deserialize(json: string): GameState {
  const state = JSON.parse(json) as GameState;
  if (state.version === 1) {
    // v1 → v2 (regras v1.6): as casas mudaram de efeito, mas IDs e ligações são os mesmos.
    state.lastMove = null;
    state.version = 2;
  }
  if (state.version !== SAVE_VERSION) throw new Error(`Versão de partida salva incompatível: ${state.version}.`);
  return state;
}
