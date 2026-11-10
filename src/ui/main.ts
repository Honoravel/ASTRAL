import { aiStep } from '../engine/ai';
import { HOUSES, NODES } from '../engine/board';
import { cardName, CARDS, useLabel } from '../engine/cards';
import { AFFINITY, ELEMENT_NAME, glyph, GODS, SIGNS } from '../engine/data';
import { DESTINIES } from '../engine/destiny';
import { apply, canBuyRelic, canEffect, canUseSandals, costFor, deserialize, freePowers, moveOptions, newGame, RULES, serialize, votes } from '../engine/game';
import type { Answer, Command, FreePower, GameState, HouseType, Pending, Player, PlayerConfig } from '../engine/types';
import { boardSvg, PLAYER_COLORS, showHighlights, updateTokens } from './board-view';
import { iconSvg } from './icons';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const SAVE_KEY = 'ascensao-ao-olimpo-save';

let game: GameState;
let selected: number | null = null; // carta escolhida para mover
let sandals: -1 | 0 | 1 = 0;
let picks: number[] = []; // cartas marcadas num descarte
let order: number[] = []; // ordem atual numa reorganização
let orderFor: Pending | null = null;
let seenBy = -1; // último humano que confirmou estar com o dispositivo
let timer: number | undefined;

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const pad = (id: number): string => String(id).padStart(2, '0');

function store(action: 'get' | 'set' | 'clear', value = ''): string | null {
  try {
    if (action === 'get') return localStorage.getItem(SAVE_KEY);
    if (action === 'set') localStorage.setItem(SAVE_KEY, value);
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* armazenamento indisponível: o jogo segue sem salvar */
  }
  return null;
}

// ---------- Tela inicial ----------

type SeatKind = 'human' | 'ai' | 'off';
const seats: { kind: SeatKind; name: string; sign: number }[] = [
  { kind: 'human', name: 'Você', sign: 4 },
  { kind: 'ai', name: 'Cassandra', sign: 6 },
  { kind: 'ai', name: 'Orfeu', sign: 7 },
  { kind: 'off', name: 'Medeia', sign: 1 },
];

