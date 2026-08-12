import { describe, it, expect, beforeEach } from "vitest";
import { useSimulationStore, poolSignature, type CourseData } from "../store/useSimulationStore";

// The store carries the distinction between the pool the user is editing and
// the instance the engine is actually running, which is what the run flow in
// the simulator is built on. These tests pin that distinction down, including
// the no-op paths the disabled transport controls now cover.

const MON: CourseData = {
    courseCode: "AAA 1000",
    sections: [{ courseCode: "AAA 1000", sectionNo: 1, days: [{ day: "Monday", startTime: "08:40", endTime: "10:40" }] }],
};

const TUE: CourseData = {
    courseCode: "BBB 2000",
    sections: [{ courseCode: "BBB 2000", sectionNo: 1, days: [{ day: "Tuesday", startTime: "08:40", endTime: "10:40" }] }],
};

beforeEach(() => {
    useSimulationStore.setState({
        sections: [],
        selectedCourses: [],
        loadedSignature: null,
        generator: null,
        currentState: null,
        treeRoot: null,
        activePathIds: [],
        isPlaying: false,
        validSchedules: [],
        activeValidScheduleIndex: 0,
    });
});

describe("poolSignature", () => {
    it("is order independent, so reordering a pool is not a change", () => {
        expect(poolSignature([MON, TUE])).toBe(poolSignature([TUE, MON]));
    });

    it("distinguishes different pools", () => {
        expect(poolSignature([MON])).not.toBe(poolSignature([MON, TUE]));
    });

    it("is empty for an empty pool", () => {
        expect(poolSignature([])).toBe("");
    });
});

describe("run", () => {
    it("loads the pool, builds a generator and starts playing", () => {
        const store = useSimulationStore.getState();
        store.setCourses([MON, TUE]);
        store.run();

        const s = useSimulationStore.getState();
        expect(s.sections).toHaveLength(2);
        expect(s.generator).not.toBeNull();
        expect(s.currentState).not.toBeNull();
        expect(s.loadedSignature).toBe(poolSignature([MON, TUE]));
        // The old initializeSimulation stopped short of this, which is why a
        // button labelled Run produced no visible motion.
        expect(s.isPlaying).toBe(true);
    });

    it("does nothing with an empty pool", () => {
        useSimulationStore.getState().run();

        const s = useSimulationStore.getState();
        expect(s.sections).toHaveLength(0);
        expect(s.generator).toBeNull();
        expect(s.loadedSignature).toBeNull();
        expect(s.isPlaying).toBe(false);
    });
});

describe("staleness", () => {
    it("appears when a course is added after a run", () => {
        const store = useSimulationStore.getState();
        store.setCourses([MON]);
        store.run();

        const fresh = useSimulationStore.getState();
        expect(poolSignature(fresh.selectedCourses)).toBe(fresh.loadedSignature);

        useSimulationStore.getState().addCourse(TUE);

        const stale = useSimulationStore.getState();
        expect(poolSignature(stale.selectedCourses)).not.toBe(stale.loadedSignature);
        // The loaded instance is untouched, which is exactly the trap the strip
        // in the UI now reports rather than leaving silent.
        expect(stale.sections).toHaveLength(1);
    });

    it("clears when the new pool is run", () => {
        const store = useSimulationStore.getState();
        store.setCourses([MON]);
        store.run();
        useSimulationStore.getState().addCourse(TUE);
        useSimulationStore.getState().run();

        const s = useSimulationStore.getState();
        expect(poolSignature(s.selectedCourses)).toBe(s.loadedSignature);
        expect(s.sections).toHaveLength(2);
    });
});

describe("no instance", () => {
    it("reset with no sections clears the loaded signature", () => {
        const store = useSimulationStore.getState();
        store.setCourses([MON]);
        store.run();
        expect(useSimulationStore.getState().loadedSignature).not.toBeNull();

        useSimulationStore.getState().setSections([]);

        const s = useSimulationStore.getState();
        expect(s.loadedSignature).toBeNull();
        expect(s.generator).toBeNull();
    });

    it("step and play are no-ops, which is why the buttons are disabled", () => {
        useSimulationStore.getState().step();
        expect(useSimulationStore.getState().currentState).toBeNull();

        useSimulationStore.getState().play();
        expect(useSimulationStore.getState().isPlaying).toBe(false);
        expect(useSimulationStore.getState().generator).toBeNull();
    });
});

describe("reset", () => {
    it("replays the same instance from the start, paused", () => {
        const store = useSimulationStore.getState();
        store.setCourses([MON, TUE]);
        store.run();

        useSimulationStore.getState().instantCompute();
        expect(useSimulationStore.getState().currentState?.step).toBe("COMPLETE");

        useSimulationStore.getState().reset();

        const s = useSimulationStore.getState();
        expect(s.isPlaying).toBe(false);
        expect(s.currentState?.step).not.toBe("COMPLETE");
        expect(s.validSchedules).toHaveLength(0);
        // Same instance, so the pool and the engine still agree.
        expect(s.loadedSignature).toBe(poolSignature([MON, TUE]));
        expect(s.sections).toHaveLength(2);
    });
});
