import { describe, expect, it } from 'vitest';
import { aiStep } from '../src/engine/ai';
import { DIST, IRIS, NODES, reachable, templeId } from '../src/engine/board';
import { CARDS } from '../src/engine/cards';
import { DESTINIES } from '../src/engine/destiny';
import { canPlay, costFor, currentPlayer, moveOptions, moveWithCard, newGame, playCard, RULES } from '../src/engine/game';

const configs = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `J${i}`, sign: i * 3, isAI: true }));

describe('tabuleiro', () => {
  it('tem 12 templos, 84 casas e duas pontes de Íris', () => {
    expect(NODES).toHaveLength(84);
    expect(NODES.filter((n) => n.type === 'templo')).toHaveLength(12);
    expect(IRIS).toHaveLength(2);
  });

  it('permite chegar de qualquer casa a qualquer outra', () => {
    for (const row of DIST) for (const d of row) expect(d).toBeLessThan(Infinity);
  });

  it('anda exatamente o valor da carta e oferece bifurcações', () => {
    const from = templeId(0);
    expect([...reachable(from, 1).keys()].sort()).toEqual([...NODES[from].next].sort());
    for (const [dest, path] of reachable(from, 4)) {
      expect(path).toHaveLength(4);
      expect(path[3]).toBe(dest);
    }
    expect(reachable(from, 4).size).toBeGreaterThan(1);
  });
});

describe('baralhos', () => {
  it('tem 4 Arcanos Menores por deus e 22 Arcanos Maiores', () => {
    expect(CARDS).toHaveLength(48);
    for (let s = 0; s < 12; s++) expect(CARDS.filter((c) => c.sector === s)).toHaveLength(4);
    expect(DESTINIES).toHaveLength(22);
  });
});

describe('partida', () => {
  it('distribui a mão inicial e começa no templo do patrono', () => {
    const g = newGame(configs(3), 42);
    for (const p of g.players) {
      expect(p.hand).toHaveLength(RULES.hand);
      expect(p.pos).toBe(templeId(p.sign));
    }
  });

  it('rejeita destino inválido e só deixa jogar carta no templo certo', () => {
    const g = newGame(configs(2), 7);
    const p = currentPlayer(g);
    const card = p.hand[0];
    expect(() => moveWithCard(g, card, p.pos)).toThrow();
    expect(canPlay(g, p, card)).toBe(false);
    expect(() => playCard(g, card)).toThrow();
    const dest = [...moveOptions(g, card).keys()][0];
    moveWithCard(g, card, dest);
    expect(p.hand).not.toContain(card);
  });

  it('dá desconto de 1 dracma no naipe do elemento do signo', () => {
    const g = newGame(configs(2), 1);
    const p = g.players[0]; // Áries, fogo → Paus
    const paus = CARDS.find((c) => c.suit === 'Paus' && c.cost > 0)!;
    const copas = CARDS.find((c) => c.suit === 'Copas' && c.cost > 0)!;
    expect(costFor(p, paus)).toBe(paus.cost - 1);
    expect(costFor(p, copas)).toBe(copas.cost);
  });

  it('é determinística para a mesma semente e termina com um vencedor', () => {
    const run = (seed: number) => {
      const g = newGame(configs(4), seed);
      let steps = 0;
      while (g.phase !== 'over' && steps++ < 20000) aiStep(g);
      return g;
    };
    const a = run(123);
    const b = run(123);
    expect(a.winner).not.toBeNull();
    expect(a.players[a.winner!].gloria).toBeGreaterThanOrEqual(RULES.goal);
    expect(a.log).toEqual(b.log);
    for (const p of a.players) for (const v of [p.gloria, p.dracmas, p.favor, p.hubris]) expect(v).toBeGreaterThanOrEqual(0);
  });
});