function renderSetup(): void {
  window.clearTimeout(timer);
  const saved = store('get');
  const signOptions = (current: number): string =>
    SIGNS.map((s, i) => `<option value="${i}" ${i === current ? 'selected' : ''}>${glyph(i)} ${s.name} · ${ELEMENT_NAME[s.element]} · patrono ${GODS[s.patron].name}</option>`).join('');
  app.innerHTML = `
    <div class="setup">
      <h1>Ascensão ao Olimpo</h1>
      <p class="tagline">Doze deuses, doze signos, vinte e dois arcanos. Um só lugar entre os imortais.</p>
      <div class="seats">
        ${seats.map((s, i) => `
          <div class="seat ${s.kind === 'off' ? 'off' : ''}">
            <span class="swatch" style="background:${PLAYER_COLORS[i]}"></span>
            <select data-seat="${i}" data-field="kind" aria-label="Tipo do jogador ${i + 1}">
              <option value="human" ${s.kind === 'human' ? 'selected' : ''}>Humano</option>
              <option value="ai" ${s.kind === 'ai' ? 'selected' : ''}>IA</option>
              ${i >= 2 ? `<option value="off" ${s.kind === 'off' ? 'selected' : ''}>Vazio</option>` : ''}
            </select>
            <input data-seat="${i}" data-field="name" value="${esc(s.name)}" maxlength="14" aria-label="Nome do jogador ${i + 1}" />
            <select data-seat="${i}" data-field="sign" aria-label="Signo do jogador ${i + 1}">${signOptions(s.sign)}</select>
          </div>`).join('')}
      </div>
      <p class="hint">O signo define o elemento (cartas do naipe correspondente custam 1 Dracma a menos) e o deus patrono, em cujo templo você começa.</p>
      <div class="setup-buttons">
        <button id="start" class="primary">Começar a ascensão</button>
        ${saved ? '<button id="resume">Continuar partida salva</button>' : ''}
      </div>
      <div class="rules-box">${rulesHtml()}</div>
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
    startGame();
  });
  app.querySelector('#resume')?.addEventListener('click', () => {
    try {
      game = deserialize(saved!);
      startGame();
    } catch {
      store('clear');
      renderSetup();
    }
  });
}

function rulesHtml(): string {
  const houses: HouseType[] = ['comum', 'dracmas', 'pedagio', 'tesouro', 'favor', 'altar', 'gloria', 'provacao', 'evento', 'destino', 'nemesis', 'bifurcacao', 'delfos', 'tartaro'];
  return `
    <h2>Como jogar</h2>
    <ol class="how">
      <li>Vence quem chegar primeiro a <b>${RULES.goal} de Glória</b>. No início do turno a mão volta a 6 cartas.</li>
      <li>Cada turno tem <b>uma ação principal</b>: <b>mover</b> (descarta a carta e anda exatamente o movimento dela), <b>usar o efeito</b> de uma carta (paga o custo e não se move), ou <b>comprar a relíquia</b> do templo onde está.</li>
      <li>Efeitos <b>universais</b> valem em qualquer casa; <b>elementais</b>, só em templo do elemento da carta; <b>divinos</b>, só no templo do deus indicado. Cartas com <b>afinidade</b> também valem no templo afim.</li>
      <li>O <b>caminho importa</b>: cada casa atravessada aplica seu efeito de <b>passagem</b> (ganhar ou pagar Dracmas, fiscalização de Nêmesis) e a última aplica só o efeito de <b>parada</b>. Ao <b>chegar</b> a um templo por movimento, escolha <b>uma</b> opção: ação principal, ação secundária, relíquia, efeito de uma carta permitida ali, ou nada. Ficar parado no templo não repete as ações.</li>
      <li>Ao parar em casa ocupada, você pode desafiar para um <b>duelo</b>: cada um aposta de 0 a 3 Favores em segredo.</li>
      <li>A cada ${RULES.electionEvery} rodadas há <b>eleição do Oráculo</b>: vence quem tiver mais Favor (o Favor não é gasto) e ganha 1 Glória.</li>
      <li><b>Húbris</b> é punida nas casas de Nêmesis, e quem encerra o turno com <b>${RULES.wrathHubris} ou mais</b> é condenado ao <b>Tártaro</b>, de onde se sai por Penitência, Suborno ou Pacto Sombrio.</li>
    </ol>
    <h2>Casas</h2>
    <table class="temples">
      <tr><th></th><th>Casa</th><th>Passagem</th><th>Parada</th></tr>
      ${houses.map((t) => `<tr><td>${iconSvg(t, t === 'comum' ? '00' : '')}</td><td><b>${HOUSES[t].name}</b></td><td>${HOUSES[t].pass || '—'}</td><td>${HOUSES[t].stop}</td></tr>`).join('')}
    </table>
    <h2>Templos e relíquias</h2>
    <table class="temples">
      <tr><th>Deus</th><th>Ação principal</th><th>Ação secundária</th><th>Relíquia</th><th>Cartas afins</th></tr>
      ${GODS.map((g, r) => `<tr><td><b>${g.name}</b><br><small>Casa ${pad(r * 8 + 3)} · ${ELEMENT_NAME[g.element]}</small></td><td><b>${g.primary.name}</b><br><small>${g.primary.text}</small></td><td><b>${g.secondary.name}</b><br><small>${g.secondary.text}</small></td><td>${g.relic.name} <small>(${g.relic.price})</small><br><small>${g.relic.text}</small></td><td><small>${AFFINITY[r].map((c) => cardName(CARDS[c])).join(', ')}</small></td></tr>`).join('')}
    </table>`;
}

// ---------- Partida ----------

function startGame(): void {
  selected = null;
  seenBy = -1;
  app.innerHTML = `
    <div class="game">
      <aside class="panel left">
        <header><h1>Ascensão ao Olimpo</h1></header>
        <div id="players"></div>
        <div class="left-buttons"><button id="help">Regras e casas</button><button id="quit" class="ghost">Sair</button></div>
      </aside>
      <main class="board-wrap">${boardSvg()}</main>
      <aside class="panel right">
        <div id="side"></div>
        <div id="destiny"></div>
        <h2>Crônica</h2>
        <ol id="log"></ol>
      </aside>
      <div id="overlay" hidden></div>
    </div>`;
  app.querySelector('#quit')!.addEventListener('click', renderSetup);
  app.querySelector('#help')!.addEventListener('click', () => {
    const overlay = app.querySelector<HTMLDivElement>('#overlay')!;
    overlay.hidden = false;
    overlay.innerHTML = `<div class="modal"><button id="close" class="primary">Fechar</button>${rulesHtml()}</div>`;
    overlay.querySelector('#close')!.addEventListener('click', () => (overlay.hidden = true));
  });
  update();
}

function send(cmd: Command): void {
  try {
    apply(game, cmd);
  } catch (e) {
    console.warn(e);
  }
  selected = null;
  sandals = 0;
  picks = [];
  update();
}
const answer = (value: Answer): void => send({ type: 'ANSWER', value });

const humans = (): Player[] => game.players.filter((p) => !p.isAI);
const actorId = (): number => (game.pending ? game.pending.player : game.current);

function playersHtml(): string {
  const actor = actorId();
  return game.players.map((p) => {
    const sign = SIGNS[p.sign];
    const tags = [
      p.isAI ? '<span class="tag">IA</span>' : '',
      game.oracle.holder === p.id ? '<span class="tag gold">Oráculo</span>' : '',
      p.jailed ? '<span class="tag red">Tártaro</span>' : '',
      p.shield ? '<span class="tag">Escudo</span>' : '',
      p.duelBonus ? `<span class="tag">Duelo +${p.duelBonus}</span>` : '',
      p.invest.forge ? `<span class="tag" title="Dracmas que a Forja ainda vai render">Forja ${p.invest.forge}</span>` : '',
      p.invest.harvest ? `<span class="tag" title="Rodadas restantes da Colheita">Colheita ${p.invest.harvest}</span>` : '',
    ].join('');
    const relics = p.relics.map((r) => `<span class="relic" title="${GODS[r].relic.text}">${GODS[r].relic.name}</span>`).join('');
    return `
      <div class="player ${p.id === actor && game.phase !== 'GAME_OVER' ? 'active' : ''}">
        <div class="player-head"><span class="swatch" style="background:${PLAYER_COLORS[p.id]}"></span><b>${esc(p.name)}</b>${tags}</div>
        <div class="player-sign">${glyph(p.sign)} ${sign.name} · ${ELEMENT_NAME[sign.element]} · ${GODS[sign.patron].name}</div>
        <div class="glory"><span style="width:${Math.min(100, (p.gloria / game.goal) * 100)}%"></span><em>Glória ${p.gloria}/${game.goal}</em></div>
        <dl>
          <div><dt>Dracmas</dt><dd>${p.dracmas}</dd></div>
          <div title="Votos na eleição: ${votes(p)}"><dt>Favor</dt><dd>${p.favor}</dd></div>
          <div class="${p.hubris >= 4 ? 'danger' : p.hubris >= 2 ? 'warn' : ''}"><dt>Húbris</dt><dd>${p.hubris}</dd></div>
          <div><dt>Cartas</dt><dd>${p.hand.length}</dd></div>
        </dl>
        ${relics ? `<div class="relics">${relics}</div>` : ''}
      </div>`;
  }).join('');
}

function affinityOf(id: number): string {
  const temples = AFFINITY.map((list, r) => (list.includes(id) ? GODS[r].name : '')).filter((n) => n && n !== (CARDS[id].god === null ? '' : GODS[CARDS[id].god!].name));
  return temples.length ? ` · afim: ${temples.join(', ')}` : '';
}

function cardHtml(id: number, viewer: Player, extra = '', cls = ''): string {
  const c = CARDS[id];
  const cost = costFor(viewer, c);
  return `
    <div class="card ${cls}" data-card="${id}">
      <div class="card-top"><span class="mv" title="Movimento">${c.move}</span><span class="rank">${cardName(c)}</span><span class="cost ${cost < c.cost ? 'discount' : ''}" title="Custo do efeito em Dracmas">${cost}</span></div>
      <div class="card-use use-${c.use}">${useLabel(c)}${affinityOf(id)}</div>
      <div class="card-text">${c.text}</div>
      ${extra}
    </div>`;
}

function destinyHtml(id: number): string {
  const d = DESTINIES[id];
  return `<div class="destiny"><span>${d.numeral}</span><div><b>${d.name}</b>${d.text}</div></div>`;
}

const POWER_LABEL: Record<FreePower, string> = {
  vision: 'Visão Profética (ver 3 do Destino)',
  weave: 'Tecelagem (reorganizar 3 do Destino, 2 Favores)',
  lira: 'Lira de Apolo (ver a próxima do Destino)',
  taca: 'Taça de Dionísio (−1 Húbris, +2 Dracmas)',
  raio: 'Raio de Zeus (+3 Glórias, +2 Húbris)',
};

function decisionHtml(pending: Pending, me: Player): string {
  let body = '';
  switch (pending.kind) {
    case 'choice':
      body = pending.options!.map((o, i) => `<button data-answer="${i}" ${o.disabled ? 'disabled' : ''}>${o.label}</button>`).join('');
      break;
    case 'target':
      body = pending.players!.map((id) => {
        const p = game.players[id];
        return `<button data-answer="${id}"><span class="swatch" style="background:${PLAYER_COLORS[id]}"></span> ${esc(p.name)} <small>${p.gloria} Glória · ${p.dracmas} Dracmas · ${p.favor} Favor</small></button>`;
      }).join('');
      break;
    case 'bid':
      body = `<div class="bids">${Array.from({ length: pending.max! + 1 }, (_, i) => `<button data-answer="${i}">${i}</button>`).join('')}</div><p class="hint">Os dois lances são revelados juntos e ambos são gastos.</p>`;
      break;
    case 'dest':
      body = '<p class="hint">Clique em uma das casas destacadas no mapa.</p>';
      break;
    case 'discard':
      body = `<div class="cards">${pending.cards!.map((id) => cardHtml(id, me, '', `pickable ${picks.includes(id) ? 'selected' : ''}`)).join('')}</div><button id="confirm" class="primary" ${picks.length >= (pending.min ?? pending.count!) && picks.length <= pending.count! ? '' : 'disabled'}>Confirmar (${picks.length}/${pending.count})</button>`;
      break;
    case 'pickCard':
      body = `<div class="cards">${pending.cards!.map((id) => cardHtml(id, me, '', 'pickable')).join('')}</div>`;
      break;
    case 'reorder':
    case 'view': {
      const can = pending.kind === 'reorder';
      const rows = order.map((id, i) => {
        const arrows = can ? `<span class="arrows"><button data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">▲</button><button data-down="${i}" ${i === order.length - 1 ? 'disabled' : ''} aria-label="Descer">▼</button></span>` : '';
        const content = pending.deck === 'destiny' ? destinyHtml(id) : `<div class="destiny"><span>${CARDS[id].move}</span><div><b>${cardName(CARDS[id])}</b>${CARDS[id].text}</div></div>`;
        return `<div class="peek-row">${arrows}${content}</div>`;
      }).join('');
      body = `${rows}<button id="confirm" class="primary">${can ? 'Confirmar ordem' : 'Entendi'}</button>`;
      break;
    }
  }
  return `<div class="decision"><h2>Decisão de ${esc(me.name)}</h2><p class="prompt">${esc(pending.prompt)}</p>${body}</div>`;
}

