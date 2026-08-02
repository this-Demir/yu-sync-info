import { useMemo, useState } from "react";
import { generateSchedules } from "../../core/scheduler";
import {
    generateInstance,
    measureDensity,
    searchTreeSize,
    stateSpaceSize,
    maxPlacementPool,
    DEFAULT_PARAMS,
} from "../../bench/instances";
import { UNBOUNDED, EXHAUSTIVE_MAX_RESULTS } from "../../bench/experiments";
import { Tex } from "../ui/Tex";
import Figure from "./Figure";

// Bound to section 4.5 of docs/04-algorithm.md.
//
// The bound the engine's node counter is measured against is the size of the
// fully expanded tree, the sum of the level widths, and not the product of the
// section counts. The product counts leaves only. Showing both side by side is
// deliberate, because conflating them is the error the evaluation had to
// correct.

const MAX_POOL = maxPlacementPool(DEFAULT_PARAMS.meetingLength);

export default function ComplexityExplorer() {
    const [courses, setCourses] = useState(8);
    const [sections, setSections] = useState(4);
    const [pool, setPool] = useState(18);
    const [seed, setSeed] = useState(20260801);

    const result = useMemo(() => {
        const instance = generateInstance({
            ...DEFAULT_PARAMS,
            courses,
            sectionsPerCourse: sections,
            placementPool: pool,
            seed,
        });

        const { results, stats } = generateSchedules(instance, EXHAUSTIVE_MAX_RESULTS, UNBOUNDED);

        const tree = searchTreeSize(instance);
        return {
            tree,
            leaves: stateSpaceSize(instance),
            nodes: stats.nodes,
            pruned: stats.pruned,
            checks: stats.conflictChecks,
            solutions: results.length,
            density: measureDensity(instance),
            fraction: tree === 0 ? 0 : stats.nodes / tree,
            timeMs: stats.timeMs,
        };
    }, [courses, sections, pool, seed]);

    const sliders: { label: string; value: number; min: number; max: number; set: (n: number) => void; hint: string }[] = [
        { label: "Courses (d)", value: courses, min: 2, max: 12, set: setCourses, hint: "tree depth" },
        { label: "Sections each (b)", value: sections, min: 2, max: 6, set: setSections, hint: "branching factor" },
        { label: "Placement pool", value: pool, min: 2, max: MAX_POOL, set: setPool, hint: "smaller means denser" },
    ];

    const bars = [
        { label: "Fully expanded tree", value: result.tree, colour: "bg-red-400" },
        { label: "Complete assignments (leaves)", value: result.leaves, colour: "bg-amber-400" },
        { label: "Nodes actually visited", value: result.nodes, colour: "bg-blue-600" },
    ];
    const widest = Math.max(...bars.map(b => b.value), 1);

    return (
        <Figure
            label="Figure C"
            title="Bound against reality"
            claim="how far the visited node count falls below the fully expanded tree, and why that tree is the right bound rather than the product of the section counts"
            source="section 4.5"
            caption={
                <>
                    Every value is computed live by running the shipped engine on a freshly generated instance with all
                    production cutoffs disabled. Bar lengths are logarithmic, because at the larger settings a linear
                    scale would render the blue bar invisible.
                </>
            }
        >
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <div className="space-y-4">
                    {sliders.map(s => (
                        <div key={s.label}>
                            <div className="mb-1 flex items-baseline justify-between">
                                <label className="text-[11px] font-semibold text-gray-600">{s.label}</label>
                                <span className="font-mono text-xs font-bold text-gray-900">{s.value}</span>
                            </div>
                            <input
                                type="range" min={s.min} max={s.max} value={s.value}
                                onChange={e => s.set(Number(e.target.value))}
                                className="w-full accent-gray-900"
                            />
                            <p className="mt-0.5 text-[10px] text-gray-400">{s.hint}</p>
                        </div>
                    ))}

                    <div className="border-t border-gray-100 pt-3">
                        <div className="mb-1 flex items-baseline justify-between">
                            <label className="text-[11px] font-semibold text-gray-600">Seed</label>
                            <span className="font-mono text-xs font-bold text-gray-900">{seed}</span>
                        </div>
                        <button
                            onClick={() => setSeed(s => s + 1)}
                            className="w-full rounded-md border border-gray-200 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        >
                            New instance
                        </button>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-gray-400">
                            Measured density {result.density.toFixed(4)}
                        </p>
                    </div>
                </div>

                <div className="min-w-0">
                    <div className="space-y-3">
                        {bars.map(b => (
                            <div key={b.label}>
                                <div className="mb-1 flex items-baseline justify-between gap-3">
                                    <span className="text-[11px] font-medium text-gray-600">{b.label}</span>
                                    <span className="font-mono text-xs font-bold text-gray-900">
                                        {b.value.toLocaleString("en-US")}
                                    </span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className={`h-full rounded-full ${b.colour} transition-all duration-300`}
                                        style={{
                                            width: `${Math.max(1.5, (Math.log10(b.value + 1) / Math.log10(widest + 1)) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                            { k: "Fraction visited", v: result.fraction < 0.001 ? result.fraction.toExponential(2) : result.fraction.toFixed(3) },
                            { k: "Pruned", v: result.pruned.toLocaleString("en-US") },
                            { k: "Conflict checks", v: result.checks.toLocaleString("en-US") },
                            { k: "Solutions", v: result.solutions.toLocaleString("en-US") },
                        ].map(item => (
                            <div key={item.k} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{item.k}</div>
                                <div className="font-mono text-sm font-black text-gray-900">{item.v}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Why two bounds
                        </p>
                        <div className="text-[11px] leading-relaxed text-gray-600">
                            <Tex block>
                                {String.raw`N_{\max} \;=\; \sum_{i=1}^{d} \prod_{j \le i} b_{c_j}
                                \qquad\text{against}\qquad \prod_{c} b_c`}
                            </Tex>
                            <p className="mt-1">
                                The left counts every node. The right counts only the leaves and is smaller, so a visited
                                node count divided by it can exceed one. At the current settings they differ by{" "}
                                <strong className="font-mono text-gray-900">
                                    {(result.tree - result.leaves).toLocaleString("en-US")}
                                </strong>{" "}
                                nodes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Figure>
    );
}
