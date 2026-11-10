import { GODS, G } from './data';
import type { Card, Op, Res, Suit } from './types';

export const SUITS: Suit[] = ['Paus', 'Copas', 'Espadas', 'Ouros'];
export const RANKS = ['Ás', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Pajem', 'Cavaleiro', 'Rainha', 'Rei'];
/** Movimento por carta (Ás…Rei): concentrado em 3 passos; 1 e 6 são raros. */
const MOVES = [1, 2, 3, 4, 5, 6, 3, 3, 3, 4, 2, 5, 3, 4];
/** Custo do efeito de cada carta, por naipe (Ás…Rei). Catálogo rebalanceado para a meta de 30 Glórias. */
const COSTS: number[][] = [
  [4, 2, 3, 8, 4, 3, 10, 9, 8, 14, 3, 6, 10, 18],
  [2, 3, 2, 4, 5, 3, 6, 6, 8, 9, 3, 6, 10, 15],
  [2, 2, 2, 3, 4, 4, 5, 7, 5, 9, 3, 7, 10, 11],
  [2, 2, 2, 3, 4, 4, 5, 5, 9, 6, 3, 8, 10, 12],
];

/** Deuses das cartas divinas (Cavaleiro, Rainha, Rei) de cada naipe. */
const DIVINE: number[][] = [
  [G.ares, G.hefesto, G.zeus],
  [G.poseidon, G.afrodite, G.dionisio],
  [G.hermes, G.atena, G.apolo],
  [G.artemis, G.demeter, G.hera],
];

const TEXTS: string[][] = [
  [
    'Ganhe 1 Glória.', 'Ganhe 5 Dracmas e 1 Húbris.', 'Roube até 3 Dracmas de um rival; +1 Húbris.', 'Ganhe 2 Glórias e 1 Húbris.',
    'Um rival perde até 2 Favores; você recebe 1 Húbris.', 'Ganhe 7 Dracmas e 2 Húbris.', 'Ganhe 3 Glórias e 2 Húbris.',
    'Ganhe 1 Glória; um rival perde até 1 Glória; +1 Húbris.', 'Ganhe 2 Glórias; se tiver 3+ Húbris, ganhe mais 1 e receba +1 Húbris.', 'Ganhe 4 Glórias e 3 Húbris.',
    'Remova até 2 Húbris ou ganhe 4 Dracmas.', 'Roube até 5 Dracmas de um rival; +2 Húbris.', 'Ganhe 2 Glórias e um escudo contra a próxima perda de Glória.', 'Ganhe 5 Glórias e 3 Húbris.',
  ],
  [
    'Ganhe 2 Favores.', 'Remova até 2 Húbris.', 'Ganhe 5 Dracmas.', 'Ganhe 3 Favores.', 'Remova até 3 Húbris; compre 1 carta e descarte 1.', 'Ganhe 2 Favores e 2 Dracmas.', 'Ganhe 4 Favores.',
    'Remova até 4 Húbris e ganhe 1 Favor.', 'Ganhe 2 Favores e 1 Glória.', 'Ganhe 2 Glórias e remova até 2 Húbris.', 'Compre 2 cartas e descarte 2.',
    'Desloque um rival 3 casas pela rota normal, sem ativar casas atravessadas nem a chegada.', 'Ganhe 2 Favores e 2 Glórias.', 'Ganhe 4 Glórias e 2 Húbris; remova 1 Húbris após a resolução.',
  ],
  [
    'Veja as 3 próximas cartas do Destino e reorganize-as.', 'Compre 2 cartas e descarte 2.', 'Ganhe 2 Favores.', 'Veja a mão de um rival; ele descarta 1 carta aleatória e compra 1.',
    'Troque uma carta sua por uma carta aleatória de um rival.', 'Veja 4 cartas do Destino e reorganize-as.', 'Compre 3 cartas e descarte 3.',
    'Ganhe 2 Glórias se estiver atrás do líder; caso contrário, 1 Glória.', 'Olhe 5 cartas do Destino e reorganize-as; ganhe 1 Favor.', 'Ganhe 2 Glórias e 2 Favores.',
    'Sua próxima carta de efeito custa 3 Dracmas a menos (mínimo 0).', 'Teletransporte-se para qualquer casa comum; não ativa passagem nem parada.', 'Ganhe 2 Glórias; compre 2 cartas e descarte 2.', 'Ganhe 3 Glórias e veja as 3 próximas cartas do Destino.',
  ],
  [
    'Ganhe 5 Dracmas.', 'Ganhe 6 Dracmas.', 'Ganhe 4 Dracmas e 1 Favor.', 'Ganhe 8 Dracmas.', 'Ganhe 7 Dracmas e remova 1 Húbris.', 'Ganhe 9 Dracmas.', 'Ganhe 10 Dracmas.',
    'Ganhe 8 Dracmas e 1 Favor.', 'Ganhe 2 Glórias e 6 Dracmas.', 'Ganhe 12 Dracmas.', 'Ganhe 5 Dracmas; compre 1 carta e descarte 1.',
    'Ganhe 2 Glórias; teletransporte-se 2 casas pela rota normal, sem ativar a chegada.', 'Ganhe 8 Dracmas e 2 Glórias.', 'Ganhe 3 Glórias e 2 Favores; remova 1 Húbris.',
  ],
];

export const CARDS: Card[] = SUITS.flatMap((suit, s) =>
  RANKS.map((rank, r) => ({
    id: s * 14 + r,
    suit,
    rank,
    move: MOVES[r],
    cost: COSTS[s][r],
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
export const SAB_CARDS: Record<number, string> = { 2: 'roubo', 4: 'politica', 7: 'ataque', 11: 'roubo', 25: 'deslocamento', 31: 'interferencia', 32: 'interferencia' };

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
    case 1: return [g('dracmas', 5), g('hubris', 1)];
    case 2: return [foe('De quem roubar até 3 Dracmas?', [{ t: 'transfer', from: T, to: p, res: 'dracmas', n: 3 }]), g('hubris', 1)];
    case 3: return [g('gloria', 2), g('hubris', 1)];
    case 4: return [foe('Quem perde até 2 Favores?', [{ t: 'res', p: T, res: 'favor', n: -2 }]), g('hubris', 1)];
    case 5: return [g('dracmas', 7), g('hubris', 2)];
    case 6: return [g('gloria', 3), g('hubris', 2)];
    case 7: return [g('gloria', 1), foe('Quem perde 1 Glória?', [{ t: 'res', p: T, res: 'gloria', n: -1 }]), g('hubris', 1)];
    case 8: return [{ t: 'paus9', p }];
    case 9: return [g('gloria', 4), g('hubris', 3)];
    case 10: return [{ t: 'choice', p, prompt: 'Pajem de Paus', options: [{ label: 'Remover até 2 Húbris', ops: [g('hubris', -2)] }, { label: 'Ganhar 4 Dracmas', ops: [g('dracmas', 4)] }] }];
    case 11: return [foe('De quem roubar até 5 Dracmas?', [{ t: 'transfer', from: T, to: p, res: 'dracmas', n: 5 }]), g('hubris', 2)];
    case 12: return [g('gloria', 2), { t: 'shield', p }];
    case 13: return [g('gloria', 5), g('hubris', 3)];
    // Copas
    case 14: return [g('favor', 2)];
    case 15: return [g('hubris', -2)];
    case 16: return [g('dracmas', 5)];
    case 17: return [g('favor', 3)];
    case 18: return [g('hubris', -3), ...cycle(1, 1)];
    case 19: return [g('favor', 2), g('dracmas', 2)];
    case 20: return [g('favor', 4)];
    case 21: return [g('hubris', -4), g('favor', 1)];
    case 22: return [g('favor', 2), g('gloria', 1)];
    case 23: return [g('gloria', 2), g('hubris', -2)];
    case 24: return cycle(2, 2);
    case 25: return [foe('Qual rival deslocar 3 casas?', [{ t: 'advance', p, who: T, min: 3, max: 3, normal: true }])];
    case 26: return [g('favor', 2), g('gloria', 2)];
    case 27: return [g('gloria', 4), g('hubris', 2), g('hubris', -1)];
    // Espadas
    case 28: return [{ t: 'peek', p, deck: 'destiny', n: 3, reorder: true }];
    case 29: return cycle(2, 2);
    case 30: return [g('favor', 2)];
    case 31: return [foe('Ver a mão de quem?', [{ t: 'viewHand', p, of: T }, { t: 'sabotage', p, of: T, kind: 'interferencia' }])];
    case 32: return [foe('Trocar carta com quem?', [{ t: 'swap', p, of: T }])];
    case 33: return [{ t: 'peek', p, deck: 'destiny', n: 4, reorder: true }];
    case 34: return cycle(3, 3);
    case 35: return [{ t: 'behind', p }];
    case 36: return [{ t: 'peek', p, deck: 'destiny', n: 5, reorder: true }, g('favor', 1)];
    case 37: return [g('gloria', 2), g('favor', 2)];
    case 38: return [{ t: 'discountNext', p }];
    case 39: return [{ t: 'teleport', p, kind: 'common' }];
    case 40: return [g('gloria', 2), ...cycle(2, 2)];
    case 41: return [g('gloria', 3), { t: 'peek', p, deck: 'destiny', n: 3, reorder: false }];
    // Ouros
    case 42: return [g('dracmas', 5)];
    case 43: return [g('dracmas', 6)];
    case 44: return [g('dracmas', 4), g('favor', 1)];
    case 45: return [g('dracmas', 8)];
    case 46: return [g('dracmas', 7), g('hubris', -1)];
    case 47: return [g('dracmas', 9)];
    case 48: return [g('dracmas', 10)];
    case 49: return [g('dracmas', 8), g('favor', 1)];
    case 50: return [g('gloria', 2), g('dracmas', 6)];
    case 51: return [g('dracmas', 12)];
    case 52: return [g('dracmas', 5), ...cycle(1, 1)];
    case 53: return [g('gloria', 2), { t: 'advance', p, who: p, min: 2, max: 2, normal: true }];
    case 54: return [g('dracmas', 8), g('gloria', 2)];
    case 55: return [g('gloria', 3), g('favor', 2), g('hubris', -1)];
    default: throw new Error(`Carta desconhecida: ${cardId}`);
  }
}
