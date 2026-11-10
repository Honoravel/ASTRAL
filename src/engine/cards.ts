import { ELEMENT_SUIT, SIGNS } from './signs';
import type { Card, Effect, Res, Who } from './types';

const self = (res: Res, n: number): Effect => ({ t: 'self', res, n });
const foes = (who: Who, res: Res, n: number): Effect => ({ t: 'foes', who, res, n });
const steal = (who: Who, res: 'dracmas' | 'favor', n: number): Effect => ({ t: 'steal', who, res, n });
const draw = (n: number): Effect => ({ t: 'draw', n });
const jail = (who: 'leader' | 'richest'): Effect => ({ t: 'jail', who });

type Row = [rank: string, title: string, move: number, cost: number, effects: Effect[]];

/** Quatro Arcanos Menores por deus, na ordem das regiões (ver SIGNS). */
const BY_SECTOR: Row[][] = [
  // Atena — Paus
  [
    ['Ás', 'Estratégia', 1, 2, [self('gloria', 1), draw(1)]],
    ['4', 'Égide', 4, 3, [self('hubris', -2), self('favor', 1)]],
    ['7', 'Sabedoria', 3, 5, [self('gloria', 2), self('hubris', 1)]],
    ['10', 'Vitória de Palas', 6, 8, [self('gloria', 4), self('hubris', 2)]],
  ],
  // Afrodite — Ouros
  [
    ['Ás', 'Encanto', 1, 1, [self('favor', 2)]],
    ['4', 'Cinto Dourado', 4, 3, [steal('all', 'favor', 1)]],
    ['7', 'Paixão', 3, 5, [self('gloria', 2), self('favor', 1), self('hubris', 1)]],
    ['10', 'Pomo de Ouro', 6, 7, [self('gloria', 3), foes('all', 'hubris', 1)]],
  ],
  // Apolo — Espadas
  [
    ['Ás', 'Profecia', 1, 2, [draw(3)]],
    ['4', 'Lira', 4, 3, [self('gloria', 1), self('favor', 1)]],
    ['7', 'Flecha da Peste', 3, 5, [self('gloria', 1), foes('all', 'dracmas', -2), self('hubris', 1)]],
    ['10', 'Carro do Sol', 6, 8, [self('gloria', 4), self('hubris', 2)]],
  ],
  // Hermes — Copas
  [
    ['Ás', 'Furto', 1, 0, [steal('richest', 'dracmas', 3), self('hubris', 1)]],
    ['4', 'Sandálias Aladas', 4, 2, [draw(2), self('favor', 1)]],
    ['7', 'Comércio', 3, 4, [self('gloria', 2)]],
    ['10', 'Mensageiro dos Deuses', 6, 6, [self('gloria', 3), draw(1)]],
  ],
  // Zeus — Paus
  [
    ['2', 'Trovão', 2, 3, [foes('leader', 'gloria', -1), self('hubris', 1)]],
    ['5', 'Águia Real', 5, 4, [self('gloria', 2), self('hubris', 1)]],
    ['8', 'Raio', 4, 6, [jail('leader'), self('hubris', 2)]],
    ['Rainha', 'Trono do Olimpo', 6, 9, [self('gloria', 5), self('hubris', 3)]],
  ],
  // Deméter — Ouros
  [
    ['2', 'Colheita', 2, 0, [self('dracmas', 4)]],
    ['5', 'Abundância', 5, 2, [self('dracmas', 7)]],
    ['8', 'Mistérios de Elêusis', 4, 5, [self('gloria', 2), self('hubris', -1)]],
    ['Rainha', 'Estações', 6, 7, [self('gloria', 3), self('dracmas', 3), self('hubris', 1)]],
  ],
  // Hefesto — Espadas
  [
    ['2', 'Forja', 2, 1, [self('dracmas', 3), self('favor', 1)]],
    ['5', 'Autômato', 5, 4, [self('gloria', 2)]],
    ['8', 'Rede de Bronze', 4, 5, [jail('richest'), self('hubris', 1)]],
    ['Rainha', 'Obra-Prima', 6, 8, [self('gloria', 4), self('hubris', 1)]],
  ],
  // Ares — Copas
  [
    ['2', 'Saque', 2, 2, [steal('all', 'dracmas', 2), self('hubris', 1)]],
    ['5', 'Fúria', 5, 4, [self('gloria', 2), self('hubris', 2)]],
    ['8', 'Cerco', 4, 5, [foes('all', 'gloria', -1), self('hubris', 2)]],
    ['Rainha', 'Triunfo', 6, 7, [self('gloria', 4), self('hubris', 3)]],
  ],
  // Ártemis — Paus
  [
    ['3', 'Caçada', 3, 2, [steal('richest', 'dracmas', 2)]],
    ['6', 'Lua Crescente', 6, 3, [self('gloria', 1), self('favor', 1)]],
    ['9', 'Flecha Certeira', 5, 5, [self('gloria', 1), foes('leader', 'gloria', -1), self('hubris', 1)]],
    ['Rei', 'Senhora das Feras', 2, 7, [self('gloria', 3), self('hubris', 1)]],
  ],
  // Héstia — Ouros
  [
    ['3', 'Lareira', 3, 1, [self('hubris', -3)]],
    ['6', 'Chama Sagrada', 6, 3, [self('gloria', 1), self('hubris', -1)]],
    ['9', 'Hospitalidade', 5, 4, [self('favor', 2), draw(2)]],
    ['Rei', 'Fogo Eterno', 1, 6, [self('gloria', 3)]],
  ],
  // Hera — Espadas
  [
    ['3', 'Ciúme', 3, 3, [foes('leader', 'hubris', 2)]],
    ['6', 'Pavão', 6, 4, [self('gloria', 1), self('favor', 2)]],
    ['9', 'Vingança', 5, 5, [foes('leader', 'gloria', -1), foes('leader', 'dracmas', -3), self('hubris', 1)]],
    ['Rei', 'Rainha dos Deuses', 2, 8, [self('gloria', 4), self('hubris', 2)]],
  ],
  // Poseidon — Copas
  [
    ['3', 'Maré', 3, 2, [self('gloria', 1), foes('all', 'dracmas', -1)]],
    ['6', 'Tridente', 6, 4, [self('gloria', 2), self('hubris', 1)]],
    ['9', 'Terremoto', 5, 6, [foes('all', 'dracmas', -3), foes('leader', 'gloria', -1), self('hubris', 2)]],
    ['Rei', 'Senhor dos Mares', 2, 8, [self('gloria', 4), self('hubris', 2)]],
  ],
];

