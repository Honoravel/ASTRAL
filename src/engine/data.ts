import { RULES as R } from './config';
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
  { name: 'Zeus', element: 'fogo', primary: { name: 'Ascensão', text: `${R.zeusCost} Dracmas → +2 Glórias e +1 Húbris. Uma vez a cada ${R.gloryActionCooldown} rodadas.` }, secondary: { name: 'Decreto Olímpico', text: '3 Favores → +1 Glória.' }, relic: { name: 'Raio de Zeus', price: 18, text: 'Uma vez por partida: +3 Glórias e +2 Húbris; consumido.' } },
  { name: 'Hera', element: 'terra', primary: { name: 'Influência', text: `2 Favores → ${R.heraSell} Dracmas, ou ${R.heraBuy} Dracmas → 2 Favores.` }, secondary: { name: 'Proteção Real', text: '2 Favores → escudo contra a próxima perda de Glória.' }, relic: { name: 'Coroa de Hera', price: 12, text: '+1 voto em eleição.' } },
  { name: 'Apolo', element: 'ar', primary: { name: 'Visão Profética', text: `${R.vision} Dracmas → ver 3 cartas do Destino e reorganizá-las.` }, secondary: { name: 'Purificação', text: `${R.purify} Dracmas → remover 2 Húbris.` }, relic: { name: 'Lira de Apolo', price: 10, text: 'Consulta a próxima carta do Destino, 1 vez/rodada.' } },
  { name: 'Ártemis', element: 'terra', primary: { name: 'Caçada', text: `Grátis: 1d6, ganha dado + ${R.huntBonus} Dracmas. Resultado 1: +1 Húbris.` }, secondary: { name: 'Caça Sagrada', text: `${R.sacredHunt} Dracmas → comprar 2 cartas e descartar 2.` }, relic: { name: 'Arco de Ártemis', price: 12, text: 'Ignora um efeito negativo de casa, 1 vez/rodada.' } },
  { name: 'Atena', element: 'ar', primary: { name: 'Julgamento', text: `${R.judge} Dracmas → disputar no dado 2 Favores de um adversário. Falha: +1 Húbris.` }, secondary: { name: 'Estratégia', text: '2 Favores → ver 3 cartas do Destino e reorganizá-las.' }, relic: { name: 'Égide de Atena', price: 12, text: 'Ignora a próxima perda de Glória, 1 vez/rodada.' } },
  { name: 'Ares', element: 'fogo', primary: { name: 'Confronto', text: `${R.confront} Dracmas e 1 Favor → duelo à distância valendo 1 Glória.` }, secondary: { name: 'Preparação de Guerra', text: `${R.warPrep} Dracmas → +${R.duelPrep} de força no próximo duelo.` }, relic: { name: 'Lança de Ares', price: 12, text: '+1 força nos duelos.' } },
  { name: 'Hefesto', element: 'fogo', primary: { name: 'Forja', text: `${R.forgeCost} Dracmas → +${R.forgeYield} Dracmas ao fim de cada rodada, por ${R.forgeRounds} rodadas.` }, secondary: { name: 'Aprimoramento', text: `${R.refine} Dracmas → a próxima carta divina custa −${R.refineDiscount}.` }, relic: { name: 'Martelo de Hefesto', price: 14, text: `−${R.hammerDiscount} Dracmas na primeira carta divina/rodada.` } },
  { name: 'Dionísio', element: 'agua', primary: { name: 'Êxtase', text: `Grátis: +${R.ecstasy} Dracmas, +2 Húbris e troca a mão inteira por 6 cartas novas.` }, secondary: { name: 'Cassino Divino', text: `Aposte ${R.casinoStep}, ${R.casinoStep * 2} ou ${R.casinoStep * 3} Dracmas: com 4, 5 ou 6 no dado, recebe o dobro.` }, relic: { name: 'Taça de Dionísio', price: 10, text: `Troca 1 Húbris por ${R.cupGain} Dracmas, 1 vez/rodada.` } },
  { name: 'Hermes', element: 'ar', primary: { name: 'Comércio', text: `Vender 1 Glória por ${R.sellGlory} Dracmas, ou ${R.favorBuy} Dracmas → 1 Favor.` }, secondary: { name: 'Contrabando', text: `${R.smuggle} Dracmas → trocar até 3 cartas da mão.` }, relic: { name: 'Sandálias de Hermes', price: 14, text: 'Altera o movimento em +1 ou −1, 1 vez/rodada; mínimo 1.' } },
  { name: 'Deméter', element: 'terra', primary: { name: 'Colheita', text: `${R.harvestCost} Dracmas → +${R.harvestYield} Dracmas por rodada durante ${R.harvestRounds} rodadas.` }, secondary: { name: 'Oferta da Terra', text: `${R.offering} Dracmas → +2 Favores.` }, relic: { name: 'Foice de Deméter', price: 10, text: `+${R.scytheGain} Dracmas no início de cada rodada.` } },
  { name: 'Afrodite', element: 'agua', primary: { name: 'Persuasão', text: `${R.persuade} Dracmas → +2 Favores.` }, secondary: { name: 'Encantamento', text: `2 Favores → tomar ${R.charm} Dracmas de um adversário que os tenha.` }, relic: { name: 'Cinto de Afrodite', price: 12, text: '+1 Favor a cada 3 rodadas.' } },
  { name: 'Poseidon', element: 'agua', primary: { name: 'Tesouro Submerso', text: `Grátis: 1d6, ganha dado + ${R.seaBonus} Dracmas. Resultado 1: +1 Húbris.` }, secondary: { name: 'Travessia', text: `${R.crossing} Dracmas → teletransporte para uma casa comum da região seguinte.` }, relic: { name: 'Tridente de Poseidon', price: 12, text: `+${R.tridentGain} Dracmas ao entrar em região nova; máximo 2 vezes/rodada.` } },
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
