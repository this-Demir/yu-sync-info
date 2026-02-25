import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { SLOTS, parseHHMM, emptyWeekMask } from "../../core/time";
import type { DayName, Section } from "../../core/types";

const WEEKDAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SOFT_COLORS = ['#FEF2F2', '#FFF7ED', '#FFFBEB', '#FEFCE8', '#F7FEE7', '#F0FDF4', '#ECFDF5', '#F0FDFA', '#ECFEFF', '#F0F9FF', '#EFF6FF', '#EEF2FF', '#F5F3FF', '#FAF5FF', '#FDF4FF', '#FDF2F8', '#FFF1F2', '#F0F4F8', '#E6F7FF', '#F9F0FF', '#FFF0F5', '#E6FFFA', '#F0FFF0', '#FFFDE6', '#FFF0E6'];

function getSoftColor(code: string) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash += code.charCodeAt(i);
    }
    return SOFT_COLORS[hash % 25];
}

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

function calculateMaskForSections(sections: Section[]) {
    const mask = emptyWeekMask();
    sections.forEach(sec => {
        sec.days.forEach(d => {
            const slots = getAffectedSlots(d.startTime, d.endTime);
            slots.forEach(i => {
                mask[d.day as DayName] |= (1 << i);
            });
        });
    });
    return mask;
}

