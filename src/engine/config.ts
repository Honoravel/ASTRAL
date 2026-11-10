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
  // Sistemas estratégicos (v1.9)
  favorCap: 10,
  /** Máximo de Dracmas ganhos por efeitos de passagem num mesmo movimento. */
  passDracmaCap: 4,
  trapMax: 2,
  trapRounds: 3,
  sabotageInPerRound: 2,
  eventEvery: 6,
  contractAbandon: 2,
  /** Módulos (1 = ligado, 0 = desligado). */
  modTraps: 1,
  modEvents: 1,
  modContracts: 0,
  modSabotage: 0,
};

/** Armadilhas (v1.9). `redraw`: a vítima descarta uma carta aleatória e compra outra. */
export const TRAPS: { name: string; text: string; cost: number; changes: [Res, number][]; redraw?: boolean }[] = [
  { name: 'Rede de Hefesto', text: 'Perde 2 Dracmas', cost: 2, changes: [['dracmas', -2]] },
  { name: 'Névoa de Hécate', text: 'Recebe +1 Húbris', cost: 2, changes: [['hubris', 1]] },
  { name: 'Emboscada de Ares', text: 'Perde 1 Favor', cost: 3, changes: [['favor', -1]] },
  { name: 'Selo de Hermes', text: 'Descarta uma carta aleatória e compra outra', cost: 2, changes: [], redraw: true },
  { name: 'Espinhos de Ártemis', text: 'Perde 1 Dracma e recebe +1 Húbris', cost: 2, changes: [['dracmas', -1], ['hubris', 1]] },
];

export type SabotageKind = 'roubo' | 'maldicao' | 'bloqueio' | 'interferencia' | 'politica';

/** Sabotagens diretas (v1.9). Ficam desligadas (modSabotage) até a aprovação do design. */
export const SABOTAGES: Record<SabotageKind, { name: string; text: string; dracmas: number; favor: number }> = {
  roubo: { name: 'Roubo', text: 'Transfere até 2 Dracmas do adversário', dracmas: 2, favor: 0 },
  maldicao: { name: 'Maldição', text: 'Adversário recebe +1 Húbris', dracmas: 3, favor: 0 },
  bloqueio: { name: 'Bloqueio', text: 'Impede o uso de relíquias por um turno do alvo', dracmas: 2, favor: 1 },
  interferencia: { name: 'Interferência', text: 'Adversário descarta uma carta aleatória e compra outra', dracmas: 2, favor: 0 },
  politica: { name: 'Sabotagem política', text: 'Adversário perde 1 Favor', dracmas: 3, favor: 0 },
};

/** Eventos globais (v1.9), um ativo por vez. */
export const EVENTS: { name: string; text: string }[] = [
  { name: 'Festival de Dionísio', text: 'Apostas vencidas rendem +1 Dracma.' },
  { name: 'Bênção de Deméter', text: 'A primeira casa de Dracmas atravessada por turno rende +1 Dracma.' },
  { name: 'Ira de Ares', text: 'Vencedores de duelos recebem +1 Dracma.' },
  { name: 'Conselho de Atena', text: 'A primeira carta de Espadas usada como efeito por rodada custa −1 Dracma (mínimo 1).' },
  { name: 'Maré de Poseidon', text: 'O primeiro Tesouro de cada jogador por rodada rende +1 Dracma.' },
  { name: 'Julgamento de Zeus', text: 'Quem tiver 5 ou mais de Húbris paga 1 Dracma ao fim de cada rodada.' },
];
export const EV = { festival: 0, demeter: 1, ares: 2, atena: 3, poseidon: 4, zeus: 5 };

/** Contratos divinos (v1.9), índice = região do deus. Módulo desligado por padrão (modContracts). */
export const CONTRACTS: { text: string; goal: number; reward: [Res, number][] }[] = [
  { text: 'Acumular 8 Favores', goal: 8, reward: [['gloria', 2]] },
  { text: 'Vencer uma eleição', goal: 1, reward: [['gloria', 2]] },
  { text: 'Remover 3 Húbris', goal: 3, reward: [['gloria', 2]] },
  { text: 'Parar em 3 regiões diferentes', goal: 3, reward: [['gloria', 2]] },
  { text: 'Vencer 2 duelos', goal: 2, reward: [['gloria', 2]] },
  { text: 'Vencer 1 duelo como atacante', goal: 1, reward: [['gloria', 1], ['dracmas', 2]] },
  { text: 'Concluir um investimento', goal: 1, reward: [['gloria', 2]] },
  { text: 'Ganhar 6 Dracmas em apostas', goal: 6, reward: [['gloria', 2]] },
  { text: 'Realizar 3 trocas comerciais', goal: 3, reward: [['gloria', 2]] },
  { text: 'Receber 6 Dracmas de investimentos', goal: 6, reward: [['gloria', 2]] },
  { text: 'Obter 5 Favores', goal: 5, reward: [['gloria', 2]] },
  { text: 'Visitar 3 regiões diferentes', goal: 3, reward: [['gloria', 2]] },
];

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