export const CARDS: Card[] = BY_SECTOR.flatMap((rows, sector) =>
  rows.map(([rank, title, move, cost, effects], i) => ({
    id: sector * 4 + i,
    sector,
    suit: ELEMENT_SUIT[SIGNS[sector].element],
    rank,
    title,
    move,
    cost,
    effects,
  })),
);

export const RES_NAME: Record<Res, string> = {
  gloria: 'Glória',
  dracmas: 'dracmas',
  favor: 'Favor',
  hubris: 'Húbris',
};

const WHO_NAME: Record<Who, string> = {
  all: 'Cada adversário',
  leader: 'O adversário com mais Glória',
  richest: 'O adversário mais rico',
};

const signed = (n: number): string => (n > 0 ? `+${n}` : `−${-n}`);

export function describeEffect(e: Effect): string {
  switch (e.t) {
    case 'self':
      return `${signed(e.n)} ${RES_NAME[e.res]}`;
    case 'foes':
      return `${WHO_NAME[e.who]}: ${signed(e.n)} ${RES_NAME[e.res]}`;
    case 'steal':
      return e.who === 'all'
        ? `Roube ${e.n} ${RES_NAME[e.res]} de cada adversário`
        : `Roube ${e.n} ${RES_NAME[e.res]} do adversário ${e.who === 'leader' ? 'com mais Glória' : 'mais rico'}`;
    case 'draw':
      return `Compre ${e.n} carta${e.n > 1 ? 's' : ''}`;
    case 'jail':
      return `Mande ao Tártaro o adversário ${e.who === 'leader' ? 'com mais Glória' : 'mais rico'}`;
  }
}

export const cardText = (card: Card): string => card.effects.map(describeEffect).join(' · ');
export const cardName = (card: Card): string => `${card.rank} de ${card.suit}`;
