import type { Res } from './types';

/** Todos os valores ajustáveis do jogo. Modelo econômico atual: equilibrado. */
export const RULES = {
  goal: 20,
  hand: 6,
  startDracmas: 5,
  startFavor: 1,
  maxRelics: 2,
  electionEvery: 6,
  bail: 4,
  nemesisFine: 4,
  maxBid: 3,
  // Casas (v1.6)
  dracmasPass: 1,
  dracmasStop: 2,
  tollPass: 1,
  tollStop: 2,
  tollHubris: 1,
  favorStop: 2,
  gloriaStop: 1,
  treasureMin: 2,
  treasureMax: 5,
  nemesisPassHubris: 4,
  nemesisPassToll: 1,
  altarMaxBet: 3,
};

export type RollRow = { text: string; changes: [Res, number][] };

/** Tabelas de 1d6 das casas de Provação e Evento. */
export const TABLES: Record<'provacao' | 'evento', RollRow[]> = {
  provacao: [
    { text: '+2 Húbris', changes: [['hubris', 2]] },
    { text: '−2 Dracmas', changes: [['dracmas', -2]] },
    { text: '−1 Favor', changes: [['favor', -1]] },
    { text: '+2 Dracmas', changes: [['dracmas', 2]] },
    { text: '+1 Glória', changes: [['gloria', 1]] },
    { text: '+1 Favor e +1 Dracma', changes: [['favor', 1], ['dracmas', 1]] },
  ],
  evento: [
    { text: 'perde 2 Dracmas', changes: [['dracmas', -2]] },
    { text: 'ganha 2 Dracmas', changes: [['dracmas', 2]] },
    { text: 'ganha 1 Favor', changes: [['favor', 1]] },
    { text: 'ganha 1 Húbris', changes: [['hubris', 1]] },
    { text: 'remove 1 Húbris', changes: [['hubris', -1]] },
    { text: 'ganha 1 Glória', changes: [['gloria', 1]] },
  ],
};

/** Altar: resultado do dado → Favores recebidos. */
export const ALTAR_FAVOR = [0, 0, 1, 1, 2, 2];
