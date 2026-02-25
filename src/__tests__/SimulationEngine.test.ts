import { describe, it, expect } from "vitest";
import { simulateScheduling, type SimulationState } from "../core/SimulationEngine";

describe("SimulationEngine Generator", () => {

    it("Valid Scenarios: should yield SUCCESS for a known, non-conflicting set of courses", () => {
        const mockSections = [
            {
                courseCode: "COURSE_A",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            },
            {
                courseCode: "COURSE_B",
                sectionNo: 1,
                days: [{ day: "Tuesday", startTime: "08:40", endTime: "10:40" }]
            }
        ];

        const gen = simulateScheduling(mockSections);
        const yieldedStates: SimulationState[] = [];

        for (const state of gen) {
            yieldedStates.push(state);
        }

        const successState = yieldedStates.find(s => s.step === "SUCCESS");
        expect(successState).toBeDefined();

        const schedule = successState!.foundSchedules[0];
        expect(schedule).toHaveLength(2);
        expect(schedule.find(s => s.courseCode === "COURSE_A" && s.sectionNo === 1)).toBeDefined();
        expect(schedule.find(s => s.courseCode === "COURSE_B" && s.sectionNo === 1)).toBeDefined();
    });

    it("Conflict Scenarios: should correctly yield CONFLICT and force a BACKTRACKING state", () => {
        const mockSections = [
            {
                courseCode: "COURSE_A",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            },
            {
                courseCode: "COURSE_B",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            },
            {
                // This section works as a fallback so the process can succeed after backtracking
                courseCode: "COURSE_B",
                sectionNo: 2,
                days: [{ day: "Tuesday", startTime: "08:40", endTime: "10:40" }]
            }
        ];

        const gen = simulateScheduling(mockSections);
        const yieldedStates: SimulationState[] = [];

        for (const state of gen) {
            yieldedStates.push(state);
        }

        const steps = yieldedStates.map(s => s.step);

        // Assert we hit a conflict and backtracked
        expect(steps).toContain("CONFLICT");
        expect(steps).toContain("BACKTRACKING");

        // The single successfully found schedule should contain COURSE_A 1 and COURSE_B 2
        const successState = yieldedStates.find(s => s.step === "SUCCESS");
        expect(successState).toBeDefined();
        const schedule = successState!.foundSchedules[0];
        expect(schedule).toHaveLength(2);
        expect(schedule.find(s => s.courseCode === "COURSE_A" && s.sectionNo === 1)).toBeDefined();
        expect(schedule.find(s => s.courseCode === "COURSE_B" && s.sectionNo === 2)).toBeDefined();
    });

    it("Exhaustion: should terminate safely when no valid schedules exist", () => {
        const mockSections = [
            {
                courseCode: "COURSE_A",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            },
            {
                courseCode: "COURSE_B",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            }
        ];

        const gen = simulateScheduling(mockSections);
        const yieldedStates: SimulationState[] = [];

        for (const state of gen) {
            yieldedStates.push(state);
        }

        const steps = yieldedStates.map(s => s.step);

        // Engine will conflict both times
        expect(steps).toContain("CONFLICT");
        expect(steps).toContain("BACKTRACKING");

        // But importantly, NEVER reach SUCCESS
        expect(steps).not.toContain("SUCCESS");

        // It must cleanly complete
        expect(steps[steps.length - 1]).toBe("COMPLETE");

        const completeState = yieldedStates.find(s => s.step === "COMPLETE");
        expect(completeState!.foundSchedules).toHaveLength(0);
    });

    it("should handle empty inputs gracefully", () => {
        const gen = simulateScheduling([]);
        const yieldedStates: SimulationState[] = [];

        for (const state of gen) {
            yieldedStates.push(state);
        }

        const steps = yieldedStates.map(s => s.step);
        expect(steps[0]).toBe("INIT");
        expect(steps[1]).toBe("COMPLETE");
    });
});
