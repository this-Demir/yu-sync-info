import { describe, it, expect } from "vitest";
import { generateSchedules } from "../core/scheduler";
import { simulateScheduling } from "../core/SimulationEngine";
import type { Section } from "../core/types";
import courseData from "../data/yu_sync_test_courses.json";

function getSectionsForCourses(codes: string[]) {
    const courses = (courseData as any[]).filter(c => codes.includes(c.courseCode ?? c.CourseCode));
    return courses.flatMap(c => c.sections ?? c.Sections ?? []);
}

describe("Core Engine Parity Verification", () => {

    function assertParity(scenarioName: string, courseCodes: string[], maxResults = 200) {
        const testSections = getSectionsForCourses(courseCodes);
        expect(testSections.length).toBeGreaterThan(0);

        // 1. Run Production Engine (with stats enabled)
        const originalResult = generateSchedules(testSections, maxResults, { enableStats: true });
        const originalSchedules = originalResult.results;
        const originalStats = originalResult.stats;

        // 2. Run Simulation Engine (tracking metrics manually)
        const t0 = performance.now();
        const gen = simulateScheduling(testSections, maxResults);
        let simulatedSchedules: Section[][] = [];

        let simNodes = 0;
        let simPruned = 0;

        for (const state of gen) {
            if (state.step === "SELECTING") {
                simNodes++;
            }
            if (state.step === "CONFLICT") {
                simPruned++;
            }
            if (state.step === "COMPLETE") {
                simulatedSchedules = state.foundSchedules;
            }
        }
        const simTimeMs = performance.now() - t0;

        // Calculate theoretical state-space complexity
        const grouped = new Map<string, Section[]>();
        for (const s of testSections) {
            const list = grouped.get(s.courseCode) || [];
            list.push(s);
            grouped.set(s.courseCode, list);
        }
        let complexity = 1;
        for (const [, sections] of grouped) {
            complexity *= sections.length;
        }

        // 3. Print Comparison
        console.log(`\n=== Scenario: ${scenarioName} ===`);
        console.log(`Theoretical State-Space Complexity: ${complexity} possible combinations`);
        console.table({
            "Production Engine (scheduler.ts)": {
                "Time (ms)": Number(originalStats.timeMs.toFixed(2)),
                "Nodes Evaluated": originalStats.nodes,
                "Branches Pruned": originalStats.pruned,
                "Valid Schedules": originalSchedules.length,
            },
            "Simulation Engine (SimulationEngine.ts)": {
                "Time (ms)": Number(simTimeMs.toFixed(2)),
                "Nodes Evaluated": simNodes,
                "Branches Pruned": simPruned,
                "Valid Schedules": simulatedSchedules.length,
            }
        });

        // 4. Execution Assertions
        expect(simulatedSchedules.length).toEqual(originalSchedules.length);
        expect(simulatedSchedules).toEqual(originalSchedules);

        // Assert that they mathematically explored the exact same tree structure
        expect(simNodes).toEqual(originalStats.nodes);
        expect(simPruned).toEqual(originalStats.pruned);
    }

    it("Scenario 1: Software Eng (Year 2) - wide-branching tree", () => {
        assertParity("Software Eng (Year 2)", ["MATH 2261", "SE 2226", "SE 2228", "SE 2230", "SE 2232"]);
    });

    it("Scenario 2: Psychology (Year 1) - standard core curriculum", () => {
        assertParity("Psychology (Year 1)", ["MATH 1114", "PHIL 1100", "PSYC 1020", "PSYC 1102", "SOFL 1102"]);
    });

    it("Scenario 3: Industrial Eng (Year 1) - heavy lab blocks", () => {
        assertParity("Industrial Eng (Year 1)", ["CHEM 1130", "ENGR 1116", "MATH 1132", "SOFL 1102"]);
    });

    it("Scenario 4: The Chaos Edge Case - cross-semester heavy backtracking", () => {
        assertParity("The Chaos Edge Case", ["MATH 1131", "SE 2226", "SE 3332", "SE 4458"]);
    });
});
