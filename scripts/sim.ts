// Simula partidas só de IA para medir duração e equilíbrio (telemetria da seção 15).
import { aiStep } from '../src/engine/ai';
import { newGame, RULES } from '../src/engine/game';

const games = Number(process.argv[2] ?? 200);
const seats = Number(process.argv[3] ?? 4);
if (process.argv[4]) RULES.goal = Number(process.argv[4]);

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
