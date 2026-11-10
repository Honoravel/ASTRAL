import { describe, expect, it } from 'vitest';
import { aiStep, autoAnswer } from '../src/engine/ai';
import { buildBoard, DIST, NODES, reach, SHORTCUTS, TARTARUS, templeOf } from '../src/engine/board';
import { CARDS } from '../src/engine/cards';
import { G, GODS, SIGNS } from '../src/engine/data';
import { DESTINIES } from '../src/engine/destiny';
import { apply, costFor, deserialize, newGame, RULES, serialize } from '../src/engine/game';
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
    expect(['comum', 'dracmas', 'favor', 'gloria', 'evento', 'destino', 'nemesis', 'bifurcacao', 'templo', 'delfos', 'tartaro'].map((t) => count(t as HouseType)))
      .toEqual([30, 12, 8, 8, 8, 6, 4, 6, 12, 1, 1]);
    for (let r = 0; r < 12; r++) expect(NODES[templeOf(r)].type).toBe('templo');
  });

  it('rejeita duplicações e lacunas na tabela de tipos', () => {
    const all = Array.from({ length: 96 }, (_, i) => i);
    const base = { comum: all, dracmas: [], favor: [], gloria: [], evento: [], destino: [], nemesis: [], bifurcacao: [], templo: [], delfos: [], tartaro: [] };
    expect(() => buildBoard({ ...base, dracmas: [5] })).toThrow(/duplicada/);
    expect(() => buildBoard({ ...base, comum: all.slice(1) })).toThrow(/sem tipo/);
    expect(() => buildBoard({ ...base, favor: [96] })).toThrow(/fora do intervalo/);
  });

  it('todas as casas são alcançáveis e as seis bifurcações têm duas saídas', () => {
    for (const row of DIST) for (const d of row) expect(d).toBeLessThan(Infinity);
    for (const [from, to] of Object.entries(SHORTCUTS)) {
      expect([...reach(Number(from), 1).keys()].sort((a, b) => a - b)).toEqual([Number(from) + 1, to].sort((a, b) => a - b));
    }
    expect(NODES.filter((n) => n.next.length === 2)).toHaveLength(6);
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
    expect(CARDS.slice(0, 14).map((c) => c.move)).toEqual([1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 2, 5, 3, 6]);
    expect(CARDS.slice(0, 14).map((c) => c.cost)).toEqual([0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 2, 3, 4, 5]);
    expect(new Set(CARDS.filter((c) => c.use === 'D').map((c) => c.god)).size).toBe(12);
    expect(DESTINIES).toHaveLength(22);
  });

  it('dá −1 Dracma no naipe do elemento do signo, com mínimo 0', () => {
    const g = game();
    const leo = g.players[0]; // Leão, fogo → Paus
    expect(costFor(leo, CARDS[13])).toBe(4);
    expect(costFor(leo, CARDS[27])).toBe(5);
    expect(costFor(leo, CARDS[0])).toBe(0);
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
  it('casas atravessadas não ativam; só o destino final', () => {
    const g = game();
    const p = g.players[0];
    p.pos = 0;
    p.hand[0] = 1; // 2 de Paus: 2 passos, passa pela casa 01 (Dracmas) e para na 02 (Comum)
    apply(g, { type: 'PLAY_CARD_MOVE', card: 1, dest: 2 });
    expect(p.dracmas).toBe(RULES.startDracmas);
    expect(g.current).toBe(1);
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
    expect(run(3, 5).dracmas).toBe(3);
    expect(run(3, 1).dracmas).toBe(0);
    expect(run(4, 3).jailed).toBe(true);
    expect(run(6, 30).pos).toBe(TARTARUS);
    const paid = run(5, 9);
    expect(paid.jailed || paid.dracmas === 5).toBe(true);
  });

  it('oferece as três saídas do Tártaro', () => {
    const jailed = () => {
      const g = game();
      Object.assign(g.players[1], { jailed: true, pos: TARTARUS, hubris: 3, gloria: 2, dracmas: 5 });
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
    expect(g.players[1]).toMatchObject({ jailed: false, dracmas: 1 });
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
    expect(g.players[1].favor).toBe(3);

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
    expect(p.dracmas).toBe(14);
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
    expect([a.favor, d.favor, a.dracmas, d.dracmas]).toEqual([1, 2, 7, 3]);
    [a, d] = duel(1, 1);
    expect([a.favor, d.favor, a.dracmas, d.dracmas]).toEqual([2, 2, 5, 5]);
    [a, d] = duel(0, 2);
    expect([a.favor, d.favor]).toEqual([2, 2]);
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
});
