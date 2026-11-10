import { GODS, G } from './data';
import type { Card, Op, Res, Suit } from './types';

export const SUITS: Suit[] = ['Paus', 'Copas', 'Espadas', 'Ouros'];
export const RANKS = ['Ás', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Pajem', 'Cavaleiro', 'Rainha', 'Rei'];
const MOVES = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 2, 5, 3, 6];
const COSTS = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 2, 3, 4, 5];
/** Deuses das cartas divinas (Cavaleiro, Rainha, Rei) de cada naipe. */
const DIVINE: number[][] = [
  [G.ares, G.hefesto, G.zeus],
  [G.poseidon, G.afrodite, G.dionisio],
  [G.hermes, G.atena, G.apolo],
  [G.artemis, G.demeter, G.hera],
];

const TEXTS: string[][] = [
  [
    'Ganhe 1 Glória.', 'Ganhe 2 Dracmas e 1 Húbris.', 'Transfira até 1 Dracma de um adversário para você.', 'Ganhe 2 Glórias e 1 Húbris.',
    'Um adversário perde até 1 Favor; você ganha 1 Húbris.', 'Ganhe 3 Dracmas e 1 Húbris.', 'Ganhe 3 Glórias e 2 Húbris.',
    'Ganhe 2 Glórias; adversário perde até 1 Glória.', 'Ganhe 2 Glórias; com 3+ Húbris, ganhe mais 1.', 'Ganhe 4 Glórias e 2 Húbris.',
    'Remova 1 Húbris ou ganhe 1 Dracma.', 'Roube até 3 Dracmas; ganhe 1 Húbris.', 'Ganhe 2 Glórias e um escudo para a próxima perda de Glória.', 'Ganhe 5 Glórias e 2 Húbris.',
  ],
  [
    'Ganhe 1 Favor.', 'Remova 1 Húbris.', 'Ganhe 2 Dracmas.', 'Ganhe 2 Favores.', 'Remova até 2 Húbris.', 'Ganhe 1 Favor e 1 Dracma.', 'Ganhe 3 Favores.',
    'Remova até 3 Húbris e ganhe 1 Favor.', 'Ganhe 2 Favores e 1 Glória.', 'Ganhe 2 Glórias e remova até 2 Húbris.', 'Compre 1 carta e descarte 1.',
    'Mova um adversário até 3 casas adiante, sem ativar o destino.', 'Ganhe 2 Favores e 2 Glórias.', 'Ganhe 4 Glórias e 2 Húbris; remova 1 Húbris.',
  ],
  [
    'Olhe 2 cartas do baralho de jogadores e reorganize.', 'Compre 1 carta e descarte 1.', 'Ganhe 1 Favor.', 'Veja a mão de um adversário.',
    'Troque 1 carta sua por 1 aleatória de um adversário.', 'Olhe 3 cartas do Destino e reorganize.', 'Compre 2 cartas e descarte 2.',
    'Ganhe 2 Glórias se estiver atrás do líder; caso contrário, 1.', 'Olhe 4 cartas do Destino e reorganize.', 'Ganhe 2 Glórias e 1 Favor.',
    'Sua próxima carta de efeito custa −1 Dracma.', 'Teletransporte-se para qualquer casa comum.', 'Ganhe 2 Glórias; compre 2 cartas e descarte 2.', 'Ganhe 3 Glórias e veja 3 cartas do Destino.',
  ],
  [
    'Ganhe 2 Dracmas.', 'Ganhe 3 Dracmas.', 'Ganhe 1 Dracma e 1 Favor.', 'Ganhe 4 Dracmas.', 'Ganhe 3 Dracmas e remova 1 Húbris.', 'Ganhe 5 Dracmas.', 'Ganhe 6 Dracmas.',
    'Ganhe 4 Dracmas e 1 Favor.', 'Ganhe 2 Glórias e 3 Dracmas.', 'Ganhe 7 Dracmas.', 'Ganhe 2 Dracmas; compre 1 carta e descarte 1.',
    'Ganhe 2 Glórias; teletransporte-se até 2 casas adiante.', 'Ganhe 6 Dracmas e 2 Glórias.', 'Ganhe 3 Glórias e 2 Favores; remova 1 Húbris.',
  ],
];

export const CARDS: Card[] = SUITS.flatMap((suit, s) =>
  RANKS.map((rank, r) => ({
    id: s * 14 + r,
    suit,
    rank,
    move: MOVES[r],
    cost: COSTS[r],
    use: r < 6 ? ('U' as const) : r < 11 ? ('E' as const) : ('D' as const),
    god: r >= 11 ? DIVINE[s][r - 11] : null,
    text: TEXTS[s][r],
  })),
);

export const cardName = (card: Card): string => `${card.rank} de ${card.suit}`;
export const useLabel = (card: Card): string =>
  card.use === 'U' ? 'Universal' : card.use === 'E' ? 'Elemental' : `Divina: ${GODS[card.god!].name}`;

/**
 * Cartas existentes cujo efeito é uma sabotagem (v1.9): seguem os limites de sabotagem
 * (alvo fora do Tártaro, no máximo duas recebidas por rodada, proteção política).
 */
