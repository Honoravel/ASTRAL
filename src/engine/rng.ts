/** Gerador determinístico (mulberry32). O estado vive em `holder.seed`. */
export function rand(holder: { seed: number }): number {
  holder.seed = (holder.seed + 0x6d2b79f5) | 0;
  let t = holder.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const d6 = (holder: { seed: number }): number => 1 + Math.floor(rand(holder) * 6);

export function shuffle<T>(holder: { seed: number }, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand(holder) * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
