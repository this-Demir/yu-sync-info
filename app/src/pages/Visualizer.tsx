import { useEffect, useState } from "react";
import { useSimulationStore } from "../store/useSimulationStore";
import ControlDeck from "../components/simulator/ControlDeck";
import LiveGrid from "../components/simulator/LiveGrid";
import CourseSelector from "../components/simulator/CourseSelector";
import GraphTree from "../components/simulator/GraphTree";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { ChevronLeft, Menu } from "lucide-react";

/** Which panel the phone layout is showing. Ignored at lg and above. */
type Pane = "courses" | "grid" | "tree";

const PANES: { id: Pane; label: string }[] = [
    { id: "courses", label: "Courses" },
    { id: "grid", label: "Timetable" },
    { id: "tree", label: "Tree" },
];

export default function Visualizer() {
    const { isPlaying, step } = useSimulationStore();
    const speedMultiplier = useSimulationStore((state) => state.speedMultiplier);
    const selectedCount = useSimulationStore((state) => state.selectedCourses.length);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Below lg the three panels cannot share one viewport height, so only one is
    // mounted at a time and a segmented control switches between them. The
    // control deck stays pinned underneath, so a run can be driven from any pane.
    const [pane, setPane] = useState<Pane>("grid");

    // Auto-step logic
    useEffect(() => {
        if (!isPlaying) return;
        const intervalMs = Math.round((1 - speedMultiplier) * 1500);
        const timerId = setInterval(() => {
            step();
        }, intervalMs);
        return () => clearInterval(timerId);
    }, [isPlaying, step, speedMultiplier]);

    return (
        <div className="custom-scrollbar flex w-full min-h-screen flex-col overflow-y-auto bg-[#FAFAFA] font-sans text-gray-900">

            {/* 100dvh Bounded Lab Workspace, less the fixed mobile tab bar. */}
            <div className="flex h-[calc(100dvh-var(--tabbar-h))] w-full shrink-0 flex-col overflow-hidden">
                <Navbar />

                <main className="relative flex w-full flex-1 overflow-hidden">
                    {/* Sliding Sidebar for Course Selection. Desktop only, since
                        below lg the Courses pane serves the same purpose. */}
                    <div className={`hidden shrink-0 transition-all duration-300 ease-in-out lg:flex ${isSidebarOpen ? 'w-80 md:w-96' : 'w-0'} relative z-20 h-full flex-col overflow-hidden border-r border-gray-200 bg-white shadow-sm`}>
                        <div className="flex h-full w-80 flex-col overflow-hidden md:w-96">
                            <CourseSelector />
                        </div>
                    </div>

                    {/* Main Application Area (Strictly Bounded) */}
                    <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">

                        {/* Quick Toolbar */}
                        <div className="mx-auto hidden w-full max-w-[1600px] shrink-0 items-center gap-4 p-4 pb-0 lg:flex">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                            >
                                {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                                <span>{isSidebarOpen ? "Hide Courses" : "Show Courses"}</span>
                            </button>
                        </div>

                        {/* Pane switcher, phone and tablet only. */}
                        <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-2 lg:hidden">
                            <div
                                role="tablist"
                                aria-label="Simulator panels"
                                className="flex items-stretch gap-1 rounded-lg bg-gray-100 p-1"
                            >
                                {PANES.map(p => {
                                    const active = pane === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setPane(p.id)}
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors ${
                                                active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                            }`}
                                        >
                                            {p.label}
                                            {p.id === "courses" && selectedCount > 0 && (
                                                <span className={`rounded-full px-1.5 py-px font-mono text-[10px] ${
                                                    active ? "bg-[#004B87] text-white" : "bg-gray-200 text-gray-600"
                                                }`}>
                                                    {selectedCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Single pane below lg. One panel, full width, real height. */}
                        <div className="flex min-h-0 flex-1 flex-col p-3 lg:hidden">
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                {pane === "courses" && <CourseSelector />}
                                {pane === "grid" && (
                                    <div className="custom-scrollbar relative min-h-0 flex-1 overflow-auto p-2">
                                        <LiveGrid />
                                    </div>
                                )}
                                {pane === "tree" && <GraphTree />}
                            </div>
                        </div>

                        {/* Compact control bar, pinned above the mobile tab bar so
                            the run is drivable from whichever pane is showing. */}
                        <div className="shrink-0 border-t border-gray-200 bg-[#FAFAFA] px-3 py-2.5 lg:hidden">
                            <ControlDeck variant="compact" />
                        </div>

                        {/* Dashboard Grid, desktop. Fills remaining height smoothly. */}
                        <div className="mx-auto hidden w-full max-w-[1600px] min-h-0 flex-1 grid-cols-12 gap-4 p-4 lg:grid">

                            {/* Left Column: Live Grid + Control Deck */}
                            <div className="col-span-8 flex min-h-0 flex-col gap-4">
                                {/* Top Left Area: Live Grid */}
                                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                    <div className="custom-scrollbar relative min-h-0 flex-1 overflow-auto p-2">
                                        <LiveGrid />
                                    </div>
                                </div>

                                {/* Bottom Left Area: Control Deck */}
                                <div className="relative flex h-fit shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                    <div className="shrink-0 border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Control Deck
                                    </div>
                                    <div className="p-3">
                                        <ControlDeck />
                                    </div>
                                </div>
                            </div>

                            {/* Right Area: Decision Tree */}
                            <div className="col-span-4 relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                <GraphTree />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer renders naturally below the bounded lab section */}
            <Footer className="w-full shrink-0 bg-[#FAFAFA]" />
        </div>
    );
}
