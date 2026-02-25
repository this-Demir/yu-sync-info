import { useEffect, useState } from "react";
import { useSimulationStore } from "../store/useSimulationStore";
import ControlDeck from "../components/simulator/ControlDeck";
import LiveGrid from "../components/simulator/LiveGrid";
import CourseSelector from "../components/simulator/CourseSelector";
import GraphTree from "../components/simulator/GraphTree";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { ChevronLeft, Menu } from "lucide-react";

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
        <div className="w-full min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-sans overflow-y-auto custom-scrollbar">

            {/* 100dvh Bounded Lab Workspace */}
            <div className="w-full h-[100dvh] flex flex-col overflow-hidden shrink-0">
                <Navbar />

                <main className="flex-1 flex overflow-hidden w-full relative">
                    {/* Sliding Sidebar for Course Selection */}
                    <div className={`transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-80 md:w-96' : 'w-0'} overflow-hidden h-full flex flex-col relative z-20 shadow-sm bg-white border-r border-gray-200`}>
                        <div className="w-80 md:w-96 h-full overflow-hidden flex flex-col">
                            <CourseSelector />
                        </div>
                    </div>

                    {/* Main Application Area (Strictly Bounded) */}
                    <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">

                        {/* Quick Toolbar */}
                        <div className="p-4 pb-0 flex items-center gap-4 shrink-0 mx-auto w-full max-w-[1600px]">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="px-3 py-1.5 rounded-md bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                                {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                                <span className="hidden sm:inline">{isSidebarOpen ? "Hide Courses" : "Show Courses"}</span>
                            </button>
                        </div>

                        {/* Dashboard Grid - Fills remaining height smoothly */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 mx-auto w-full max-w-[1600px] min-h-0">

                            {/* Left Column: Live Grid + Control Deck */}
                            <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 min-h-0">
                                {/* Top Left Area: Live Grid */}
                                <div className="flex-1 flex flex-col relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 min-h-0">
                                    <div className="flex-1 overflow-auto custom-scrollbar p-2 min-h-0 relative">
                                        <LiveGrid />
                                    </div>
                                </div>

                                {/* Bottom Left Area: Control Deck */}
                                <div className="shrink-0 h-fit flex flex-col relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
                                        Control Deck
                                    </div>
                                    <div className="p-3">
                                        <ControlDeck />
                                    </div>
                                </div>
                            </div>

                            {/* Right Area: Decision Tree */}
                            <div className="col-span-1 lg:col-span-4 flex flex-col relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 min-h-0 h-full">
                                <GraphTree />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer renders naturally below the 100dvh Lab section */}
            <Footer className="w-full shrink-0 bg-[#FAFAFA]" />
        </div>
    );
}
