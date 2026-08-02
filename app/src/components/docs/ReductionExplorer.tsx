import { useMemo, useState } from "react";
import { generateSchedules } from "../../core/scheduler";
import {
    buildReductionInstance,
    selectionToColouring,
    improperEdges,
    PRESET_GRAPHS,
    COLOURS,
    type Colour,
    type Edge,
} from "../../bench/reduction";
import { UNBOUNDED, EXHAUSTIVE_MAX_RESULTS } from "../../bench/experiments";
import Figure from "./Figure";

// Bound to Theorem 2 of docs/03-complexity.md, the reduction from 3-colouring.
//
// The graph is turned into a Section Selection instance by exactly the
// construction the proof states, and the instance is handed to the shipped
// scheduler. Lemma 2 and Lemma 3 are then observable: a proper colouring always
// produces a conflict-free selection, and anything the engine returns always
// decodes to a proper colouring.

const MAX_VERTICES = 5;
const COLOUR_STYLES: Record<Colour, { chip: string; ring: string; label: string }> = {
    1: { chip: "bg-blue-500", ring: "ring-blue-500", label: "1" },
    2: { chip: "bg-amber-500", ring: "ring-amber-500", label: "2" },
    3: { chip: "bg-emerald-500", ring: "ring-emerald-500", label: "3" },
};

function vertexPosition(i: number, n: number, r = 74, cx = 110, cy = 100) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function edgeKey([u, v]: Edge): string {
    return `${Math.min(u, v)}-${Math.max(u, v)}`;
}

