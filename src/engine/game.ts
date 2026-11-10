import { gateId, IRIS, NODES, reachable, templeId } from './board';
import { cardName, CARDS } from './cards';
import { DESTINIES } from './destiny';
import { d6, shuffle } from './rng';
import { ELEMENT_SUIT, SIGNS } from './signs';
import type { Card, DestinyTarget, Effect, GameState, Player, PlayerConfig, Res, Who } from './types';

export const RULES = {
  hand: 6,
  maxHand: 9,
  goal: 15,
  startDracmas: 5,
  offering: 3,
  tribute: 2,
  bail: 4,
  nemesisSentence: 2,
  cardSentence: 1,
  absolution: 2,
  duelStake: 2,
};

export function newGame(configs: PlayerConfig[], seed: number = Date.now() | 0): GameState {
  const state: GameState = {
    players: configs.map((c, id) => ({
      id,
      name: c.name,
      sign: c.sign,
      isAI: c.isAI,
      pos: templeId(c.sign),
      gloria: 0,
      dracmas: RULES.startDracmas,
      favor: 0,
      hubris: 0,
      hand: [],
      jail: 0,
    })),
    current: 0,
    phase: 'move',
    round: 1,
    deck: [],
    discard: [],
    destiny: [],
    destinyDiscard: [],
    lastDestiny: null,
    log: [],
    winner: null,
    seed,
    goal: RULES.goal,
  };
  state.deck = shuffle(state, CARDS.map((c) => c.id));
  state.destiny = shuffle(state, DESTINIES.map((d) => d.id));
  for (const p of state.players) drawCards(state, p, RULES.hand);
  say(state, null, 'A disputa pela ascensão ao Olimpo começa.');
  return state;
}

export const currentPlayer = (state: GameState): Player => state.players[state.current];

function say(state: GameState, player: Player | null, text: string): void {
  state.log.push({ player: player ? player.id : null, text });
}

function drawCards(state: GameState, p: Player, n: number): number {
  let drawn = 0;
  for (let i = 0; i < n && p.hand.length < RULES.maxHand; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffle(state, state.discard);
      state.discard = [];
    }
    p.hand.push(state.deck.pop()!);
    drawn++;
  }
  return drawn;
}

/** Altera um recurso sem deixá-lo negativo; devolve a variação real. */
function change(p: Player, res: Res, n: number): number {
  const before = p[res];
  p[res] = Math.max(0, before + n);
  return p[res] - before;
}

function sendToTartarus(state: GameState, p: Player, turns: number): void {
  p.jail = Math.max(p.jail, turns);
  say(state, p, `${p.name} é lançado ao Tártaro por ${turns} turno${turns > 1 ? 's' : ''}.`);
}

function opponents(state: GameState, p: Player): Player[] {
  const n = state.players.length;
  const list: Player[] = [];
  for (let i = 1; i < n; i++) list.push(state.players[(p.id + i) % n]);
  return list;
}

function pickMax(players: Player[], key: (p: Player) => number): Player | null {
  let best: Player | null = null;
  for (const p of players) if (!best || key(p) > key(best)) best = p;
  return best;
}

export function targets(state: GameState, p: Player, who: Who): Player[] {
  const foes = opponents(state, p);
  if (who === 'all') return foes;
  const one = pickMax(foes, (f) => (who === 'leader' ? f.gloria : f.dracmas));
  return one ? [one] : [];
}

/** Custo da carta para o jogador: o naipe do seu elemento custa 1 a menos. */
export function costFor(p: Player, card: Card): number {
  const discount = card.suit === ELEMENT_SUIT[SIGNS[p.sign].element] ? 1 : 0;
  return Math.max(0, card.cost - discount);
}

export function canPlay(state: GameState, p: Player, cardId: number): boolean {
  const card = CARDS[cardId];
  const node = NODES[p.pos];
  return state.phase === 'action' && node.type === 'templo' && node.sector === card.sector && p.dracmas >= costFor(p, card);
}

export const playableCards = (state: GameState): number[] => {
  const p = currentPlayer(state);
  return p.hand.filter((id) => canPlay(state, p, id));
};

/** Destinos possíveis ao mover com a carta (exatamente o valor de movimento). */
export function moveOptions(state: GameState, cardId: number): Map<number, number[]> {
  return reachable(currentPlayer(state).pos, CARDS[cardId].move);
}

function applyEffect(state: GameState, p: Player, e: Effect): void {
  switch (e.t) {
    case 'self':
      change(p, e.res, e.n);
      break;
    case 'foes':
      for (const f of targets(state, p, e.who)) change(f, e.res, e.n);
      break;
    case 'steal':
      for (const f of targets(state, p, e.who)) change(p, e.res, -change(f, e.res, -e.n));
      break;
    case 'draw':
      drawCards(state, p, e.n);
      break;
    case 'jail':
      for (const f of targets(state, p, e.who)) sendToTartarus(state, f, RULES.cardSentence);
      break;
  }
}

