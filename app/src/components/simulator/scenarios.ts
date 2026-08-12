// Preset course pools for the simulator.
//
// Held apart from CourseSelector so Visualizer can reach the default for its
// first-visit preload without importing a component.

export interface Scenario {
    label: string;
    note: string;
    codes: string[];
}

export const TEST_SCENARIOS: Scenario[] = [
    { label: "Software Eng (Year 2)", note: "Wide branching tree.", codes: ["MATH 2261", "SE 2226", "SE 2228", "SE 2230", "SE 2232"] },
    { label: "Psychology (Year 1)", note: "Standard core, quick resolution.", codes: ["MATH 1114", "PHIL 1100", "PSYC 1020", "PSYC 1102", "SOFL 1102"] },
    { label: "Industrial Eng (Year 1)", note: "Heavy lab blocks.", codes: ["CHEM 1130", "ENGR 1116", "MATH 1132", "SOFL 1102"] },
    { label: "The Chaos Edge Case", note: "Cross-semester collision testing. Heavy backtracking.", codes: ["MATH 1131", "SE 2226", "SE 3332", "SE 4458"] },
];

/** What an empty first visit loads, so the page is never a blank screen. */
export const DEFAULT_SCENARIO = TEST_SCENARIOS[0]!;
