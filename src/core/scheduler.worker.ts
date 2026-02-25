// src/core/scheduler.worker.ts
/// <reference lib="webworker" />
import type { Course, FilterOptions, SectionSelection } from "./types";
import { filterSections } from "./filtering";
import { generateSchedules as gen, findConflicts } from "./scheduler";

function resolveSelections(allCourses: Course[], selections: SectionSelection[]) {
  const byCode = new Map<string, Course>();
  for (const c of allCourses) {
    const code = String(c.courseCode ?? (c as any).CourseCode ?? "").trim();
    byCode.set(code, c as Course);
  }
  const resolved: any[] = [];
  
  for (const sel of selections) {
    const code = String(sel.courseCode).trim();
    const wantedNo = Number(sel.sectionNo);
    const c = byCode.get(code);
    const sec = c?.sections?.find(
      (s) => Number((s as any).sectionNo ?? (s as any).SectionNo) === wantedNo
    );

    // --- GÜNCELLEME BURADA YAPILDI ---
    if (sec) {
      resolved.push({
        ...sec,
        isRetake: !!sel.isRetake 
      });
    }
    // --------------------------------
  }
  return resolved;
}


function validateCoverage(filteredSections: any[], selections: SectionSelection[]) {
  const norm = (v: any) => String(v ?? "").trim();
  const selectedCourses = new Set(selections.map((s) => norm(s.courseCode)));
  const filteredCourses = new Set(
    (filteredSections as any[]).map((s) => norm(s.courseCode ?? s.CourseCode))
  );
  const missing: string[] = [];
  for (const code of selectedCourses) if (!filteredCourses.has(code)) missing.push(code);
  return { ok: missing.length === 0, missing };
}

type InMsg = {
  courses: Course[];
  selections: SectionSelection[];
  filters?: FilterOptions;
  maxResults?: number;
  enableStats?: boolean;
};

type OutMsg =
  | { 
      results: any[][]; 
      total: number; 
      ms: number; 
      conflictInfo?: string[];
      stats?: any; 
    }
  | { error: string; ms: number };

self.onmessage = (e: MessageEvent<InMsg>) => {
  const { courses, selections, filters, maxResults, enableStats } = e.data;
  const t0 = performance.now();

  try {
    const resolved = resolveSelections(courses, selections);
    const filtered = filterSections(resolved as any[], filters);


    const { ok, missing } = validateCoverage(filtered, selections);
    if (!ok) {
      const t1 = performance.now();
      (self as unknown as Worker).postMessage({
        error:
          "Your filters remove some selected courses: " +
          missing.join(", "),
        ms: t1 - t0,
      } as OutMsg);
      return;
    }


    const { results, stats } = gen(filtered, maxResults ?? 200, { enableStats });

    
    const t1 = performance.now();

    if (results.length > 0) {
      // SUCCESS
      (self as unknown as Worker).postMessage({
        results,
        total: results.length,
        ms: t1 - t0,
        stats, 
      } as OutMsg);
    } else {
      // FAIL TO FIND CONFLICT FREE TIMETABLES
      // THEN FIND WHICH COURSES CONFLICT EACH OTHER
      const conflicts = findConflicts(filtered);
      
      (self as unknown as Worker).postMessage({
        results: [],
        total: 0,
        conflictInfo: conflicts, 
        ms: t1 - t0,
        stats, 
      } as OutMsg);
    }

  } catch (err: any) {
    const t1 = performance.now();
    (self as unknown as Worker).postMessage({
      error: String(err?.message ?? err),
      ms: t1 - t0,
    } as OutMsg);
  }
};