export const SAB_CARDS: Record<number, string> = { 2: 'roubo', 4: 'politica', 7: 'ataque', 11: 'roubo', 25: 'deslocamento', 32: 'interferencia' };

/** Marcador do alvo escolhido dentro das operações de um `target`. */
export const T = -1;

/** Operações do efeito de cada Arcano Menor para o jogador `p`. */
export function effectOps(cardId: number, p: number): Op[] {
  const g = (res: Res, n: number): Op => ({ t: 'res', p, res, n });
  const foe = (prompt: string, ops: Op[]): Op => ({ t: 'target', p, prompt, ops, ...(SAB_CARDS[cardId] ? { sab: SAB_CARDS[cardId] } : {}) });
  const cycle = (n: number, m: number): Op[] => [{ t: 'draw', p, n }, { t: 'discard', p, n: m }];
  switch (cardId) {
    // Paus
    case 0: return [g('gloria', 1)];
    case 1: return [g('dracmas', 2), g('hubris', 1)];
    case 2: return [foe('De quem transferir 1 Dracma?', [{ t: 'transfer', from: T, to: p, res: 'dracmas', n: 1 }])];
    case 3: return [g('gloria', 2), g('hubris', 1)];
    case 4: return [foe('Quem perde 1 Favor?', [{ t: 'res', p: T, res: 'favor', n: -1 }]), g('hubris', 1)];
    case 5: return [g('dracmas', 3), g('hubris', 1)];
    case 6: return [g('gloria', 3), g('hubris', 2)];
    case 7: return [g('gloria', 2), foe('Quem perde 1 Glória?', [{ t: 'res', p: T, res: 'gloria', n: -1 }])];
    case 8: return [{ t: 'paus9', p }];
    case 9: return [g('gloria', 4), g('hubris', 2)];
    case 10: return [{ t: 'choice', p, prompt: 'Pajem de Paus', options: [{ label: 'Remover 1 Húbris', ops: [g('hubris', -1)] }, { label: 'Ganhar 1 Dracma', ops: [g('dracmas', 1)] }] }];
    case 11: return [foe('De quem roubar até 3 Dracmas?', [{ t: 'transfer', from: T, to: p, res: 'dracmas', n: 3 }]), g('hubris', 1)];
    case 12: return [g('gloria', 2), { t: 'shield', p }];
    case 13: return [g('gloria', 5), g('hubris', 2)];
    // Copas
    case 14: return [g('favor', 1)];
    case 15: return [g('hubris', -1)];
    case 16: return [g('dracmas', 2)];
    case 17: return [g('favor', 2)];
    case 18: return [g('hubris', -2)];
    case 19: return [g('favor', 1), g('dracmas', 1)];
    case 20: return [g('favor', 3)];
    case 21: return [g('hubris', -3), g('favor', 1)];
    case 22: return [g('favor', 2), g('gloria', 1)];
    case 23: return [g('gloria', 2), g('hubris', -2)];
    case 24: return cycle(1, 1);
    case 25: return [foe('Qual adversário mover?', [{ t: 'advance', p, who: T, min: 1, max: 3 }])];
    case 26: return [g('favor', 2), g('gloria', 2)];
    case 27: return [g('gloria', 4), g('hubris', 2), g('hubris', -1)];
    // Espadas
    case 28: return [{ t: 'peek', p, deck: 'minor', n: 2, reorder: true }];
    case 29: return cycle(1, 1);
    case 30: return [g('favor', 1)];
    case 31: return [foe('Ver a mão de quem?', [{ t: 'viewHand', p, of: T }])];
    case 32: return [foe('Trocar carta com quem?', [{ t: 'swap', p, of: T }])];
    case 33: return [{ t: 'peek', p, deck: 'destiny', n: 3, reorder: true }];
    case 34: return cycle(2, 2);
    case 35: return [{ t: 'behind', p }];
    case 36: return [{ t: 'peek', p, deck: 'destiny', n: 4, reorder: true }];
    case 37: return [g('gloria', 2), g('favor', 1)];
    case 38: return [{ t: 'discountNext', p }];
    case 39: return [{ t: 'teleport', p, kind: 'common' }];
    case 40: return [g('gloria', 2), ...cycle(2, 2)];
    case 41: return [g('gloria', 3), { t: 'peek', p, deck: 'destiny', n: 3, reorder: false }];
    // Ouros
    case 42: return [g('dracmas', 2)];
    case 43: return [g('dracmas', 3)];
    case 44: return [g('dracmas', 1), g('favor', 1)];
    case 45: return [g('dracmas', 4)];
    case 46: return [g('dracmas', 3), g('hubris', -1)];
    case 47: return [g('dracmas', 5)];
    case 48: return [g('dracmas', 6)];
    case 49: return [g('dracmas', 4), g('favor', 1)];
    case 50: return [g('gloria', 2), g('dracmas', 3)];
    case 51: return [g('dracmas', 7)];
    case 52: return [g('dracmas', 2), ...cycle(1, 1)];
    case 53: return [g('gloria', 2), { t: 'advance', p, who: p, min: 0, max: 2 }];
    case 54: return [g('dracmas', 6), g('gloria', 2)];
    case 55: return [g('gloria', 3), g('favor', 2), g('hubris', -1)];
    default: throw new Error(`Carta desconhecida: ${cardId}`);
  }
}
