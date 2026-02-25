import Navbar from "../components/layout/Navbar";

export default function Docs() {
    return (
        <div className="w-full min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-sans">
            <Navbar />

            <div className="flex-1 flex overflow-hidden w-full mx-auto">
                {/* Left Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-[#FAFAFA] h-[calc(100vh-56px)] overflow-y-auto shrink-0 p-6 hidden md:block">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Architecture</h3>
                    <ul className="space-y-1">
                        <li>
                            <button className="w-full text-left px-3 py-1.5 rounded-md bg-gray-100 text-gray-900 text-sm font-medium">
                                Introduction
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm font-medium mt-1">
                                Core Algorithm
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm font-medium mt-1">
                                State-Space Tree
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm font-medium mt-1">
                                Bitmask Math
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white h-[calc(100vh-56px)] overflow-y-auto p-8 lg:p-16">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Introduction to YU-Sync</h1>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            The YU-Sync algorithm is designed to resolve multi-dimensional scheduling conflicts using a highly optimized depth-first search approach combined with binary bitmasking. This ensures maximum efficiency while pruning invalid branches early in the computation.
                        </p>

                        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4 mt-12">Compute Environment</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            The visualizer runs the algorithm iteratively via JavaScript generator functions. Each step yields a snapshot of the engine's internal state.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-md font-mono text-sm text-gray-800 overflow-x-auto my-6 leading-snug">
                            <span className="text-purple-600">export function*</span> <span className="text-blue-600">simulationEngine</span>(courses: <span className="text-yellow-600">CourseData</span>[]) {'{'}
                            <br />&nbsp;&nbsp;<span className="text-gray-400">// Initialize simulation state</span>
                            <br />&nbsp;&nbsp;<span className="text-purple-600">let</span> currentMask = <span className="text-orange-500">0</span>;
                            <br />&nbsp;&nbsp;
                            <br />&nbsp;&nbsp;<span className="text-gray-400">// Yield initial state to UI</span>
                            <br />&nbsp;&nbsp;<span className="text-purple-600">yield</span> {'{'} status: <span className="text-green-600">'IDLE'</span>, currentMask {'}'};
                            <br />{'}'}
                        </div>

                        <p className="text-gray-600 mt-6 leading-relaxed">
                            By leveraging generator yielding, the UI thread remains unblocked while parsing thousands of state-space tree nodes, achieving the 60fps interaction requirement.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
