import { aiStep } from '../engine/ai';
import { HOUSE_INFO, NODES } from '../engine/board';
import { cardName, CARDS, cardText } from '../engine/cards';
import { DESTINIES } from '../engine/destiny';
import { canPlay, costFor, currentPlayer, jailChoice, moveOptions, moveWithCard, newGame, pass, playCard, RULES } from '../engine/game';
import { ELEMENT_NAME, ELEMENT_SUIT, glyph, SIGNS } from '../engine/signs';
import type { GameState, HouseType, Player, PlayerConfig } from '../engine/types';
import { boardSvg, PLAYER_COLORS, showHighlights, updateTokens } from './board-view';
import { iconSvg } from './icons';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const AI_DELAY = 950;

let game: GameState;
let selected: number | null = null;
let lastHuman = 0;
let aiTimer: number | undefined;

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// ---------- Tela inicial ----------

type SeatKind = 'human' | 'ai' | 'off';
const seats: { kind: SeatKind; name: string; sign: number }[] = [
  { kind: 'human', name: 'Você', sign: 4 },
  { kind: 'ai', name: 'Cassandra', sign: 0 },
  { kind: 'ai', name: 'Orfeu', sign: 7 },
  { kind: 'off', name: 'Medeia', sign: 10 },
];

function renderSetup(): void {
  window.clearTimeout(aiTimer);
  const signOptions = (current: number): string =>
    SIGNS.map((s, i) => `<option value="${i}" ${i === current ? 'selected' : ''}>${glyph(i)} ${s.name} — ${s.god} (${ELEMENT_NAME[s.element]})</option>`).join('');
  app.innerHTML = `
    <div class="setup">
      <h1>ASTRAL</h1>
      <p class="tagline">Doze deuses, doze signos, um só lugar no Olimpo.</p>
      <div class="seats">
        ${seats
          .map(
            (s, i) => `
          <div class="seat ${s.kind === 'off' ? 'off' : ''}">
            <span class="swatch" style="background:${PLAYER_COLORS[i]}"></span>
            <select data-seat="${i}" data-field="kind" aria-label="Tipo do jogador ${i + 1}">
              <option value="human" ${s.kind === 'human' ? 'selected' : ''}>Humano</option>
              <option value="ai" ${s.kind === 'ai' ? 'selected' : ''}>IA</option>
              ${i >= 2 ? `<option value="off" ${s.kind === 'off' ? 'selected' : ''}>Vazio</option>` : ''}
            </select>
            <input data-seat="${i}" data-field="name" value="${esc(s.name)}" maxlength="14" aria-label="Nome do jogador ${i + 1}" />
            <select data-seat="${i}" data-field="sign" aria-label="Signo do jogador ${i + 1}">${signOptions(s.sign)}</select>
          </div>`,
          )
          .join('')}
      </div>
      <p class="hint">O signo define o deus patrono (onde você começa e ganha Favor) e o elemento: cartas do naipe do seu elemento custam 1 dracma a menos.</p>
      <button id="start" class="primary">Começar a ascensão</button>
      <details class="rules">
        <summary>Como jogar</summary>
        <ol>
          <li>No seu turno, descarte uma carta para andar <b>exatamente</b> o valor de movimento dela. As trilhas têm sentido fixo; nas bifurcações você escolhe o caminho.</li>
          <li>A casa onde você para tem um efeito (veja a legenda).</li>
          <li>Se parar em um <b>templo</b>, pode jogar uma carta daquele deus pagando o custo em dracmas.</li>
          <li>Cartas fortes dão <b>Húbris</b>. Nas casas de <b>Nêmesis</b>, um dado ≤ sua Húbris manda você ao Tártaro.</li>
          <li>Vence quem primeiro chegar a <b>${RULES.goal} de Glória</b>.</li>
        </ol>
      </details>
    </div>`;
  app.querySelectorAll<HTMLSelectElement | HTMLInputElement>('[data-seat]').forEach((el) => {
    el.addEventListener('change', () => {
      const seat = seats[Number(el.dataset.seat)];
      if (el.dataset.field === 'kind') seat.kind = el.value as SeatKind;
      else if (el.dataset.field === 'sign') seat.sign = Number(el.value);
      else seat.name = el.value.trim() || seat.name;
      if (el.dataset.field === 'kind') renderSetup();
    });
  });
  app.querySelector('#start')!.addEventListener('click', () => {
    const configs: PlayerConfig[] = seats.filter((s) => s.kind !== 'off').map((s) => ({ name: s.name, sign: s.sign, isAI: s.kind === 'ai' }));
    game = newGame(configs);
    selected = null;
    lastHuman = Math.max(0, configs.findIndex((c) => !c.isAI));
    renderGame();
  });
}

