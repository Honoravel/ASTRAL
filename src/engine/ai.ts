import { DIST, NODES, templeId } from './board';
import { CARDS } from './cards';
import { costFor, currentPlayer, jailChoice, moveOptions, moveWithCard, pass, playableCards, playCard, RULES, targets } from './game';
import type { Card, GameState, Player, Res } from './types';

const WEIGHT: Record<Res, number> = { gloria: 10, dracmas: 1, favor: 2, hubris: -2.5 };

/** Quanto vale para o jogador jogar a carta agora (sem contar o custo). */
function cardValue(state: GameState, p: Player, card: Card): number {
  let value = 0;
  for (const e of card.effects) {
    switch (e.t) {
      case 'self':
        if (e.res === 'hubris' && e.n < 0) value += Math.min(p.hubris, -e.n) * 2.5;
        else if (e.res === 'hubris') value += e.n * (p.hubris + e.n >= 4 ? -4 : -2.5);
        else value += e.n * WEIGHT[e.res];
        break;
      case 'foes':
        value -= targets(state, p, e.who).length * e.n * WEIGHT[e.res] * 0.5;
        break;
      case 'steal':
        for (const f of targets(state, p, e.who)) value += Math.min(f[e.res], e.n) * WEIGHT[e.res] * 1.5;
        break;
      case 'draw':
        value += e.n * 1.5;
        break;
      case 'jail':
        value += targets(state, p, e.who).some((f) => f.jail === 0) ? 6 : 0;
        break;
    }
  }
  return value;
}

const netValue = (state: GameState, p: Player, card: Card): number => cardValue(state, p, card) - costFor(p, card);

function houseValue(p: Player, node: number): number {
  const n = NODES[node];
  switch (n.type) {
    case 'templo':
      return n.sector === p.sign ? 2 : 0;
    case 'oferenda':
      return RULES.offering;
    case 'tributo':
      return p.dracmas >= RULES.tribute ? -RULES.tribute : -3;
    case 'nemesis':
      return -(Math.min(p.hubris, 6) / 6) * (p.favor >= RULES.absolution ? 4 : 14);
    case 'moiras':
      return 0.5;
    case 'fortuna':
      return 2;
    case 'visao':
      return 3;
    case 'purificacao':
      return Math.min(p.hubris, 2) * 2.5;
    case 'tentacao':
      return p.hubris >= 2 ? 2 : 5;
    case 'iris':
    case 'duelo':
      return 0;
  }
}

function chooseMove(state: GameState, p: Player): { card: number; dest: number } {
  let best = { card: p.hand[0], dest: -1, score: -Infinity };
  for (const cardId of p.hand) {
    const rest = p.hand.filter((id) => id !== cardId).map((id) => CARDS[id]);
    const keep = Math.max(0, netValue(state, p, CARDS[cardId])) * 0.3;
    for (const dest of moveOptions(state, cardId).keys()) {
      let score = houseValue(p, dest) - keep;
      const node = NODES[dest];
      let approach = 0;
      for (const card of rest) {
        const net = netValue(state, p, card);
        if (net <= 0) continue;
        const affordable = p.dracmas >= costFor(p, card);
        if (node.type === 'templo' && node.sector === card.sector && affordable) {
          score = Math.max(score, houseValue(p, dest) - keep + net);
        } else {
          approach = Math.max(approach, (net * (affordable ? 1 : 0.5)) / (DIST[dest][templeId(card.sector)] + 2));
        }
      }
      score += approach;
      if (score > best.score) best = { card: cardId, dest, score };
    }
  }
  return best;
}

/** Executa uma única decisão da IA (para a interface poder animar passo a passo). */
export function aiStep(state: GameState): void {
  const p = currentPlayer(state);
  if (state.phase === 'jail') {
    jailChoice(state, p.dracmas >= RULES.bail + 2 ? 'pay' : 'serve');
  } else if (state.phase === 'move') {
    const { card, dest } = chooseMove(state, p);
    moveWithCard(state, card, dest);
  } else if (state.phase === 'action') {
    const options = playableCards(state).map((id) => ({ id, net: netValue(state, p, CARDS[id]) }));
    options.sort((a, b) => b.net - a.net);
    if (options.length > 0 && options[0].net > 0) playCard(state, options[0].id);
    else pass(state);
  }
}
