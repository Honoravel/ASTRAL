import type { Destiny, DestinyOp, DestinyTarget, Res } from './types';

const res = (to: DestinyTarget, r: Res, n: number): DestinyOp => ({ t: 'res', to, res: r, n });
const draw = (to: DestinyTarget, n: number): DestinyOp => ({ t: 'draw', to, n });

type Row = [numeral: string, name: string, text: string, ops: DestinyOp[]];

/** Os 22 Arcanos Maiores: o baralho do Destino, revelado nas casas das Moiras. */
const ROWS: Row[] = [
  ['0', 'O Louco', 'Quem revelou: +1 Glória e +2 Húbris.', [res('active', 'gloria', 1), res('active', 'hubris', 2)]],
  ['I', 'O Mago', 'Quem revelou compra 2 cartas.', [draw('active', 2)]],
  ['II', 'A Sacerdotisa', 'Todos: −1 Húbris.', [res('all', 'hubris', -1)]],
  ['III', 'A Imperatriz', 'Todos: +2 dracmas.', [res('all', 'dracmas', 2)]],
  ['IV', 'O Imperador', 'Quem tem mais Glória paga 3 dracmas de imposto.', [res('leader', 'dracmas', -3)]],
  ['V', 'O Hierofante', 'Todos: +1 Favor.', [res('all', 'favor', 1)]],
  ['VI', 'Os Enamorados', 'Quem revelou: +2 Favor.', [res('active', 'favor', 2)]],
  ['VII', 'O Carro', 'Quem revelou: +2 dracmas e compra 1 carta.', [res('active', 'dracmas', 2), draw('active', 1)]],
  ['VIII', 'A Justiça', 'Quem tiver 3 ou mais de Húbris perde 3 dracmas.', [{ t: 'justice' }]],
  ['IX', 'O Eremita', 'Quem tem menos Glória: +3 dracmas e +1 Favor.', [res('last', 'dracmas', 3), res('last', 'favor', 1)]],
  ['X', 'A Roda da Fortuna', 'Todos descartam a mão e compram 6 cartas.', [{ t: 'redraw' }]],
  ['XI', 'A Força', 'Quem tem menos Glória: +1 Glória.', [res('last', 'gloria', 1)]],
  ['XII', 'O Enforcado', 'Quem revelou: −2 dracmas e +1 Favor.', [res('active', 'dracmas', -2), res('active', 'favor', 1)]],
  ['XIII', 'A Morte', 'Quem tem mais Glória: −1 Glória.', [res('leader', 'gloria', -1)]],
  ['XIV', 'A Temperança', 'Todos: −2 Húbris.', [res('all', 'hubris', -2)]],
  ['XV', 'O Diabo', 'Todos: +1 Húbris.', [res('all', 'hubris', 1)]],
  ['XVI', 'A Torre', 'Todos: −3 dracmas.', [res('all', 'dracmas', -3)]],
  ['XVII', 'A Estrela', 'Quem revelou: +1 Glória.', [res('active', 'gloria', 1)]],
  ['XVIII', 'A Lua', 'Os demais jogadores: +1 Húbris.', [res('others', 'hubris', 1)]],
  ['XIX', 'O Sol', 'Todos: +3 dracmas.', [res('all', 'dracmas', 3)]],
  ['XX', 'O Julgamento', 'Quem tiver mais Húbris (ao menos 1) vai para o Tártaro.', [{ t: 'judgement' }]],
  ['XXI', 'O Mundo', 'Todos: +1 Favor. Quem tem menos Glória: +1 Glória.', [res('all', 'favor', 1), res('last', 'gloria', 1)]],
];

export const DESTINIES: Destiny[] = ROWS.map(([numeral, name, text, ops], id) => ({ id, numeral, name, text, ops }));
