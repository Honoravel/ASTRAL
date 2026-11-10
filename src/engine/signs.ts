import type { Element, Suit } from './types';

export interface Sign {
  name: string;
  glyph: string;
  element: Element;
  god: string;
  epithet: string;
}

/** Signos na ordem do zodíaco; o índice é também o da região no mapa. */
export const SIGNS: Sign[] = [
  { name: 'Áries', glyph: '♈', element: 'fogo', god: 'Atena', epithet: 'Sabedoria e estratégia' },
  { name: 'Touro', glyph: '♉', element: 'terra', god: 'Afrodite', epithet: 'Amor e beleza' },
  { name: 'Gêmeos', glyph: '♊', element: 'ar', god: 'Apolo', epithet: 'Luz e profecia' },
  { name: 'Câncer', glyph: '♋', element: 'agua', god: 'Hermes', epithet: 'Viajantes e ladrões' },
  { name: 'Leão', glyph: '♌', element: 'fogo', god: 'Zeus', epithet: 'Rei dos deuses' },
  { name: 'Virgem', glyph: '♍', element: 'terra', god: 'Deméter', epithet: 'Colheita e mistérios' },
  { name: 'Libra', glyph: '♎', element: 'ar', god: 'Hefesto', epithet: 'Forja e engenho' },
  { name: 'Escorpião', glyph: '♏', element: 'agua', god: 'Ares', epithet: 'Guerra e fúria' },
  { name: 'Sagitário', glyph: '♐', element: 'fogo', god: 'Ártemis', epithet: 'Caça e lua' },
  { name: 'Capricórnio', glyph: '♑', element: 'terra', god: 'Héstia', epithet: 'Lar e fogo sagrado' },
  { name: 'Aquário', glyph: '♒', element: 'ar', god: 'Hera', epithet: 'Rainha dos deuses' },
  { name: 'Peixes', glyph: '♓', element: 'agua', god: 'Poseidon', epithet: 'Mares e terremotos' },
];

export const ELEMENT_SUIT: Record<Element, Suit> = {
  fogo: 'Paus',
  terra: 'Ouros',
  ar: 'Espadas',
  agua: 'Copas',
};

export const ELEMENT_NAME: Record<Element, string> = {
  fogo: 'Fogo',
  terra: 'Terra',
  ar: 'Ar',
  agua: 'Água',
};

/** Glifo com seletor de variação de texto, para não virar emoji colorido. */
export const glyph = (sign: number): string => SIGNS[sign].glyph + '︎';
