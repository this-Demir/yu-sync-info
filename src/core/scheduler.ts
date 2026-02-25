// src/core/scheduler.ts
import type { Section } from "./types";
import { parseHHMM } from "./time";

const SCHEDULER_DEADLINE_MS = 1200;

function normalizeSections(rawSections: any[]): Section[] {
  return (rawSections ?? [])
    .map((s: any) => {
      const daysRaw: any[] = s.days ?? s.Days ?? [];
      const days = daysRaw
        .map((d: any) => ({
          day: d.day ?? d.Day ?? "",
          startTime: d.startTime ?? d.StartTime ?? "",
          endTime: d.endTime ?? d.EndTime ?? "",
          classroom: d.classroom ?? d.Classroom ?? "",
        }))
        .filter((d) => d.day && d.startTime && d.endTime);

      return {
        courseCode: s.courseCode ?? s.CourseCode ?? "",
        sectionNo: Number(s.sectionNo ?? s.SectionNo ?? 0),
        days,
        isRetake: !!s.isRetake, 
      } as Section;
    })
    .filter((s: Section) => !!s.courseCode && s.days.length > 0);
}

const SLOT_STARTS = [
  "08:40","09:40","10:40","11:40","12:40","13:40",
  "14:40","15:40","16:40","17:40","18:40","19:40"
] as const;

const SLOT_STARTS_MIN: number[] = Array.from(SLOT_STARTS, (t) => parseHHMM(t)).filter(
  (n): n is number => Number.isFinite(n)
);

function rangeToMask(start: string, end: string): number {
  const sMin = parseHHMM(start);
  const eMin = parseHHMM(end);
  let mask = 0;
  for (const [i, slotMin] of SLOT_STARTS_MIN.entries()) {
    if (slotMin >= sMin && slotMin < eMin) mask |= (1 << i);
  }
  return mask;
}

type WeekMask = {
  Monday: number; Tuesday: number; Wednesday: number; Thursday: number; Friday: number;
  Saturday: number; Sunday: number;
};

function emptyWeekMask(): WeekMask {
  return { Monday:0, Tuesday:0, Wednesday:0, Thursday:0, Friday:0, Saturday:0, Sunday:0 };
}

function buildSectionMasks(sections: Section[]) {
  return sections.map(s => ({
    section: s,
    masks: s.days.map(d => ({
      day: d.day as keyof WeekMask,
      mask: rangeToMask(d.startTime, d.endTime)
    }))
  }));
}

function popcount(x: number) {
  let c = 0;
  while (x) { x &= x - 1; c++; }
  return c;
}

// --- STATISTICS TYPES ---
export interface ScheduleStats {
  nodes: number;        // Number of visited nodes
  pruned: number;       // Number of pruned branches
  depthReached: number; // Maximum depth reached
  timeMs: number;       // Elapsed time (ms)
  solutionCount: number; // Number of solutions found
}


export type SchedulerResult = {
  results: Section[][];
  stats: ScheduleStats;
};

const EMPTY_STATS: ScheduleStats = { nodes: 0, pruned: 0, depthReached: 0, timeMs: 0, solutionCount: 0 };

