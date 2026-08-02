// src/bench/instances.ts
//
// Random Section Selection instance generation.
//
// The engines under test consume `Section[]` with wall-clock strings, so the
// generator emits exactly that rather than an abstract mask representation.
// Instances therefore exercise the real parsing, grouping and ordering paths,
// not a synthetic shortcut around them.
//
// Constraint density is controlled by `placementPool`, the number of distinct
// (day, start slot) placements a section may be assigned. A small pool crowds
// every section into a handful of positions and makes conflicts near certain.
// A large pool spreads them out and makes conflicts rare. Sweeping the pool
// size sweeps density monotonically, which is what Experiment 4 needs.
//
// The nominal pool size is a knob, not a claim. Every experiment reports the
// *measured* density of the instances it generated, computed by
// `measureDensity` below, and plots against that.

import { SLOTS, DAYS } from "../core/time";
import type { DayName, Section } from "../core/types";
import { mulberry32, type Rng } from "./rng";

/** Weekdays only. The engine supports 7 days; real timetables use 5. */
export const BENCH_DAYS: DayName[] = DAYS.slice(0, 5);

/** Slot boundaries, extended by one so a section ending in the last slot has an end time. */
const SLOT_BOUNDS: string[] = [...SLOTS, "20:40"];

export interface InstanceParams {
  /** Number of courses, which is the depth of the search tree. */
  courses: number;
  /** Sections offered per course, which is the branching factor. */
  sectionsPerCourse: number;
  /** Consecutive slots each meeting occupies. */
  meetingLength: number;
  /** Meetings per week per section. */
  meetingsPerSection: number;
  /** How many distinct (day, start) placements sections may draw from. */
  placementPool: number;
  seed: number;
}

export const DEFAULT_PARAMS: Omit<InstanceParams, "courses" | "placementPool" | "seed"> = {
  sectionsPerCourse: 4,
  meetingLength: 2,
  meetingsPerSection: 1,
};

interface Placement {
  day: DayName;
  startSlot: number;
}

/** Every legal (day, start slot) pair, in a fixed canonical order. */
function allPlacements(meetingLength: number): Placement[] {
  const out: Placement[] = [];
  for (const day of BENCH_DAYS) {
    for (let s = 0; s + meetingLength <= SLOTS.length; s++) {
      out.push({ day, startSlot: s });
    }
  }
  return out;
}

export function maxPlacementPool(meetingLength: number): number {
  return allPlacements(meetingLength).length;
}

function courseCode(i: number): string {
  return `C${String(i).padStart(3, "0")}`;
}

/**
 * Builds one random instance. Deterministic in `params.seed`: identical
 * params always yield a structurally identical `Section[]`.
 */
export function generateInstance(params: InstanceParams): Section[] {
  const { courses, sectionsPerCourse, meetingLength, meetingsPerSection, placementPool, seed } = params;
  const rng: Rng = mulberry32(seed);

  // The pool is a deterministic shuffle of all placements truncated to size.
  // Shuffling first means a small pool is not biased toward Monday mornings.
  const pool = rng.shuffle(allPlacements(meetingLength))
    .slice(0, Math.max(1, Math.min(placementPool, maxPlacementPool(meetingLength))));

  const sections: Section[] = [];

  for (let c = 0; c < courses; c++) {
    for (let s = 0; s < sectionsPerCourse; s++) {
      // Draw meetings without replacement so a section never self-overlaps.
      const chosen: Placement[] = [];
      const attemptLimit = 50;
      for (let m = 0; m < meetingsPerSection; m++) {
        let attempt = 0;
        let p = rng.pick(pool);
        while (attempt < attemptLimit && chosen.some(q => q.day === p.day && Math.abs(q.startSlot - p.startSlot) < meetingLength)) {
          p = rng.pick(pool);
          attempt++;
        }
        chosen.push(p);
      }

      sections.push({
        courseCode: courseCode(c),
        sectionNo: s + 1,
        days: chosen.map(p => ({
          day: p.day,
          startTime: SLOT_BOUNDS[p.startSlot]!,
          endTime: SLOT_BOUNDS[p.startSlot + meetingLength]!,
        })),
      });
    }
  }

  return sections;
}

/** Bit i of the returned per-day record is set when the section occupies slot i. */
export function sectionWeekMask(section: Section): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of section.days) {
    const start = SLOT_BOUNDS.indexOf(d.startTime);
    const end = SLOT_BOUNDS.indexOf(d.endTime);
    let mask = 0;
    for (let i = start; i < end; i++) mask |= 1 << i;
    out[d.day] = (out[d.day] ?? 0) | mask;
  }
  return out;
}

export function sectionsConflict(a: Section, b: Section): boolean {
  const ma = sectionWeekMask(a);
  const mb = sectionWeekMask(b);
  for (const day of Object.keys(ma)) {
    if (((ma[day] ?? 0) & (mb[day] ?? 0)) !== 0) return true;
  }
  return false;
}

/**
 * Measured constraint density: the fraction of cross-course section pairs that
 * conflict. This is the honest x-axis for the phase transition study, since it
 * describes the instance actually produced rather than the parameter that was
 * requested. Pairs within a course are excluded because the algorithm never
 * places two sections of the same course together, so such pairs impose no
 * constraint on the search.
 */
export function measureDensity(sections: Section[]): number {
  let pairs = 0;
  let conflicts = 0;
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const a = sections[i]!;
      const b = sections[j]!;
      if (a.courseCode === b.courseCode) continue;
      pairs++;
      if (sectionsConflict(a, b)) conflicts++;
    }
  }
  return pairs === 0 ? 0 : conflicts / pairs;
}

function sectionCounts(sections: Section[]): number[] {
  const counts = new Map<string, number>();
  for (const s of sections) counts.set(s.courseCode, (counts.get(s.courseCode) ?? 0) + 1);
  return [...counts.values()];
}

/**
 * Number of complete assignments, the product of the section counts.
 * These are the leaves of the search tree, not its total size.
 */
export function stateSpaceSize(sections: Section[]): number {
  return sectionCounts(sections).reduce((a, b) => a * b, 1);
}

/**
 * Total nodes in the fully expanded search tree.
 *
 * The engine's node counter increments once per section considered at every
 * depth, so it counts partial assignments as well as complete ones. The
 * matching bound is therefore the sum of the level widths
 *
 *     sum over k of (product of b_i for i <= k)
 *
 * and not the product alone, which counts only the deepest level. Comparing a
 * node count against the product would understate the bound and can report a
 * fraction above one on shallow instances.
 */
export function searchTreeSize(sections: Section[]): number {
  const counts = sectionCounts(sections);
  let level = 1;
  let total = 0;
  for (const b of counts) {
    level *= b;
    total += level;
  }
  return total;
}
