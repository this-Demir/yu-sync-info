// src/bench/naive.ts
//
// The uninformed baseline for Experiment 2.
//
// This enumerates the entire Cartesian product of section choices and tests
// each complete assignment for pairwise conflicts. It performs no pruning: a
// combination that already conflicts at depth 2 is still built out to full
// depth before being rejected. That is precisely the behaviour the DFS engine
// avoids, so the ratio between the two node counts measures what pruning buys.
//
// It is deliberately written to be obviously correct rather than fast, since
// its role is to be the reference the optimised engine is checked against.

import type { Section } from "../core/types";
import { BENCH_DAYS, sectionWeekMask } from "./instances";

export interface NaiveResult {
  /** Canonical solution keys, sorted. */
  solutions: string[];
  /** Complete assignments constructed, which is the product of section counts. */
  combinationsExamined: number;
  /** Pairwise conflict tests performed. */
  conflictChecks: number;
  timeMs: number;
}

/** Order-independent identity of a schedule, so two engines can be compared. */
export function canonicalKey(schedule: Section[]): string {
  return schedule
    .map(s => `${s.courseCode}#${s.sectionNo}`)
    .sort()
    .join("|");
}

function groupByCourse(sections: Section[]): Section[][] {
  const grouped = new Map<string, Section[]>();
  for (const s of sections) {
    const list = grouped.get(s.courseCode) ?? [];
    list.push(s);
    grouped.set(s.courseCode, list);
  }
  // Sorted by course code so the baseline's traversal order is fixed and
  // independent of the input ordering.
  return [...grouped.keys()].sort().map(code => grouped.get(code)!);
}

/** A section reduced to the days it actually meets, mirroring `Masked` in the engine. */
interface MeetingMasks {
  /** Day indices this section occupies. */
  days: number[];
  /** Mask per day index, dense over the weekday range for O(1) lookup. */
  byDay: number[];
}

/**
 * Masks are precomputed once per section rather than derived at each
 * comparison. This is not an optimisation that changes what the baseline
 * measures. The baseline's defining property is that it constructs every
 * complete assignment without pruning, and that is untouched. Rebuilding
 * masks inside the innermost loop would only measure string parsing.
 *
 * Only the days a section meets are iterated, exactly as `fits()` in
 * scheduler.ts iterates `option.masks`. This matters for the comparison in
 * Experiment 2: both sides must count the same primitive, one AND of one day
 * mask, or the reported ratio would be an artefact of how the baseline was
 * written rather than a property of pruning.
 */
function meetingMasks(sections: Section[]): MeetingMasks[] {
  return sections.map(s => {
    const perDay = sectionWeekMask(s);
    const byDay = BENCH_DAYS.map(d => perDay[d] ?? 0);
    const days: number[] = [];
    byDay.forEach((m, i) => { if (m !== 0) days.push(i); });
    return { days, byDay };
  });
}

/** Returns the conflict verdict and the number of day-mask ANDs it cost. */
function masksConflict(a: MeetingMasks, b: MeetingMasks): { hit: boolean; checks: number } {
  let checks = 0;
  for (const d of a.days) {
    checks++;
    if ((a.byDay[d]! & b.byDay[d]!) !== 0) return { hit: true, checks };
  }
  return { hit: false, checks };
}

export function enumerateNaive(sections: Section[], maxResults = Number.MAX_SAFE_INTEGER): NaiveResult {
  const t0 = performance.now();
  const groups = groupByCourse(sections);
  const solutions: string[] = [];
  let combinationsExamined = 0;
  let conflictChecks = 0;

  if (groups.length === 0) {
    return { solutions, combinationsExamined, conflictChecks, timeMs: performance.now() - t0 };
  }

  const groupMasks = groups.map(meetingMasks);
  const indices = new Array<number>(groups.length).fill(0);

  for (;;) {
    combinationsExamined++;

    let ok = true;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const r = masksConflict(groupMasks[i]![indices[i]!]!, groupMasks[j]![indices[j]!]!);
        conflictChecks += r.checks;
        if (r.hit) {
          ok = false;
          break outer;
        }
      }
    }

    if (ok) {
      solutions.push(canonicalKey(groups.map((g, i) => g[indices[i]!]!)));
      if (solutions.length >= maxResults) break;
    }

    // Odometer increment across the Cartesian product.
    let k = groups.length - 1;
    while (k >= 0) {
      indices[k]!++;
      if (indices[k]! < groups[k]!.length) break;
      indices[k] = 0;
      k--;
    }
    if (k < 0) break;
  }

  return {
    solutions: solutions.sort(),
    combinationsExamined,
    conflictChecks,
    timeMs: performance.now() - t0,
  };
}