function actionHtml(p: Player): string {
  const node = NODES[p.pos];
  const here = node.type === 'templo' ? `Templo de ${GODS[node.region].name}` : `${HOUSES[node.type].name}, região de ${GODS[node.region].name}`;
  const buttons: string[] = [];
  if (node.type === 'templo') {
    const god = GODS[node.region];
    if (game.stock[node.region]) buttons.push(`<button data-cmd="BUY_RELIC" ${canBuyRelic(game) ? '' : 'disabled'} title="${god.relic.text}">Comprar ${god.relic.name} (${god.relic.price})</button>`);
  }
  for (const power of freePowers(game)) buttons.push(`<button data-power="${power}" class="free">${POWER_LABEL[power]}</button>`);
  buttons.push('<button data-cmd="END_TURN" class="ghost">Encerrar turno sem agir</button>');
  const sandalsUi = canUseSandals(game)
    ? `<div class="sandals">Sandálias de Hermes: ${([-1, 0, 1] as const).map((m) => `<button data-sandals="${m}" class="${sandals === m ? 'on' : ''}">${m > 0 ? '+1' : m < 0 ? '−1' : '0'}</button>`).join('')}</div>`
    : '';
  const hint = selected === null ? 'Clique em uma carta para mover, ou use um efeito.' : 'Escolha a rota abaixo ou clique no destino destacado no mapa.';
  const routes = selected === null ? '' : `<div class="routes">${[...moveOptions(game, selected, sandals)].map(([dest, path]) => {
    const passes = path.slice(0, -1).filter((n) => NODES[n].onPass.length > 0).map((n) => `${HOUSES[NODES[n].type].pass} <small>(${pad(n)})</small>`);
    const stop = NODES[dest].type === 'templo' ? `Templo de ${GODS[NODES[dest].region].name}` : HOUSES[NODES[dest].type].name;
    return `<button data-route="${dest}"><b>Casa ${pad(dest)} · ${stop}</b><small>Caminho: ${passes.length ? passes.join(' · ') : 'sem efeitos'}</small></button>`;
  }).join('')}</div>`;
  const cards = p.hand.map((id) => {
    const can = canEffect(game, id);
    return cardHtml(id, p, `<button data-effect="${id}" ${can ? 'class="primary"' : 'disabled'}>Usar efeito</button>`, `movable ${id === selected ? 'selected' : ''}`);
  }).join('');
  return `<h2>Turno de ${esc(p.name)}</h2><p class="where">Casa ${pad(p.pos)} · ${here}</p><p class="hint">${hint}</p>${sandalsUi}${routes}<div class="buttons">${buttons.join('')}</div><div class="cards">${cards}</div>`;
}

