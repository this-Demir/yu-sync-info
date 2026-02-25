import { Play, Pause, StepForward, RotateCcw } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";

export default function ControlDeck() {
    const {
        isPlaying,
        speedMultiplier,
        currentState,
        play,
        pause,
        step,
        reset,
        setSpeedMultiplier
    } = useSimulationStore();

    const isFinished = currentState?.step === "COMPLETE" || currentState?.step === "SUCCESS";
    const statusColor = getStatusColor(currentState?.step);

    return (
        <div className="flex flex-col gap-4 w-full h-full justify-between items-center px-4">
            {/* Status Display */}
            <div className="w-full flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Engine Status</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold tracking-wider ${statusColor.bg} ${statusColor.text}`}>
                        {currentState?.step || "IDLE"}
                    </div>
                </div>
                <div className="text-xs text-slate-400 font-mono truncate max-w-[60%]">
                    {currentState?.message || "Awaiting initialization..."}
                </div>
            </div>

            {/* Controls Row */}
            <div className="w-full flex items-center justify-between">

                {/* Playback Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={isPlaying ? pause : play}
                        disabled={isFinished}
                        className={`p-3 rounded-lg flex items-center justify-center transition-all duration-200 border
                            ${isFinished ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600' : 'hover:scale-105 active:scale-95'}
                            ${!isFinished && isPlaying ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20' : ''}
                            ${!isFinished && !isPlaying ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20' : ''}
                        `}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                    </button>

                    <button
                        onClick={step}
                        disabled={isPlaying || isFinished}
                        className={`p-3 rounded-lg flex items-center justify-center transition-all duration-200 border
                            ${isPlaying || isFinished ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600' : 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20 hover:scale-105 active:scale-95'}
                        `}
                        title="Step Forward"
                    >
                        <StepForward size={20} />
                    </button>

                    <button
                        onClick={reset}
                        className="p-3 rounded-lg flex items-center justify-center transition-all duration-200 border bg-rose-500/10 border-rose-500/50 text-rose-400 hover:bg-rose-500/20 hover:scale-105 active:scale-95 ml-2"
                        title="Reset Simulation"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>

                {/* Speed Slider */}
                <div className="flex flex-col gap-1 w-48">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speed</span>
                        <span className="text-[10px] font-mono text-indigo-300">{speedMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={speedMultiplier}
                        onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    />
                </div>

            </div>
        </div>
    );
}

function getStatusColor(step?: string) {
    switch (step) {
        case "INIT": return { bg: "bg-blue-500/20", text: "text-blue-400" };
        case "SELECTING": return { bg: "bg-indigo-500/20", text: "text-indigo-400" };
        case "BITMASK_CHECK": return { bg: "bg-purple-500/20", text: "text-purple-400" };
        case "CONFLICT": return { bg: "bg-rose-500/20", text: "text-rose-400" };
        case "BACKTRACKING": return { bg: "bg-orange-500/20", text: "text-orange-400" };
        case "SUCCESS": return { bg: "bg-emerald-500/20", text: "text-emerald-400" };
        case "COMPLETE": return { bg: "bg-slate-500/20", text: "text-slate-400" };
        default: return { bg: "bg-slate-800", text: "text-slate-500" };
    }
}
