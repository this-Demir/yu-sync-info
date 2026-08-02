// src/bench/maskVariants.ts
//
// Two implementations of the same predicate, used by Experiment 3.
//
// The claim under test is the one the original documentation asserted without
// evidence, that the bitmask conflict check is O(1). It is not, in general. A
// universe of T slots needs ceil(T / w) machine words, so the word-wise check
// is O(T / w) and the slot-wise check is O(T). Both are linear in T; the
// bitmask version simply carries a divisor of w.
//
// The check is genuinely constant only for a fixed universe that fits in a
// bounded number of words, which is the case the deployed engine occupies:
// 12 slots per day across 7 days is 7 single-word ANDs regardless of input.
// Experiment 3 measures the general case so the deployed claim can be stated
// with its precondition attached rather than as an unqualified O(1).

/** Bits per element of a Uint32Array, the word size the word-wise variant works in. */
export const WORD_BITS = 32;

/** Word-wise conflict test. Cost grows with ceil(T / WORD_BITS). */
export function wordAndConflicts(a: Uint32Array, b: Uint32Array): boolean {
  for (let i = 0; i < a.length; i++) {
    if ((a[i]! & b[i]!) !== 0) return true;
  }
  return false;
}

/** Slot-wise conflict test. Cost grows with T. */
export function slotScanConflicts(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i]! !== 0 && b[i]! !== 0) return true;
  }
  return false;
}

/** The deployed encoding: one machine word per day, a fixed number of days. */
export function fixedWeekConflicts(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if ((a[i]! & b[i]!) !== 0) return true;
  }
  return false;
}

export interface SlotVectors {
  wordsA: Uint32Array;
  wordsB: Uint32Array;
  slotsA: Uint8Array;
  slotsB: Uint8Array;
}

/**
 * Builds a disjoint pair of occupancy vectors over a universe of `slots`.
 *
 * Disjoint is the deliberate choice. Both variants short-circuit on the first
 * overlap, so a conflicting pair would return after a couple of iterations and
 * measure nothing. The non-conflicting case forces the full scan and is
 * therefore the worst case, which is what a complexity claim is about.
 */
export function buildDisjointVectors(slots: number, density = 0.25): SlotVectors {
  const words = Math.ceil(slots / WORD_BITS);
  const wordsA = new Uint32Array(words);
  const wordsB = new Uint32Array(words);
  const slotsA = new Uint8Array(slots);
  const slotsB = new Uint8Array(slots);

  const step = Math.max(2, Math.round(1 / density));
  for (let i = 0; i < slots; i++) {
    // A takes every step-th slot, B takes the slot after it. They never meet.
    if (i % step === 0) {
      slotsA[i] = 1;
      wordsA[Math.floor(i / WORD_BITS)]! |= 1 << (i % WORD_BITS);
    } else if (i % step === 1) {
      slotsB[i] = 1;
      wordsB[Math.floor(i / WORD_BITS)]! |= 1 << (i % WORD_BITS);
    }
  }

  return { wordsA, wordsB, slotsA, slotsB };
}

/**
 * Times `fn` and reports nanoseconds per call.
 *
 * `trials` independent batches are run and the minimum is reported. The
 * minimum is used rather than the mean because the quantity of interest is the
 * cost of the operation itself, and every source of noise on a multitasking
 * operating system adds time rather than removing it.
 */
export function timeNsPerOp(fn: () => boolean, reps: number, trials = 7): number {
  let sink = 0;

  // Warm up so the JIT has compiled and specialised before anything is timed.
  for (let i = 0; i < reps; i++) sink ^= fn() ? 1 : 0;

  let best = Infinity;
  for (let t = 0; t < trials; t++) {
    const t0 = performance.now();
    for (let i = 0; i < reps; i++) sink ^= fn() ? 1 : 0;
    const elapsed = performance.now() - t0;
    best = Math.min(best, elapsed);
  }

  // Consume the accumulator so the loop body cannot be optimised away.
  if (sink === 0xdeadbeef) throw new Error("unreachable");

  return (best * 1e6) / reps;
}
