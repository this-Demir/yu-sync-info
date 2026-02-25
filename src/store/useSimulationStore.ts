import { create } from "zustand";
import { simulateScheduling, type SimulationState } from "../core/SimulationEngine";
import type { Section } from "../core/types";

export interface CourseData {
    courseCode: string;
    courseName?: string;
    year?: number;
    semester?: string;
    sections: Section[];
}

export interface TreeNode {
    id: string; // Unique ID, e.g. level-course-section
    courseCode: string;
    sectionNo: number;
    status: "SUCCEEDED" | "FAILED" | "EVALUATING" | "PRUNED" | "PENDING";
    parentId: string | null;
    children: TreeNode[];
    level: number;
}

interface SimulationStore {
    // Data
    sections: Section[];
    selectedCourses: CourseData[];

    // Engine State
    generator: Generator<SimulationState, void, unknown> | null;
    currentState: SimulationState | null;

    // Tree State
    treeRoot: TreeNode | null;
    activePathIds: string[]; // Keep track of the current path

    // Playback State
    isPlaying: boolean;
    speedMultiplier: number; // 1x is normal speed

    // Multi-Solution State
    validSchedules: Section[][];
    activeValidScheduleIndex: number;

    // Setup Actions
    setSections: (sections: Section[]) => void;
    setCourses: (courses: CourseData[]) => void;
    addCourse: (course: CourseData) => void;
    removeCourse: (courseCode: string) => void;
    initializeSimulation: () => void;
    setSpeedMultiplier: (speed: number) => void;

    // Control Actions
    play: () => void;
    pause: () => void;
    step: () => void;
    reset: () => void;
    instantCompute: () => void;
    setActiveSchedule: (index: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
    sections: [],
    selectedCourses: [],
    generator: null,
    currentState: null,
    treeRoot: null,
    activePathIds: [],
    isPlaying: false,
    speedMultiplier: 1.0,
    validSchedules: [],
    activeValidScheduleIndex: 0,

    setSections: (sections) => {
        set({ sections });
        get().reset();
    },

    setCourses: (courses) => {
        set({ selectedCourses: courses });
    },

    addCourse: (course) => {
        const { selectedCourses } = get();
        if (!selectedCourses.find(c => c.courseCode === course.courseCode)) {
            set({ selectedCourses: [...selectedCourses, course] });
        }
    },

    removeCourse: (courseCode) => {
        set(state => ({
            selectedCourses: state.selectedCourses.filter(c => c.courseCode !== courseCode)
        }));
    },

    initializeSimulation: () => {
        const { selectedCourses } = get();
        // Flatten all sections from selected courses
        const allSections = selectedCourses.flatMap(c => c.sections);
        set({ sections: allSections });
        get().reset(); // Resets the simulation with the new sections
    },

    setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),

    play: () => {
        const { generator, currentState } = get();
        if (!generator) {
            get().reset();
            // Start playing only if reset actually created a generator and initial state is valid
            const newGen = get().generator;
            if (newGen) {
                const current = get().currentState;
                if (current?.step !== "COMPLETE" && current?.step !== "SUCCESS") {
                    set({ isPlaying: true });
                }
            }
        } else if (currentState?.step === "COMPLETE") {
            return;
        } else {
            set({ isPlaying: true });
        }
    },

    pause: () => set({ isPlaying: false }),

