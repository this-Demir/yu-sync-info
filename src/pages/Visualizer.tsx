import { useEffect, useState } from "react";
import { useSimulationStore } from "../store/useSimulationStore";
import ControlDeck from "../components/simulator/ControlDeck";
import LiveGrid from "../components/simulator/LiveGrid";
import CourseSelector from "../components/simulator/CourseSelector";
import GraphTree from "../components/simulator/GraphTree";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Visualizer() {
    const { isPlaying, step } = useSimulationStore();
    const speedMultiplier = useSimulationStore((state) => state.speedMultiplier);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Auto-step logic
    useEffect(() => {
        if (!isPlaying) return;
        const intervalMs = Math.max(50, 500 / speedMultiplier);
        const timerId = setInterval(() => {
            step();
        }, intervalMs);
        return () => clearInterval(timerId);
    }, [isPlaying, step, speedMultiplier]);

    return (
        <div className="w-full h-screen bg-slate-950 text-slate-200 overflow-hidden flex font-sans">

            {/* Sliding Sidebar for Course Selection */}
            <div className={`transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden h-full flex flex-col relative z-20 shadow-2xl shadow-black`}>
                <div className="w-80 h-full">
                    <CourseSelector />
                </div>
            </div>

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 relative">

                {/* Header */}
                <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 shrink-0 transition-colors gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Toggle Course Drawer"
                    >
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>

                    <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            YU
                        </div>
                        <h1 className="text-sm font-semibold tracking-wider text-slate-100">
                            SYNC <span className="text-indigo-400">INFO</span> / ENGINE
                        </h1>
                    </div>
                </header>

                {/* Dashboard Grid */}
                <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 p-4 min-h-0 bg-slate-950">

                    {/* Left Area: Live Grid */}
                    <div className="col-span-8 row-span-4 rounded-xl border border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col shadow-inner backdrop-blur-sm">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <LiveGrid />
                        </div>
                    </div>

                    {/* Right Area: Decision Tree */}
                    <div className="col-span-4 row-span-6 rounded-xl border border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col shadow-inner backdrop-blur-sm">
                        <GraphTree />
                    </div>

                    {/* Bottom Left Area: Control Deck */}
                    <div className="col-span-8 row-span-2 rounded-xl border border-indigo-900/30 bg-indigo-950/20 relative overflow-hidden flex flex-col shadow-lg backdrop-blur-md">
                        <div className="px-4 py-2 border-b border-indigo-900/30 bg-indigo-900/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest shrink-0">
                            Control Deck
                        </div>
                        <div className="flex-1 p-2 flex flex-col justify-center">
                            <ControlDeck />
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
