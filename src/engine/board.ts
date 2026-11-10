import { RULES } from './config';
import type { BoardNode, EffectDefinition, HouseType } from './types';

export const NODE_COUNT = 96;
export const TARTARUS = 52;
export const DELPHI = 68;

/** Tipos e IDs de casas — fonte de verdade da especificação v1.6. */
const TYPE_IDS: Record<HouseType, number[]> = {
  comum: [0, 2, 5, 9, 13, 18, 21, 24, 28, 32, 37, 40],
  dracmas: [1, 12, 20, 31, 39, 49, 58, 71, 78, 84],
  pedagio: [42, 47, 50, 57, 60, 63, 66, 72],
  favor: [4, 16, 23, 34, 41, 55, 61, 74],
  gloria: [7, 15, 25, 33, 44, 53],
  provacao: [77, 79, 80, 81, 85, 87],
  destino: [10, 29, 48, 69, 82, 93],
  nemesis: [14, 30, 46, 62],
  bifurcacao: [6, 22, 38, 54, 70, 86],
  templo: [3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91],
  evento: [8, 17, 26, 36, 45, 56],
  altar: [89, 90, 92, 95, 65, 76],
  tesouro: [88, 94, 64, 73],
  delfos: [DELPHI],
  tartaro: [TARTARUS],
};

export interface House {
  name: string;
  /** Texto do efeito de passagem ('' = nenhum). */
  pass: string;
  stop: string;
  onPass: EffectDefinition[];
  onStop: EffectDefinition[];
}

/** Efeitos de passagem e de parada de cada tipo de casa. */
export const HOUSES: Record<HouseType, House> = {
  comum: { name: 'Comum', pass: '', stop: 'Nenhum efeito.', onPass: [], onStop: [] },
  dracmas: {
    name: 'Dracmas', pass: `+${RULES.dracmasPass} Dracmas`, stop: `+${RULES.dracmasStop} Dracmas`,
    onPass: [{ k: 'res', res: 'dracmas', n: RULES.dracmasPass }], onStop: [{ k: 'res', res: 'dracmas', n: RULES.dracmasStop }],
  },
  pedagio: {
    name: 'Pedágio divino', pass: `−${RULES.tollPass} Dracmas`, stop: `−${RULES.tollStop} Dracmas. Sem saldo: paga o que tiver e ganha ${RULES.tollHubris} Húbris`,
    onPass: [{ k: 'toll', n: RULES.tollPass }], onStop: [{ k: 'toll', n: RULES.tollStop }],
  },
  favor: { name: 'Favor', pass: '', stop: `+${RULES.favorStop} Favores`, onPass: [], onStop: [{ k: 'res', res: 'favor', n: RULES.favorStop }] },
  gloria: { name: 'Glória', pass: RULES.gloriaPass ? `+${RULES.gloriaPass} Glória` : '', stop: `+${RULES.gloriaStop} Glória${RULES.gloriaStop > 1 ? 's' : ''}`, onPass: RULES.gloriaPass ? [{ k: 'res', res: 'gloria', n: RULES.gloriaPass }] : [], onStop: [{ k: 'res', res: 'gloria', n: RULES.gloriaStop }] },
  provacao: {
    name: 'Provação', pass: '', stop: '1d6: 1 +2 Húbris · 2 −3 Dracmas · 3 −1 Favor · 4 +3 Dracmas · 5 +1 Glória · 6 +1 Favor e +2 Dracmas',
    onPass: [], onStop: [{ k: 'roll', table: 'provacao' }],
  },
  destino: { name: 'Destino', pass: '', stop: 'Revela um Arcano Maior', onPass: [], onStop: [{ k: 'destiny' }] },
  nemesis: {
    name: 'Nêmesis', pass: `Com Húbris ≥ ${RULES.nemesisPassHubris}: −${RULES.nemesisPassToll} Dracma`,
    stop: `Julgamento. Húbris 0–1: nada · 2–3: perde ${RULES.judgementLoss} + Húbris em Dracmas · 4–5: paga ${RULES.nemesisFine} + Húbris ou Tártaro · 6+: Tártaro`,
    onPass: [{ k: 'hubrisToll', min: RULES.nemesisPassHubris, n: RULES.nemesisPassToll }], onStop: [{ k: 'judgement' }],
  },
  bifurcacao: { name: 'Bifurcação', pass: 'Escolha de rota: saída normal ou atalho para dentro', stop: 'Nenhum efeito.', onPass: [], onStop: [] },
  templo: { name: 'Templo', pass: '', stop: 'Ação divina (só ao chegar por movimento), comprar a relíquia ou nada', onPass: [], onStop: [{ k: 'temple' }] },
  evento: {
    name: 'Evento', pass: '', stop: '1d6: 1 −3 Dracmas · 2 +3 Dracmas · 3 +1 Favor · 4 +1 Húbris · 5 −1 Húbris · 6 +1 Glória',
    onPass: [], onStop: [{ k: 'roll', table: 'evento' }],
  },
  altar: {
    name: 'Altar', pass: '', stop: `Aposte de 1 a ${RULES.altarMaxBet} Dracmas e role 1d6, +1 por Dracma além do primeiro: 1–2 nada · 3–4 +1 Favor · 5 ou mais +2 Favores`,
    onPass: [], onStop: [{ k: 'altar' }],
  },
  tesouro: {
    name: 'Tesouro', pass: '', stop: `+${RULES.treasureMin} a ${RULES.treasureMax} Dracmas`,
    onPass: [], onStop: [{ k: 'treasure', min: RULES.treasureMin, max: RULES.treasureMax }],
  },
  delfos: { name: 'Delfos', pass: '', stop: `Ver 2 cartas do Destino, ou pagar ${RULES.delphiFavor} Dracmas por 1 Favor, ou pagar ${RULES.delphiCycle} para comprar 2 e descartar 2`, onPass: [], onStop: [{ k: 'delphi' }] },
  tartaro: { name: 'Tártaro', pass: '', stop: 'Entrada comum, sem prisão. A prisão exige condenação.', onPass: [], onStop: [] },
};