function destinyTargets(state: GameState, active: Player, to: DestinyTarget): Player[] {
  const all = [active, ...opponents(state, active)];
  switch (to) {
    case 'active':
      return [active];
    case 'all':
      return all;
    case 'others':
      return opponents(state, active);
    case 'leader':
      return [pickMax(all, (p) => p.gloria)!];
    case 'last':
      return [pickMax([...all].reverse(), (p) => -p.gloria)!];
  }
}

function revealDestiny(state: GameState, active: Player): void {
  if (state.destiny.length === 0) {
    state.destiny = shuffle(state, state.destinyDiscard);
    state.destinyDiscard = [];
  }
  const destiny = DESTINIES[state.destiny.pop()!];
  state.destinyDiscard.push(destiny.id);
  state.lastDestiny = destiny.id;
  say(state, active, `As Moiras revelam ${destiny.numeral} · ${destiny.name}: ${destiny.text}`);
  for (const op of destiny.ops) {
    switch (op.t) {
      case 'res':
        for (const p of destinyTargets(state, active, op.to)) change(p, op.res, op.n);
        break;
      case 'draw':
        for (const p of destinyTargets(state, active, op.to)) drawCards(state, p, op.n);
        break;
      case 'redraw':
        for (const p of state.players) {
          state.discard.push(...p.hand);
          p.hand = [];
        }
        for (const p of state.players) drawCards(state, p, RULES.hand);
        break;
      case 'justice':
        for (const p of state.players) if (p.hubris >= 3) change(p, 'dracmas', -3);
        break;
      case 'judgement': {
        const top = Math.max(...state.players.map((p) => p.hubris));
        if (top >= 1) {
          for (const p of state.players) {
            if (p.hubris === top && p.jail === 0) sendToTartarus(state, p, RULES.nemesisSentence);
          }
        }
        break;
      }
    }
  }
}

function land(state: GameState, p: Player): void {
  const node = NODES[p.pos];
  switch (node.type) {
    case 'templo':
      if (node.sector === p.sign) {
        change(p, 'favor', 1);
        say(state, p, `${SIGNS[p.sign].god} acolhe ${p.name}: +1 Favor.`);
      }
      break;
    case 'oferenda':
      change(p, 'dracmas', RULES.offering);
      say(state, p, `Oferenda: ${p.name} recebe ${RULES.offering} dracmas.`);
      break;
    case 'tributo': {
      const paid = -change(p, 'dracmas', -RULES.tribute);
      if (paid < RULES.tribute) {
        change(p, 'hubris', 1);
        say(state, p, `Tributo: ${p.name} não consegue pagar e ganha 1 Húbris.`);
      } else {
        say(state, p, `Tributo: ${p.name} paga ${RULES.tribute} dracmas.`);
      }
      break;
    }
    case 'nemesis': {
      if (p.hubris === 0) {
        say(state, p, `Nêmesis nada tem contra ${p.name}.`);
        break;
      }
      const roll = d6(state);
      if (roll > p.hubris) {
        say(state, p, `Nêmesis julga ${p.name}: dado ${roll} contra Húbris ${p.hubris}. Inocente.`);
      } else if (p.favor >= RULES.absolution) {
        change(p, 'favor', -RULES.absolution);
        say(state, p, `Nêmesis condena ${p.name} (dado ${roll}), mas ${RULES.absolution} de Favor compram a absolvição.`);
      } else {
        say(state, p, `Nêmesis condena ${p.name}: dado ${roll} contra Húbris ${p.hubris}.`);
        change(p, 'hubris', -3);
        sendToTartarus(state, p, RULES.nemesisSentence);
      }
      break;
    }
    case 'moiras':
      revealDestiny(state, p);
      break;
    case 'fortuna': {
      const roll = d6(state);
      const outcomes: [Res, number][] = [['hubris', 1], ['dracmas', -2], ['dracmas', 2], ['dracmas', 3], ['favor', 1], ['gloria', 1]];
      const [res, n] = outcomes[roll - 1];
      change(p, res, n);
      const label = { gloria: 'Glória', dracmas: 'dracmas', favor: 'Favor', hubris: 'Húbris' }[res];
      say(state, p, `Fortuna: ${p.name} tira ${roll}: ${n > 0 ? '+' : '−'}${Math.abs(n)} ${label}.`);
      break;
    }
    case 'visao': {
      const n = drawCards(state, p, 2);
      say(state, p, `Visão: ${p.name} compra ${n} carta${n === 1 ? '' : 's'}.`);
      break;
    }
    case 'purificacao':
      say(state, p, `Purificação: ${p.name} perde ${-change(p, 'hubris', -2)} de Húbris.`);
      break;
    case 'tentacao':
      change(p, 'gloria', 1);
      change(p, 'hubris', 2);
      say(state, p, `Tentação: ${p.name} prova a ambrosia: +1 Glória, +2 Húbris.`);
      break;
    case 'iris': {
      const other = IRIS.find((id) => id !== p.pos);
      if (other !== undefined) {
        p.pos = other;
        say(state, p, `${p.name} atravessa a Ponte de Íris até a região de ${SIGNS[NODES[other].sector].god}.`);
      }
      break;
    }
    case 'duelo': {
      const foe = pickMax(opponents(state, p).filter((f) => f.jail === 0), (f) => f.dracmas);
      if (!foe) break;
      const mine = d6(state);
      const theirs = d6(state);
      if (mine === theirs) {
        say(state, p, `Duelo: ${p.name} ${mine} × ${theirs} ${foe.name}. Empate.`);
      } else {
        const [winner, loser] = mine > theirs ? [p, foe] : [foe, p];
        const taken = -change(loser, 'dracmas', -RULES.duelStake);
        change(winner, 'dracmas', taken);
        say(state, p, `Duelo: ${p.name} ${mine} × ${theirs} ${foe.name}. ${winner.name} toma ${taken} dracmas.`);
      }
      break;
    }
  }
}

