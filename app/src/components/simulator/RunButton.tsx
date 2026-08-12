import { Play, RefreshCw, Check } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { useRunState } from "./runState";

// The primary action for the simulator, and the answer to "what do I press
// next". Its label states the current engine state rather than always reading
// the same, so the button doubles as a status line.

interface RunButtonProps {
    /** "footer" is the primary action in the pool panel. "strip" is the compact one in the stale bar. */
    variant?: "footer" | "strip";
}

export default function RunButton({ variant = "footer" }: RunButtonProps) {
    const run = useSimulationStore(s => s.run);
    const { poolEmpty, hasInstance, isStale, count } = useRunState();

    const courses = `${count} ${count === 1 ? "course" : "courses"}`;

    let label: string;
    let Icon = Play;
    if (poolEmpty) {
        label = "Select courses to run";
    } else if (!hasInstance) {
        label = `Run ${courses}`;
    } else if (isStale) {
        label = `Re-run with ${courses}`;
        Icon = RefreshCw;
    } else {
        label = "Run again";
        Icon = RefreshCw;
    }

    // Settled means loaded and matching the pool, where re-running is available
    // but is not what the user most likely wants next.
    const settled = hasInstance && !isStale && !poolEmpty;

    if (variant === "strip") {
        return (
            <button
                onClick={run}
                disabled={poolEmpty}
                className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {poolEmpty ? "Select courses" : `Re-run with ${courses}`}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={run}
                disabled={poolEmpty}
                className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors active:scale-[0.99] disabled:cursor-not-allowed ${
                    poolEmpty
                        ? "border border-gray-200 bg-gray-50 text-gray-400"
                        : settled
                            ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            : "bg-gray-900 text-white shadow-sm hover:bg-black"
                }`}
            >
                <Icon size={16} className={Icon === Play && !poolEmpty ? "fill-current" : ""} />
                {label}
            </button>

            {settled && (
                <span
                    title="The loaded instance matches your selection"
                    className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                >
                    <Check size={12} />
                    Loaded
                </span>
            )}
        </div>
    );
}
