import type { HouseType } from '../engine/types';

/** Ícones das casas, desenhados numa caixa de ±9 em torno da origem. */
const PATHS: Partial<Record<HouseType, string>> = {
  dracmas: '<circle r="7.5"/><circle r="2.2" class="dot"/>',
  favor: '<path d="M0,-9L2.2,-2.2L9,0L2.2,2.2L0,9L-2.2,2.2L-9,0L-2.2,-2.2Z"/>',
  gloria: '<path d="M-8,6V-4L-4,1L0,-7L4,1L8,-4V6Z"/>',
  evento:
    '<rect x="-7.5" y="-7.5" width="15" height="15" rx="3"/><circle r="1.3" class="dot"/><circle cx="-3.8" cy="-3.8" r="1.3" class="dot"/><circle cx="3.8" cy="3.8" r="1.3" class="dot"/>',
  destino: '<path d="M-6,-8h12L-6,8h12Z"/>',
  nemesis: '<path d="M0,-8v15M-4,7h8M-7,-5h14M-7,-5l-2,6h4zM7,-5l-2,6h4z"/>',
  bifurcacao: '<path d="M0,8V1M0,1L-6,-7M0,1L6,-7M-6,-7h4M-6,-7v4M6,-7h-4M6,-7v4"/>',
  delfos: '<path d="M-9,0C-5,-7 5,-7 9,0C5,7 -5,7 -9,0Z"/><circle r="2.6"/>',
  tartaro: '<path d="M0,-9C6,-3 7,2 5,5.5C3,9 -3,9 -5,5.5C-7,2 -4,-1 -2.5,-3.5C-2,-1 0,0 0,-9Z"/>',
};

export const houseIcon = (type: HouseType): string => (PATHS[type] ? `<g class="icon">${PATHS[type]}</g>` : '');

export function iconSvg(type: HouseType, label = ''): string {
  return `<svg class="house-chip ${type}" viewBox="-13 -13 26 26" width="24" height="24"><circle r="12"/>${houseIcon(type)}${label ? `<text y="3.5">${label}</text>` : ''}</svg>`;
}
