import { useSimulationStore, poolSignature } from "../../store/useSimulationStore";

// The one place that decides what state the engine is in.
//
// The pool the user edits and the instance the engine runs are separate pieces
// of state, and every surface that cares reads this rather than recomputing, so
// the pool footer, the stale strip, the transport controls and the empty states
// cannot disagree about whether something is loaded.

export interface RunState {
    /** No courses picked, so there is nothing to run. */
    poolEmpty: boolean;
    /** An instance is loaded, so the transport controls mean something. */
    hasInstance: boolean;
    /** The pool has been edited since the loaded instance was built. */
    isStale: boolean;
    /** Courses currently in the pool. */
    count: number;
}

export function useRunState(): RunState {
    const selectedCourses = useSimulationStore(s => s.selectedCourses);
    const sections = useSimulationStore(s => s.sections);
    const loadedSignature = useSimulationStore(s => s.loadedSignature);

    const hasInstance = sections.length > 0;

    return {
        poolEmpty: selectedCourses.length === 0,
        hasInstance,
        isStale: hasInstance && poolSignature(selectedCourses) !== loadedSignature,
        count: selectedCourses.length,
    };
}
