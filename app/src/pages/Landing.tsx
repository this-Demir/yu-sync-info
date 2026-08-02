import { ArrowRight } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useRouteStore } from "../store/useRouteStore";
import { RESULTS } from "../bench/results.generated";

// The home page has exactly two jobs, to send a visitor to the paper or to the
// simulator. Every measured number below is read from results.generated.ts, so
// the landing page cannot drift from docs/06-evaluation.md.

export default function Landing() {
    const navigate = useRouteStore(state => state.navigate);

    const scaling = RESULTS.scaling;
    const pruning = RESULTS.pruning;
    const phase = RESULTS.phaseTransition;
    const deepestPruning = pruning.points[pruning.points.length - 1]!;

    const stats = [
        {
            value: "NP-complete",
            label: "Section Selection",
            note: "Proved, by reduction from 3-colouring",
        },
        {
            value: scaling.effectiveBranchingFactor.toFixed(2),
            label: `Effective branching factor against ${scaling.config.sectionsPerCourse} sections per course`,
            note: "Measured, Experiment 1",
        },
        {
            value: `${(deepestPruning.checkReduction * 100).toFixed(2)}%`,
            label: `Conflict checks pruning avoids at d = ${deepestPruning.courses}`,
            note: "Measured, Experiment 2",
        },
        {
            value: phase.peak!.meanDensity.toFixed(3),
            label: "Constraint density at which instances cost the most",
            note: "Measured, Experiment 4",
        },
    ];

    return (
        <div className="w-full min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 flex flex-col items-center p-6 w-full max-w-5xl mx-auto pt-20 pb-20">

                {/* Title */}
                <h1 className="w-full mb-8 text-center text-3xl font-bold tracking-tighter text-gray-900">
                    The engine behind YU-Sync
                </h1>

                {/* The two paths */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-16">
                    <button
                        onClick={() => navigate('docs')}
                        className="group bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-left flex flex-col hover:border-gray-300 hover:shadow-md transition-all"
                    >
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                            The paper
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
                            What the engine provably does
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            A self-contained write-up in ten numbered sections. It states the problem
                            formally, proves it hard, proves the search sound and complete, and reports
                            what four seeded experiments actually measured.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 mb-8">
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">03</span>
                                NP-completeness by reduction from graph 3-colouring
                            </li>
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">04</span>
                                Soundness and completeness by a loop invariant
                            </li>
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">06</span>
                                Four reproducible experiments with committed data
                            </li>
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">08</span>
                                What the work does not establish
                            </li>
                        </ul>
                        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            Read the paper
                            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </button>

                    <button
                        onClick={() => navigate('simulator')}
                        className="group bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-left flex flex-col hover:border-gray-300 hover:shadow-md transition-all"
                    >
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                            The simulator
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
                            The same search, one step at a time
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            The search is a generator that yields a state at every decision, so you can
                            pause it, step through it, or let it run. Pick your own courses and watch the
                            engine work on them.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 mb-8">
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">&rarr;</span>
                                The state-space tree as it is explored and pruned
                            </li>
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">&rarr;</span>
                                The week bitmask filling slot by slot
                            </li>
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">&rarr;</span>
                                Live node, prune and conflict check counts
                            </li>
                            <li className="flex gap-2.5">
                                <span className="font-mono text-[11px] text-gray-400 pt-0.5">&rarr;</span>
                                Why an unsatisfiable selection has no schedule
                            </li>
                        </ul>
                        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            Open the simulator
                            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </button>
                </div>

                {/* Results, quoted from the generated experiment output */}
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                        {stats.map(stat => (
                            <div key={stat.label} className="bg-white p-5 flex flex-col">
                                <span className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                                    {stat.value}
                                </span>
                                <span className="text-xs text-gray-500 leading-relaxed mb-3">
                                    {stat.label}
                                </span>
                                <span className="mt-auto font-mono text-[10px] uppercase tracking-wider text-gray-400">
                                    {stat.note}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-400 text-center">
                        Every measured figure here is seeded and reproduces exactly. Timing figures are
                        hardware dependent and are reported only in the paper.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
