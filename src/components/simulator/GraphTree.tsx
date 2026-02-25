import { useRef, useEffect } from "react";
import { Network } from "lucide-react";
import { useSimulationStore, type TreeNode } from "../../store/useSimulationStore";

export default function GraphTree() {
    const { treeRoot, currentState } = useSimulationStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-pan / scroll to rightmost and bottom when tree changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [treeRoot, currentState]);

    if (!treeRoot) {
        return (
            <div className="flex items-center justify-center h-full w-full opacity-30 text-xs tracking-widest uppercase text-slate-400">
                Waiting for engine...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 p-4 font-mono">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 text-slate-300 border-b border-slate-800 pb-2 shrink-0">
                <Network size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest">State-Space Tree</h3>
                <span className="ml-auto text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    DFS Backtracking Search
                </span>
            </div>

            {/* Tree Container (Pan/Scrollable) */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto custom-scrollbar relative p-4 bg-slate-950/50 rounded-lg border border-slate-900 shadow-inner"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* CSS hack to hide webkit scrollbar but keep scrollability */}
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div className="min-w-max min-h-max pb-32 pr-32 cursor-grab active:cursor-grabbing">
                    <TreeNodeView node={treeRoot} depth={0} />
                </div>
            </div>
        </div>
    );
}

// Recursive Component to render the Tree Hierarchy using Flexbox & connecting borders
function TreeNodeView({ node, depth }: { node: TreeNode; depth: number }) {

    // Status color mapping strictly according to rules
    let nodeColors = "bg-slate-800 border-slate-600 text-slate-400"; // PENDING / Default
    let dotColors = "bg-slate-500 scale-75";
    let isPulsing = false;

    if (node.status === "SUCCEEDED" && node.id !== "root") {
        nodeColors = "bg-emerald-900/30 border-emerald-600/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
        dotColors = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";
    } else if (node.status === "FAILED") {
        nodeColors = "bg-rose-950/60 border-rose-600 text-rose-300 line-through opacity-80";
        dotColors = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]";
    } else if (node.status === "PRUNED") {
        nodeColors = "bg-slate-900 border-slate-700 text-slate-500 opacity-50 line-through";
        dotColors = "bg-slate-700";
    } else if (node.status === "EVALUATING") {
        nodeColors = "bg-amber-950/40 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.3)]";
        dotColors = "bg-amber-400";
        isPulsing = true;
    }

    if (node.id === "root") {
        nodeColors = "bg-indigo-950/50 border-indigo-600 text-indigo-300";
        dotColors = "bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]";
    }

    // Indentation/Line rendering lines up vertically for children
    return (
        <div className="flex flex-col relative">

            {/* The Node Block Itself */}
            <div className="flex items-center mb-1 group relative">

                {/* Visual Branch Line (Horizontal Connector) */}
                {depth > 0 && (
                    <div className="absolute -left-6 w-6 h-px bg-slate-700"></div>
                )}

                {/* The colored dot indicator */}
                <div className={`w-3 h-3 rounded-full mr-3 z-10 transition-all duration-300 border-[3px] border-slate-950 ${dotColors} ${isPulsing ? 'animate-pulse' : ''}`}></div>

                {/* The Node Content Card */}
                <div className={`px-3 py-1.5 rounded-md text-xs transition-all duration-300 border min-w-[120px] ${nodeColors} ${isPulsing ? 'scale-105' : ''}`}>
                    <div className="flex justify-between items-center gap-4">
                        <span className="font-bold tracking-wider">{node.courseCode}</span>
                        {node.id !== "root" && <span className="text-[10px] opacity-70">Sec {node.sectionNo}</span>}
                    </div>
                </div>

                {/* Status tag text next to node for extreme clarity */}
                <span className="ml-3 text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-slate-500">
                    [{node.status}]
                </span>
            </div>

            {/* Children Rendering (Indented with a vertical line connecting them) */}
            {node.children.length > 0 && (
                <div className="flex flex-col ml-6 relative mt-1">
                    {/* Vertical Connecting Line dropping down from parent dot to children */}
                    <div className={`absolute -left-[18px] top-0 bottom-3 w-px bg-slate-700 z-0`}></div>

                    {node.children.map((child) => (
                        <div key={child.id} className="relative">
                            <TreeNodeView
                                node={child}
                                depth={depth + 1}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
