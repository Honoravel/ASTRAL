import { HOUSE_INFO, NODES, SECTORS } from '../engine/board';
import { glyph, SIGNS } from '../engine/signs';
import type { BoardNode, GameState } from '../engine/types';
import { houseIcon } from './icons';

export const PLAYER_COLORS = ['#f4e7c3', '#2f8c9c', '#e0ad1e', '#a8325a'];

const radiusOf = (n: BoardNode): number => (n.type === 'templo' ? 27 : 17);

function point(radius: number, degrees: number): string {
  const a = ((degrees - 90) * Math.PI) / 180;
  return `${(radius * Math.cos(a)).toFixed(1)},${(radius * Math.sin(a)).toFixed(1)}`;
}

function meander(): string {
  const unit = 'M-9,9V-7H7V5H-3V-1H2';
  let out = '';
  for (let i = 0; i < 80; i++) out += `<path transform="rotate(${i * 4.5}) translate(0,-483)" d="${unit}"/>`;
  return `<g class="meander">${out}</g>`;
}

function wedges(): string {
  let out = '';
  for (let s = 0; s < SECTORS; s++) {
    const a = s * 30 - 15;
    const b = s * 30 + 15;
    out += `<path class="wedge ${s % 2 ? 'alt' : ''}" d="M${point(150, a)}L${point(468, a)}A468,468 0 0 1 ${point(468, b)}L${point(150, b)}A150,150 0 0 0 ${point(150, a)}Z"/>`;
    const flip = s > 3 && s < 9;
    const label = `${glyph(s)} ${SIGNS[s].god.toUpperCase()}`;
    out += flip
      ? `<text class="rim" transform="rotate(${s * 30 + 180}) translate(0,453)">${label}</text>`
      : `<text class="rim" transform="rotate(${s * 30}) translate(0,-441)">${label}</text>`;
  }
  return out;
}

function edges(): string {
  let out = '';
  for (const a of NODES) {
    for (const id of a.next) {
      const b = NODES[id];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const x1 = a.x + ux * radiusOf(a);
      const y1 = a.y + uy * radiusOf(a);
      const x2 = b.x - ux * (radiusOf(b) + 7);
      const y2 = b.y - uy * (radiusOf(b) + 7);
      out += `<line class="trail" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" marker-end="url(#arrow)"/>`;
    }
  }
  return out;
}

function nodes(): string {
  let out = '';
  for (const n of NODES) {
    const info = HOUSE_INFO[n.type];
    const sign = SIGNS[n.sector];
    const title = n.type === 'templo' ? `Templo de ${sign.god} (${sign.name}) — ${info.text}` : `${info.name} — ${info.text}`;
    const body =
      n.type === 'templo'
        ? `<circle r="27"/><circle class="ring" r="21.5"/><text class="temple-glyph" y="9">${glyph(n.sector)}</text>`
        : `<circle r="17"/>${houseIcon(n.type)}`;
    out += `<g class="node ${n.type}" transform="translate(${n.x},${n.y})"><title>${title}</title>${body}</g>`;
  }
  return out;
}

export function boardSvg(): string {
  return `<svg id="board" viewBox="-500 -500 1000 1000" role="img" aria-label="Mapa do Olimpo">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto"><path d="M0,0L10,5L0,10Z"/></marker></defs>
    <circle class="plate-edge" r="499"/>
    ${meander()}
    <circle class="plate" r="468"/>
    ${wedges()}
    <circle class="tartarus" r="150"/>
    <circle class="tartarus-ring" r="140"/>
    <text class="tartarus-label" y="-98">TÁRTARO</text>
    <g>${edges()}</g>
    <g>${nodes()}</g>
    <g id="highlights"></g>
    <g id="tokens"></g>
  </svg>`;
}

const TOKEN_OFFSETS = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
const JAIL_SPOTS = [[-45, -20], [45, -20], [-45, 45], [45, 45]];

export function tokenPosition(state: GameState, playerId: number): { x: number; y: number } {
  const p = state.players[playerId];
  if (p.jail > 0) return { x: JAIL_SPOTS[playerId][0], y: JAIL_SPOTS[playerId][1] };
  const n = NODES[p.pos];
  return { x: n.x + TOKEN_OFFSETS[playerId][0], y: n.y + TOKEN_OFFSETS[playerId][1] };
}

export function ensureTokens(svg: SVGSVGElement, state: GameState): void {
  const layer = svg.querySelector('#tokens')!;
  if (layer.childElementCount === state.players.length) return;
  layer.innerHTML = state.players
    .map((p) => `<g class="token" data-player="${p.id}"><circle class="halo" r="12.5"/><circle r="9.5" fill="${PLAYER_COLORS[p.id]}"/><title>${p.name}</title></g>`)
    .join('');
}

export function updateTokens(svg: SVGSVGElement, state: GameState): void {
  ensureTokens(svg, state);
  svg.querySelectorAll<SVGGElement>('.token').forEach((el) => {
    const id = Number(el.dataset.player);
    const { x, y } = tokenPosition(state, id);
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.classList.toggle('active', id === state.current && state.phase !== 'over');
  });
}

export function showHighlights(svg: SVGSVGElement, dests: number[], onPick: (dest: number) => void): void {
  const layer = svg.querySelector('#highlights')!;
  layer.innerHTML = dests
    .map((id) => {
      const n = NODES[id];
      return `<circle class="dest" data-node="${id}" cx="${n.x}" cy="${n.y}" r="${radiusOf(n) + 7}"/>`;
    })
    .join('');
  layer.querySelectorAll<SVGCircleElement>('.dest').forEach((el) => {
    el.addEventListener('click', () => onPick(Number(el.dataset.node)));
  });
}
