import { useRef, useEffect } from "react";
import { Network } from "lucide-react";
import { useSimulationStore, type TreeNode } from "../../store/useSimulationStore";
import type { Section } from "../../core/types";

export default function GraphTree() {
    const { treeRoot, currentState, validSchedules, activeValidScheduleIndex, activePathIds, isPlaying } = useSimulationStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-pan / scroll to rightmost and bottom when tree changes
    useEffect(() => {
        if (scrollRef.current && isPlaying) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [treeRoot, currentState, isPlaying]);

    if (!treeRoot) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50/50 rounded-[16px]">
                <Network size={48} strokeWidth={1} className="text-slate-300 mb-4" />
                <span className="opacity-40 text-xs tracking-[0.2em] font-bold uppercase text-slate-500 font-sans">
                    Waiting for Engine...
                </span>
            </div>
        );
    }

    const showValid = validSchedules.length > 0 && (!isPlaying || currentState?.step === "COMPLETE");
    let glowPathIds = new Set<string>();

    if (showValid) {
        const activeSchedule = validSchedules[activeValidScheduleIndex];
        glowPathIds.add("root");
        activeSchedule?.forEach((sec, level) => {
            glowPathIds.add(`level-${level}-${sec.courseCode}-sec-${sec.sectionNo}`);
        });
    } else {
        activePathIds.forEach(id => glowPathIds.add(id));
    }

    return (
        <div className="flex flex-col h-full bg-white p-5 font-sans">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 text-slate-800 border-b border-slate-100 pb-3 shrink-0">
                <Network size={18} className="text-[#004B87]" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#004B87]">State-Space Tree</h3>
                <span className="ml-auto text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 font-semibold tracking-wide">
                    DFS Backtracking Search
                </span>
            </div>

            {/* Tree Container (Pan/Scrollable) */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto custom-scrollbar relative p-4 bg-gray-50/50 rounded-lg border border-gray-200 shadow-inner"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* CSS hack to hide webkit scrollbar but keep scrollability */}
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div className="min-w-max min-h-max pb-32 pr-32 cursor-grab active:cursor-grabbing">
                    <TreeNodeView node={treeRoot} depth={0} glowPathIds={glowPathIds} validSchedules={validSchedules} />
                </div>
            </div>
        </div>
    );
}

// Recursive Component to render the Tree Hierarchy using Flexbox & connecting borders
function TreeNodeView({ node, depth, glowPathIds, validSchedules }: { node: TreeNode; depth: number, glowPathIds: Set<string>, validSchedules: Section[][] }) {

    // Status color mapping for Light Mode
    let nodeColors = "bg-white border-gray-200 text-gray-400"; // PENDING / Default
    let dotColors = "bg-gray-200 border-white";
    let isPulsing = false;
    let isGlowing = glowPathIds.has(node.id);

    // Check if this node is part of ANY valid schedule
    let partOfValidSchedule = false;
    if (validSchedules.length > 0) {
        // A node is part of a valid schedule if its course & section matches at its appropriate level
        for (const schedule of validSchedules) {
            if (node.id === "root") {
                partOfValidSchedule = true;
                break;
            }
            // node.level is 1-indexed for the data, but schedule array is 0-indexed
            const matchLevel = parseInt(node.id.split('-')[1]);
            const targetSection = schedule[matchLevel];

            if (targetSection && targetSection.courseCode === node.courseCode && targetSection.sectionNo === node.sectionNo) {
                partOfValidSchedule = true;
                break;
            }
        }
    }

    if (partOfValidSchedule) {
        if (isGlowing) {
            // Actively viewed valid schedule
            nodeColors = "bg-emerald-50 border-emerald-500 text-emerald-900 z-10 font-medium shadow-sm";
            dotColors = "bg-emerald-500 border-emerald-100";
        } else {
            // Valid schedule but NOT actively viewed
            nodeColors = "bg-white border-emerald-200 text-emerald-600";
            dotColors = "bg-emerald-300 border-white";
        }
    } else if (node.status === "SUCCEEDED" && node.id !== "root") {
        if (isGlowing) {
            nodeColors = "bg-emerald-50 border-emerald-500 text-emerald-900 font-medium shadow-sm";
            dotColors = "bg-emerald-500 border-emerald-100";
        } else {
            nodeColors = "bg-white border-emerald-200 text-emerald-600 opacity-80";
            dotColors = "bg-emerald-300 border-white";
        }
    } else if (node.status === "FAILED") {
        nodeColors = "bg-red-50 border-red-200 text-red-600 opacity-80";
        dotColors = "bg-red-400 border-white";
    } else if (node.status === "PRUNED") {
        nodeColors = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
        dotColors = "bg-gray-300 border-white";
    } else if (node.status === "EVALUATING") {
        nodeColors = "bg-amber-50 border-amber-300 text-amber-900 shadow-sm";
        dotColors = "bg-amber-400 border-white";
        isPulsing = true;
    }

    if (node.id === "root") {
        if (isGlowing) {
            nodeColors = "bg-blue-50 border-blue-500 text-blue-900 z-10 shadow-sm font-medium";
            dotColors = "bg-blue-500 border-blue-100";
        } else if (partOfValidSchedule) {
            nodeColors = "bg-blue-50 border-blue-300 text-blue-800";
            dotColors = "bg-blue-400 border-white";
        } else {
            nodeColors = "bg-white border-gray-200 text-gray-500 opacity-80";
            dotColors = "bg-gray-400 border-white";
        }
    }

    // Indentation/Line rendering lines up vertically for children
    return (
        <div className="flex flex-col relative font-mono">

            {/* The Node Block Itself */}
            <div className="flex items-center mb-1 group relative">

                {/* Visual Branch Line (Horizontal Connector) */}
                {depth > 0 && (
                    <div className={`absolute -left-6 w-6 h-px ${isGlowing ? 'bg-emerald-500 z-10' : 'bg-gray-200'}`}></div>
                )}

                {/* The colored dot indicator */}
                <div className={`w-3.5 h-3.5 rounded-full mr-3 z-10 transition-all duration-300 border-[3px] ${dotColors} ${isPulsing ? 'animate-pulse' : ''}`}></div>

                {/* The Node Content Card */}
                <div className={`px-3 py-1.5 rounded-md text-xs transition-all duration-300 border min-w-[124px] ${nodeColors}`}>
                    <div className="flex justify-between items-center gap-4">
                        <span className="font-sans font-semibold tracking-tight">{node.courseCode}</span>
                        {node.id !== "root" && <span className="font-sans text-[10px] opacity-80">Sec {node.sectionNo}</span>}
                    </div>
                </div>

                {/* Status tag text next to node for extreme clarity */}
                <span className="ml-3 text-[10px] uppercase tracking-widest font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-slate-400">
                    [{node.status}]
                </span>
            </div>

            {/* Children Rendering (Indented with a vertical line connecting them) */}
            {node.children.length > 0 && (
                <div className="flex flex-col ml-[26px] relative mt-1">
                    {/* Vertical Connecting Line dropping down from parent dot to children */}
                    <div className={`absolute -left-[19px] top-0 bottom-3 w-px bg-gray-200 z-0`}></div>

                    {node.children.map((child) => (
                        <div key={child.id} className="relative">
                            <TreeNodeView
                                node={child}
                                depth={depth + 1}
                                glowPathIds={glowPathIds}
                                validSchedules={validSchedules}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
