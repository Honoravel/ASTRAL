import type { Element, Suit } from './types';

export interface God {
  name: string;
  element: Element;
  action: { label: string; cost: number; res: 'dracmas' | 'favor' };
  relic: { name: string; price: number; text: string };
}

/** Os 12 deuses na ordem das regiões do circuito (região r ocupa as casas 8r…8r+7). */
export const GODS: God[] = [
  { name: 'Zeus', element: 'fogo', action: { label: 'Ganhar 2 Glórias', cost: 4, res: 'dracmas' }, relic: { name: 'Raio de Zeus', price: 8, text: 'Uma vez por partida: +3 Glórias e +2 Húbris; consumido.' } },
  { name: 'Hera', element: 'terra', action: { label: 'Ganhar 2 Favores', cost: 2, res: 'dracmas' }, relic: { name: 'Coroa de Hera', price: 6, text: '+1 voto em eleição.' } },
  { name: 'Apolo', element: 'ar', action: { label: 'Consultar 3 cartas do Destino', cost: 1, res: 'dracmas' }, relic: { name: 'Lira de Apolo', price: 5, text: 'Consulta a próxima carta do Destino, 1 vez/rodada.' } },
  { name: 'Ártemis', element: 'terra', action: { label: 'Teletransportar até 3 casas adiante', cost: 2, res: 'dracmas' }, relic: { name: 'Arco de Ártemis', price: 6, text: 'Ignora um efeito negativo de casa, 1 vez/rodada.' } },
  { name: 'Atena', element: 'ar', action: { label: 'Comprar 2 e descartar 2', cost: 1, res: 'dracmas' }, relic: { name: 'Égide de Atena', price: 6, text: 'Ignora a próxima perda de Glória, 1 vez/rodada.' } },
  { name: 'Ares', element: 'fogo', action: { label: 'Roubar até 2 Dracmas', cost: 2, res: 'dracmas' }, relic: { name: 'Lança de Ares', price: 6, text: '+1 força nos duelos.' } },
  { name: 'Hefesto', element: 'fogo', action: { label: 'Criar escudo contra perda de Glória', cost: 3, res: 'dracmas' }, relic: { name: 'Martelo de Hefesto', price: 7, text: '−1 Dracma na primeira carta divina/rodada.' } },
  { name: 'Dionísio', element: 'agua', action: { label: 'Ganhar 2 Glórias e 1 Húbris', cost: 1, res: 'dracmas' }, relic: { name: 'Taça de Dionísio', price: 5, text: 'Troca 1 Húbris por 2 Dracmas, 1 vez/rodada.' } },
  { name: 'Hermes', element: 'ar', action: { label: 'Comprar 2 e descartar 1', cost: 2, res: 'dracmas' }, relic: { name: 'Sandálias de Hermes', price: 7, text: 'Altera o movimento em +1 ou −1, 1 vez/rodada; mínimo 1.' } },
  { name: 'Deméter', element: 'terra', action: { label: 'Ganhar 4 Dracmas', cost: 0, res: 'dracmas' }, relic: { name: 'Foice de Deméter', price: 5, text: '+1 Dracma no início de cada rodada.' } },
  { name: 'Afrodite', element: 'agua', action: { label: 'Trocar 2 Favores por 2 Glórias', cost: 2, res: 'favor' }, relic: { name: 'Cinto de Afrodite', price: 6, text: '+1 Favor a cada 3 rodadas.' } },
  { name: 'Poseidon', element: 'agua', action: { label: 'Teletransportar para casa comum de região adjacente', cost: 3, res: 'dracmas' }, relic: { name: 'Tridente de Poseidon', price: 6, text: '+1 Dracma ao entrar em região nova; máximo 2/rodada.' } },
];

/** Índices de região usados nas regras de relíquias. */
export const G = { zeus: 0, hera: 1, apolo: 2, artemis: 3, atena: 4, ares: 5, hefesto: 6, dionisio: 7, hermes: 8, demeter: 9, afrodite: 10, poseidon: 11 };

export interface Sign {
  name: string;
  glyph: string;
  element: Element;
  /** Região do deus patrono (PROVISÓRIO: tabela signo–deus a confirmar). */
  patron: number;
}

export const SIGNS: Sign[] = [
  { name: 'Áries', glyph: '♈', element: 'fogo', patron: G.ares },
  { name: 'Touro', glyph: '♉', element: 'terra', patron: G.hera },
  { name: 'Gêmeos', glyph: '♊', element: 'ar', patron: G.hermes },
  { name: 'Câncer', glyph: '♋', element: 'agua', patron: G.afrodite },
  { name: 'Leão', glyph: '♌', element: 'fogo', patron: G.zeus },
  { name: 'Virgem', glyph: '♍', element: 'terra', patron: G.demeter },
  { name: 'Libra', glyph: '♎', element: 'ar', patron: G.atena },
  { name: 'Escorpião', glyph: '♏', element: 'agua', patron: G.dionisio },
  { name: 'Sagitário', glyph: '♐', element: 'fogo', patron: G.hefesto },
  { name: 'Capricórnio', glyph: '♑', element: 'terra', patron: G.artemis },
  { name: 'Aquário', glyph: '♒', element: 'ar', patron: G.apolo },
  { name: 'Peixes', glyph: '♓', element: 'agua', patron: G.poseidon },
];

export const ELEMENT_SUIT: Record<Element, Suit> = { fogo: 'Paus', agua: 'Copas', ar: 'Espadas', terra: 'Ouros' };
export const SUIT_ELEMENT: Record<Suit, Element> = { Paus: 'fogo', Copas: 'agua', Espadas: 'ar', Ouros: 'terra' };
export const ELEMENT_NAME: Record<Element, string> = { fogo: 'Fogo', agua: 'Água', ar: 'Ar', terra: 'Terra' };

/** Glifo com seletor de variação de texto, para não virar emoji colorido. */
export const glyph = (sign: number): string => SIGNS[sign].glyph + '︎';
