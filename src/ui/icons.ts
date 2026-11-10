import type { HouseType } from '../engine/types';

/** Ícones das casas, desenhados numa caixa de ±10 em torno da origem. */
const PATHS: Record<Exclude<HouseType, 'templo'>, string> = {
  oferenda: '<path d="M-4,-9h8M-3,-9C-3,-5 -8,-3 -7,3C-6,8 6,8 7,3C8,-3 3,-5 3,-9M-3,8.5h6"/>',
  tributo: '<circle r="8"/><path d="M-4,0h8"/>',
  nemesis: '<path d="M0,-9v17M-5,8h10M-8,-6h16M-8,-6l-2,7h4zM8,-6l-2,7h4z"/>',
  moiras: '<path d="M-6,-8h12L-6,8h12Z"/>',
  fortuna:
    '<rect x="-8" y="-8" width="16" height="16" rx="3"/><circle r="1.4" class="dot"/><circle cx="-4" cy="-4" r="1.4" class="dot"/><circle cx="4" cy="4" r="1.4" class="dot"/><circle cx="4" cy="-4" r="1.4" class="dot"/><circle cx="-4" cy="4" r="1.4" class="dot"/>',
  visao: '<path d="M-10,0C-5,-8 5,-8 10,0C5,8 -5,8 -10,0Z"/><circle r="3"/>',
  purificacao: '<path d="M-9,-5q4.5,-5 9,0t9,0M-9,1q4.5,-5 9,0t9,0M-9,7q4.5,-5 9,0t9,0"/>',
  tentacao: '<path d="M0,-10C7,-3 8,2 6,6C4,10 -4,10 -6,6C-8,2 -5,-1 -3,-4C-2,-1 0,0 0,-10Z"/>',
  iris: '<path d="M-10,7a10,10 0 0 1 20,0M-6.5,7a6.5,6.5 0 0 1 13,0M-3,7a3,3 0 0 1 6,0"/>',
  duelo: '<path d="M-8,-8L7,7M8,-8L-7,7M-9,3l5,5M9,3l-5,5"/>',
};

export function houseIcon(type: HouseType): string {
  return type === 'templo' ? '' : `<g class="icon">${PATHS[type]}</g>`;
}

export function iconSvg(type: HouseType, size = 22): string {
  return `<svg class="house-chip" viewBox="-14 -14 28 28" width="${size}" height="${size}"><circle r="13"/>${houseIcon(type)}</svg>`;
}
