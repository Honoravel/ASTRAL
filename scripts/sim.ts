// Simula partidas só de IA para medir duração e equilíbrio (telemetria da seção 15).
import { RULES } from '../src/engine/config';

const games = Number(process.argv[2] ?? 200);
const seats = Number(process.argv[3] ?? 4);
// Parâmetros extras no formato chave=valor sobrescrevem RULES (ex.: gloriaStop=2).
for (const arg of process.argv.slice(4)) {
  const [key, value] = arg.split('=');
  if (key in RULES) (RULES as Record<string, number>)[key] = Number(value);
}
// O mapa lê RULES ao ser carregado; por isso o motor é importado depois das sobrescritas.
const { aiStep } = await import('../src/engine/ai');
const { newGame } = await import('../src/engine/game');

const rounds: number[] = [];
const winsBySeat = new Array<number>(seats).fill(0);
let unfinished = 0;
let duels = 0;
let jails = 0;
let relics = 0;

for (let g = 0; g < games; g++) {
  const configs = Array.from({ length: seats }, (_, i) => ({ name: `IA${i}`, sign: (g + i * 5) % 12, isAI: true }));
  const state = newGame(configs, g * 7919 + 1);
  let steps = 0;
  while (state.phase !== 'GAME_OVER' && steps++ < 20000) aiStep(state);
  if (state.winner === null) {
    unfinished++;
    continue;
  }
  rounds.push(state.round);
  winsBySeat[state.winner]++;
  duels += state.stats.duels;
  jails += state.stats.jails.reduce((a, b) => a + b, 0);
  relics += state.players.reduce((a, p) => a + p.relics.length, 0);
}

rounds.sort((a, b) => a - b);
const n = rounds.length;
const avg = rounds.reduce((a, b) => a + b, 0) / n;
console.log(`meta ${RULES.goal} · ${seats} jogadores · ${games} partidas · inacabadas ${unfinished}`);
console.log(`rodadas: média ${avg.toFixed(1)} · p10 ${rounds[Math.floor(n * 0.1)]} · mediana ${rounds[Math.floor(n / 2)]} · p90 ${rounds[Math.floor(n * 0.9)]}`);
console.log(`por partida: duelos ${(duels / n).toFixed(1)} · prisões/jogador ${(jails / n / seats).toFixed(2)} · relíquias/jogador ${(relics / n / seats).toFixed(2)}`);
console.log('vitórias por assento:', winsBySeat.join(' '));
