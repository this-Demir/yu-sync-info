import type { Section, DayName } from "./types";
import { parseHHMM, emptyWeekMask, SLOTS } from "./time";

// Helpers copied from scheduler logic to keep SimulationEngine self-contained
// but using the common types/time

const SLOT_STARTS_MIN: number[] = Array.from(SLOTS, (t) => parseHHMM(t)).filter(
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

export type WeekMask = Record<DayName, number>;

function buildSectionMasks(sections: Section[]) {
    return sections.map(s => ({
        section: s,
        masks: s.days.map(d => ({
            day: d.day as DayName,
            mask: rangeToMask(d.startTime, d.endTime)
        }))
    }));
}

function popcount(x: number) {
    let c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
}

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

// SIMULATION TYPES
export type SimulationStepType =
    | "INIT"
    | "SELECTING"
    | "BITMASK_CHECK"
    | "CONFLICT"
    | "BACKTRACKING"
    | "SUCCESS"
    | "COMPLETE";

export interface SimulationState {
    step: SimulationStepType;
    currentCourseIndex?: number;
    currentCourseCode?: string;
    evaluatingSection?: Section;
    currentMask: WeekMask;
    chosenSections: Section[];
    foundSchedules: Section[][];
    message: string;
}

export function* simulateScheduling(
    sectionsInput: any[],
    maxResults = 200
): Generator<SimulationState, void, unknown> {
    const sections = normalizeSections(sectionsInput);

    const foundSchedules: Section[][] = [];
    const baseState = { currentMask: emptyWeekMask(), chosenSections: [], foundSchedules };

    yield {
        step: "INIT",
        message: `Initializing scheduling with ${sections.length} valid sections.`,
        ...baseState
    };

    if (sections.length === 0) {
        yield { step: "COMPLETE", message: "No sections provided.", ...baseState };
        return;
    }

    const grouped = new Map<string, Section[]>();
    for (const s of sections) {
        const list = grouped.get(s.courseCode) ?? [];
        list.push(s);
        grouped.set(s.courseCode, list);
    }
    const courses = Array.from(grouped.keys());

    if (courses.length === 0) {
        yield { step: "COMPLETE", message: "No courses found after grouping.", ...baseState };
        return;
    }

    courses.sort((a, b) => (grouped.get(a)!.length - grouped.get(b)!.length));

    type Masked = {
        section: Section;
        masks: { day: DayName; mask: number }[];
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
        yield { step: "COMPLETE", message: "Some courses have no valid sections. Impossible to schedule.", ...baseState };
        return;
    }

    function fits(weekMask: WeekMask, option: Masked): boolean {
        for (const { day, mask } of option.masks) {
            if ((weekMask[day] & mask) !== 0) return false;
        }
        return true;
    }

    function place(weekMask: WeekMask, option: Masked): WeekMask {
        const next = { ...weekMask };
        for (const { day, mask } of option.masks) next[day] |= mask;
        return next;
    }

    yield {
        step: "INIT",
        message: `Algorithm ready. Courses to schedule: ${courses.join(", ")}`,
        ...baseState
    };

    function* dfs(i: number, w: WeekMask, chosen: Section[]): Generator<SimulationState, void, unknown> {
        if (foundSchedules.length >= maxResults) return;

        if (i === groupedMasked.length) {
            foundSchedules.push([...chosen]);
            yield {
                step: "SUCCESS",
                message: `Found a valid schedule! (Total: ${foundSchedules.length})`,
                currentCourseIndex: i,
                currentMask: w,
                chosenSections: [...chosen],
                foundSchedules
            };
            return;
        }

        const currentCourseCode = courses[i];
        const options = groupedMasked[i] ?? [];

        for (const opt of options) {
            const isGhost = !!opt.section.isRetake;

            yield {
                step: "SELECTING",
                message: `Selecting ${currentCourseCode} - Section ${opt.section.sectionNo} (Ghost: ${isGhost})`,
                currentCourseIndex: i,
                currentCourseCode,
                evaluatingSection: opt.section,
                currentMask: w,
                chosenSections: [...chosen],
                foundSchedules
            };

            yield {
                step: "BITMASK_CHECK",
                message: `Checking bitmask collision for ${currentCourseCode} - Section ${opt.section.sectionNo}...`,
                currentCourseIndex: i,
                currentCourseCode,
                evaluatingSection: opt.section,
                currentMask: w,
                chosenSections: [...chosen],
                foundSchedules
            };

            if (!isGhost && !fits(w, opt)) {
                yield {
                    step: "CONFLICT",
                    message: `Conflict detected for ${currentCourseCode} - Section ${opt.section.sectionNo}!`,
                    currentCourseIndex: i,
                    currentCourseCode,
                    evaluatingSection: opt.section,
                    currentMask: w,
                    chosenSections: [...chosen],
                    foundSchedules
                };

                yield {
                    step: "BACKTRACKING",
                    message: `Backtracking from ${currentCourseCode} - Section ${opt.section.sectionNo}. Trying alternative branch...`,
                    currentCourseIndex: i,
                    currentCourseCode,
                    evaluatingSection: opt.section,
                    currentMask: w,
                    chosenSections: [...chosen],
                    foundSchedules
                };
                continue;
            }

            const nextMask = isGhost ? w : place(w, opt);
            const nextChosen = [...chosen, opt.section];

            yield* dfs(i + 1, nextMask, nextChosen);

            if (foundSchedules.length >= maxResults) return;

            yield {
                step: "BACKTRACKING",
                message: `Exploring other sections after ${currentCourseCode} - Section ${opt.section.sectionNo}.`,
                currentCourseIndex: i,
                currentCourseCode,
                evaluatingSection: opt.section,
                currentMask: w,
                chosenSections: [...chosen],
                foundSchedules
            };
        }
    }

    yield* dfs(0, emptyWeekMask(), []);

    yield {
        step: "COMPLETE",
        message: `Simulation complete. Total schedules found: ${foundSchedules.length}.`,
        ...baseState
    };
}
