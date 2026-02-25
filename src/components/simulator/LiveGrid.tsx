
import { useSimulationStore } from "../../store/useSimulationStore";
import { SLOTS, parseHHMM } from "../../core/time";
import type { DayName } from "../../core/types";

const WEEKDAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Helper to calculate position top% and height% based on day start/end
const DAY_START_MIN = parseHHMM(SLOTS[0]!); // 08:40 -> 520
const DAY_END_MIN = parseHHMM("19:40");     // 19:40 -> 1180
const DAY_DURATION_MIN = DAY_END_MIN - DAY_START_MIN;

// Helper to determine which slots a start/end time covers
function getAffectedSlots(startTime: string, endTime: string): number[] {
    const sMin = parseHHMM(startTime);
    const eMin = parseHHMM(endTime);
    const affectedIndices: number[] = [];

    SLOTS.forEach((t, index) => {
        const slotMin = parseHHMM(t);
        if (slotMin >= sMin && slotMin < eMin) {
            affectedIndices.push(index);
        }
    });

    return affectedIndices;
}

function getPositionStyles(startTime: string, endTime: string) {
    const startMin = parseHHMM(startTime);
    const endMin = parseHHMM(endTime);

    // Calculate percentages
    const topPct = ((startMin - DAY_START_MIN) / DAY_DURATION_MIN) * 100;
    const heightPct = ((endMin - startMin) / DAY_DURATION_MIN) * 100;

    return {
        top: `${Math.max(0, topPct)}%`,
        height: `${Math.min(100 - topPct, heightPct)}%`,
    };
}

// Generate bit array from number
function getBits(num: number = 0) {
    return Array.from({ length: 12 }, (_, i) => (num & (1 << i)) ? 1 : 0);
}