export default function ReductionExplorer() {
    const [vertices, setVertices] = useState(3);
    const [edges, setEdges] = useState<Edge[]>(PRESET_GRAPHS[0]!.edges);
    const [colouring, setColouring] = useState<Colour[]>([1, 2, 3, 1, 2]);

    const edgeSet = useMemo(() => new Set(edges.map(edgeKey)), [edges]);

    // Vertices with no incident edge produce sections with empty masks, which
    // the engine's normaliser discards. They are trivially colourable and are
    // reported separately rather than silently dropped.
    const isolated = useMemo(
        () => Array.from({ length: vertices }, (_, v) => v).filter(v => !edges.some(e => e[0] === v || e[1] === v)),
        [vertices, edges]
    );

    const analysis = useMemo(() => {
        if (edges.length === 0) return null;
        const instance = buildReductionInstance(vertices, edges);
        const { results, stats } = generateSchedules(instance.sections, EXHAUSTIVE_MAX_RESULTS, UNBOUNDED);
        return {
            instance,
            satisfiable: results.length > 0,
            solutions: results.length,
            stats,
            firstColouring: results.length > 0 ? selectionToColouring(results[0]!, vertices) : null,
        };
    }, [vertices, edges]);

    const active = colouring.slice(0, vertices) as Colour[];
    const bad = improperEdges(edges, active);
    const properNow = bad.length === 0;

    const toggleEdge = (u: number, v: number) => {
        const key = edgeKey([u, v]);
        setEdges(prev =>
            prev.some(e => edgeKey(e) === key) ? prev.filter(e => edgeKey(e) !== key) : [...prev, [u, v] as Edge]
        );
    };

    const cycleColour = (v: number) => {
        setColouring(prev => {
            const next = [...prev];
            next[v] = ((next[v]! % 3) + 1) as Colour;
            return next;
        });
    };

    const slotsUsed = edges.length * COLOURS.length;

    return (
        <Figure
            label="Figure B"
            title="Reduction explorer"
            claim="that a graph is 3-colourable exactly when the Section Selection instance built from it is satisfiable"
            source="Theorem 2, section 3.2"
            caption={
                <>
                    Click a vertex to recolour it and click a cell in the adjacency grid to add or remove an edge. The
                    instance is rebuilt by the same <code className="font-mono text-[10px]">buildReductionInstance</code>{" "}
                    the proof describes and is solved by the shipped scheduler, not by a separate demonstration
                    routine. The construction is checked against this component's assumptions in{" "}
                    <code className="font-mono text-[10px]">Reduction.test.ts</code>.
                </>
            }
        >
            <div className="mb-5 flex flex-wrap gap-2">
                {PRESET_GRAPHS.map(g => (
                    <button
                        key={g.name}
                        onClick={() => { setVertices(g.vertices); setEdges(g.edges); }}
                        className="rounded-md border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    >
                        {g.name}
                    </button>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                {/* Graph */}
                <div>
                    <svg width={220} height={200} viewBox="0 0 220 200" className="mx-auto block">
                        {edges.map(([u, v]) => {
                            const a = vertexPosition(u, vertices);
                            const b = vertexPosition(v, vertices);
                            const isBad = active[u] === active[v];
                            return (
                                <line
                                    key={edgeKey([u, v])}
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke={isBad ? "#ef4444" : "#d1d5db"}
                                    strokeWidth={isBad ? 3 : 1.75}
                                />
                            );
                        })}
                        {Array.from({ length: vertices }, (_, v) => {
                            const p = vertexPosition(v, vertices);
                            const c = COLOUR_STYLES[active[v] ?? 1];
                            return (
                                <g key={v} onClick={() => cycleColour(v)} className="cursor-pointer">
                                    <circle
                                        cx={p.x} cy={p.y} r={17}
                                        className={c.chip.replace("bg-", "fill-")}
                                        stroke="#fff" strokeWidth={2.5}
                                    />
                                    <text
                                        x={p.x} y={p.y + 4.5} textAnchor="middle"
                                        fontSize="12" fontWeight="800" fill="white"
                                        fontFamily="system-ui, sans-serif" pointerEvents="none"
                                    >
                                        {v}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    <div className="mt-1 flex items-center justify-center gap-3">
                        <label className="text-[11px] font-semibold text-gray-500">Vertices</label>
                        <input
                            type="range" min={3} max={MAX_VERTICES} value={vertices}
                            onChange={e => {
                                const n = Number(e.target.value);
                                setVertices(n);
                                setEdges(prev => prev.filter(([u, v]) => u < n && v < n));
                            }}
                            className="w-24 accent-gray-900"
                        />
                        <span className="font-mono text-xs font-bold text-gray-900">{vertices}</span>
                    </div>

                    {/* Adjacency grid */}
                    <div className="mt-4">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Edges</p>
                        <div className="inline-block">
                            {Array.from({ length: vertices }, (_, u) => (
                                <div key={u} className="flex">
                                    {Array.from({ length: vertices }, (_, v) => {
                                        if (v <= u) return <div key={v} className="h-6 w-6" />;
                                        const on = edgeSet.has(edgeKey([u, v]));
                                        return (
                                            <button
                                                key={v}
                                                onClick={() => toggleEdge(u, v)}
                                                aria-label={`edge ${u} to ${v}`}
                                                className={`m-px h-6 w-6 rounded text-[9px] font-bold transition-colors ${
                                                    on ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                                                }`}
                                            >
                                                {u}{v}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Instance and verdicts */}
                <div className="min-w-0">
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                            { k: "Courses", v: vertices },
                            { k: "Sections", v: vertices * 3 },
                            { k: "Slots (3|E|)", v: slotsUsed },
                            { k: "Selections", v: Math.pow(3, vertices) },
                        ].map(item => (
                            <div key={item.k} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{item.k}</div>
                                <div className="font-mono text-base font-black text-gray-900">{item.v}</div>
                            </div>
                        ))}
                    </div>

                    {/* Your colouring */}
                    <div
                        className={`mb-3 rounded-lg border px-4 py-3 ${
                            properNow ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                        }`}
                    >
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Your colouring
                        </p>
                        <p className={`text-xs leading-relaxed ${properNow ? "text-emerald-900" : "text-red-900"}`}>
                            {properNow ? (
                                <>
                                    Proper. By Lemma 2 the induced selection is conflict-free, so no two chosen sections
                                    share a slot.
                                </>
                            ) : (
                                <>
                                    Improper on {bad.map(e => `${e[0]}-${e[1]}`).join(", ")}. Each such edge{" "}
                                    <em>uv</em> puts slot <em>t(uv, k)</em> in both chosen masks, which is precisely the
                                    collision Lemma 3 relies on.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Engine verdict */}
                    {analysis ? (
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Shipped engine on this instance
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600">
                                {analysis.satisfiable ? (
                                    <>
                                        <strong className="text-emerald-700">Satisfiable.</strong> The engine found{" "}
                                        {analysis.solutions} conflict-free{" "}
                                        {analysis.solutions === 1 ? "selection" : "selections"} in {analysis.stats.nodes}{" "}
                                        nodes, pruning {analysis.stats.pruned}. Decoding the first gives the colouring{" "}
                                        <span className="font-mono font-bold text-gray-900">
                                            {analysis.firstColouring?.join(", ")}
                                        </span>
                                        , which is proper. The graph is 3-colourable.
                                    </>
                                ) : (
                                    <>
                                        <strong className="text-red-700">Unsatisfiable.</strong> The engine exhausted the
                                        search in {analysis.stats.nodes} nodes, pruning {analysis.stats.pruned}, and found
                                        no conflict-free selection. By Lemma 2, contrapositively, the graph has no proper
                                        3-colouring.
                                    </>
                                )}
                            </p>
                            {isolated.length > 0 && (
                                <p className="mt-2 border-t border-gray-100 pt-2 text-[11px] leading-relaxed text-gray-400">
                                    {isolated.length === 1 ? "Vertex" : "Vertices"} {isolated.join(", ")}{" "}
                                    {isolated.length === 1 ? "has" : "have"} no incident edge, so{" "}
                                    {isolated.length === 1 ? "its" : "their"} sections have empty masks and the engine
                                    drops {isolated.length === 1 ? "it" : "them"}. An isolated vertex takes any colour, so
                                    this does not affect 3-colourability.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
                            Add an edge to build an instance. With no edges the slot universe is empty and every
                            colouring is proper.
                        </div>
                    )}
                </div>
            </div>
        </Figure>
    );
}
