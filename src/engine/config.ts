import type { Res } from './types';

/** Todos os valores ajustáveis do jogo. Modelo econômico atual: equilibrado. */
export const RULES = {
  goal: 30,
  hand: 6,
  startDracmas: 10,
  startFavor: 2,
  maxRelics: 2,
  electionEvery: 6,
  bail: 8,
  nemesisFine: 6,
  maxBid: 3,
  // Casas (v1.6)
  dracmasPass: 3,
  dracmasStop: 6,
  tollPass: 2,
  tollStop: 4,
  tollHubris: 1,
  favorStop: 2,
  gloriaPass: 0,
  gloriaStop: 2,
  treasureMin: 4,
  treasureMax: 8,
  nemesisPassHubris: 4,
  nemesisPassToll: 1,
  altarMaxBet: 3,
  /** Ira de Nêmesis: ao encerrar o turno com esta Húbris, o jogador é condenado… */
  wrathHubris: 6,
  /** …e a queda expia parte da soberba: a Húbris cai para este valor. */
  wrathReset: 4,
  // Templos (v1.8)
  gloryActionCooldown: 3,
  forgeCost: 10,
  forgeRounds: 8,
  forgeYield: 2,
  harvestCost: 8,
  harvestRounds: 4,
  harvestYield: 4,
  duelPrep: 2,
  // Economia rebalanceada: custos e ganhos de templos, relíquias e duelos.
  zeusCost: 10,
  heraSell: 8,
  heraBuy: 8,
  campaign: 4,
  vision: 4,
  purify: 5,
  huntBonus: 2,
  sacredHunt: 4,
  judge: 5,
  intrigue: 4,
  confront: 4,
  warPrep: 4,
  refine: 5,
  refineDiscount: 3,
  /** Pajem de Espadas: desconto na próxima carta de efeito. */
  pageDiscount: 3,
  ecstasy: 8,
  casinoStep: 2,
  sellGlory: 10,
  favorBuy: 4,
  smuggle: 3,
  offering: 5,
  persuade: 5,
  charm: 5,
  seaBonus: 4,
  crossing: 5,
  delphiFavor: 4,
  delphiCycle: 5,
  duelPrize: 4,
  /** Julgamento de Nêmesis: perda-base com Húbris 2–3; cada ponto de Húbris soma 1 a qualquer cobrança. */
  judgementLoss: 2,
  /** Após a eleição, cada jogador perde esta fração do Favor (arredondada para baixo). */
  electionFavorLoss: 0.5,
  tridentGain: 2,
  scytheGain: 2,
  cupGain: 4,
  hammerDiscount: 2,
  eventBonus: 2,
  theft: 4,
  // Sistemas estratégicos (v1.9)
  favorCap: 12,
  /** Máximo de Dracmas ganhos por efeitos de passagem num mesmo movimento. */
  passDracmaCap: 6,
  trapMax: 2,
  trapRounds: 3,
  sabotageInPerRound: 2,
  eventEvery: 6,
  contractAbandon: 4,
  /** Módulos (1 = ligado, 0 = desligado). */
  modTraps: 1,
  modEvents: 1,
  modContracts: 0,
  modSabotage: 0,
};

/** Armadilhas (v1.9). `redraw`: a vítima descarta uma carta aleatória e compra outra. */
export const TRAPS: { name: string; text: string; cost: number; changes: [Res, number][]; redraw?: boolean }[] = [
  { name: 'Rede de Hefesto', text: 'Perde 4 Dracmas', cost: 3, changes: [['dracmas', -4]] },
  { name: 'Névoa de Hécate', text: 'Recebe +1 Húbris', cost: 3, changes: [['hubris', 1]] },
  { name: 'Emboscada de Ares', text: 'Perde 1 Favor', cost: 4, changes: [['favor', -1]] },
  { name: 'Selo de Hermes', text: 'Descarta uma carta aleatória e compra outra', cost: 3, changes: [], redraw: true },
  { name: 'Espinhos de Ártemis', text: 'Perde 2 Dracmas e recebe +1 Húbris', cost: 3, changes: [['dracmas', -2], ['hubris', 1]] },
];

export type SabotageKind = 'roubo' | 'maldicao' | 'bloqueio' | 'interferencia' | 'politica';

/** Sabotagens diretas (v1.9). Ficam desligadas (modSabotage) até a aprovação do design. */
export const SABOTAGES: Record<SabotageKind, { name: string; text: string; dracmas: number; favor: number }> = {
  roubo: { name: 'Roubo', text: 'Transfere até 4 Dracmas do adversário', dracmas: 3, favor: 0 },
  maldicao: { name: 'Maldição', text: 'Adversário recebe +1 Húbris', dracmas: 4, favor: 0 },
  bloqueio: { name: 'Bloqueio', text: 'Impede o uso de relíquias por um turno do alvo', dracmas: 5, favor: 1 },
  interferencia: { name: 'Interferência', text: 'Adversário descarta uma carta aleatória e compra outra', dracmas: 3, favor: 0 },
  politica: { name: 'Sabotagem política', text: 'Adversário perde 1 Favor', dracmas: 4, favor: 0 },
};

/** Eventos globais (v1.9), um ativo por vez. */
export const EVENTS: { name: string; text: string }[] = [
  { name: 'Festival de Dionísio', text: 'Apostas vencidas rendem +2 Dracmas.' },
  { name: 'Bênção de Deméter', text: 'A primeira casa de Dracmas atravessada por turno rende +2 Dracmas.' },
  { name: 'Ira de Ares', text: 'Vencedores de duelos recebem +2 Dracmas.' },
  { name: 'Conselho de Atena', text: 'A primeira carta de Espadas usada como efeito por rodada custa −1 Dracma (mínimo 1).' },
  { name: 'Maré de Poseidon', text: 'O primeiro Tesouro de cada jogador por rodada rende +2 Dracmas.' },
  { name: 'Julgamento de Zeus', text: 'Quem tiver 5 ou mais de Húbris paga 2 Dracmas ao fim de cada rodada.' },
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
  { text: 'Ganhar 10 Dracmas em apostas', goal: 10, reward: [['gloria', 2]] },
  { text: 'Realizar 3 trocas comerciais', goal: 3, reward: [['gloria', 2]] },
  { text: 'Receber 12 Dracmas de investimentos', goal: 12, reward: [['gloria', 2]] },
  { text: 'Obter 5 Favores', goal: 5, reward: [['gloria', 2]] },
  { text: 'Visitar 3 regiões diferentes', goal: 3, reward: [['gloria', 2]] },
];

export type RollRow = { text: string; changes: [Res, number][] };

/** Tabelas de 1d6 das casas de Provação e Evento. */
export const TABLES: Record<'provacao' | 'evento', RollRow[]> = {
  provacao: [
    { text: '+2 Húbris', changes: [['hubris', 2]] },
    { text: '−3 Dracmas', changes: [['dracmas', -3]] },
    { text: '−1 Favor', changes: [['favor', -1]] },
    { text: '+3 Dracmas', changes: [['dracmas', 3]] },
    { text: '+1 Glória', changes: [['gloria', 1]] },
    { text: '+1 Favor e +2 Dracmas', changes: [['favor', 1], ['dracmas', 2]] },
  ],
  evento: [
    { text: 'perde 3 Dracmas', changes: [['dracmas', -3]] },
    { text: 'ganha 3 Dracmas', changes: [['dracmas', 3]] },
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
