import { Play, Pause, StepForward, RotateCcw, Zap, Download } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { APP_VERSION } from "../../core/appMeta";

export default function ControlDeck() {
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
        <div className="flex flex-col gap-4 w-full h-fit items-center px-1 pb-1 font-sans">
            {/* Status Display */}
            <div className="w-full flex items-center justify-between bg-white rounded-md p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Engine Status</span>
                    <div className={`px-2 py-1 rounded-md text-xs font-bold tracking-wider ${statusColor.bg} ${statusColor.text}`}>
                        {currentState?.step || "IDLE"}
                    </div>
                </div>
                <div className="text-xs text-slate-600 font-mono truncate max-w-[60%]">
                    {currentState?.message || "Awaiting initialization..."}
                </div>
            </div>

            {/* Live counters. These are the quantities the evaluation aggregates,
                shown per run so a single traversal can be inspected directly. */}
            {stats && (
                <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                        { k: "Nodes", v: stats.nodes },
                        { k: "Pruned", v: stats.pruned },
                        { k: "Checks", v: stats.conflictChecks },
                        { k: "Depth", v: stats.depthReached },
                        { k: "Schedules", v: stats.solutionCount },
                    ].map(item => (
                        <div key={item.k} className="bg-white rounded-md border border-gray-200 px-2.5 py-1.5 shadow-sm">
                            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">{item.k}</div>
                            <div className="font-mono text-sm font-bold text-gray-800 leading-tight">
                                {item.v.toLocaleString("en-US")}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls Row */}
            <div className="w-full flex items-center justify-between">

                {/* Playback Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={isPlaying ? pause : play}
                        disabled={isFinished}
                        className={`p-3 rounded-md flex items-center justify-center transition-all duration-200 border
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
                        className={`p-3 rounded-md flex items-center justify-center transition-all duration-200 border
                            ${isPlaying || isFinished ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95'}
                        `}
                        title="Step Forward"
                    >
                        <StepForward size={20} />
                    </button>

                    <button
                        onClick={reset}
                        className="p-3 rounded-md flex items-center justify-center transition-all duration-200 border bg-white border-gray-200 text-rose-500 hover:bg-gray-100 active:scale-95 ml-2"
                        title="Reset Simulation"
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button
                        onClick={instantCompute}
                        disabled={isFinished}
                        className={`p-3 rounded-md flex items-center justify-center transition-all duration-200 border ml-2
                            ${isFinished ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95'}
                        `}
                        title="Instant Compute"
                    >
                        <Zap size={20} className={!isFinished ? "fill-current" : ""} />
                    </button>

                    <button
                        onClick={exportMetrics}
                        disabled={!currentState}
                        className={`p-3 rounded-md flex items-center justify-center transition-all duration-200 border ml-2
                            ${!currentState ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50 text-slate-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95'}
                        `}
                        title="Export this run's metrics as JSON"
                    >
                        <Download size={20} />
                    </button>
                </div>

                {/* Speed Slider */}
                <div className="flex flex-col gap-1 w-48 bg-white p-2.5 rounded-md border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center px-1">
                        <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Speed</span>
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
                        className="w-full accent-[#004B87] cursor-pointer h-1.5 bg-slate-100 rounded-md appearance-none"
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
