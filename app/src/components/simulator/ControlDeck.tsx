import { Play, Pause, StepForward, RotateCcw, Zap, Download } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { APP_VERSION } from "../../core/appMeta";

interface ControlDeckProps {
    /**
     * "compact" is the phone bar pinned above the tab bar, which has to drive a
     * run from any pane in about 150px. It keeps every control the full deck
     * has, tightened, and drops the panel chrome around them.
     */
    variant?: "full" | "compact";
}

export default function ControlDeck({ variant = "full" }: ControlDeckProps) {
    const compact = variant === "compact";
    const {
        isPlaying,
        speedMultiplier,
        currentState,
        play,
        pause,
        step,
        reset,
        instantCompute,
        setSpeedMultiplier,
        sections,
        validSchedules
    } = useSimulationStore();

    const isFinished = currentState?.step === "COMPLETE";
    const statusColor = getStatusColor(currentState?.step);
    const stats = currentState?.stats;

    // 40px still clears the touch target guidance and buys back a row of height
    // in the compact bar, which is competing with the pane above it.
    const btnPad = compact ? "p-2.5" : "p-3";

    // Machine-readable export of the current run.
    //
    // The counters come from the simulation engine, which attaches a snapshot
    // to every yielded state, so a run can be exported mid-traversal and not
    // only once it has completed. The same counters are what the experiments in
    // docs/06-evaluation.md aggregate in bulk.
    const exportMetrics = () => {
        if (!currentState) return;

        const courses = [...new Set(sections.map(s => s.courseCode))].sort();
        const payload = {
            schemaVersion: 1,
            appVersion: APP_VERSION,
            exportedAt: new Date().toISOString(),
            engine: "SimulationEngine.ts",
            note: "Counters are as of the step shown when this file was exported. A run that has not reached COMPLETE is a partial traversal.",
            run: {
                step: currentState.step,
                complete: currentState.step === "COMPLETE",
                message: currentState.message,
            },
            instance: {
                courses: courses.length,
                courseCodes: courses,
                sections: sections.length,
                sectionsPerCourse: courses.map(c => ({
                    courseCode: c,
                    sections: sections.filter(s => s.courseCode === c).length,
                })),
            },
            metrics: stats ?? null,
            solutions: {
                found: validSchedules.length,
                schedules: validSchedules.map(schedule =>
                    schedule.map(s => ({ courseCode: s.courseCode, sectionNo: s.sectionNo }))
                ),
            },
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `yu-sync-run-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`flex w-full flex-col items-center font-sans ${compact ? "gap-2" : "h-fit gap-4 px-1 pb-1"}`}>
            {/* Status Display */}
            <div
                className={`flex w-full gap-2 ${
                    compact
                        ? "items-center"
                        : "flex-col items-start rounded-md border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                }`}
            >
                <div className="flex shrink-0 items-center gap-3">
                    <span className={`font-mono text-xs uppercase tracking-widest text-gray-500 ${compact ? "hidden" : "hidden sm:inline"}`}>
                        Engine Status
                    </span>
                    <div className={`rounded-md px-2 py-1 text-xs font-bold tracking-wider ${statusColor.bg} ${statusColor.text}`}>
                        {currentState?.step || "IDLE"}
                    </div>
                </div>
                <div className={`min-w-0 truncate font-mono text-xs text-slate-600 ${compact ? "" : "max-w-full sm:max-w-[60%]"}`}>
                    {currentState?.message || "Awaiting initialization..."}
                </div>
            </div>

            {/* Live counters. These are the quantities the evaluation aggregates,
                shown per run so a single traversal can be inspected directly.
                Compact keeps all five, scrolling sideways rather than dropping any. */}
            {stats && (
                <div
                    className={
                        compact
                            ? "scroll-hint -mx-1 flex w-full gap-1.5 overflow-x-auto px-1"
                            : "grid w-full grid-cols-3 gap-2 sm:grid-cols-5"
                    }
                >
                    {[
                        { k: "Nodes", v: stats.nodes },
                        { k: "Pruned", v: stats.pruned },
                        { k: "Checks", v: stats.conflictChecks },
                        { k: "Depth", v: stats.depthReached },
                        { k: "Schedules", v: stats.solutionCount },
                    ].map(item => (
                        <div
                            key={item.k}
                            className={`rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm ${compact ? "shrink-0" : ""}`}
                        >
                            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">{item.k}</div>
                            <div className="font-mono text-sm font-bold leading-tight text-gray-800">
                                {item.v.toLocaleString("en-US")}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls Row. Five buttons plus a fixed-width slider need about
                412px, so below sm the slider drops onto its own full-width row. */}
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">

                {/* Playback Buttons */}
                <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <button
                        onClick={isPlaying ? pause : play}
                        disabled={isFinished}
                        className={`${btnPad} rounded-md flex items-center justify-center transition-all duration-200 border
                            ${isFinished ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white hover:bg-gray-100 active:scale-95'}
                            ${!isFinished && isPlaying ? 'border-amber-200 text-amber-600' : ''}
                            ${!isFinished && !isPlaying ? 'border-gray-200 text-gray-700' : ''}
                        `}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    <button
                        onClick={step}
                        disabled={isPlaying || isFinished}
                        className={`${btnPad} rounded-md flex items-center justify-center transition-all duration-200 border
                            ${isPlaying || isFinished ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95'}
                        `}
                        title="Step Forward"
                    >
                        <StepForward size={20} />
                    </button>

                    <button
                        onClick={reset}
                        className={`${btnPad} ml-2 flex items-center justify-center rounded-md border border-gray-200 bg-white text-rose-500 transition-all duration-200 hover:bg-gray-100 active:scale-95`}
                        title="Reset Simulation"
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button
                        onClick={instantCompute}
                        disabled={isFinished}
                        className={`${btnPad} rounded-md flex items-center justify-center transition-all duration-200 border ml-2
                            ${isFinished ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95'}
                        `}
                        title="Instant Compute"
                    >
                        <Zap size={20} className={!isFinished ? "fill-current" : ""} />
                    </button>

                    <button
                        onClick={exportMetrics}
                        disabled={!currentState}
                        className={`${btnPad} rounded-md flex items-center justify-center transition-all duration-200 border ml-2
                            ${!currentState ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95'}
                        `}
                        title="Export this run's metrics as JSON"
                    >
                        <Download size={20} />
                    </button>
                </div>

                {/* Speed Slider. Compact drops the card chrome and sets the label
                    beside the track rather than above it, saving a row. */}
                <div
                    className={`flex w-full shrink-0 sm:w-48 ${
                        compact
                            ? "items-center gap-2"
                            : "flex-col gap-1 rounded-md border border-gray-200 bg-white p-2.5 shadow-sm"
                    }`}
                >
                    <div className={`flex items-center ${compact ? "shrink-0 gap-1.5" : "justify-between px-1"}`}>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Speed</span>
                        <span className="font-mono text-[10px] text-gray-700">
                            {speedMultiplier >= 1 ? "max" : `${Math.round(speedMultiplier * 100)}%`}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={speedMultiplier}
                        onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                        className="h-2.5 w-full cursor-pointer appearance-none rounded-md bg-slate-100 accent-[#004B87] sm:h-1.5"
                    />
                </div>

            </div>
        </div>
    );
}

function getStatusColor(step?: string) {
    switch (step) {
        case "INIT": return { bg: "bg-blue-100", text: "text-blue-700" };
        case "SELECTING": return { bg: "bg-[#e8f3fc]", text: "text-[#004B87]" };
        case "BITMASK_CHECK": return { bg: "bg-purple-100", text: "text-purple-700" };
        case "CONFLICT": return { bg: "bg-rose-100", text: "text-rose-700" };
        case "BACKTRACKING": return { bg: "bg-orange-100", text: "text-orange-700" };
        case "SUCCESS": return { bg: "bg-emerald-100", text: "text-emerald-700" };
        case "COMPLETE": return { bg: "bg-slate-100", text: "text-slate-700" };
        default: return { bg: "bg-slate-100", text: "text-slate-500" };
    }
}