    step: () => {
        const { generator } = get();
        if (!generator) return;

        const result = generator.next();
        if (!result.done && result.value) {
            let nextState = result.value;
            set({ currentState: nextState });

            // Build the state-space tree incrementally
            let { treeRoot, activePathIds } = get();

            // Clone root to trigger re-renders
            let newRoot = treeRoot ? JSON.parse(JSON.stringify(treeRoot)) as TreeNode : null;
            let newActivePath = [...activePathIds];

            const level = nextState.currentCourseIndex ?? 0;
            const evalSec = nextState.evaluatingSection;

            if (nextState.step === "INIT" && !newRoot) {
                newRoot = {
                    id: "root",
                    courseCode: "ROOT",
                    sectionNo: 0,
                    status: "SUCCEEDED",
                    parentId: null,
                    children: [],
                    level: -1
                };
                newActivePath = ["root"];
            }

            if (newRoot && evalSec) {
                const nodeId = `level-${level}-${evalSec.courseCode}-sec-${evalSec.sectionNo}`;
                const parentId = level === 0 ? "root" : newActivePath[level]; // the active node at level-1 is parent

                // Find parent node
                const findNode = (node: TreeNode, targetId: string): TreeNode | null => {
                    if (node.id === targetId) return node;
                    for (const child of node.children) {
                        const found = findNode(child, targetId);
                        if (found) return found;
                    }
                    return null;
                };

                const parentNode = findNode(newRoot, parentId!);

                if (parentNode) {
                    // Check if node already exists under this parent
                    let targetNode = parentNode.children.find(c => c.id === nodeId);

                    if (!targetNode && nextState.step === "SELECTING") {
                        // Create node
                        targetNode = {
                            id: nodeId,
                            courseCode: evalSec.courseCode,
                            sectionNo: evalSec.sectionNo,
                            status: "EVALUATING",
                            parentId: parentId,
                            children: [],
                            level
                        };
                        parentNode.children.push(targetNode);
                        newActivePath[level + 1] = nodeId;
                    }

                    if (targetNode) {
                        // Update status based on step
                        if (nextState.step === "CONFLICT") {
                            targetNode.status = "FAILED";
                        } else if (nextState.step === "BACKTRACKING") {
                            targetNode.status = targetNode.status === "FAILED" ? "FAILED" : "PRUNED";
                        } else if (nextState.step === "SELECTING" || nextState.step === "BITMASK_CHECK") {
                            targetNode.status = "EVALUATING";
                            newActivePath[level + 1] = nodeId;
                        } else {
                            // Being explored, keep it Evaluating until either conflict or backtrack or success
                            targetNode.status = "EVALUATING";
                        }
                    }
                }
            }

            if (nextState.step === "SUCCESS" && newRoot) {
                const findNode = (node: TreeNode, targetId: string): TreeNode | null => {
                    if (node.id === targetId) return node;
                    for (const child of node.children) {
                        const found = findNode(child, targetId);
                        if (found) return found;
                    }
                    return null;
                };

                // ensure everything in active path is marked succeeded just in case
                for (let i = 1; i <= nextState.chosenSections.length; i++) {
                    const nid = newActivePath[i];
                    if (nid) {
                        const n = findNode(newRoot, nid);
                        if (n) n.status = "SUCCEEDED";
                    }
                }
            }

            set({
                treeRoot: newRoot,
                activePathIds: newActivePath,
                validSchedules: nextState.foundSchedules || get().validSchedules,
            });

        } else if (result.done) {
            set({ isPlaying: false });
        }
    },

    reset: () => {
        const { sections } = get();
        if (sections.length === 0) {
            set({ generator: null, currentState: null, isPlaying: false, treeRoot: null, activePathIds: [] });
            return;
        }

        const newGenerator = simulateScheduling(sections);
        const firstStep = newGenerator.next();

        let initialRoot: TreeNode = {
            id: "root",
            courseCode: "ROOT",
            sectionNo: 0,
            status: "SUCCEEDED",
            parentId: null,
            children: [],
            level: -1
        };

        set({
            generator: newGenerator,
            currentState: firstStep.value ? firstStep.value : null,
            isPlaying: false,
            treeRoot: initialRoot,
            activePathIds: ["root"],
            validSchedules: [],
            activeValidScheduleIndex: 0
        });
    },

    instantCompute: () => {
        let { generator } = get();
        if (!generator) {
            get().reset();
            generator = get().generator;
            if (!generator) return;
        }

        set({ isPlaying: false });

        // Loop until step is COMPLETE or the generator finishes
        while (get().currentState?.step !== "COMPLETE") {
            const currentGen = get().generator;
            if (!currentGen) break;
            get().step();
        }
    },

    setActiveSchedule: (index) => {
        const { validSchedules } = get();
        if (index >= 0 && index < validSchedules.length) {
            set({ activeValidScheduleIndex: index });
        }
    }
}));