// ---------- Partida ----------

const LEGEND: HouseType[] = ['oferenda', 'tributo', 'nemesis', 'moiras', 'fortuna', 'visao', 'purificacao', 'tentacao', 'iris', 'duelo'];

function renderGame(): void {
  app.innerHTML = `
    <div class="game">
      <aside class="panel left">
        <header><h1>ASTRAL</h1><span id="round"></span></header>
        <div id="players"></div>
        <h2>Casas</h2>
        <ul class="legend">
          <li><span class="temple-chip">${glyph(0)}</span><div><b>Templo</b> ${HOUSE_INFO.templo.text}</div></li>
          ${LEGEND.map((t) => `<li>${iconSvg(t)}<div><b>${HOUSE_INFO[t].name}</b> ${HOUSE_INFO[t].text}</div></li>`).join('')}
        </ul>
        <button id="quit" class="ghost">Abandonar partida</button>
      </aside>
      <main class="board-wrap">${boardSvg()}</main>
      <aside class="panel right">
        <div id="hand"></div>
        <div id="destiny"></div>
        <h2>Crônica</h2>
        <ol id="log"></ol>
      </aside>
      <div id="overlay" hidden></div>
    </div>`;
  app.querySelector('#quit')!.addEventListener('click', renderSetup);
  update();
}

function viewer(): Player {
  const p = currentPlayer(game);
  if (!p.isAI) lastHuman = p.id;
  return game.players[lastHuman].isAI ? p : game.players[lastHuman];
}

function playersHtml(): string {
  return game.players
    .map((p) => {
      const sign = SIGNS[p.sign];
      const active = p.id === game.current && game.phase !== 'over';
      return `
      <div class="player ${active ? 'active' : ''}">
        <div class="player-head">
          <span class="swatch" style="background:${PLAYER_COLORS[p.id]}"></span>
          <b>${esc(p.name)}</b>${p.isAI ? '<span class="tag">IA</span>' : ''}${p.jail > 0 ? `<span class="tag jail">Tártaro ${p.jail}</span>` : ''}
        </div>
        <div class="player-sign">${glyph(p.sign)} ${sign.name} · ${sign.god} · ${ELEMENT_NAME[sign.element]}</div>
        <div class="glory" title="Glória"><span style="width:${Math.min(100, (p.gloria / game.goal) * 100)}%"></span><em>Glória ${p.gloria}/${game.goal}</em></div>
        <dl>
          <div><dt>Dracmas</dt><dd>${p.dracmas}</dd></div>
          <div><dt>Favor</dt><dd>${p.favor}</dd></div>
          <div class="${p.hubris >= 3 ? 'warn' : ''}"><dt>Húbris</dt><dd>${p.hubris}</dd></div>
          <div><dt>Cartas</dt><dd>${p.hand.length}</dd></div>
        </dl>
      </div>`;
    })
    .join('');
}

