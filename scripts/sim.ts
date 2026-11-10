// Simula partidas só de IA para calibrar a duração e o equilíbrio.
import { aiStep } from '../src/engine/ai';
import { newGame, RULES } from '../src/engine/game';

const games = Number(process.argv[2] ?? 300);
const seats = Number(process.argv[3] ?? 4);
if (process.argv[4]) RULES.goal = Number(process.argv[4]);

const rounds: number[] = [];
const winsBySeat = new Array<number>(seats).fill(0);
const winsBySign = new Array<number>(12).fill(0);
const playsBySign = new Array<number>(12).fill(0);
let unfinished = 0;

for (let g = 0; g < games; g++) {
  const configs = Array.from({ length: seats }, (_, i) => ({ name: `IA${i}`, sign: (g + i * 3) % 12, isAI: true }));
  const state = newGame(configs, g * 7919 + 1);
  let steps = 0;
  while (state.phase !== 'over' && steps++ < 20000) aiStep(state);
  if (state.winner === null) {
    unfinished++;
    continue;
  }
  rounds.push(state.round);
  winsBySeat[state.winner]++;
  for (const c of configs) playsBySign[c.sign]++;
  winsBySign[state.players[state.winner].sign]++;
}

rounds.sort((a, b) => a - b);
const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length;
console.log(`meta ${RULES.goal} · ${seats} jogadores · ${games} partidas · inacabadas ${unfinished}`);
console.log(`rodadas: média ${avg.toFixed(1)} · p10 ${rounds[Math.floor(rounds.length * 0.1)]} · mediana ${rounds[Math.floor(rounds.length / 2)]} · p90 ${rounds[Math.floor(rounds.length * 0.9)]}`);
console.log('vitórias por assento:', winsBySeat.join(' '));
console.log('taxa de vitória por signo:', winsBySign.map((w, i) => (playsBySign[i] ? (w / playsBySign[i]).toFixed(2) : '-')).join(' '));
