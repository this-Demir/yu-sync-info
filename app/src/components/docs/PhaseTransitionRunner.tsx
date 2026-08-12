import { useRef, useState } from "react";
import { generateSchedules } from "../../core/scheduler";
import { generateInstance, measureDensity, maxPlacementPool, DEFAULT_PARAMS } from "../../bench/instances";
import { UNBOUNDED } from "../../bench/experiments";
import { RESULTS } from "../../bench/results.generated";
import { lineChart } from "../../bench/svg";
import Figure from "./Figure";

// Bound to Experiment 4 of docs/06-evaluation.md, the easy-hard-easy pattern
// described by Cheeseman, Kanefsky and Taylor.
//
// The sweep runs one pool size per animation frame rather than in a single
// synchronous loop. Two hundred instances at twelve courses is a few seconds of
// work, and doing it in one pass would freeze the page and hide the shape of
// the curve as it emerges.
//
// The engine is asked for one solution, not all of them, because the object of
// study is the decision problem. Enumerating every solution would measure the
// size of the solution set instead and would hide the effect entirely.

const MAX_POOL = maxPlacementPool(DEFAULT_PARAMS.meetingLength);
const PUBLISHED = RESULTS.phaseTransition;

interface Point {
    pool: number;
    density: number;
    meanNodes: number;
    medianNodes: number;
    solvable: number;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export default function PhaseTransitionRunner() {
    const [courses, setCourses] = useState<number>(PUBLISHED.config.courses);
    const [instances, setInstances] = useState<number>(40);
    const [seed, setSeed] = useState<number>(PUBLISHED.config.baseSeed);
    const [points, setPoints] = useState<Point[]>([]);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const cancelled = useRef(false);

    const sweepOne = (pool: number): Point => {
        const nodes: number[] = [];
        let density = 0;
        let solvable = 0;

        for (let k = 0; k < instances; k++) {
            const sections = generateInstance({
                ...DEFAULT_PARAMS,
                courses,
                sectionsPerCourse: PUBLISHED.config.sectionsPerCourse,
                placementPool: pool,
                seed: seed + k * 10007 + pool,
            });
            const { results, stats } = generateSchedules(sections, 1, UNBOUNDED);
            nodes.push(stats.nodes);
            density += measureDensity(sections);
            if (results.length > 0) solvable++;
        }

        return {
            pool,
            density: density / instances,
            meanNodes: nodes.reduce((a, b) => a + b, 0) / instances,
            medianNodes: median(nodes),
            solvable: solvable / instances,
        };
    };

    const run = () => {
        cancelled.current = false;
        setRunning(true);
        setPoints([]);
        setProgress(0);

        const collected: Point[] = [];
        let pool = 1;

        const step = () => {
            if (cancelled.current) { setRunning(false); return; }

            collected.push(sweepOne(pool));
            setPoints([...collected]);
            setProgress(pool / MAX_POOL);

            pool++;
            if (pool <= MAX_POOL) {
                // Yield to the browser so the curve draws as it is computed.
                requestAnimationFrame(step);
            } else {
                setRunning(false);
            }
        };

        requestAnimationFrame(step);
    };

    const peak = points.length > 0
        ? points.reduce((best, p) => (p.meanNodes > best.meanNodes ? p : best), points[0]!)
        : null;
    const crossover = points.length > 0
        ? points.reduce((best, p) => (Math.abs(p.solvable - 0.5) < Math.abs(best.solvable - 0.5) ? p : best), points[0]!)
        : null;

    const chart = points.length > 1
        ? lineChart({
            title: "Nodes explored to decide an instance",
            subtitle: `${courses} courses, ${PUBLISHED.config.sectionsPerCourse} sections each, ${instances} instances per point, seed ${seed}`,
            xLabel: "Measured constraint density, log scale",
            yLabel: "Nodes, log scale",
            xLog: true,
            yLog: true,
            width: 700,
            height: 340,
            series: [
                { label: "Mean nodes", color: "#2563eb", points: points.map(p => ({ x: p.density, y: Math.max(p.meanNodes, 1) })) },
                { label: "Median nodes", color: "#d97706", dashed: true, points: points.map(p => ({ x: p.density, y: Math.max(p.medianNodes, 1) })) },
            ],
            vRule: peak ? { x: peak.density, label: `peak ${peak.density.toFixed(3)}` } : undefined,
        })
        : null;

    const solvabilityChart = points.length > 1
        ? lineChart({
            title: "Fraction of instances with a solution",
            subtitle: "Same sweep, same horizontal axis",
            xLabel: "Measured constraint density, log scale",
            yLabel: "Solvable fraction",
            xLog: true,
            yMin: 0,
            yMax: 1,
            width: 700,
            height: 260,
            series: [
                { label: "Solvable fraction", color: "#059669", points: points.map(p => ({ x: p.density, y: p.solvable })) },
            ],
            vRule: peak ? { x: peak.density, label: `cost peak ${peak.density.toFixed(3)}` } : undefined,
        })
        : null;

    const matchesPublished =
        courses === PUBLISHED.config.courses &&
        seed === PUBLISHED.config.baseSeed &&
        instances === PUBLISHED.config.instancesPerPoint;

    return (
        <Figure
            label="Figure D"
            title="Phase transition runner"
            claim="that search cost is low at both extremes of constraint density and peaks in between, near where instances stop being solvable"
            source="Experiment 4, section 6"
            caption={
                <>
                    Calls the same instance generator and the same engine that produced Figures 4 and 5 in the docs. At
                    the published settings, {PUBLISHED.config.courses} courses and{" "}
                    {PUBLISHED.config.instancesPerPoint} instances per point at seed {PUBLISHED.config.baseSeed}, this
                    reproduces the published curve exactly. The default of 40 instances per point is lower so the sweep
                    finishes in a few seconds in a browser tab; the shape is the same, with more scatter.
                </>
            }
        >
            <div className="mb-5 flex flex-wrap items-end gap-4">
                <div>
                    <div className="mb-1 flex items-baseline gap-2">
                        <label className="text-[11px] font-semibold text-gray-600">Courses</label>
                        <span className="font-mono text-xs font-bold text-gray-900">{courses}</span>
                    </div>
                    <input
                        type="range" min={6} max={14} value={courses} disabled={running}
                        onChange={e => setCourses(Number(e.target.value))}
                        className="w-28 accent-gray-900 disabled:opacity-40"
                    />
                </div>

                <div>
                    <div className="mb-1 flex items-baseline gap-2">
                        <label className="text-[11px] font-semibold text-gray-600">Instances per point</label>
                        <span className="font-mono text-xs font-bold text-gray-900">{instances}</span>
                    </div>
                    <input
                        type="range" min={10} max={200} step={10} value={instances} disabled={running}
                        onChange={e => setInstances(Number(e.target.value))}
                        className="w-32 accent-gray-900 disabled:opacity-40"
                    />
                </div>

                <div>
                    <div className="mb-1 text-[11px] font-semibold text-gray-600">Seed</div>
                    <input
                        type="number" value={seed} disabled={running}
                        onChange={e => setSeed(Number(e.target.value))}
                        className="w-28 rounded-md border border-gray-200 px-2 py-1 font-mono text-xs text-gray-900 disabled:opacity-40"
                    />
                </div>

                <button
                    onClick={running ? () => { cancelled.current = true; } : run}
                    className={`rounded-lg px-5 py-2 text-xs font-bold tracking-wide text-white shadow-sm transition-all ${
                        running ? "bg-gray-400 hover:bg-gray-500" : "bg-black hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                >
                    {running ? `Stop (${Math.round(progress * 100)}%)` : points.length > 0 ? "Run again" : "Run the sweep"}
                </button>

                <button
                    onClick={() => { setCourses(PUBLISHED.config.courses); setSeed(PUBLISHED.config.baseSeed); setInstances(PUBLISHED.config.instancesPerPoint); }}
                    disabled={running || matchesPublished}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                    Published settings
                </button>
            </div>

            {points.length === 0 && !running && (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center">
                    <p className="text-xs text-gray-400">
                        Sweeps the placement pool from 1 to {MAX_POOL}, which takes density from 1.0 down to about 0.05.
                    </p>
                    <p className="mt-2 text-[11px] text-gray-400">
                        Published result: peak at density{" "}
                        <strong className="font-mono text-gray-600">{PUBLISHED.peak?.meanDensity.toFixed(3)}</strong> with{" "}
                        <strong className="font-mono text-gray-600">{Math.round(PUBLISHED.peak?.meanNodes ?? 0).toLocaleString("en-US")}</strong>{" "}
                        mean nodes, solvability crossover at{" "}
                        <strong className="font-mono text-gray-600">{PUBLISHED.crossover?.meanDensity.toFixed(3)}</strong>.
                    </p>
                </div>
            )}

            {chart && (
                <div className="space-y-3">
                    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: chart }} />
                    {solvabilityChart && (
                        <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: solvabilityChart }} />
                    )}

                    <div className="grid gap-2 sm:grid-cols-3">
                        {[
                            { k: "Cost peak", v: peak ? `density ${peak.density.toFixed(3)}` : "not found", s: peak ? `${Math.round(peak.meanNodes).toLocaleString("en-US")} mean nodes` : "" },
                            { k: "Solvability crossover", v: crossover ? `density ${crossover.density.toFixed(3)}` : "not found", s: crossover ? `${(crossover.solvable * 100).toFixed(0)}% solvable` : "" },
                            { k: "Peak against easiest", v: peak && points.length > 0 ? `${(peak.meanNodes / points[points.length - 1]!.meanNodes).toFixed(0)}×` : "not found", s: "mean nodes ratio" },
                        ].map(item => (
                            <div key={item.k} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{item.k}</div>
                                <div className="font-mono text-sm font-black text-gray-900">{item.v}</div>
                                <div className="text-[10px] text-gray-400">{item.s}</div>
                            </div>
                        ))}
                    </div>

                    {matchesPublished && !running && peak && (
                        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] leading-relaxed text-emerald-900">
                            These are the published settings, so this run reproduces Figure 4. The docs report a peak at
                            density {PUBLISHED.peak?.meanDensity.toFixed(3)} and this run found{" "}
                            {peak.density.toFixed(3)}.
                        </p>
                    )}
                </div>
            )}
        </Figure>
    );
}
