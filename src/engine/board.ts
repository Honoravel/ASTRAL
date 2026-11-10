import type { BoardNode, HouseType } from './types';

export const NODE_COUNT = 96;
export const TARTARUS = 52;
export const DELPHI = 68;

/** Tipos e IDs de casas — fonte de verdade da especificação v1.5. */
const TYPE_IDS: Record<HouseType, number[]> = {
  comum: [0, 2, 5, 9, 13, 18, 21, 24, 28, 32, 37, 40, 42, 47, 50, 57, 60, 63, 66, 72, 77, 79, 80, 81, 85, 87, 89, 90, 92, 95],
  dracmas: [1, 12, 20, 31, 39, 49, 58, 71, 78, 84, 88, 94],
  favor: [4, 16, 23, 34, 41, 55, 61, 74],
  gloria: [7, 15, 25, 33, 44, 53, 64, 73],
  evento: [8, 17, 26, 36, 45, 56, 65, 76],
  destino: [10, 29, 48, 69, 82, 93],
  nemesis: [14, 30, 46, 62],
  bifurcacao: [6, 22, 38, 54, 70, 86],
  templo: [3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91],
  delfos: [DELPHI],
  tartaro: [TARTARUS],
};

/** Bifurcações: origem → atalho (a saída normal é sempre a casa seguinte). */
export const SHORTCUTS: Record<number, number> = { 6: 32, 22: 48, 38: 64, 54: 80, 70: 0, 86: 16 };

/** Monta o mapa e rejeita duplicações ou lacunas na tabela de tipos. */
export function buildBoard(typeIds: Record<HouseType, number[]> = TYPE_IDS): BoardNode[] {
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
    return {
      id,
      region: Math.floor(id / 8),
      type,
      next,
      position: { x: Math.round(radius * Math.cos(angle) * 10) / 10, y: Math.round(radius * Math.sin(angle) * 8.6) / 10 },
      elevation: Math.floor(id / 26),
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

export const HOUSE_INFO: Record<HouseType, { name: string; text: string }> = {
  comum: { name: 'Comum', text: 'Sem efeito.' },
  dracmas: { name: 'Dracmas', text: 'Ganhe 2 Dracmas.' },
  favor: { name: 'Favor', text: 'Ganhe 1 Favor.' },
  gloria: { name: 'Glória', text: 'Ganhe 1 Glória.' },
  evento: { name: 'Evento', text: 'Role 1d6: 1 −2 Dracmas · 2 +1 Húbris · 3 +2 Dracmas · 4 compre 1 carta · 5 +1 Favor · 6 +1 Glória.' },
  destino: { name: 'Destino', text: 'Revele um Arcano Maior.' },
  nemesis: { name: 'Nêmesis', text: 'Húbris 0–1: nada · 2–3: perde até 2 Dracmas · 4–5: paga 4 Dracmas ou Tártaro · 6+: Tártaro.' },
  bifurcacao: { name: 'Bifurcação', text: 'Sem efeito ao parar. Ao sair, escolha a saída normal ou o atalho.' },
  templo: { name: 'Templo', text: 'Ao chegar: ação do templo, comprar a relíquia ou nada. Cartas elementais e divinas são jogadas aqui.' },
  delfos: { name: 'Delfos', text: 'Veja 2 cartas do Destino, ou pague 2 Dracmas por 1 Favor, ou pague 3 para comprar 2 e descartar 2.' },
  tartaro: { name: 'Tártaro', text: 'Prisão dos condenados. Parar aqui por movimento não tem efeito.' },
};
