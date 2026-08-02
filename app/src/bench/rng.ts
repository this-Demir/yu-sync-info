// src/bench/rng.ts
//
// Deterministic pseudo-random number generation for reproducible experiments.
//
// Every figure and table in docs/06-evaluation.md is generated from a stated
// seed. Math.random() is deliberately not used anywhere in the bench code,
// because a reader must be able to regenerate byte-identical results.
//
// mulberry32 is a 32-bit generator with a period of 2^32. It is not
// cryptographically secure and is not intended to be. It is chosen because it
// is short enough to audit by eye and produces identical streams in every
// JavaScript engine, which is what reproducibility requires here.

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform integer in [0, n). */
  int(n: number): number;
  /** Fisher-Yates shuffle, in place, returning the same array. */
  shuffle<T>(items: T[]): T[];
  /** Uniformly chosen element. Throws on an empty array. */
  pick<T>(items: T[]): T;
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;

  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (n: number): number => Math.floor(next() * n);

  const shuffle = <T,>(items: T[]): T[] => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const tmp = items[i]!;
      items[i] = items[j]!;
      items[j] = tmp;
    }
    return items;
  };

  const pick = <T,>(items: T[]): T => {
    if (items.length === 0) throw new Error("pick() called on an empty array");
    return items[int(items.length)]!;
  };

  return { next, int, shuffle, pick };
}
