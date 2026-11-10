import type { Element, Suit } from './types';

export interface God {
  name: string;
  element: Element;
  /** Ação principal e ação secundária do templo (v1.8). */
  primary: { name: string; text: string };
  secondary: { name: string; text: string };
  relic: { name: string; price: number; text: string };
}

/** Os 12 deuses na ordem das regiões do circuito (região r ocupa as casas 8r…8r+7). */
export const GODS: God[] = [
  { name: 'Zeus', element: 'fogo', primary: { name: 'Ascensão', text: '6 Dracmas → +2 Glórias e +1 Húbris. Uma vez a cada 3 rodadas.' }, secondary: { name: 'Decreto Olímpico', text: '3 Favores → +1 Glória.' }, relic: { name: 'Raio de Zeus', price: 8, text: 'Uma vez por partida: +3 Glórias e +2 Húbris; consumido.' } },
  { name: 'Hera', element: 'terra', primary: { name: 'Influência', text: '2 Favores → 4 Dracmas, ou 5 Dracmas → 2 Favores.' }, secondary: { name: 'Proteção Real', text: '2 Favores → escudo contra a próxima perda de Glória.' }, relic: { name: 'Coroa de Hera', price: 6, text: '+1 voto em eleição.' } },
  { name: 'Apolo', element: 'ar', primary: { name: 'Visão Profética', text: '2 Dracmas → ver 3 cartas do Destino e reorganizá-las.' }, secondary: { name: 'Purificação', text: '3 Dracmas → remover 2 Húbris.' }, relic: { name: 'Lira de Apolo', price: 5, text: 'Consulta a próxima carta do Destino, 1 vez/rodada.' } },
  { name: 'Ártemis', element: 'terra', primary: { name: 'Caçada', text: 'Grátis: 1d6, ganha de 1 a 5 Dracmas. Resultado 1: +1 Húbris.' }, secondary: { name: 'Caça Sagrada', text: '2 Dracmas → comprar 2 cartas e descartar 2.' }, relic: { name: 'Arco de Ártemis', price: 6, text: 'Ignora um efeito negativo de casa, 1 vez/rodada.' } },
  { name: 'Atena', element: 'ar', primary: { name: 'Julgamento', text: '3 Dracmas → disputar no dado 2 Favores de um adversário. Falha: +1 Húbris.' }, secondary: { name: 'Estratégia', text: '2 Favores → ver 3 cartas do Destino e reorganizá-las.' }, relic: { name: 'Égide de Atena', price: 6, text: 'Ignora a próxima perda de Glória, 1 vez/rodada.' } },
  { name: 'Ares', element: 'fogo', primary: { name: 'Confronto', text: '2 Dracmas e 1 Favor → duelo à distância valendo 1 Glória.' }, secondary: { name: 'Preparação de Guerra', text: '2 Dracmas → +2 de força no próximo duelo.' }, relic: { name: 'Lança de Ares', price: 6, text: '+1 força nos duelos.' } },
  { name: 'Hefesto', element: 'fogo', primary: { name: 'Forja', text: '5 Dracmas → +1 Dracma ao fim de cada rodada, até render 8.' }, secondary: { name: 'Aprimoramento', text: '3 Dracmas → a próxima carta divina custa −1.' }, relic: { name: 'Martelo de Hefesto', price: 7, text: '−1 Dracma na primeira carta divina/rodada.' } },
  { name: 'Dionísio', element: 'agua', primary: { name: 'Êxtase', text: 'Grátis: +5 Dracmas, +2 Húbris e troca a mão inteira por 6 cartas novas.' }, secondary: { name: 'Cassino Divino', text: 'Aposte 1–3 Dracmas: com 4, 5 ou 6 no dado, recebe o dobro.' }, relic: { name: 'Taça de Dionísio', price: 5, text: 'Troca 1 Húbris por 2 Dracmas, 1 vez/rodada.' } },
  { name: 'Hermes', element: 'ar', primary: { name: 'Comércio', text: 'Vender 1 Glória por 5 Dracmas, ou 3 Dracmas → 1 Favor.' }, secondary: { name: 'Contrabando', text: '2 Dracmas → trocar até 3 cartas da mão.' }, relic: { name: 'Sandálias de Hermes', price: 7, text: 'Altera o movimento em +1 ou −1, 1 vez/rodada; mínimo 1.' } },
  { name: 'Deméter', element: 'terra', primary: { name: 'Colheita', text: '4 Dracmas → +2 Dracmas por rodada durante 4 rodadas.' }, secondary: { name: 'Oferta da Terra', text: '3 Dracmas → +2 Favores.' }, relic: { name: 'Foice de Deméter', price: 5, text: '+1 Dracma no início de cada rodada.' } },
  { name: 'Afrodite', element: 'agua', primary: { name: 'Persuasão', text: '3 Dracmas → +2 Favores.' }, secondary: { name: 'Encantamento', text: '2 Favores → tomar 3 Dracmas de um adversário que os tenha.' }, relic: { name: 'Cinto de Afrodite', price: 6, text: '+1 Favor a cada 3 rodadas.' } },
  { name: 'Poseidon', element: 'agua', primary: { name: 'Tesouro Submerso', text: 'Grátis: 1d6, ganha de 2 a 7 Dracmas. Resultado 1: +1 Húbris.' }, secondary: { name: 'Travessia', text: '3 Dracmas → teletransporte para uma casa comum da região seguinte.' }, relic: { name: 'Tridente de Poseidon', price: 6, text: '+1 Dracma ao entrar em região nova; máximo 2/rodada.' } },
];

/** Afinidades temáticas (v1.8): cartas que também podem ter o efeito usado neste templo. Índice = região. */
export const AFFINITY: number[][] = [
  [13, 0], [26, 54], [28, 38], [11, 10], [41, 40], [4, 39], [55, 49], [20, 22], [53, 43], [42, 54], [15, 26], [27, 14],
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