function checkWinner(state: GameState): boolean {
  const active = currentPlayer(state);
  const order = [active, ...opponents(state, active)];
  const best = pickMax(order, (p) => p.gloria)!;
  if (best.gloria < state.goal) return false;
  state.winner = best.id;
  state.phase = 'over';
  say(state, best, `${best.name} alcança ${best.gloria} de Glória e ascende ao Olimpo!`);
  return true;
}

function endTurn(state: GameState): void {
  if (checkWinner(state)) return;
  const p = currentPlayer(state);
  drawCards(state, p, Math.max(0, RULES.hand - p.hand.length));
  state.current = (state.current + 1) % state.players.length;
  if (state.current === 0) state.round++;
  const next = currentPlayer(state);
  state.phase = next.jail > 0 ? 'jail' : 'move';
  if (state.phase === 'move' && next.hand.length === 0) {
    say(state, next, `${next.name} não tem cartas e perde a vez.`);
    endTurn(state);
  }
}

function release(p: Player): void {
  p.jail = 0;
  p.pos = gateId(p.sign);
}

/** No Tártaro: pagar a fiança e jogar normalmente, ou cumprir um turno de pena. */
export function jailChoice(state: GameState, choice: 'pay' | 'serve'): void {
  const p = currentPlayer(state);
  if (state.phase !== 'jail') throw new Error('Não é hora de escolher no Tártaro.');
  if (choice === 'pay') {
    if (p.dracmas < RULES.bail) throw new Error('Dracmas insuficientes para a fiança.');
    change(p, 'dracmas', -RULES.bail);
    release(p);
    state.phase = 'move';
    say(state, p, `${p.name} paga ${RULES.bail} dracmas a Caronte e deixa o Tártaro.`);
    return;
  }
  p.jail--;
  if (p.jail === 0) {
    release(p);
    say(state, p, `${p.name} cumpre a pena e volta ao portão de ${SIGNS[p.sign].god}.`);
  } else {
    say(state, p, `${p.name} cumpre pena no Tártaro (${p.jail} turno${p.jail > 1 ? 's' : ''} restante${p.jail > 1 ? 's' : ''}).`);
  }
  endTurn(state);
}

/** Descarta a carta e anda exatamente o valor dela até `dest`. */
export function moveWithCard(state: GameState, cardId: number, dest: number): void {
  const p = currentPlayer(state);
  if (state.phase !== 'move') throw new Error('Não é a fase de movimento.');
  const at = p.hand.indexOf(cardId);
  if (at < 0) throw new Error('A carta não está na mão.');
  if (!moveOptions(state, cardId).has(dest)) throw new Error('Destino inválido para esta carta.');
  const card = CARDS[cardId];
  p.hand.splice(at, 1);
  state.discard.push(cardId);
  p.pos = dest;
  const node = NODES[p.pos];
  say(state, p, `${p.name} descarta ${cardName(card)} e anda ${card.move} até ${node.type === 'templo' ? `o Templo de ${SIGNS[node.sector].god}` : 'a região de ' + SIGNS[node.sector].god}.`);
  land(state, p);
  if (checkWinner(state)) return;
  if (p.jail > 0) {
    endTurn(state);
    return;
  }
  state.phase = 'action';
  if (playableCards(state).length === 0) endTurn(state);
}

/** No templo do deus da carta: paga o custo e aplica os efeitos. */
export function playCard(state: GameState, cardId: number): void {
  const p = currentPlayer(state);
  if (!p.hand.includes(cardId) || !canPlay(state, p, cardId)) throw new Error('Esta carta não pode ser jogada agora.');
  const card = CARDS[cardId];
  change(p, 'dracmas', -costFor(p, card));
  p.hand.splice(p.hand.indexOf(cardId), 1);
  state.discard.push(cardId);
  say(state, p, `${p.name} joga ${card.title} (${cardName(card)}) no Templo de ${SIGNS[card.sector].god}.`);
  for (const e of card.effects) applyEffect(state, p, e);
  endTurn(state);
}

export function pass(state: GameState): void {
  if (state.phase !== 'action') throw new Error('Não há ação para passar.');
  endTurn(state);
}