export default function LiveGrid() {
    const { currentState, validSchedules, activeValidScheduleIndex, setActiveSchedule, isPlaying } = useSimulationStore();

    // Safety fallback
    const step = currentState?.step || "IDLE";
    const showValid = validSchedules.length > 0 && (!isPlaying || step === "COMPLETE");

    let chosenBlocks = currentState?.chosenSections || [];
    let currentMask = currentState?.currentMask;

    if (showValid) {
        chosenBlocks = validSchedules[activeValidScheduleIndex] || [];
        currentMask = calculateMaskForSections(chosenBlocks);
    }

    const evalBlock = !showValid ? (currentState?.evaluatingSection || null) : null;

    // Bitmask Visualization Info
    const isConflict = !showValid && step === "CONFLICT";
    const isEvaluating = !showValid && (step === "SELECTING" || step === "BITMASK_CHECK" || isConflict);

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            {/* Pagination Controls */}
            {validSchedules.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shrink-0">
                    <span className="font-mono text-[10px] text-gray-500 tracking-wider uppercase">Valid Schedules Found</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveSchedule((activeValidScheduleIndex - 1 + validSchedules.length) % validSchedules.length)}
                            className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="font-mono text-xs text-gray-600 tracking-widest min-w-[140px] text-center uppercase">
                            Schedule {activeValidScheduleIndex + 1} of {validSchedules.length}
                        </span>
                        <button
                            onClick={() => setActiveSchedule((activeValidScheduleIndex + 1) % validSchedules.length)}
                            className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header / Days */}
            <div className="flex border-b border-gray-100 w-full shrink-0">
                <div className="w-16 border-r border-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-sans tracking-widest bg-white">
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
                        <div key={day} className="flex-1 py-1.5 flex flex-col items-center justify-center bg-white border-r border-gray-100 last:border-0 overflow-hidden">
                            <span className="text-xs font-semibold text-gray-600 tracking-widest font-sans">
                                {day.substring(0, 3).toUpperCase()}
                            </span>

                            {/* Decimal Bit Math Display */}
                            <div className="flex flex-col items-center mt-0.5 justify-center h-4">
                                {!isTestingDay ? (
                                    <span className="text-xs font-mono text-gray-400">
                                        [{dayMaskVal}]
                                    </span>
                                ) : (
                                    <div className="flex items-center text-xs font-mono whitespace-nowrap bg-white px-1.5 py-[1px] rounded border border-gray-100 shadow-sm">
                                        <span className="text-gray-600">{dayMaskVal}</span>
                                        <span className="text-amber-500/70 mx-0.5">&</span>
                                        <span className="text-amber-600">{evalMaskVal}</span>
                                        <span className="text-gray-400 mx-0.5">=</span>
                                        <span className={`font-semibold ${hasConflict ? 'text-red-600' : 'text-emerald-600'}`}>
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
            <div className="flex-1 flex w-full relative overflow-hidden bg-white/50 font-mono">

                {/* Time Axis */}
                <div className="w-16 border-r border-gray-100 bg-white flex flex-col relative z-10 shrink-0">
                    {SLOTS.map((time) => (
                        <div key={time} className="flex-1 flex justify-center text-[10px] text-gray-400 font-sans font-medium items-start px-1 border-b border-gray-100">
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
                            <div key={day} className="flex-1 relative border-r border-gray-100 last:border-0 h-full flex flex-col bg-white">

                                {/* Base Bit Cells & Hologram Overlays */}
                                {SLOTS.map((_, slotIdx) => {
                                    const isBaseFilled = dayBits[slotIdx] === 1;
                                    const isEvalTesting = evalBits[slotIdx] === 1;
                                    const isColliding = isBaseFilled && isEvalTesting;

                                    return (
                                        <div
                                            key={`cell-${day}-${slotIdx}`}
                                            className={`flex-1 border-b border-gray-100 flex items-center justify-center transition-all duration-300 relative`}
                                        >
                                            {/* Base Bit Indicator */}
                                            <span className={`font-mono text-xs z-0 select-none
                                                ${isBaseFilled ? 'text-gray-400' : 'text-gray-200'}
                                            `}>
                                                {isBaseFilled ? '1' : '0'}
                                            </span>

                                            {/* Hologram / Testing Indicator */}
                                            {isEvalTesting && (
                                                <div className={`absolute inset-0 border rounded-md m-[1px] flex items-center justify-center select-none shadow-sm z-30 transition-all duration-300
                                                    ${isColliding && isConflict ? 'border-red-300 bg-red-50 text-red-600' :
                                                        'border-amber-200 border-dashed bg-amber-50 text-amber-500'}
                                                `}>
                                                    {/* Explain collision mathematically if it hits */}
                                                    {isColliding && isConflict ? (
                                                        <span className="font-mono text-xs tracking-widest bg-red-100 px-1 rounded border border-red-300">1&1</span>
                                                    ) : (
                                                        <span className="font-mono text-xs opacity-0">...</span>
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
                                                className="absolute left-[2px] right-[2px] rounded-md border border-gray-200 p-1.5 flex flex-col justify-center overflow-hidden text-gray-900 shadow-sm transition-all duration-300 z-20"
                                                style={{ ...pos, backgroundColor: getSoftColor(section.courseCode) }}
                                            >
                                                <div className="font-sans text-xs font-semibold tracking-tight truncate leading-none">{section.courseCode}</div>
                                                <div className="font-mono text-[10px] text-gray-500 mt-0.5">Sec {section.sectionNo}</div>
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
                                        let styleClasses = "absolute left-[2px] right-[2px] rounded-md p-1.5 flex flex-col overflow-hidden shadow-sm transition-all duration-200 z-40 backdrop-blur-sm font-sans border border-gray-200 ";

                                        if (isConflict) {
                                            styleClasses += "bg-red-50 text-red-800";
                                        } else {
                                            styleClasses += "bg-amber-50 text-amber-800";
                                        }

                                        return (
                                            <div
                                                key={`evaluating-${matchIdx}`}
                                                className={styleClasses}
                                                style={pos}
                                            >
                                                <div className="flex justify-between items-start w-full leading-none">
                                                    <span className="font-sans text-xs font-semibold tracking-tight truncate">{evalBlock.courseCode}</span>
                                                    {isConflict && <span className="font-mono text-xs bg-red-100 text-red-600 rounded px-1 border border-red-300">X</span>}
                                                </div>
                                                <div className="font-sans text-[10px] opacity-80 mt-1">Sec {evalBlock.sectionNo}</div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend / Watermark */}
            <div className="absolute bottom-2 left-4 z-50 pointer-events-none opacity-50">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest hidden sm:inline-block">
                    COLORS DISTINGUISH UNIQUE COURSES • RED HIGHLIGHTS INDICATE BITMASK COLLISIONS
                </span>
            </div>
        </div>
    );
}