export default function LiveGrid() {
    const { currentState } = useSimulationStore();

    // Safety fallback
    const chosenBlocks = currentState?.chosenSections || [];
    const evalBlock = currentState?.evaluatingSection || null;
    const step = currentState?.step || "IDLE";

    // Bitmask Visualization Info
    const currentMask = currentState?.currentMask;
    const isConflict = step === "CONFLICT";
    const isEvaluating = step === "SELECTING" || step === "BITMASK_CHECK" || isConflict;

    return (
        <div className="w-full h-full flex flex-col min-h-[400px]">
            {/* Header / Days */}
            <div className="flex border-b border-slate-700 w-full shrink-0">
                <div className="w-16 border-r border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold tracking-widest bg-slate-900/50">
                    TIME
                </div>
                {WEEKDAYS.map(day => {
                    const dayMaskVal = currentMask?.[day] || 0;

                    let evalMaskVal = 0;
                    if (isEvaluating && evalBlock) {
                        const dayTarget = evalBlock.days.find(d => d.day === day);
                        if (dayTarget) {
                            const affectedSlots = getAffectedSlots(dayTarget.startTime, dayTarget.endTime);
                            affectedSlots.forEach(i => { evalMaskVal |= (1 << i); });
                        }
                    }

                    const isTestingDay = evalMaskVal > 0;
                    const result = dayMaskVal & evalMaskVal;
                    const hasConflict = result > 0;

                    return (
                        <div key={day} className="flex-1 py-1 flex flex-col items-center justify-center bg-slate-900/50 border-r border-slate-800 last:border-0 overflow-hidden">
                            <span className="text-xs font-semibold text-slate-300 tracking-wider">
                                {day.substring(0, 3).toUpperCase()}
                            </span>

                            {/* Decimal Bit Math Display */}
                            <div className="flex flex-col items-center mt-0.5 justify-center h-4">
                                {!isTestingDay ? (
                                    <span className="text-[9px] font-mono text-slate-500 opacity-60">
                                        [{dayMaskVal}]
                                    </span>
                                ) : (
                                    <div className="flex items-center text-[9px] font-mono whitespace-nowrap">
                                        <span className="text-slate-500">{dayMaskVal}</span>
                                        <span className="text-amber-500/70 mx-0.5">&</span>
                                        <span className="text-amber-400">{evalMaskVal}</span>
                                        <span className="text-slate-600 mx-0.5">=</span>
                                        <span className={`font-bold ${hasConflict ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                                            {result}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid Body */}
            <div className="flex-1 flex w-full relative overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-950 font-mono">

                {/* Time Axis */}
                <div className="w-16 border-r border-slate-700 bg-slate-900/30 flex flex-col pt-2 relative z-10 shrink-0">
                    {SLOTS.map((time) => (
                        <div key={time} className="flex-1 flex justify-center text-[10px] text-slate-500 items-start min-h-[40px] px-1 border-b border-slate-800/50">
                            {time}
                        </div>
                    ))}
                </div>

                {/* Day Columns Map */}
                <div className="flex-1 flex relative">

                    {/* Day Columns */}
                    {WEEKDAYS.map((day) => {
                        const dayMaskVal = currentMask?.[day] || 0;
                        const dayBits = getBits(dayMaskVal);

                        // Calculate incoming evaluating bits for this specific day
                        let evalBits = Array(12).fill(0);
                        if (isEvaluating && evalBlock) {
                            const dayTarget = evalBlock.days.find(d => d.day === day);
                            if (dayTarget) {
                                const affectedSlots = getAffectedSlots(dayTarget.startTime, dayTarget.endTime);
                                affectedSlots.forEach(i => { evalBits[i] = 1; });
                            }
                        }

                        return (
                            <div key={day} className="flex-1 relative border-r border-slate-800 last:border-0 h-full flex flex-col pt-2 bg-slate-950">

                                {/* Base Bit Cells & Hologram Overlays */}
                                {SLOTS.map((_, slotIdx) => {
                                    const isBaseFilled = dayBits[slotIdx] === 1;
                                    const isEvalTesting = evalBits[slotIdx] === 1;
                                    const isColliding = isBaseFilled && isEvalTesting;

                                    return (
                                        <div
                                            key={`cell-${day}-${slotIdx}`}
                                            className={`flex-1 min-h-[40px] border-b border-slate-800/30 flex items-center justify-center transition-all duration-300 relative
                                                ${isColliding && isConflict ? 'bg-rose-950 shadow-[inset_0_0_20px_rgba(244,63,94,0.3)] border-y border-rose-900' : ''}
                                            `}
                                        >
                                            {/* Base Bit Indicator */}
                                            <span className={`text-[10px] font-bold z-0 select-none
                                                ${isBaseFilled ? 'text-indigo-900/50' : 'text-slate-800/20'}
                                            `}>
                                                {isBaseFilled ? '1' : '0'}
                                            </span>

                                            {/* Hologram / Testing Indicator */}
                                            {isEvalTesting && (
                                                <div className={`absolute inset-0 border-2 rounded-sm m-[1px] flex items-center justify-center select-none shadow-sm z-30 transition-all duration-300
                                                    ${isColliding && isConflict ? 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse' :
                                                        'border-amber-400 border-dashed bg-amber-500/10 text-amber-200'}
                                                `}>
                                                    {/* Explain collision mathematically if it hits */}
                                                    {isColliding && isConflict ? (
                                                        <span className="text-[10px] font-black tracking-widest bg-rose-950 px-1 rounded border border-rose-500">1&1</span>
                                                    ) : (
                                                        <span className="text-xl font-bold opacity-30">1</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Render Chosen Sections (Visual Code Blocks over the bits) */}
                                {chosenBlocks.flatMap((section, idx) => {
                                    const dayMatches = section.days.filter(d => d.day === day);
                                    return dayMatches.map((dayMatch, matchIdx) => {
                                        const pos = getPositionStyles(dayMatch.startTime, dayMatch.endTime);
                                        return (
                                            <div
                                                key={`chosen-${idx}-${matchIdx}-${day}`}
                                                className="absolute left-1 right-1 rounded-md bg-emerald-500/20 border border-emerald-500/50 p-1 flex flex-col overflow-hidden text-emerald-100 shadow-md shadow-emerald-900/20 transition-all duration-300 z-20 backdrop-blur-sm"
                                                style={pos}
                                            >
                                                <div className="text-[10px] font-sans font-bold tracking-wider opacity-80">{section.courseCode}</div>
                                                <div className="text-[9px] opacity-60 font-mono">Sec {section.sectionNo}</div>
                                            </div>
                                        );
                                    });
                                })}

                                {/* Render Evaluating Section Title Box (if any matches this day) */}
                                {evalBlock && (() => {
                                    const dayMatches = evalBlock.days.filter(d => d.day === day);
                                    return dayMatches.map((dayMatch, matchIdx) => {
                                        const pos = getPositionStyles(dayMatch.startTime, dayMatch.endTime);

                                        // The big title block follows the hologram outline
                                        let styleClasses = "absolute left-1 right-1 rounded-md p-1 flex flex-col overflow-hidden shadow-lg transition-all duration-200 z-40 backdrop-blur-md font-sans ";

                                        if (isConflict) {
                                            styleClasses += "bg-rose-900/40 border-l-[4px] border-rose-500 text-rose-100";
                                        } else {
                                            styleClasses += "bg-amber-900/20 border-l-[4px] border-amber-400 text-amber-100 opacity-90";
                                        }

                                        return (
                                            <div
                                                key={`evaluating-${matchIdx}`}
                                                className={styleClasses}
                                                style={pos}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-[10px] font-bold tracking-wider">{evalBlock.courseCode}</span>
                                                    {isConflict && <span className="text-[10px] bg-rose-600 rounded-sm px-1 font-mono">X</span>}
                                                </div>
                                                <div className="text-[9px] opacity-80 font-mono">Sec {evalBlock.sectionNo}</div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
