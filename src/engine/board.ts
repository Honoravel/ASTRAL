import type { BoardNode, HouseType } from './types';

export const SECTORS = 12;
const R_OUTER = 408;
const R_TEMPLE = 322;
const R_INNER = 238;

/**
 * Casas de cada região: quatro no anel externo (sentido horário) e duas no
 * anel interno (sentido anti-horário). O templo fica entre os dois anéis.
 */
const LAYOUT: HouseType[][] = [
  ['oferenda', 'moiras', 'tributo', 'fortuna', 'nemesis', 'oferenda'],
  ['nemesis', 'oferenda', 'duelo', 'visao', 'oferenda', 'purificacao'],
  ['oferenda', 'fortuna', 'moiras', 'tributo', 'tentacao', 'duelo'],
  ['iris', 'oferenda', 'nemesis', 'oferenda', 'moiras', 'visao'],
  ['tributo', 'purificacao', 'oferenda', 'fortuna', 'oferenda', 'nemesis'],
  ['moiras', 'oferenda', 'visao', 'duelo', 'fortuna', 'tributo'],
  ['oferenda', 'nemesis', 'tributo', 'moiras', 'purificacao', 'oferenda'],
  ['fortuna', 'oferenda', 'duelo', 'purificacao', 'nemesis', 'tentacao'],
  ['oferenda', 'moiras', 'fortuna', 'tributo', 'visao', 'duelo'],
  ['iris', 'oferenda', 'nemesis', 'oferenda', 'oferenda', 'moiras'],
  ['tributo', 'visao', 'oferenda', 'fortuna', 'tentacao', 'purificacao'],
  ['nemesis', 'oferenda', 'purificacao', 'duelo', 'oferenda', 'tentacao'],
];

const OUTER_OFFSETS = [-11.25, -3.75, 3.75, 11.25];
const INNER_OFFSETS = [-7.5, 7.5];
const PER_SECTOR = 7;

export const outerId = (sector: number, k: number): number => sector * PER_SECTOR + k;
export const innerId = (sector: number, k: number): number => sector * PER_SECTOR + 4 + k;
export const templeId = (sector: number): number => sector * PER_SECTOR + 6;
/** Portão da região: onde o jogador reaparece ao sair do Tártaro. */
export const gateId = (sector: number): number => outerId(sector, 0);

function polar(radius: number, degrees: number): { x: number; y: number } {
  const a = ((degrees - 90) * Math.PI) / 180;
  return { x: Math.round(radius * Math.cos(a) * 10) / 10, y: Math.round(radius * Math.sin(a) * 10) / 10 };
}

function build(): BoardNode[] {
  const nodes: BoardNode[] = [];
  for (let s = 0; s < SECTORS; s++) {
    const center = s * 30;
    const nextSector = (s + 1) % SECTORS;
    const prevSector = (s + SECTORS - 1) % SECTORS;
    for (let k = 0; k < 4; k++) {
      const next = k < 3 ? [outerId(s, k + 1)] : [outerId(nextSector, 0)];
      if (k === 1) next.push(templeId(s));
      nodes.push({ id: outerId(s, k), type: LAYOUT[s][k], sector: s, ring: 'outer', ...polar(R_OUTER, center + OUTER_OFFSETS[k]), next });
    }
    for (let k = 0; k < 2; k++) {
      const next = k === 1 ? [innerId(s, 0), templeId(s)] : [innerId(prevSector, 1)];
      nodes.push({ id: innerId(s, k), type: LAYOUT[s][4 + k], sector: s, ring: 'inner', ...polar(R_INNER, center + INNER_OFFSETS[k]), next });
    }
    nodes.push({ id: templeId(s), type: 'templo', sector: s, ring: 'temple', ...polar(R_TEMPLE, center), next: [outerId(s, 2), innerId(s, 0)] });
  }
  return nodes;
}

export const NODES: BoardNode[] = build();

export const IRIS: number[] = NODES.filter((n) => n.type === 'iris').map((n) => n.id);

/** Destinos alcançáveis com exatamente `steps` passos, com um caminho para cada. */
export function reachable(from: number, steps: number): Map<number, number[]> {
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
  const dist = new Array<number>(NODES.length).fill(Infinity);
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
  templo: { name: 'Templo', text: 'Jogue uma carta deste deus. No templo do seu patrono: +1 Favor.' },
  oferenda: { name: 'Oferenda', text: 'Receba 3 dracmas.' },
  tributo: { name: 'Tributo', text: 'Pague 2 dracmas. Se não puder pagar tudo: +1 Húbris.' },
  nemesis: { name: 'Nêmesis', text: 'Role um dado: se o resultado for ≤ sua Húbris, você vai para o Tártaro (2 Favor compram a absolvição).' },
  moiras: { name: 'Moiras', text: 'Revele um Arcano Maior: o Destino afeta os jogadores.' },
  fortuna: { name: 'Fortuna', text: 'Role um dado: 1 +1 Húbris · 2 −2 dracmas · 3 +2 dracmas · 4 +3 dracmas · 5 +1 Favor · 6 +1 Glória.' },
  visao: { name: 'Visão', text: 'Compre 2 cartas.' },
  purificacao: { name: 'Purificação', text: 'Perca 2 de Húbris.' },
  tentacao: { name: 'Tentação', text: '+1 Glória e +2 Húbris.' },
  iris: { name: 'Ponte de Íris', text: 'Atravesse o arco-íris até a outra ponte.' },
  duelo: { name: 'Duelo', text: 'Você e o adversário mais rico rolam um dado: quem tirar mais toma 2 dracmas do outro.' },
};
