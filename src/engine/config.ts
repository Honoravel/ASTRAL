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
  gloriaPass: 1,
  gloriaStop: 2,
  treasureMin: 2,
  treasureMax: 5,
  nemesisPassHubris: 4,
  nemesisPassToll: 1,
  altarMaxBet: 3,
  /** Ira de Nêmesis: ao encerrar o turno com esta Húbris, o jogador é condenado… */
  wrathHubris: 6,
  /** …e a queda expia parte da soberba: a Húbris cai para este valor. */
  wrathReset: 4,
  // Templos (v1.8)
  gloryActionCooldown: 3,
  forgeCost: 5,
  forgeTotal: 8,
  harvestCost: 4,
  harvestRounds: 4,
  harvestYield: 2,
  duelPrep: 2,
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

/** Altar: cada Dracma apostado além do primeiro soma 1 ao dado. Total 1–2: nada · 3–4: 1 Favor · 5+: 2 Favores. */
export const altarFavor = (roll: number, bet: number): number => {
  const total = roll + bet - 1;
  return total <= 2 ? 0 : total <= 4 ? 1 : 2;
};
