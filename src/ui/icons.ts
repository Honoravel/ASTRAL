import type { HouseType } from '../engine/types';

const STAR4 = 'M0,-9L2.2,-2.2L9,0L2.2,2.2L0,9L-2.2,2.2L-9,0L-2.2,-2.2Z';

/** Símbolos das casas (v1.6), desenhados numa caixa de ±9 em torno da origem. */
const PATHS: Partial<Record<HouseType, string>> = {
  dracmas: '<path d="M0,-9L9,0L0,9L-9,0Z"/><path class="solid" d="M0,-4L4,0L0,4L-4,0Z"/>',
  pedagio: '<path class="thick" d="M-7,0h14"/>',
  favor: `<path class="solid" d="${STAR4}"/>`,
  gloria: '<path class="solid" d="M0,-9L2.2,-3L8.6,-2.8L3.6,1.2L5.3,7.3L0,3.8L-5.3,7.3L-3.6,1.2L-8.6,-2.8L-2.2,-3Z"/>',
  provacao: '<text class="sym" y="6">!</text>',
  destino: '<text class="sym" y="6">?</text>',
  nemesis: '<path d="M0,-8v15M-4,7h8M-7,-5h14M-7,-5l-2,6h4zM7,-5l-2,6h4z"/>',
  bifurcacao: '<path d="M0,8V1M0,1L-6,-7M0,1L6,-7M-6,-7h4M-6,-7v4M6,-7h-4M6,-7v4"/>',
  evento: `<path d="${STAR4}"/>`,
  altar: '<circle cy="-4.2" r="3.4"/><circle cx="-4.4" cy="1.6" r="3.4"/><circle cx="4.4" cy="1.6" r="3.4"/><path d="M0,3L-2,9h4Z"/>',
  tesouro: '<path class="solid" d="M0,-8.5L8.5,0L0,8.5L-8.5,0Z"/>',
  delfos: '<path d="M-9,0C-5,-7 5,-7 9,0C5,7 -5,7 -9,0Z"/><circle r="2.6"/>',
  tartaro: '<path d="M0,-9C6,-3 7,2 5,5.5C3,9 -3,9 -5,5.5C-7,2 -4,-1 -2.5,-3.5C-2,-1 0,0 0,-9Z"/>',
};

export const houseIcon = (type: HouseType): string => (PATHS[type] ? `<g class="icon">${PATHS[type]}</g>` : '');

export function iconSvg(type: HouseType, label = ''): string {
  return `<svg class="house-chip ${type}" viewBox="-13 -13 26 26" width="24" height="24"><circle r="12"/>${houseIcon(type)}${label ? `<text class="num" y="3.5">${label}</text>` : ''}</svg>`;
}
