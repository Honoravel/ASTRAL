import { describe, expect, it } from 'vitest';
import { aiStep, autoAnswer } from '../src/engine/ai';
import { buildBoard, DIST, NODES, reach, RETURNS, SHORTCUTS, TARTARUS, templeOf } from '../src/engine/board';
import { CARDS } from '../src/engine/cards';
import { G, GODS, SIGNS } from '../src/engine/data';
import { DESTINIES } from '../src/engine/destiny';
import { altarFavor, EV, EVENTS, TRAPS } from '../src/engine/config';
import { apply, costFor, deserialize, effectBlock, newGame, RULES, sabotageTargets, serialize, TRAP_NODES, walk } from '../src/engine/game';
import type { GameState, HouseType } from '../src/engine/types';

const game = (n = 2, seed = 7): GameState =>
  newGame(Array.from({ length: n }, (_, i) => ({ name: `J${i}`, sign: [4, 7, 2, 9][i], isAI: true })), seed);
const settle = (g: GameState): void => {
  let guard = 0;
  while (g.pending && guard++ < 50) apply(g, { type: 'ANSWER', value: autoAnswer(g) });
};
/** Move o jogador atual com uma carta de 1 passo até a casa seguinte a `from`. */
const stepTo = (g: GameState, from: number): void => {
  const p = g.players[g.current];
  p.pos = from;
  p.hand[0] = 0;
  apply(g, { type: 'PLAY_CARD_MOVE', card: 0, dest: from + 1 });
};

describe('tabuleiro', () => {
  it('tem 96 casas com as contagens da especificação', () => {
    const count = (t: HouseType) => NODES.filter((n) => n.type === t).length;
    expect(NODES).toHaveLength(96);
    expect(['comum', 'dracmas', 'pedagio', 'favor', 'gloria', 'provacao', 'destino', 'nemesis', 'bifurcacao', 'templo', 'evento', 'altar', 'tesouro', 'delfos', 'tartaro'].map((t) => count(t as HouseType)))
      .toEqual([12, 10, 8, 8, 6, 6, 6, 4, 6, 12, 6, 6, 4, 1, 1]);
    expect(new Set(NODES.map((n) => n.id)).size).toBe(96);
    for (const n of NODES) expect(Array.isArray(n.onPass) && Array.isArray(n.onStop)).toBe(true);
    for (let r = 0; r < 12; r++) expect(NODES[templeOf(r)].type).toBe('templo');
  });

  it('rejeita duplicações e lacunas na tabela de tipos', () => {
    const all = Array.from({ length: 96 }, (_, i) => i);
    const base = { comum: all };
    expect(() => buildBoard({ ...base, dracmas: [5] })).toThrow(/duplicada/);
    expect(() => buildBoard({ ...base, comum: all.slice(1) })).toThrow(/sem tipo/);
    expect(() => buildBoard({ ...base, favor: [96] })).toThrow(/fora do intervalo/);
  });

  it('todas as casas são alcançáveis e as seis bifurcações têm duas saídas', () => {
    for (const row of DIST) for (const d of row) expect(d).toBeLessThan(Infinity);
    for (const [from, to] of Object.entries(SHORTCUTS)) {
      expect([...reach(Number(from), 1).keys()].sort((a, b) => a - b)).toEqual([Number(from) + 1, to].sort((a, b) => a - b));
    }
    expect(NODES.filter((n) => n.type === 'bifurcacao' && n.next.length === 2)).toHaveLength(6);
    expect(NODES.filter((n) => n.next.length === 2)).toHaveLength(12);
    expect(NODES.every((n) => n.next.length <= 2)).toBe(true);
  });

  it('os retornos fecham anéis de 27 passos, permitindo dar voltas sem fim', () => {
    for (const [from, to] of Object.entries(RETURNS)) {
      const origin = Number(from);
      expect(NODES[origin].next).toEqual([origin + 1, to]);
      expect(NODES[origin].type).not.toBe('bifurcacao');
      expect(DIST[to][origin]).toBe(26); // da volta externa de volta à origem
      expect(DIST[origin][to]).toBe(1);
    }
    // Uma rota real pode usar o retorno: 4 passos de 58 passam por 59 e 60 e saem para 34 e 35.
    expect(reach(58, 4).get(35)).toEqual([59, 60, 34, 35]);
    // Cada destino continua tendo um único caminho, então escolher o destino escolhe a rota.
    for (const n of NODES) {
      for (let steps = 1; steps <= 7; steps++) {
        const paths: number[][] = [];
        const walkAll = (node: number, left: number, path: number[]): void => {
          if (left === 0) return void paths.push(path);
          for (const next of NODES[node].next) walkAll(next, left - 1, [...path, next]);
        };
        walkAll(n.id, steps, []);
        expect(new Set(paths.map((p) => p[p.length - 1])).size).toBe(paths.length);
      }
    }
  });

  it('move exatamente os passos, escolhendo a rota na bifurcação', () => {
    expect([...reach(4, 2).keys()]).toEqual([6]);
    expect([...reach(4, 3).keys()]).toEqual([7, 32]);
    expect([...reach(4, 4).keys()].sort((a, b) => a - b)).toEqual([8, 33]);
    expect(reach(4, 4).get(33)).toEqual([5, 6, 32, 33]);
    expect([...reach(95, 2).keys()]).toEqual([1]);
  });
});

