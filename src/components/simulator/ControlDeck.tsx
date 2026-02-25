import { Play, Pause, StepForward, RotateCcw, Zap } from "lucide-react";
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
        instantCompute,
        setSpeedMultiplier
    } = useSimulationStore();

    const isFinished = currentState?.step === "COMPLETE";
    const statusColor = getStatusColor(currentState?.step);

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
                </div>

                {/* Speed Slider */}
                <div className="flex flex-col gap-1 w-48 bg-white p-2.5 rounded-md border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center px-1">
                        <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Speed</span>
                        <span className="font-mono text-[10px] text-gray-700">{speedMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="10.0"
                        step="0.1"
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