export function generateSchedules(
  sectionsInput: any[],
  maxResults = 200,
  opts?: { 
    deadlineMs?: number; 
    maxNodes?: number; 
    estSpaceLimit?: number; 
    enableStats?: boolean 
  }
): SchedulerResult {
  
  const enableStats = opts?.enableStats ?? false;
  const t0 = enableStats ? performance.now() : 0;
  const sections = normalizeSections(sectionsInput);
  
  if (sections.length === 0) {
     return { results: [], stats: EMPTY_STATS };
  }

  const grouped = new Map<string, Section[]>();
  for (const s of sections) {
    const list = grouped.get(s.courseCode) ?? [];
    list.push(s);
    grouped.set(s.courseCode, list);
  }
  const courses = Array.from(grouped.keys());
  
  if (courses.length === 0) {
    return { results: [], stats: EMPTY_STATS };
  }

  courses.sort((a, b) => (grouped.get(a)!.length - grouped.get(b)!.length));

  type Masked = {
    section: Section;
    masks: { day: keyof WeekMask; mask: number }[];
    weight: number;
  };

  const groupedMasked: Masked[][] = courses.map(course => {
    const base = grouped.get(course) ?? [];
    const arr: Masked[] = buildSectionMasks(base).map(m => {
      const weight = m.masks.reduce((acc, x) => acc + popcount(x.mask), 0);
      return { ...m, weight };
    });
    arr.sort((x, y) => x.weight - y.weight);
    return arr;
  });

  if (groupedMasked.some(options => (options?.length ?? 0) === 0)) {
     return { 
       results: [], 
       stats: enableStats ? { ...EMPTY_STATS, timeMs: performance.now() - t0 } : EMPTY_STATS 
     };
  }

  const EST_SPACE_LIMIT = opts?.estSpaceLimit ?? 5_000_000;
  let estSpace = 1;
  for (const options of groupedMasked) {
    estSpace *= options.length;
    if (estSpace > EST_SPACE_LIMIT) {
        return { results: [], stats: EMPTY_STATS };
    }
  }

  const results: Section[][] = [];
  const week = emptyWeekMask();

  const deadline = (enableStats ? t0 : (typeof performance !== "undefined" ? performance.now() : Date.now())) + (opts?.deadlineMs ?? SCHEDULER_DEADLINE_MS);
  const maxNodes = opts?.maxNodes ?? 1_000_000;
  const safeMaxResults = Math.max(0, Math.floor(Number.isFinite(maxResults as any) ? (maxResults as number) : 0));
  

  let nodes = 0; 
  let pruned = 0;
  let maxDepth = 0;


  const timeUp = () => {
    if (nodes >= maxNodes) return true;

    if ((nodes & 63) === 0) { 
        return (typeof performance !== "undefined" ? performance.now() : Date.now()) > deadline;
    }
    return false;
  };

  function fits(weekMask: WeekMask, option: { masks: { day: keyof WeekMask; mask: number }[] }): boolean {
    for (const { day, mask } of option.masks) {
      if ((weekMask[day] & mask) !== 0) return false;
    }
    return true;
  }

  function place(weekMask: WeekMask, option: { masks: { day: keyof WeekMask; mask: number }[] }): WeekMask {
    const next = { ...weekMask } as WeekMask;
    for (const { day, mask } of option.masks) next[day] |= mask;
    return next;
  }

  function dfs(i: number, w: WeekMask, chosen: Section[]) {

    if (enableStats && i > maxDepth) maxDepth = i;

    if (results.length >= safeMaxResults || timeUp()) return;
    
    if (i === groupedMasked.length) {
      results.push(chosen.slice());
      return;
    }

    const options = groupedMasked[i] ?? [];
    if (options.length === 0) return;

    for (const opt of options) {
      nodes++; 
      
      const isGhost = !!opt.section.isRetake; 

      if (!isGhost && !fits(w, opt)) {
        if (enableStats) pruned++; 
        continue;
      }
      
      const nextMask = isGhost ? w : place(w, opt);

      dfs(i + 1, nextMask, [...chosen, opt.section]);
      
      if (results.length >= safeMaxResults || timeUp()) return;
    }
  }

  dfs(0, week, []);
  

  let stats = EMPTY_STATS;
  
  if (enableStats) {
    const t1 = performance.now();
    stats = {
      nodes,
      pruned,
      depthReached: maxDepth,
      timeMs: parseFloat((t1 - t0).toFixed(2)),
      solutionCount: results.length
    };
  }

  return { results, stats };
}


function maskCollision(
  masksA: { day: keyof WeekMask; mask: number }[],
  masksB: { day: keyof WeekMask; mask: number }[]
): boolean {
  for (const mA of masksA) {
    for (const mB of masksB) {
      if (mA.day === mB.day) {
        if ((mA.mask & mB.mask) !== 0) return true;
      }
    }
  }
  return false;
}

function formatCourseWithSections(code: string, items: { section: Section }[]): string {
  if (items.length === 1) {
    return `${code}-${items[0]!.section.sectionNo}`;
  }
  
  if (items.length <= 3) {
    const nums = items.map(x => x.section.sectionNo).sort((a,b) => a-b).join(", ");
    return `${code} (${nums})`;
  }

  return `${code} (${items.length} şube)`;
}

export function findConflicts(sectionsInput: any[]): string[] {
  const sections = normalizeSections(sectionsInput);
  if (sections.length === 0) return [];

  const grouped = new Map<string, Section[]>();
  for (const s of sections) {
    const list = grouped.get(s.courseCode) ?? [];
    list.push(s);
    grouped.set(s.courseCode, list);
  }
  const courses = Array.from(grouped.keys());

  const courseMasks = new Map<string, ReturnType<typeof buildSectionMasks>>();

  for (const code of courses) {
    const secs = grouped.get(code) ?? [];
    courseMasks.set(code, buildSectionMasks(secs));
  }

  const conflicts: string[] = [];

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const codeA = courses[i]!;
      const codeB = courses[j]!;

      const maskedSecsA = courseMasks.get(codeA) ?? [];
      const maskedSecsB = courseMasks.get(codeB) ?? [];

      let canCoexist = false;

      outerLoop: for (const a of maskedSecsA) {
        for (const b of maskedSecsB) {
          if (!maskCollision(a.masks, b.masks)) {
            canCoexist = true;
            break outerLoop;
          }
        }
      }

      if (!canCoexist) {
        const nameA = formatCourseWithSections(codeA, maskedSecsA);
        const nameB = formatCourseWithSections(codeB, maskedSecsB);
        conflicts.push(`${nameA} ↔ ${nameB}`);
      }
    }
  }

  return conflicts;
}