function handHtml(v: Player, myTurn: boolean): string {
  const p = currentPlayer(game);
  let hint = '';
  let buttons = '';
  if (game.phase === 'over') hint = 'A partida terminou.';
  else if (!myTurn) hint = `Vez de ${esc(p.name)}…`;
  else if (game.phase === 'jail') {
    hint = `Você está no Tártaro (${p.jail} turno${p.jail > 1 ? 's' : ''} de pena).`;
    buttons = `<button data-act="pay" class="primary" ${p.dracmas < RULES.bail ? 'disabled' : ''}>Pagar fiança (${RULES.bail} dracmas)</button><button data-act="serve">Cumprir pena</button>`;
  } else if (game.phase === 'move') {
    hint = selected === null ? 'Escolha uma carta para andar.' : 'Agora escolha o destino destacado no mapa.';
  } else {
    hint = `Você está no Templo de ${SIGNS[NODES[p.pos].sector].god}: jogue uma carta ou passe.`;
    buttons = '<button data-act="pass">Passar a vez</button>';
  }
  const suit = ELEMENT_SUIT[SIGNS[v.sign].element];
  const cards = v.hand
    .map((id) => {
      const c = CARDS[id];
      const cost = costFor(v, c);
      const playable = myTurn && canPlay(game, v, id);
      const cls = ['card', id === selected ? 'selected' : '', playable ? 'playable' : '', myTurn && game.phase === 'move' ? 'movable' : ''].join(' ');
      return `
      <div class="${cls}" data-card="${id}">
        <div class="card-top"><span class="mv" title="Movimento">${c.move}</span><span class="rank">${cardName(c)}</span><span class="cost ${c.suit === suit ? 'discount' : ''}" title="Custo em dracmas">${cost}</span></div>
        <div class="card-title">${c.title}</div>
        <div class="card-god">${glyph(c.sector)} Templo de ${SIGNS[c.sector].god}</div>
        <div class="card-text">${cardText(c)}</div>
        ${playable ? `<button data-play="${id}" class="primary">Jogar</button>` : ''}
      </div>`;
    })
    .join('');
  return `<h2>Mão de ${esc(v.name)}</h2><p class="hint">${hint}</p><div class="buttons">${buttons}</div><div class="cards">${cards}</div>`;
}

function update(): void {
  const svg = app.querySelector<SVGSVGElement>('#board')!;
  const p = currentPlayer(game);
  const v = viewer();
  const myTurn = game.phase !== 'over' && !p.isAI && v.id === p.id;
  if (!myTurn || game.phase !== 'move') selected = null;

  app.querySelector('#round')!.textContent = `Rodada ${game.round}`;
  app.querySelector('#players')!.innerHTML = playersHtml();
  app.querySelector('#hand')!.innerHTML = handHtml(v, myTurn);
  const destiny = game.lastDestiny === null ? null : DESTINIES[game.lastDestiny];
  app.querySelector('#destiny')!.innerHTML = destiny
    ? `<div class="destiny"><span>${destiny.numeral}</span><div><b>${destiny.name}</b>${destiny.text}</div></div>`
    : '';
  const log = app.querySelector('#log')!;
  log.innerHTML = game.log
    .slice(-40)
    .map((e) => `<li>${e.player === null ? '' : `<span class="swatch" style="background:${PLAYER_COLORS[e.player]}"></span>`}${esc(e.text)}</li>`)
    .join('');
  log.scrollTop = log.scrollHeight;

  updateTokens(svg, game);
  const dests = selected !== null ? [...moveOptions(game, selected).keys()] : [];
  showHighlights(svg, dests, (dest) => {
    moveWithCard(game, selected!, dest);
    selected = null;
    update();
  });

  app.querySelectorAll<HTMLElement>('.card.movable').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number(el.dataset.card);
      selected = selected === id ? null : id;
      update();
    });
  });
  app.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      playCard(game, Number(el.dataset.play));
      update();
    });
  });
  app.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.dataset.act === 'pass') pass(game);
      else jailChoice(game, el.dataset.act as 'pay' | 'serve');
      update();
    });
  });

  const overlay = app.querySelector<HTMLDivElement>('#overlay')!;
  if (game.phase === 'over' && game.winner !== null) {
    const w = game.players[game.winner];
    overlay.hidden = false;
    overlay.innerHTML = `<div class="victory"><div class="big">${glyph(w.sign)}</div><h2>${esc(w.name)} ascendeu ao Olimpo</h2><p>${w.gloria} de Glória em ${game.round} rodadas, sob a proteção de ${SIGNS[w.sign].god}.</p><button id="again" class="primary">Nova partida</button></div>`;
    overlay.querySelector('#again')!.addEventListener('click', renderSetup);
  }

  window.clearTimeout(aiTimer);
  if (game.phase !== 'over' && currentPlayer(game).isAI) {
    aiTimer = window.setTimeout(() => {
      aiStep(game);
      update();
    }, AI_DELAY);
  }
}

renderSetup();