/** Bifurcações: origem → atalho (a saída normal é sempre a casa seguinte). */
export const SHORTCUTS: Record<number, number> = { 6: 32, 22: 48, 38: 64, 54: 80, 70: 0, 86: 16 };

/**
 * Retornos: origem → casa da volta externa, no mesmo ângulo da espiral. Cada um fecha um anel de
 * 27 passos, de modo que o jogador pode dar voltas no mapa em vez de ser levado sempre ao centro.
 * As casas de origem mantêm o tipo e os efeitos; só ganham uma segunda saída.
 */
export const RETURNS: Record<number, number> = { 28: 2, 39: 13, 60: 34, 71: 45, 84: 58, 92: 66 };

/** Monta o mapa e rejeita duplicações ou lacunas na tabela de tipos. */
export function buildBoard(typeIds: Partial<Record<HouseType, number[]>> = TYPE_IDS): BoardNode[] {
  const types = new Array<HouseType | undefined>(NODE_COUNT).fill(undefined);
  for (const [type, ids] of Object.entries(typeIds) as [HouseType, number[]][]) {
    for (const id of ids) {
      if (!Number.isInteger(id) || id < 0 || id >= NODE_COUNT) throw new Error(`Casa ${id} fora do intervalo 00–95.`);
      if (types[id] !== undefined) throw new Error(`Casa ${id} duplicada (${types[id]} e ${type}).`);
      types[id] = type;
    }
  }
  return types.map((type, id) => {
    if (type === undefined) throw new Error(`Casa ${id} sem tipo.`);
    // Espiral de 26 casas por volta: cada atalho liga uma volta à seguinte, no mesmo ângulo.
    const angle = (id * (360 / 26) - 90) * (Math.PI / 180);
    const radius = 452 - id * (258 / 95);
    const next = [(id + 1) % NODE_COUNT];
    if (id in SHORTCUTS) next.push(SHORTCUTS[id]);
    if (id in RETURNS) next.push(RETURNS[id]);
    return {
      id,
      region: Math.floor(id / 8),
      type,
      next,
      position: { x: Math.round(radius * Math.cos(angle) * 10) / 10, y: Math.round(radius * Math.sin(angle) * 8.6) / 10 },
      elevation: Math.floor(id / 26),
      onPass: HOUSES[type].onPass,
      onStop: HOUSES[type].onStop,
    };
  });
}

export const NODES: BoardNode[] = buildBoard();
export const templeOf = (region: number): number => region * 8 + 3;
export const COMMON: number[] = TYPE_IDS.comum;

/** Destinos alcançáveis com exatamente `steps` passos, com o caminho de cada um. */
export function reach(from: number, steps: number): Map<number, number[]> {
  const found = new Map<number, number[]>();
  const walk = (node: number, left: number, path: number[]): void => {
    if (left === 0) {
      if (!found.has(node)) found.set(node, path);
      return;
    }
    for (const n of NODES[node].next) walk(n, left - 1, [...path, n]);
  };
  walk(from, steps, []);
  return found;
}

/** DIST[a][b] = menor número de passos de a até b. */
export const DIST: number[][] = NODES.map((start) => {
  const dist = new Array<number>(NODE_COUNT).fill(Infinity);
  dist[start.id] = 0;
  const queue = [start.id];
  for (let i = 0; i < queue.length; i++) {
    for (const n of NODES[queue[i]].next) {
      if (dist[n] === Infinity) {
        dist[n] = dist[queue[i]] + 1;
        queue.push(n);
      }
    }
  }
  return dist;
});