function sideHtml(): string {
  if (game.phase === 'GAME_OVER') return '<h2>Fim de partida</h2>';
  const actor = game.players[actorId()];
  if (actor.isAI) {
    const watcher = humans().length === 1 ? humans()[0] : null;
    const hand = watcher ? `<h2>Mão de ${esc(watcher.name)}</h2><div class="cards">${watcher.hand.map((id) => cardHtml(id, watcher)).join('')}</div>` : '';
    return `<p class="waiting">${esc(actor.name)} está jogando…</p>${hand}`;
  }
  if (humans().length > 1 && seenBy !== actor.id) {
    return `<div class="handoff"><h2>Vez de ${esc(actor.name)}</h2><p class="hint">Passe o dispositivo. As cartas e os lances ficam ocultos até a confirmação.</p><button id="ready" class="primary">Sou ${esc(actor.name)}</button></div>`;
  }
  return game.pending ? decisionHtml(game.pending, actor) : actionHtml(actor);
}

function update(): void {
  store('set', serialize(game));
  const svg = app.querySelector<SVGSVGElement>('#board')!;
  const pending = game.pending;
  if (pending && (pending.kind === 'reorder' || pending.kind === 'view') && orderFor !== pending) {
    order = [...pending.cards!];
    orderFor = pending;
  }

  app.querySelector('#players')!.innerHTML = playersHtml();
  app.querySelector('#side')!.innerHTML = sideHtml();
  app.querySelector('#destiny')!.innerHTML = game.lastDestiny === null ? '' : `<h2>Último Destino</h2>${destinyHtml(game.lastDestiny)}`;
  const log = app.querySelector('#log')!;
  log.innerHTML = game.log.slice(-50).map((e) => `<li>${e.player === null ? '' : `<span class="swatch" style="background:${PLAYER_COLORS[e.player]}"></span>`}${esc(e.text)}</li>`).join('');
  log.scrollTop = log.scrollHeight;

  const oracle = game.oracle.holder;
  svg.querySelector('#summit-round')!.textContent = `Rodada ${game.round}`;
  svg.querySelector('#summit-oracle')!.textContent = oracle === null ? 'Oráculo: vago' : `Oráculo: ${game.players[oracle].name}`;
  const left = RULES.electionEvery - ((game.round - 1) % RULES.electionEvery);
  svg.querySelector('#summit-next')!.textContent = left === 1 ? 'Eleição ao fim desta rodada' : `Eleição em ${left} rodadas`;
  updateTokens(svg, game);

  const actor = game.players[actorId()];
  const mine = game.phase !== 'GAME_OVER' && !actor.isAI && (humans().length === 1 || seenBy === actor.id);
  let dests: number[] = [];
  let onPick: (d: number) => void = () => {};
  if (mine && pending?.kind === 'dest') {
    dests = pending.nodes!;
    onPick = (d) => answer(d);
  } else if (mine && !pending && selected !== null) {
    const card = selected;
    const mod = sandals;
    dests = [...moveOptions(game, card, mod).keys()];
    onPick = (d) => send({ type: 'PLAY_CARD_MOVE', card, dest: d, mod });
  }
  showHighlights(svg, dests, onPick);

  const side = app.querySelector<HTMLDivElement>('#side')!;
  side.querySelector('#ready')?.addEventListener('click', () => {
    seenBy = actor.id;
    update();
  });
  side.querySelectorAll<HTMLElement>('.card.movable').forEach((el) => el.addEventListener('click', () => {
    const id = Number(el.dataset.card);
    selected = selected === id ? null : id;
    update();
  }));
  side.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((el) => el.addEventListener('click', () => onPick(Number(el.dataset.route))));
  side.querySelectorAll<HTMLButtonElement>('[data-effect]').forEach((el) => el.addEventListener('click', (ev) => {
    ev.stopPropagation();
    send({ type: 'PLAY_CARD_EFFECT', card: Number(el.dataset.effect) });
  }));
  side.querySelectorAll<HTMLButtonElement>('[data-cmd]').forEach((el) => el.addEventListener('click', () => send({ type: el.dataset.cmd as 'BUY_RELIC' | 'END_TURN' })));
  side.querySelectorAll<HTMLButtonElement>('[data-power]').forEach((el) => el.addEventListener('click', () => send({ type: 'FREE_POWER', power: el.dataset.power as FreePower })));
  side.querySelectorAll<HTMLButtonElement>('[data-sandals]').forEach((el) => el.addEventListener('click', () => {
    sandals = Number(el.dataset.sandals) as -1 | 0 | 1;
    update();
  }));
  side.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach((el) => el.addEventListener('click', () => answer(Number(el.dataset.answer))));
  side.querySelectorAll<HTMLElement>('.card.pickable').forEach((el) => el.addEventListener('click', () => {
    const id = Number(el.dataset.card);
    if (pending?.kind === 'pickCard') return answer(id);
    picks = picks.includes(id) ? picks.filter((c) => c !== id) : picks.length < pending!.count! ? [...picks, id] : picks;
    update();
  }));
  const swap = (i: number, j: number): void => {
    [order[i], order[j]] = [order[j], order[i]];
    update();
  };
  side.querySelectorAll<HTMLButtonElement>('[data-up]').forEach((el) => el.addEventListener('click', () => swap(Number(el.dataset.up), Number(el.dataset.up) - 1)));
  side.querySelectorAll<HTMLButtonElement>('[data-down]').forEach((el) => el.addEventListener('click', () => swap(Number(el.dataset.down), Number(el.dataset.down) + 1)));
  side.querySelector('#confirm')?.addEventListener('click', () => {
    if (pending?.kind === 'discard') answer(picks);
    else if (pending?.kind === 'reorder') answer(order);
    else answer(null);
  });

  const overlay = app.querySelector<HTMLDivElement>('#overlay')!;
  if (game.phase === 'GAME_OVER' && game.winner !== null) {
    store('clear');
    const w = game.players[game.winner];
    overlay.hidden = false;
    overlay.innerHTML = `<div class="victory"><div class="big">${glyph(w.sign)}</div><h2>${esc(w.name)} ascendeu ao Olimpo</h2><p>${w.gloria} de Glória em ${game.round} rodadas, sob a proteção de ${GODS[SIGNS[w.sign].patron].name}.</p><button id="again" class="primary">Nova partida</button></div>`;
    overlay.querySelector('#again')!.addEventListener('click', renderSetup);
  }

  window.clearTimeout(timer);
  if (game.phase !== 'GAME_OVER' && actor.isAI) {
    timer = window.setTimeout(() => {
      aiStep(game);
      update();
    }, pending ? 350 : 900);
  }
}

renderSetup();
