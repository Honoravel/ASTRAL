export interface Destiny {
  id: number;
  numeral: string;
  name: string;
  text: string;
}

const ROWS: [string, string, string][] = [
  ['0', 'O Louco', 'Todos compram 1 carta e descartam 1.'],
  ['I', 'O Mago', 'Ativo ganha 2 Dracmas e 1 Favor.'],
  ['II', 'A Sacerdotisa', 'Ativo olha as 3 próximas cartas do Destino e reorganiza.'],
  ['III', 'A Imperatriz', 'Todos ganham 3 Dracmas.'],
  ['IV', 'O Imperador', 'Líder em Glória ganha 1 Húbris; demais ganham 1 Dracma.'],
  ['V', 'O Hierofante', 'Todos removem 1 Húbris.'],
  ['VI', 'Os Enamorados', 'Ativo escolhe outro; ambos ganham 1 Favor.'],
  ['VII', 'O Carro', 'Ativo avança 3 casas sem ativar o destino.'],
  ['VIII', 'A Justiça', 'Jogadores com 3+ Húbris perdem até 2 Dracmas.'],
  ['IX', 'O Eremita', 'Ativo compra 2 cartas e descarta 2.'],
  ['X', 'A Roda da Fortuna', 'Todos descartam as mãos e compram 6.'],
  ['XI', 'A Força', 'Ativo ganha 2 Glórias e 1 Húbris.'],
  ['XII', 'O Enforcado', 'Ativo perde 1 Favor; sem Favor, perde até 2 Dracmas.'],
  ['XIII', 'A Morte', 'Todos descartam 1 carta aleatória, se tiverem.'],
  ['XIV', 'A Temperança', 'Todos removem até 2 Húbris.'],
  ['XV', 'O Diabo', 'Ativo ganha 5 Dracmas e 2 Húbris.'],
  ['XVI', 'A Torre', 'Todos perdem até 3 Dracmas.'],
  ['XVII', 'A Estrela', 'Jogador com menos Glória ganha 2 Glórias.'],
  ['XVIII', 'A Lua', 'Todos revelam 1 carta aleatória; ativo ganha 1 Favor.'],
  ['XIX', 'O Sol', 'Todos ganham 1 Glória.'],
  ['XX', 'O Julgamento', 'Jogadores com 4+ Húbris vão ao Tártaro.'],
  ['XXI', 'O Mundo', 'Ativo ganha 3 Glórias e 1 Favor.'],
];

export const DESTINIES: Destiny[] = ROWS.map(([numeral, name, text], id) => ({ id, numeral, name, text }));