describe('cartas', () => {
  it('são 56 Arcanos Menores (24 U, 20 E, 12 D) e 22 Arcanos Maiores', () => {
    expect(CARDS).toHaveLength(56);
    expect(['U', 'E', 'D'].map((u) => CARDS.filter((c) => c.use === u).length)).toEqual([24, 20, 12]);
    expect(CARDS.slice(0, 14).map((c) => c.move)).toEqual([1, 2, 3, 4, 5, 6, 3, 3, 3, 4, 2, 5, 3, 4]);
    expect(CARDS.filter((c) => c.move === 3)).toHaveLength(20); // movimento concentrado em 3 passos
    expect(CARDS.slice(0, 14).map((c) => c.cost)).toEqual([4, 2, 3, 8, 4, 3, 10, 9, 8, 14, 3, 6, 10, 18]);
    expect(CARDS.slice(14, 28).map((c) => c.cost)).toEqual([2, 3, 2, 4, 5, 3, 6, 6, 8, 9, 3, 6, 10, 15]);
    expect(CARDS.slice(28, 42).map((c) => c.cost)).toEqual([2, 2, 2, 3, 4, 4, 5, 7, 5, 9, 3, 7, 10, 11]);
    expect(CARDS.slice(42, 56).map((c) => c.cost)).toEqual([2, 2, 2, 3, 4, 4, 5, 5, 9, 6, 3, 8, 10, 12]);
    // Toda carta que dá 2 ou mais Glórias custa ao menos 7 Dracmas.
    for (const c of CARDS) if (/Ganhe [2-5] Glórias/.test(c.text)) expect(c.cost, c.text).toBeGreaterThanOrEqual(7);
    expect(new Set(CARDS.filter((c) => c.use === 'D').map((c) => c.god)).size).toBe(12);
    expect(DESTINIES).toHaveLength(22);
  });

  it('dá −1 Dracma no naipe do elemento do signo, com mínimo 0', () => {
    const g = game();
    const leo = g.players[0]; // Leão, fogo → Paus
    expect(costFor(leo, CARDS[13])).toBe(17);
    expect(costFor(leo, CARDS[27])).toBe(15);
    expect(costFor(leo, CARDS[1])).toBe(1); // 2 de Paus: 2 − 1
    expect(costFor(leo, CARDS[14])).toBe(2); // Ás de Copas: outro elemento, sem desconto
    leo.discountNext = true; // Pajem de Espadas: −3, sem ficar negativo
    expect(costFor(leo, CARDS[1])).toBe(0);
    expect(costFor(leo, CARDS[13])).toBe(14);
  });

  it('resolve o efeito de todas as 56 cartas sem deixar recursos negativos', () => {
    for (const card of CARDS) {
      const g = game(3, card.id + 1);
      const p = g.players[0];
      p.dracmas = 20;
      p.hand = [card.id, ...p.hand.filter((c) => c !== card.id).slice(0, 5)];
      if (card.use === 'D') p.pos = templeOf(card.god!);
      if (card.use === 'E') p.pos = templeOf(GODS.findIndex((god) => SIGNS.some((s) => s.element === god.element && CARDS[card.id].suit === { fogo: 'Paus', agua: 'Copas', ar: 'Espadas', terra: 'Ouros' }[s.element])));
      apply(g, { type: 'PLAY_CARD_EFFECT', card: card.id });
      settle(g);
      expect(g.current, card.text).toBe(1);
      expect(p.hand).not.toContain(card.id);
      for (const q of g.players) for (const v of [q.gloria, q.dracmas, q.favor, q.hubris]) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('só permite efeito elemental/divino no templo adequado', () => {
    const g = game();
    const p = g.players[0];
    p.dracmas = 20;
    p.hand = [13, 6, 0];
    p.pos = 0;
    expect(() => apply(g, { type: 'PLAY_CARD_EFFECT', card: 13 })).toThrow();
    expect(() => apply(g, { type: 'PLAY_CARD_EFFECT', card: 6 })).toThrow();
    p.pos = templeOf(G.ares);
    expect(() => apply(g, { type: 'PLAY_CARD_EFFECT', card: 13 })).toThrow();
    apply(g, { type: 'PLAY_CARD_EFFECT', card: 6 });
    expect(p.gloria).toBe(3);
    expect(p.hubris).toBe(2);
  });

  it('resolve os 22 Arcanos Maiores', () => {
    for (const d of DESTINIES) {
      const g = game(3, d.id + 3);
      g.destiny.push(d.id);
      g.players.forEach((p) => (p.hubris = 4));
      stepTo(g, 9);
      settle(g);
      expect(g.lastDestiny).toBe(d.id);
      expect(g.current, d.name).toBe(1);
    }
  });
});

describe('turno e casas', () => {
  it('aplica passagem em cada casa intermediária, em ordem, e só a parada na última', () => {
    const g = game();
    const p = g.players[0];
    p.pos = 0;
    p.hand[0] = 1; // 2 passos: passa pela 01 (Dracmas, +1) e para na 02 (Comum)
    apply(g, { type: 'PLAY_CARD_MOVE', card: 1, dest: 2 });
    expect(p.dracmas).toBe(RULES.startDracmas + RULES.dracmasPass);
    expect(g.lastMove).toMatchObject({ path: [1, 2], passedNodes: [1], destination: 2 });

    const h = game();
    const q = h.players[0];
    Object.assign(q, { pos: 56, dracmas: 3 });
    q.hand[0] = 4; // 5 passos: 57 (Pedágio −1), 58 (Dracmas +1), 59, 60 (Pedágio −1), para na 61 (Favor +2)
    apply(h, { type: 'PLAY_CARD_MOVE', card: 4, dest: 61 });
    expect(q.dracmas).toBe(2);
    expect(q.favor).toBe(RULES.startFavor + 2);
    expect(h.lastMove!.events.map((e) => e.node)).toEqual([57, 58, 60]);
  });

  it('não ativa a casa inicial nem paga em dobro na parada', () => {
    const g = game();
    const p = g.players[0];
    p.pos = 1; // começa numa casa de Dracmas: não recebe passagem
    p.hand[0] = 0;
    apply(g, { type: 'PLAY_CARD_MOVE', card: 0, dest: 2 });
    expect(p.dracmas).toBe(RULES.startDracmas);

    const h = game();
    h.players[0].pos = 0;
    h.players[0].hand[0] = 0;
    apply(h, { type: 'PLAY_CARD_MOVE', card: 0, dest: 1 }); // para em Dracmas: só o valor de parada
    expect(h.players[0].dracmas).toBe(RULES.startDracmas + RULES.dracmasStop);
  });

  it('cobra pedágio sem saldo: paga o que tiver e ganha 1 Húbris por casa', () => {
    const g = game();
    const p = g.players[0];
    Object.assign(p, { pos: 41, dracmas: 0 });
    p.hand[0] = 1; // passa pela 42 (Pedágio) e para no templo 43
    apply(g, { type: 'PLAY_CARD_MOVE', card: 1, dest: 43 });
    expect(p).toMatchObject({ dracmas: 0, hubris: 1 });

    const h = game();
    const q = h.players[0];
    Object.assign(q, { pos: 46, dracmas: 1 });
    q.hand[0] = 0; // para na 47 (Pedágio −2) com 1 Dracma
    apply(h, { type: 'PLAY_CARD_MOVE', card: 0, dest: 47 });
    expect(q).toMatchObject({ dracmas: 0, hubris: 1 });
  });

  it('Nêmesis fiscaliza na passagem só com Húbris 4+, sem prender', () => {
    const pass = (hubris: number, dracmas: number) => {
      const g = game();
      const p = g.players[0];
      Object.assign(p, { pos: 13, hubris, dracmas });
      p.hand[0] = 1; // passa pela 14 (Nêmesis) e para na 15 (Glória)
      apply(g, { type: 'PLAY_CARD_MOVE', card: 1, dest: 15 });
      return p;
    };
    expect(pass(3, 5)).toMatchObject({ dracmas: 5, jailed: false });
    expect(pass(4, 5)).toMatchObject({ dracmas: 4, hubris: 4, jailed: false });
    expect(pass(4, 0)).toMatchObject({ dracmas: 0, hubris: 5, jailed: false, pos: 15 });
  });

  it('aplica a passagem de novo se a rota visitar a mesma casa duas vezes', () => {
    const g = game();
    const p = g.players[0];
    p.pos = 0;
    const move = walk(g, p, [1, 2, 1, 2]);
    expect(p.dracmas).toBe(RULES.startDracmas + 2 * RULES.dracmasPass);
    expect(move.events).toHaveLength(2);
  });

  it('teletransporte não ativa casas atravessadas nem o destino', () => {
    const g = game();
    const p = g.players[0];
    Object.assign(p, { pos: 67, dracmas: 10 }); // Templo de Hermes
    p.hand = [39, ...p.hand.filter((c) => c !== 39).slice(0, 5)]; // Cavaleiro de Espadas
    apply(g, { type: 'PLAY_CARD_EFFECT', card: 39 });
    expect(g.pending?.kind).toBe('dest');
    const before = p.dracmas;
    apply(g, { type: 'ANSWER', value: 40 });
    expect(p.pos).toBe(40);
    expect(p.dracmas).toBe(before);
    expect(g.current).toBe(1);
  });

  it('resolve Tesouro, Altar, Provação e Evento na parada', () => {
    let g = game();
    stepTo(g, 87); // 88: Tesouro
    const gain = g.players[0].dracmas - RULES.startDracmas;
    expect(gain).toBeGreaterThanOrEqual(RULES.treasureMin);
    expect(gain).toBeLessThanOrEqual(RULES.treasureMax);

    g = game();
    stepTo(g, 88); // 89: Altar
    expect(g.pending?.options?.map((o) => o.label)).toEqual(['Apostar 1 Dracma', 'Apostar 2 Dracmas (+1 no dado)', 'Apostar 3 Dracmas (+2 no dado)', 'Não apostar']);
    apply(g, { type: 'ANSWER', value: 2 });
    expect(g.players[0].dracmas).toBe(RULES.startDracmas - 3);
    expect([1, 2]).toContain(g.players[0].favor - RULES.startFavor); // apostando 3, o total nunca fica abaixo de 3
    expect([1, 2, 3, 4, 5, 6].map((roll) => altarFavor(roll, 1))).toEqual([0, 0, 1, 1, 2, 2]);
    expect([1, 2, 3, 4, 5, 6].map((roll) => altarFavor(roll, 2))).toEqual([0, 1, 1, 2, 2, 2]);
    expect([1, 2, 3, 4, 5, 6].map((roll) => altarFavor(roll, 3))).toEqual([1, 1, 2, 2, 2, 2]);

    for (const from of [76, 7]) { // 77: Provação; 08: Evento
      g = game(2, from);
      stepTo(g, from);
      expect(g.current).toBe(1);
      expect(g.pending).toBeNull();
    }
  });

  it('a ira de Nêmesis condena quem encerra o turno com Húbris alta', () => {
    const g = game();
    const p = g.players[0];
    p.hubris = RULES.wrathHubris - 1;
    p.hand = [1, ...p.hand.filter((c) => c !== 1).slice(0, 5)]; // 2 de Paus: +2 Dracmas, +1 Húbris
    apply(g, { type: 'PLAY_CARD_EFFECT', card: 1 });
    expect(p).toMatchObject({ jailed: true, pos: TARTARUS, hubris: RULES.wrathReset });
    expect(g.current).toBe(1);
    expect(g.phase).toBe('CHOOSE_ACTION');
  });

  it('a ação de templo só vale ao chegar por movimento', () => {
    const g = game();
    const p = g.players[0];
    Object.assign(p, { pos: templeOf(G.dionisio), dracmas: 10 });
    g.players[1].pos = 0; // o patrono do segundo jogador é Dionísio; tira-o do templo para não haver encontro
    expect(() => apply(g, { type: 'TEMPLE_ACTION' } as never)).toThrow();
    expect(p.gloria).toBe(0);
    stepTo(g, templeOf(G.dionisio) - 1);
    expect(g.pending?.prompt).toBe('Templo de Dionísio');
    apply(g, { type: 'ANSWER', value: 0 }); // Êxtase
    expect(p).toMatchObject({ dracmas: 10 + RULES.ecstasy, hubris: 2 });
    expect(p.hand).toHaveLength(RULES.hand);
    expect(g.current).toBe(1);
  });

  it('condenação ao Tártaro encerra o turno sem quebrar o estado', () => {
    const g = game();
    const p = g.players[0];
    Object.assign(p, { hubris: 6 });
    stepTo(g, 13);
    expect(p).toMatchObject({ jailed: true, pos: TARTARUS });
    expect(g.current).toBe(1);
    expect(g.phase).toBe('CHOOSE_ACTION');
    expect(g.queue).toHaveLength(0);

    const h = game();
    stepTo(h, 51); // parar na casa 52 por movimento não prende
    expect(h.players[0]).toMatchObject({ jailed: false, pos: TARTARUS });
  });

  it('recompõe a mão até 6 no início do turno', () => {
    const g = game();
    stepTo(g, 1);
    stepTo(g, 4);
    expect(g.current).toBe(0);
    expect(g.players[0].hand).toHaveLength(6);
  });

  it('aplica as faixas de Nêmesis', () => {
    const run = (hubris: number, dracmas: number) => {
      const g = game();
      Object.assign(g.players[0], { hubris, dracmas });
      stepTo(g, 13);
      settle(g);
      return g.players[0];
    };
    expect(run(1, 5).dracmas).toBe(5);
    // Cada ponto de Húbris soma 1 Dracma à cobrança.
    expect(run(2, 20).dracmas).toBe(20 - RULES.judgementLoss - 2);
    expect(run(3, 20).dracmas).toBe(20 - RULES.judgementLoss - 3);
    expect(run(3, 1).dracmas).toBe(0);
    expect(run(4, RULES.nemesisFine + 3).jailed).toBe(true); // a multa é 6 + 4: não tem como pagar
    expect(run(6, 30).pos).toBe(TARTARUS);
    const paid = run(5, 20);
    expect(paid.jailed || paid.dracmas === 20 - RULES.nemesisFine - 5).toBe(true);
  });

  it('oferece as três saídas do Tártaro', () => {
    const jailed = () => {
      const g = game();
      Object.assign(g.players[1], { jailed: true, pos: TARTARUS, hubris: 3, gloria: 2, dracmas: 10 });
      stepTo(g, 0);
      expect(g.pending?.kind).toBe('choice');
      return g;
    };
    let g = jailed();
    apply(g, { type: 'ANSWER', value: 0 });
    expect(g.players[1]).toMatchObject({ jailed: false, hubris: 1, pos: TARTARUS });
    expect(g.current).toBe(0);
    g = jailed();
    apply(g, { type: 'ANSWER', value: 1 });
    expect(g.players[1]).toMatchObject({ jailed: false, dracmas: 10 - RULES.bail });
    expect(g.current).toBe(1);
    expect(g.phase).toBe('CHOOSE_ACTION');
    g = jailed();
    apply(g, { type: 'ANSWER', value: 2 });
    expect(g.players[1]).toMatchObject({ jailed: false, gloria: 1, hubris: 5 });
    expect(g.current).toBe(1);
  });

  it('declara vitória ao atingir a meta de Glória', () => {
    const g = game();
    g.players[0].gloria = RULES.goal - 1;
    stepTo(g, 6); // casa 07: Glória
    expect(g.phase).toBe('GAME_OVER');
    expect(g.winner).toBe(0);
  });
});

describe('Oráculo, relíquias e duelos', () => {
  const toElection = (g: GameState): void => {
    g.round = RULES.electionEvery;
    g.current = g.players.length - 1;
    apply(g, { type: 'END_TURN' });
  };

  it('elege por Favor, com Coroa de Hera e desempates', () => {
    let g = game(3);
    g.players.forEach((p, i) => (p.favor = [2, 3, 1][i]));
    toElection(g);
    expect(g.oracle.holder).toBe(1);
    expect(g.players[1].gloria).toBe(1);
    expect(g.players.map((p) => p.favor)).toEqual([1, 2, 1]); // após a votação, cada um perde metade do Favor

    g = game(3);
    g.players.forEach((p, i) => (p.favor = [2, 3, 3][i]));
    g.players[2].hubris = 1;
    g.players[1].gloria = 1;
    g.players[0].relics = [G.hera];
    toElection(g);
    expect(g.oracle.holder).toBe(0); // J0 (2 Favor + Coroa) empata com J1 em votos e Húbris; vence por ter menos Glória

    g = game(2);
    toElection(g);
    expect(g.oracle.holder).toBeNull();
  });

  it('limita a duas relíquias e devolve a substituída ao estoque', () => {
    const g = game();
    const p = g.players[0];
    Object.assign(p, { relics: [G.hera, G.apolo], dracmas: 20, pos: templeOf(G.ares) });
    g.stock[G.hera] = g.stock[G.apolo] = false;
    apply(g, { type: 'BUY_RELIC' });
    expect(g.pending?.kind).toBe('choice');
    apply(g, { type: 'ANSWER', value: 0 });
    expect(p.relics).toEqual([G.apolo, G.ares]);
    expect(g.stock[G.hera]).toBe(true);
    expect(g.stock[G.ares]).toBe(false);
    expect(p.dracmas).toBe(20 - GODS[G.ares].relic.price);
  });

  it('duela com lances secretos, consome o Favor e respeita o empate', () => {
    const duel = (bidA: number, bidD: number) => {
      const g = game();
      const [a, d] = g.players;
      Object.assign(a, { favor: 3, dracmas: 5 });
      Object.assign(d, { favor: 3, dracmas: 5, pos: 2 });
      stepTo(g, 1);
      apply(g, { type: 'ANSWER', value: 0 });
      expect(g.pending).toMatchObject({ kind: 'bid', player: 0, secret: true });
      apply(g, { type: 'ANSWER', value: bidA });
      expect(g.pending).toMatchObject({ kind: 'bid', player: 1 });
      expect(JSON.stringify(g.pending)).not.toContain('bidA');
      apply(g, { type: 'ANSWER', value: bidD });
      return [a, d];
    };
    let [a, d] = duel(2, 1);
    expect([a.favor, d.favor, a.dracmas, d.dracmas]).toEqual([1, 2, 5 + RULES.duelPrize, 5 - RULES.duelPrize]);
    [a, d] = duel(1, 1);
    expect([a.favor, d.favor, a.dracmas, d.dracmas]).toEqual([2, 2, 5, 5]);
    [a, d] = duel(0, 2);
    expect([a.favor, d.favor]).toEqual([2, 2]);
  });
});

describe('templos v1.8', () => {
  /** Chega ao templo da região com 1 passo e devolve os rótulos das opções. */
  const arrive = (g: GameState, region: number): string[] => {
    stepTo(g, templeOf(region) - 1);
    expect(g.pending?.prompt).toBe(`Templo de ${GODS[region].name}`);
    return g.pending!.options!.map((o) => o.label);
  };
  const rich = (g: GameState, extra = {}): void => g.players.forEach((p) => Object.assign(p, { dracmas: 20, favor: 5, ...extra }));

  it('oferece ação principal, secundária, relíquia e nada, uma por visita', () => {
    const g = game();
    rich(g);
    g.players[0].hand = [0, 1, 2, 3, 5, 16]; // só cartas universais sem afinidade com Afrodite
    const labels = arrive(g, G.afrodite);
    expect(labels).toHaveLength(4);
    expect(labels[0]).toMatch(/^Persuasão/);
    expect(labels[1]).toMatch(/^Encantamento/);
    apply(g, { type: 'ANSWER', value: 0 });
    expect(g.players[0]).toMatchObject({ dracmas: 20 - RULES.persuade, favor: 7 });
    expect(g.current).toBe(1);
  });

  it('limita a Ascensão de Zeus a uma vez a cada três rodadas', () => {
    const g = game();
    rich(g);
    arrive(g, G.zeus);
    apply(g, { type: 'ANSWER', value: 0 });
    expect(g.players[0]).toMatchObject({ gloria: 2, hubris: 1, dracmas: 20 - RULES.zeusCost, gloryRound: 1 });
    g.current = 0;
    g.round = 3;
    arrive(g, G.zeus);
    expect(g.pending!.options![0].disabled).toBe(true);
    expect(g.pending!.options![1].disabled).toBe(false); // Decreto Olímpico não tem o limite
    apply(g, { type: 'ANSWER', value: g.pending!.options!.length - 1 });
    g.current = 0;
    g.round = 4;
    arrive(g, G.zeus);
    expect(g.pending!.options![0].disabled).toBe(false);
  });

  it('paga Forja e Colheita ao fim das rodadas, com um investimento ativo de cada', () => {
    const g = game();
    rich(g);
    arrive(g, G.hefesto);
    apply(g, { type: 'ANSWER', value: 0 });
    const p = g.players[0];
    expect(p.dracmas).toBe(20 - RULES.forgeCost);
    expect(p.investments).toEqual([{ kind: 'forge', incomePerRound: RULES.forgeYield, remainingRounds: RULES.forgeRounds, received: 0 }]);
    apply(g, { type: 'END_TURN' }); // fecha a rodada 1
    expect(p.dracmas).toBe(20 - RULES.forgeCost + RULES.forgeYield);
    expect(p.investments[0]).toMatchObject({ remainingRounds: RULES.forgeRounds - 1, received: RULES.forgeYield });
    arrive(g, G.hefesto);
    expect(g.pending!.options![0].disabled).toBe(true);
    apply(g, { type: 'ANSWER', value: g.pending!.options!.length - 1 });
    apply(g, { type: 'END_TURN' });

    arrive(g, G.demeter);
    apply(g, { type: 'ANSWER', value: 0 });
    const before = p.dracmas;
    for (let i = 0; i < 6; i++) {
      apply(g, { type: 'END_TURN' });
      apply(g, { type: 'END_TURN' });
    }
    expect(p.investments.some((i) => i.kind === 'harvest')).toBe(false);
    expect(p.dracmas - before).toBe(RULES.harvestRounds * RULES.harvestYield + 6 * RULES.forgeYield);
  });

  it('Confronto de Ares duela à distância por 1 Glória e respeita escudo e limite de duelo', () => {
    const fight = (shield: boolean) => {
      const g = game();
      rich(g, { gloria: 3 });
      g.players[1].shield = shield;
      g.players[1].pos = 80;
      arrive(g, G.ares);
      apply(g, { type: 'ANSWER', value: 0 });
      expect(g.pending).toMatchObject({ kind: 'bid', player: 0 });
      apply(g, { type: 'ANSWER', value: 3 });
      apply(g, { type: 'ANSWER', value: 0 });
      return g.players;
    };
    let [a, d] = fight(false);
    expect([a.gloria, d.gloria, a.duelDone]).toEqual([4, 2, true]);
    expect(a).toMatchObject({ dracmas: 20 - RULES.confront, favor: 1 });
    [a, d] = fight(true);
    expect([a.gloria, d.gloria, d.shield]).toEqual([3, 3, false]);
  });

  it('Preparação de Guerra soma força ao próximo duelo e é consumida', () => {
    const g = game();
    rich(g);
    arrive(g, G.ares);
    apply(g, { type: 'ANSWER', value: 1 });
    expect(g.players[0].duelBonus).toBe(RULES.duelPrep);
    apply(g, { type: 'END_TURN' });
    g.players[1].pos = 2;
    stepTo(g, 1);
    apply(g, { type: 'ANSWER', value: 0 });
    apply(g, { type: 'ANSWER', value: 0 });
    apply(g, { type: 'ANSWER', value: 1 });
    expect(g.players[0].duelBonus).toBe(0);
    expect(g.players[0].dracmas).toBe(20); // 20 − 2 da preparação + 2 do duelo vencido com força 2 × 1
  });

  it('permite jogar carta com afinidade no templo afim, na chegada ou como ação', () => {
    const g = game();
    rich(g);
    const p = g.players[0];
    p.hand = [0, 26, 1, 2, 3, 5]; // Rainha de Copas: divina de Afrodite, afim de Hera
    const labels = arrive(g, G.hera);
    const at = labels.findIndex((l) => l.startsWith('Jogar Rainha de Copas'));
    expect(at).toBeGreaterThan(0);
    apply(g, { type: 'ANSWER', value: at });
    expect(p).toMatchObject({ gloria: 2, favor: 7, dracmas: 20 - CARDS[26].cost });
    expect(p.hand).not.toContain(26);

    const h = game();
    rich(h);
    Object.assign(h.players[0], { pos: templeOf(G.zeus), hand: [26, 0, 1, 2, 3, 5] });
    expect(() => apply(h, { type: 'PLAY_CARD_EFFECT', card: 26 })).toThrow();
  });

  it('resolve todas as ações de todos os templos sem quebrar o turno', () => {
    for (let region = 0; region < 12; region++) {
      for (let option = 0; option < 3; option++) {
        const g = game(3, region * 7 + option);
        rich(g, { gloria: 2, hubris: 1 });
        const labels = arrive(g, region);
        if (g.pending!.options![option].disabled || option >= labels.length - 1) continue;
        apply(g, { type: 'ANSWER', value: option });
        settle(g);
        expect(g.current, labels[option]).toBe(1);
        for (const q of g.players) for (const v of [q.gloria, q.dracmas, q.favor, q.hubris]) expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('sistemas estratégicos v1.9', () => {
  const trap = (g: GameState, node: number, kind = 0): void => {
    const p = g.players[g.current];
    apply(g, { type: 'PLACE_TRAP', card: p.hand[0], kind, node });
  };

  it('arma armadilha oculta, com limites de quantidade e de casas', () => {
    const g = game();
    const p = g.players[0];
    p.dracmas = 20;
    expect(() => trap(g, templeOf(0))).toThrow();
    expect(() => trap(g, 14)).toThrow(); // Nêmesis
    expect(() => trap(g, 52)).toThrow(); // Tártaro
    expect(TRAP_NODES).toHaveLength(96 - 12 - 4 - 2);
    trap(g, 5);
    expect(p.dracmas).toBe(20 - TRAPS[0].cost);
    expect(p.hand).toHaveLength(5);
    expect(g.current).toBe(1);
    expect(g.traps).toEqual([{ id: 1, owner: 0, node: 5, kind: 0, expiresAtRound: 1 + RULES.trapRounds }]);
    expect(g.log.some((l) => /casa 05/.test(l.text))).toBe(false); // o registro público não revela a casa
    apply(g, { type: 'END_TURN' });
    trap(g, 6);
    apply(g, { type: 'END_TURN' });
    expect(() => trap(g, 7)).toThrow(/2 armadilhas/);
  });

  it('dispara no adversário durante o movimento exato, uma única vez, antes do efeito da casa', () => {
    const g = game();
    g.players[0].dracmas = 20;
    trap(g, 1, 0); // Rede de Hefesto numa casa de Dracmas
    trap(g, 2, 1); // do jogador 1: Névoa de Hécate
    const q = g.players[1];
    // De volta ao jogador 0: é imune à própria armadilha na casa 01 e cai na do adversário na 02.
    const p = g.players[0];
    Object.assign(p, { pos: 0, dracmas: 5, hubris: 0 });
    p.hand[0] = 1;
    apply(g, { type: 'PLAY_CARD_MOVE', card: 1, dest: 2 });
    expect(p).toMatchObject({ pos: 2, dracmas: 5 + RULES.dracmasPass, hubris: 1 });
    expect(g.traps.map((t) => t.node)).toEqual([1]);
    expect(g.lastTrap).toMatchObject({ node: 2, owner: 1, victim: 0 });
    // O jogador 1 atravessa a casa 01: primeiro a armadilha (−4 Dracmas), depois a passagem (+3).
    Object.assign(q, { pos: 0, dracmas: 5 });
    q.hand[0] = 1;
    apply(g, { type: 'PLAY_CARD_MOVE', card: 1, dest: 2 });
    expect(q).toMatchObject({ pos: 2, dracmas: 5 - 4 + RULES.dracmasPass });
    expect(g.traps).toHaveLength(0);
    expect(g.lastMove!.events.map((e) => e.node)).toEqual([1, 1]);
  });

  it('armadilha expira sem efeito após três rodadas completas', () => {
    const g = game();
    trap(g, 5);
    for (let i = 0; i < 2 * RULES.trapRounds - 2; i++) apply(g, { type: 'END_TURN' });
    expect(g.traps).toHaveLength(1);
    apply(g, { type: 'END_TURN' });
    apply(g, { type: 'END_TURN' });
    expect(g.round).toBe(1 + RULES.trapRounds);
    expect(g.traps).toHaveLength(1); // armada na rodada 1, dura as rodadas 2, 3 e 4
    apply(g, { type: 'END_TURN' });
    expect(g.round).toBe(2 + RULES.trapRounds);
    expect(g.traps).toHaveLength(0);
    expect(g.lastTrap).toBeNull();
  });

  it('limita sabotagens: alvo fora do Tártaro e no máximo duas recebidas por rodada', () => {
    const g = game(3);
    const [a, b, c] = g.players;
    g.players.forEach((p) => Object.assign(p, { dracmas: 10, favor: 3 }));
    b.jailed = true;
    expect(sabotageTargets(g, 0)).toEqual([2]);
    a.hand = [4, 2, 0, 1, 3, 5]; // 5 de Paus (−1 Favor) e 3 de Paus (roubo)
    apply(g, { type: 'PLAY_CARD_EFFECT', card: 4 });
    expect(c.favor).toBe(1); // perde até 2 Favores
    expect(c.used.sabIn).toBe(1);
    c.used.sabIn = RULES.sabotageInPerRound;
    g.current = 0;
    g.phase = 'CHOOSE_ACTION';
    a.sabDone = false;
    expect(effectBlock(g, 2)).toMatch(/Nenhum alvo/);
    expect(() => apply(g, { type: 'PLAY_CARD_EFFECT', card: 2 })).toThrow();
    expect(a.hand).toContain(2); // a carta só é descartada após ação válida
    expect(() => apply(g, { type: 'SABOTAGE', kind: 'maldicao', target: 2 })).toThrow(/desativadas/);
  });

  it('Decreto de Zeus anula uma sabotagem política e Intriga de Atena tira Favor', () => {
    const g = game();
    const [a, b] = g.players;
    g.players.forEach((p) => Object.assign(p, { dracmas: 10, favor: 3 }));
    b.decree = true;
    stepTo(g, templeOf(G.atena) - 1);
    const at = g.pending!.options!.findIndex((o) => o.label.startsWith('Intriga'));
    apply(g, { type: 'ANSWER', value: at });
    expect(b).toMatchObject({ favor: 3, decree: false });
    expect(a.dracmas).toBe(10 - RULES.intrigue);
    apply(g, { type: 'END_TURN' });
    stepTo(g, templeOf(G.atena) - 1);
    apply(g, { type: 'ANSWER', value: at });
    expect(b.favor).toBe(2);
  });

  it('limita o Favor ao teto e registra o histórico das eleições', () => {
    const g = game();
    g.players[0].favor = RULES.favorCap - 1;
    stepTo(g, 3); // casa 04: Favor +2
    expect(g.players[0].favor).toBe(RULES.favorCap);
    g.round = RULES.electionEvery;
    apply(g, { type: 'END_TURN' });
    expect(g.elections).toEqual([{ round: 6, winner: 0, votes: [RULES.favorCap, RULES.startFavor] }]);
    expect(g.oracle.holder).toBe(0);
  });

  it('paga investimentos a quem está no Tártaro e informa o total recebido', () => {
    const g = game();
    const p = g.players[0];
    p.investments.push({ kind: 'harvest', incomePerRound: 2, remainingRounds: 2, received: 0 });
    Object.assign(p, { jailed: true, pos: TARTARUS, dracmas: 0 });
    g.current = 1;
    apply(g, { type: 'END_TURN' });
    expect(p.dracmas).toBe(2);
    expect(p.investments[0]).toMatchObject({ remainingRounds: 1, received: 2 });
  });

  it('devolve a mão a seis cartas ao fim da ação', () => {
    const g = game();
    const p = g.players[0];
    p.hand.push(g.deck.pop()!, g.deck.pop()!);
    apply(g, { type: 'END_TURN' });
    expect(g.pending).toMatchObject({ kind: 'discard', count: 2, player: 0 });
    apply(g, { type: 'ANSWER', value: p.hand.slice(0, 2) });
    expect(p.hand).toHaveLength(RULES.hand);
    expect(g.current).toBe(1);
  });

  it('teto de 4 Dracmas de passagem por movimento', () => {
    const g = game();
    const p = g.players[0];
    p.pos = 0;
    walk(g, p, [1, 12, 20, 31, 39, 49, 2]); // seis casas de Dracmas atravessadas
    expect(p.dracmas).toBe(RULES.startDracmas + RULES.passDracmaCap);
  });

  it('revela um evento global após a eleição, válido por seis rodadas', () => {
    const g = game();
    expect(g.globalEvent).toBeNull();
    for (let i = 0; i < 2 * RULES.eventEvery; i++) apply(g, { type: 'END_TURN' });
    expect(g.round).toBe(7);
    const first = g.globalEvent!;
    expect(first).toMatchObject({ startedAtRound: 7, expiresAtRound: 12 });
    expect(EVENTS[first.id]).toBeDefined();
    for (let i = 0; i < 2 * (RULES.eventEvery - 1); i++) apply(g, { type: 'END_TURN' });
    expect(g.globalEvent).toEqual(first);
    apply(g, { type: 'END_TURN' });
    apply(g, { type: 'END_TURN' });
    expect(g.round).toBe(13);
    expect(g.globalEvent!.id).not.toBe(first.id);
    expect(g.globalEvent).toMatchObject({ startedAtRound: 13, expiresAtRound: 18 });
  });

  it('aplica os efeitos dos eventos globais', () => {
    const on = (id: number): GameState => {
      const g = game();
      g.globalEvent = { id, startedAtRound: 1, expiresAtRound: 6 };
      return g;
    };
    let g = on(EV.demeter);
    g.players[0].pos = 0;
    walk(g, g.players[0], [1, 12, 2]);
    expect(g.players[0].dracmas).toBe(RULES.startDracmas + RULES.passDracmaCap); // 3 + 2 de bênção na primeira casa; a segunda esbarra no teto

    g = on(EV.atena);
    const leo = g.players[0];
    expect(costFor(leo, CARDS[34], g)).toBe(4); // 7 de Espadas: 5 → 4
    expect(costFor(leo, CARDS[29], g)).toBe(1); // 2 de Espadas: 2 → 1
    leo.discountNext = true;
    expect(costFor(leo, CARDS[32], g)).toBe(1); // 5 de Espadas: 4 − 3 = 1 e não fica gratuita
    leo.discountNext = false;
    leo.used.atena = 1;
    expect(costFor(leo, CARDS[34], g)).toBe(5);

    g = on(EV.zeus);
    Object.assign(g.players[0], { hubris: 5, dracmas: 3 });
    apply(g, { type: 'END_TURN' });
    apply(g, { type: 'END_TURN' });
    expect(g.players[0].dracmas).toBe(3 - RULES.eventBonus);

    g = on(EV.poseidon);
    stepTo(g, 87); // Tesouro
    expect(g.players[0].dracmas - RULES.startDracmas).toBeGreaterThanOrEqual(RULES.treasureMin + RULES.eventBonus);
  });

  it('contratos: desligados por padrão; ligados, concluem exatamente uma vez', () => {
    const g = game();
    g.players.forEach((p) => Object.assign(p, { dracmas: 20, favor: 0 }));
    stepTo(g, templeOf(G.afrodite) - 1);
    expect(g.pending!.options!.some((o) => o.label.startsWith('Aceitar contrato'))).toBe(false);
    apply(g, { type: 'ANSWER', value: g.pending!.options!.length - 1 });

    RULES.modContracts = 1;
    try {
      apply(g, { type: 'END_TURN' });
      const p = g.players[0];
      stepTo(g, templeOf(G.afrodite) - 1);
      const at = g.pending!.options!.findIndex((o) => o.label.startsWith('Aceitar contrato'));
      apply(g, { type: 'ANSWER', value: at });
      expect(p.contract).toEqual({ god: G.afrodite, progress: 0, regions: [] });
      apply(g, { type: 'END_TURN' });
      for (const expected of [2, 4]) {
        stepTo(g, 3); // casa 04: +2 Favores
        expect(p.contract!.progress).toBe(expected);
        apply(g, { type: 'END_TURN' });
      }
      stepTo(g, 3);
      expect(p.contract).toBeNull();
      expect(p.contractsDone).toEqual([G.afrodite]);
      expect(p.gloria).toBe(2);
      apply(g, { type: 'END_TURN' });
      stepTo(g, templeOf(G.afrodite) - 1);
      expect(g.pending!.options!.some((o) => o.label.startsWith('Aceitar contrato'))).toBe(false);
    } finally {
      RULES.modContracts = 0;
    }
  });

  it('a IA não usa armadilhas ocultas dos outros ao decidir', () => {
    const g = game(2, 21);
    const before = JSON.stringify(g);
    aiStep(g);
    const chosen = g.lastMove ? g.lastMove.destination : -1;
    const h = game(2, 21);
    for (const node of [1, 2, 3, 4, 5, 6].map((d) => (h.players[0].pos + d) % 96).filter((n) => TRAP_NODES.includes(n))) {
      h.traps.push({ id: 100 + node, owner: 1, node, kind: 0, expiresAtRound: 9 });
    }
    aiStep(h);
    expect(h.lastMove ? h.lastMove.destination : -1).toBe(chosen);
    expect(before).toContain('"traps":[]');
  });
});

describe('catálogo de cartas rebalanceado', () => {
  const play = (card: number, setup: (g: GameState) => void = () => {}, n = 2): GameState => {
    const g = game(n);
    const p = g.players[0];
    Object.assign(p, { dracmas: 30, hand: [card, ...p.hand.filter((c) => c !== card).slice(0, 5)] });
    setup(g);
    apply(g, { type: 'PLAY_CARD_EFFECT', card });
    return g;
  };

  it('cobra o custo e aplica os novos efeitos de recursos', () => {
    let g = play(47); // 6 de Ouros: 4 → +9 Dracmas (Leão não tem desconto em Ouros)
    expect(g.players[0].dracmas).toBe(30 - 4 + 9);
    g = play(1); // 2 de Paus com desconto do signo: 1 → +5 Dracmas, +1 Húbris
    expect(g.players[0]).toMatchObject({ dracmas: 30 - 1 + 5, hubris: 1 });
    g = play(20, (s) => (s.players[0].pos = templeOf(G.afrodite))); // 7 de Copas: +4 Favores
    expect(g.players[0].favor).toBe(RULES.startFavor + 4);
    g = play(8, (s) => Object.assign(s.players[0], { pos: templeOf(G.ares), hubris: 3 })); // 9 de Paus com 3+ Húbris
    expect(g.players[0]).toMatchObject({ gloria: 3, hubris: 4 });
    g = play(27, (s) => (s.players[0].pos = templeOf(G.dionisio))); // Rei de Copas: +2 Húbris e remove 1
    expect(g.players[0]).toMatchObject({ gloria: 4, hubris: 1, dracmas: 15 });
  });

  it('desloca pela rota normal, sem atalho e sem ativar a chegada', () => {
    // Cavaleiro de Copas: o rival na casa 05 anda 3 pela saída normal (06, 07, 08), não pelo atalho da 06.
    let g = play(25, (s) => {
      s.players[0].pos = templeOf(G.poseidon);
      Object.assign(s.players[1], { pos: 5, dracmas: 10, gloria: 0 });
    });
    expect(g.pending).toBeNull();
    expect(g.players[1]).toMatchObject({ pos: 8, dracmas: 10, gloria: 0 });
    // Cavaleiro de Ouros: +2 Glórias e 2 casas adiante, sem o +6 da casa de Dracmas onde chega.
    g = play(53, (s) => (s.players[0].pos = templeOf(G.hermes)));
    expect(g.players[0]).toMatchObject({ gloria: 2, pos: templeOf(G.hermes) + 2, dracmas: 30 - 8 });
  });

  it('4 de Espadas mostra a mão e faz o rival trocar uma carta; conta como sabotagem', () => {
    const g = play(31);
    expect(g.pending).toMatchObject({ kind: 'view', player: 0 });
    const before = [...g.players[1].hand];
    apply(g, { type: 'ANSWER', value: null });
    expect(g.players[1].hand).toHaveLength(6);
    expect(g.players[1].hand.filter((c) => before.includes(c))).toHaveLength(5);
    expect(g.players[1].used.sabIn).toBe(1);
  });

  it('respeita escudo no ataque do 8 de Paus', () => {
    const g = play(7, (s) => {
      s.players[0].pos = templeOf(G.zeus);
      Object.assign(s.players[1], { gloria: 3, shield: true });
    });
    expect(g.players[0]).toMatchObject({ gloria: 1, hubris: 1 });
    expect(g.players[1]).toMatchObject({ gloria: 3, shield: false });
  });

  it('trocas e descartes funcionam com mão vazia e baralho esgotado', () => {
    // 5 de Espadas contra rival sem cartas: nada acontece e o turno segue.
    let g = play(32, (s) => (s.players[1].hand = []));
    expect(g.current).toBe(1);
    expect(g.players[0].hand).toHaveLength(5);
    // 4 de Espadas contra rival sem cartas: não há o que ver nem descartar.
    g = play(31, (s) => (s.players[1].hand = []));
    expect(g.current).toBe(1);
    // 7 de Espadas com baralho e descarte vazios: compra o que houver (nada) e descarta 3.
    g = play(34, (s) => {
      s.players[0].pos = templeOf(G.atena);
      s.deck = [];
      s.discard = [];
    });
    settle(g);
    expect(g.players[0].hand.length).toBeLessThanOrEqual(RULES.hand);
    expect(g.current).toBe(1);
    // Baralho vazio com descarte: o descarte é reembaralhado para a compra.
    g = play(29, (s) => {
      s.discard.push(...s.deck);
      s.deck = [];
    });
    settle(g);
    expect(g.current).toBe(1);
    expect(g.deck.length).toBeGreaterThan(0);
  });

  it('as cartas de Ouros não geram dinheiro sem limite: uma por turno e saem da mão', () => {
    const g = game();
    const p = g.players[0];
    p.hand = [42, 43, 45, 47, 0, 1];
    apply(g, { type: 'PLAY_CARD_EFFECT', card: 47 });
    expect(g.current).toBe(1); // o efeito consome a ação principal do turno
    expect(p.hand).not.toContain(47);
    expect(() => apply(g, { type: 'PLAY_CARD_EFFECT', card: 45 })).toThrow();
    // O maior ganho líquido de uma carta de Ouros universal não passa da renda de parar numa casa de Dracmas.
    const net = [42, 43, 44, 45, 46, 47].map((id) => Number(/(\d+) Dracmas/.exec(CARDS[id].text)![1]) - CARDS[id].cost);
    expect(Math.max(...net)).toBeLessThanOrEqual(RULES.dracmasStop);
  });
});

describe('propriedades', () => {
  it('é determinística por semente, mantém recursos não negativos e termina', () => {
    const play = (seed: number) => {
      const g = game(4, seed);
      let steps = 0;
      while (g.phase !== 'GAME_OVER' && steps++ < 20000) {
        aiStep(g);
        for (const p of g.players) for (const v of [p.gloria, p.dracmas, p.favor, p.hubris]) expect(v).toBeGreaterThanOrEqual(0);
      }
      return g;
    };
    const a = play(99);
    expect(a.winner).not.toBeNull();
    expect(play(99).log).toEqual(a.log);
  });

  it('restaura a partida salva no meio de uma decisão pendente', () => {
    const g = game(3, 5);
    let steps = 0;
    while (!(g.pending && g.round > 2) && steps++ < 5000) aiStep(g);
    expect(g.pending).not.toBeNull();
    const copy = deserialize(serialize(g));
    for (const s of [g, copy]) for (let i = 0; i < 300 && s.phase !== 'GAME_OVER'; i++) aiStep(s);
    expect(copy.log).toEqual(g.log);
    expect(() => deserialize('{"version":0}')).toThrow();
  });

  it('migra partidas salvas na versão anterior', () => {
    const g = game(2, 11);
    const old = JSON.parse(serialize(g));
    old.version = 1;
    delete old.lastMove;
    for (const q of old.players) for (const k of ['investments', 'duelBonus', 'divineDiscount', 'gloryRound', 'decree', 'sabDone', 'blocked', 'contract', 'contractsDone']) delete q[k];
    for (const k of ['traps', 'trapSeq', 'lastTrap', 'globalEvent', 'elections']) delete old[k];
    const migrated = deserialize(JSON.stringify(old));
    expect(migrated.version).toBe(4);
    expect(migrated.lastMove).toBeNull();
    expect(migrated.players[0]).toMatchObject({ investments: [], duelBonus: 0, gloryRound: null, contract: null });
    expect(migrated).toMatchObject({ traps: [], globalEvent: null, elections: [] });
    stepTo(migrated, 0);
    expect(migrated.players[0].dracmas).toBe(RULES.startDracmas + RULES.dracmasStop);
  });
});
