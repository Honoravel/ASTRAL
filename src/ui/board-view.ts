import { HOUSE_INFO, NODES, SHORTCUTS } from '../engine/board';
import { GODS } from '../engine/data';
import type { BoardNode, GameState } from '../engine/types';
import { houseIcon } from './icons';

export const PLAYER_COLORS = ['#f4e7c3', '#35a3b5', '#e8b923', '#c2416d'];
export const ABBR = ['ZEU', 'HER', 'APO', 'ÁRT', 'ATE', 'ARE', 'HEF', 'DIO', 'HRM', 'DEM', 'AFR', 'POS'];

const radiusOf = (n: BoardNode): number => (n.type === 'templo' ? 21 : 15);
const pad = (id: number): string => String(id).padStart(2, '0');

function link(a: BoardNode, b: BoardNode, cls: string): string {
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  const x1 = a.position.x + ux * radiusOf(a);
  const y1 = a.position.y + uy * radiusOf(a);
  const x2 = b.position.x - ux * (radiusOf(b) + 6);
  const y2 = b.position.y - uy * (radiusOf(b) + 6);
  return `<line class="${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" marker-end="url(#arrow-${cls.split(' ')[0]})"/>`;
}

function bands(): string {
  let out = '';
  for (let r = 0; r < 12; r++) {
    const ids = Array.from({ length: 8 }, (_, k) => r * 8 + k);
    if (r < 11) ids.push(r * 8 + 8);
    const d = ids.map((id, i) => `${i ? 'L' : 'M'}${NODES[id].position.x},${NODES[id].position.y}`).join('');
    out += `<path class="band ${r % 2 ? 'alt' : ''}" d="${d}"/>`;
  }
  return out;
}

function links(): string {
  let out = '';
  for (const a of NODES) {
    const b = NODES[a.next[0]];
    out += link(a, b, a.id === 95 ? 'far' : 'trail');
    const s = SHORTCUTS[a.id];
    if (s !== undefined) out += link(a, NODES[s], s > a.id ? 'shortcut' : 'far');
  }
  return out;
}

function nodes(): string {
  let out = '';
  for (const n of NODES) {
    const info = HOUSE_INFO[n.type];
    const god = GODS[n.region];
    const title =
      n.type === 'templo'
        ? `Casa ${pad(n.id)} · Templo de ${god.name} — Ação: ${god.action.label}. Relíquia: ${god.relic.name}.`
        : `Casa ${pad(n.id)} · ${info.name} (região de ${god.name}) — ${info.text}`;
    const body =
      n.type === 'templo'
        ? `<circle r="21"/><circle class="ring" r="16.5"/><text class="abbr" y="4">${ABBR[n.region]}</text>`
        : `<circle r="15"/>${n.type === 'comum' ? `<text class="num" y="4">${pad(n.id)}</text>` : houseIcon(n.type)}`;
    out += `<g class="node ${n.type}" data-node="${n.id}" transform="translate(${n.position.x},${n.position.y})"><title>${title}</title>${body}</g>`;
  }
  return out;
}

export function boardSvg(): string {
  const marker = (id: string): string =>
    `<marker id="arrow-${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0L10,5L0,10Z"/></marker>`;
  return `<svg id="board" viewBox="-500 -432 1000 864" role="img" aria-label="Mapa do Olimpo">
    <defs>${marker('trail')}${marker('shortcut')}${marker('far')}</defs>
    <ellipse class="plate-edge" rx="498" ry="430"/>
    <ellipse class="plate" rx="486" ry="418"/>
    <ellipse class="plate-line" rx="478" ry="410"/>
    ${bands()}
    <g>${links()}</g>
    <g class="summit">
      <ellipse class="summit-disc" rx="122" ry="104"/>
      <ellipse class="summit-ring" rx="113" ry="95"/>
      <path class="pediment" d="M-34,-44L0,-64L34,-44ZM-30,-40h60M-26,-40v0M-30,-22h60M-24,-40v18M-8,-40v18M8,-40v18M24,-40v18"/>
      <text class="summit-title" y="2">OLIMPO</text>
      <text id="summit-round" class="summit-info" y="28"></text>
      <text id="summit-oracle" class="summit-info" y="50"></text>
      <text id="summit-next" class="summit-small" y="70"></text>
    </g>
    <g>${nodes()}</g>
    <g id="highlights"></g>
    <g id="tokens"></g>
  </svg>`;
}

const OFFSETS = [[-9, -9], [9, -9], [-9, 9], [9, 9]];

export function updateTokens(svg: SVGSVGElement, state: GameState): void {
  const layer = svg.querySelector('#tokens')!;
  if (layer.childElementCount !== state.players.length) {
    layer.innerHTML = state.players
      .map((p) => `<g class="token" data-player="${p.id}"><circle class="halo" r="13"/><circle class="disc" r="9" fill="${PLAYER_COLORS[p.id]}"/><title>${p.name}</title></g>`)
      .join('');
  }
  const actor = state.pending ? state.pending.player : state.current;
  layer.querySelectorAll<SVGGElement>('.token').forEach((el) => {
    const p = state.players[Number(el.dataset.player)];
    const pos = NODES[p.pos].position;
    el.style.transform = `translate(${pos.x + OFFSETS[p.id][0]}px, ${pos.y + OFFSETS[p.id][1]}px)`;
    el.classList.toggle('active', p.id === actor && state.phase !== 'GAME_OVER');
    el.classList.toggle('jailed', p.jailed);
  });
}

export function showHighlights(svg: SVGSVGElement, dests: number[], onPick: (dest: number) => void): void {
  const layer = svg.querySelector('#highlights')!;
  layer.innerHTML = dests
    .map((id) => {
      const n = NODES[id];
      return `<circle class="dest" data-node="${id}" cx="${n.position.x}" cy="${n.position.y}" r="${radiusOf(n) + 7}"><title>Casa ${pad(id)}</title></circle>`;
    })
    .join('');
  layer.querySelectorAll<SVGCircleElement>('.dest').forEach((el) => el.addEventListener('click', () => onPick(Number(el.dataset.node))));
}
