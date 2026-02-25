import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useRouteStore } from "../store/useRouteStore";

export default function Landing() {
    const navigate = useRouteStore(state => state.navigate);

    return (
        <div className="w-full min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto pt-24 pb-20">
                {/* Hero Section */}
                <div className="text-center w-full max-w-3xl mb-24">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-6">
                        The Engine Behind YU-Sync
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        A deterministic backtracking algorithm optimized for high-dimensional timetable generation. Explore the state-space tree, analyze bitmask performance, and visualize the compute in real-time.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('simulator')}
                            className="bg-black hover:bg-gray-800 text-white rounded-md px-6 py-2.5 text-sm font-medium transition-colors"
                        >
                            Open Simulator
                        </button>
                        <button
                            onClick={() => navigate('docs')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-6 py-2.5 text-sm font-medium transition-colors shadow-sm"
                        >
                            Read Documentation
                        </button>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    {/* Feature 1 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col items-start text-left">
                        <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
                            <span className="font-mono text-xs font-bold text-gray-500">01</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Bitmasking Math</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Intersections between course schedules and free time are computed using binary bitwise operations for zero-allocation performance.
                        </p>
                        <span className="font-mono text-[10px] text-gray-500 mt-auto bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 w-full truncate">
                            mask & target === 0
                        </span>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col items-start text-left">
                        <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
                            <span className="font-mono text-xs font-bold text-gray-500">02</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">DFS Backtracking</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            The core exploration strategy bounds the search space by aggressively pruning branches that lead to guaranteed collisions.
                        </p>
                        <span className="font-mono text-[10px] text-gray-500 mt-auto bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 w-full truncate">
                            O(b^d) bounded
                        </span>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col items-start text-left">
                        <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
                            <span className="font-mono text-xs font-bold text-gray-500">03</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Generator Yielding</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            The compute cycle yields discrete states, allowing the visualizer to pause, step through, and analyze the decision tree interactively.
                        </p>
                        <span className="font-mono text-[10px] text-gray-500 mt-auto bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 w-full truncate">
                            yield state;
                        </span>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
