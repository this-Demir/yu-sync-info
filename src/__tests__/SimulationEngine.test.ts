import { describe, it, expect } from "vitest";
import { simulateScheduling, type SimulationState } from "../core/SimulationEngine";

describe("SimulationEngine Generator", () => {
    it("should yield INIT, SELECTING, BITMASK_CHECK, CONFLICT, BACKTRACKING, and SUCCESS", () => {
        // Mock data designed to test conflict and successful backtracking.
        // MATHA has 1 section (Monday morning).
        // COMPA has 2 sections: 
        //   - Sec 1 is Monday morning (will conflict with MATHA).
        //   - Sec 2 is Tuesday morning (will succeed).
        const mockSections = [
            {
                courseCode: "COMPA",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            },
            {
                courseCode: "COMPA",
                sectionNo: 2,
                days: [{ day: "Tuesday", startTime: "08:40", endTime: "10:40" }]
            },
            {
                courseCode: "MATHA",
                sectionNo: 1,
                days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }]
            }
        ];

        const gen = simulateScheduling(mockSections);
        const yieldedStates: SimulationState[] = [];

        // Let's iterate until the end
        let result = gen.next();
        while (!result.done) {
            if (result.value) {
                yieldedStates.push(result.value);
            }
            result = gen.next();
        }

        // Extract sequence of steps
        const steps = yieldedStates.map(s => s.step);

        // Initial state
        expect(steps[0]).toBe("INIT"); // Ready state
        expect(steps[1]).toBe("INIT"); // Sorted state

        // We expect a SELECTING, BITMASK_CHECK, CONFLICT, BACKTRACKING because MATHA (Monday) + COMPA Sec 1 (Monday) collide
        expect(steps).toContain("SELECTING");
        expect(steps).toContain("BITMASK_CHECK");
        expect(steps).toContain("CONFLICT");
        expect(steps).toContain("BACKTRACKING");
        expect(steps).toContain("SUCCESS");
        expect(steps).toContain("COMPLETE");

        // The single successfully found schedule should contain MATHA 1 and COMPA 2
        const successState = yieldedStates.find(s => s.step === "SUCCESS");
        expect(successState).toBeDefined();

        const finalSchedule = successState!.foundSchedules[0];
        expect(finalSchedule).toHaveLength(2);
        expect(finalSchedule.find(s => s.courseCode === "MATHA" && s.sectionNo === 1)).toBeDefined();
        expect(finalSchedule.find(s => s.courseCode === "COMPA" && s.sectionNo === 2)).toBeDefined();
    });

    it("should handle empty inputs gracefully", () => {
        const gen = simulateScheduling([]);

        let result = gen.next();
        expect((result.value as SimulationState).step).toBe("INIT");

        result = gen.next();
        expect((result.value as SimulationState).step).toBe("COMPLETE");
        expect(result.done).toBe(false);

        result = gen.next();
        expect(result.done).toBe(true);
    });
});
