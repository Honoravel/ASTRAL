import { DIST, NODES, templeOf } from './board';
import { CARDS } from './cards';
import { GODS } from './data';
import { RULES, TRAPS } from './config';
import { apply, canBuyRelic, canEffect, costFor, currentPlayer, freePowers, moveOptions, others, placeAllows, subst, TRAP_NODES, trapBlock } from './game';
import { rand, shuffle } from './rng';
import type { Answer, Command, GameState, Op, Player, Res } from './types';

const WEIGHT: Record<Res, number> = { gloria: 10, dracmas: 1, favor: 1.5, hubris: -1.5 };

function hubrisRisk(h: number): number {
  return h * 1.5 + (h >= 2 ? 1.5 : 0) + (h >= 4 ? 4 : 0) + (h >= 6 ? 12 : 0);
}

/** Avaliação da situação de um jogador. */
function worth(state: GameState, p: Player): number {
  // O Favor vale mais quando a eleição se aproxima.
  const toElection = RULES.electionEvery - ((state.round - 1) % RULES.electionEvery);
  const favorWeight = toElection <= 2 ? 2.4 : 1.5;
  const income = p.investments.reduce((a, i) => a + i.incomePerRound * i.remainingRounds, 0) * 0.7;
  return p.gloria * 10 + Math.min(p.dracmas, 18) * 0.7 + Math.min(Math.max(0, p.dracmas - 18), 14) * 0.25 + p.favor * favorWeight - hubrisRisk(p.hubris) + income + (p.decree ? 1 : 0)
    + p.relics.reduce((a, r) => a + GODS[r].relic.price * 0.95, 0) + p.hand.length * 0.8 - (p.jailed ? 9 : 0) + (state.oracle.holder === p.id ? 2 : 0);
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
      case 'buy': v += GODS[op.relic].relic.price * 0.95; break;
      case 'altar': v += [1.5, 2.25, 2.5][op.bet - 1] - op.bet; break;
      case 'shield': v += 2; break;
      case 'peek': v += 0.3; break;
      case 'advance': case 'teleport': v += 1; break;
      case 'duel': v += op.stake === 'gloria' ? (state.players[me].favor >= 3 ? 5 : -2) : state.players[me].favor >= 2 && state.players[op.d].dracmas >= 2 ? 1.5 : -1; break;
      case 'target': v += opsValue(state, me, subst(op.ops, others(state, me)[0])); break;
      case 'choice': v += Math.max(0, ...op.options.filter((o) => !o.disabled).map((o) => opsValue(state, me, o.ops))); break;
      case 'templeRoll': v += (3.5 + (op.kind === 'artemis' ? RULES.huntBonus : RULES.seaBonus)) * 0.7 - 0.5; break;
      case 'dispute': v += Math.min(state.players[op.of].favor, 2) * 1.2 - 1.2; break;
      case 'cassino': v += 0; break;
      case 'invest': v += (op.kind === 'forge' ? RULES.forgeRounds * RULES.forgeYield : RULES.harvestRounds * RULES.harvestYield) * 0.6; break;
      case 'newHand': v += 0.5; break;
      case 'swapUpTo': v += 0.8; break;
      case 'duelBonus': v += state.players[me].duelBonus ? 0 : 1; break;
      case 'divineDiscount': v += 0.8; break;
      case 'decree': v += 1; break;
      case 'acceptContract': v += 4; break;
      case 'playCard': v += CARDS[op.card].cost * 2.6 + 2 - costFor(state.players[me], CARDS[op.card], state); break;
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
      return [...pending.cards!].sort((a, b) => keepValue(me, a) - keepValue(me, b)).slice(0, pending.min === 0 ? Math.min(2, pending.count!) : pending.count);
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
  // Informação oculta: a IA não conhece as armadilhas dos outros nem a ordem dos baralhos.
  copy.traps = copy.traps.filter((t) => t.owner === me);
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

/**
 * Armadilha: procura uma casa de 2 a 5 passos à frente de um rival que esteja na disputa,
 * preferindo bifurcações e casas logo antes de templos. Usa só informação pública.
 */
function planTrap(state: GameState, p: Player): { cmd: Command; bias: number } | null {
  if (p.hand.length === 0 || p.dracmas < 12) return null;
  const rivals = others(state, p.id).map((id) => state.players[id]).filter((r) => !r.jailed && r.gloria >= p.gloria - 2);
  if (rivals.length === 0) return null;
  const rival = rivals.reduce((a, b) => (b.gloria > a.gloria ? b : a));
  const kind = rival.dracmas >= 2 ? 0 : 1;
  if (trapBlock(state, kind)) return null;
  let best = -1;
  let bestScore = 0;
  for (const node of TRAP_NODES) {
    const d = DIST[rival.pos][node];
    if (d < 2 || d > 5 || state.traps.some((t) => t.node === node && t.owner === p.id)) continue;
    const score = (NODES[node].next.length > 1 ? 1.5 : 0) + (NODES[NODES[node].next[0]].type === 'templo' ? 1.5 : 0) + (NODES[rival.pos].next.length === 1 ? 1 : 0) + 1 / d;
    if (score > bestScore) [best, bestScore] = [node, score];
  }
  if (best < 0) return null;
  const card = [...p.hand].sort((a, b) => keepValue(p, a) - keepValue(p, b))[0];
  return { cmd: { type: 'PLACE_TRAP', card, kind, node: best }, bias: TRAPS[kind].cost + 1.5 + bestScore + (rival.gloria >= state.goal - 5 ? 2 : 0) };
}

/** Política da IA. A padrão é a usada no jogo; as demais servem a experimentos de auditoria. */
export interface AiPolicy {
  /** Prêmio somado ao valor simulado de jogar uma carta pelo efeito. */
  effectBias: number;
  /** Peso da aproximação a templos onde as cartas da mão podem ser jogadas. */
  approachWeight: number;
}
export const DEFAULT_POLICY: AiPolicy = { effectBias: 0, approachWeight: 1 };

/** Escolhe o próximo comando da IA sem aplicá-lo. */
export function aiChoose(state: GameState, policy: AiPolicy = DEFAULT_POLICY): Command {
  if (state.pending) return { type: 'ANSWER', value: autoAnswer(state) };
  const p = currentPlayer(state);
  const free = freePowers(state);
  if (free.includes('taca')) return { type: 'FREE_POWER', power: 'taca' };
  if (free.includes('raio') && (p.hubris <= 1 || p.gloria + 3 >= state.goal)) return { type: 'FREE_POWER', power: 'raio' };

  const options: { cmd: Command; bias: number }[] = [{ cmd: { type: 'END_TURN' }, bias: -3 }];
  for (const card of p.hand) {
    for (const dest of moveOptions(state, card).keys()) {
      options.push({ cmd: { type: 'PLAY_CARD_MOVE', card, dest }, bias: approach(state, p, dest, card) * policy.approachWeight - keepValue(p, card) * 0.25 });
    }
    if (canEffect(state, card)) options.push({ cmd: { type: 'PLAY_CARD_EFFECT', card }, bias: (placeAllows(p, CARDS[card]) && CARDS[card].use !== 'U' ? 1 : 0) + policy.effectBias });
  }
  if (canBuyRelic(state)) options.push({ cmd: { type: 'BUY_RELIC' }, bias: 0 });
  const trap = planTrap(state, p);
  if (trap) options.push(trap);

  let best = options[0].cmd;
  let bestValue = -Infinity;
  for (const o of options) {
    const v = simulate(state, o.cmd) + o.bias;
    if (v > bestValue) [best, bestValue] = [o.cmd, v];
  }
  return best;
}

/** Executa uma única decisão da IA (para a interface poder animar passo a passo). */
export function aiStep(state: GameState, policy: AiPolicy = DEFAULT_POLICY): void {
  if (state.phase === 'GAME_OVER') return;
  apply(state, aiChoose(state, policy));
}
