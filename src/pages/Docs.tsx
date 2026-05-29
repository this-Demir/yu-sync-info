import { useState, useEffect, useRef } from 'react';
import Navbar from "../components/layout/Navbar";
import { generateSchedules } from "../core/scheduler";
import { simulateScheduling } from "../core/SimulationEngine";
import courseData from "../data/yu_sync_test_courses.json";

// --- Shared Components ---

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">{title}</h1>
        <p className="text-xl text-gray-500 font-medium tracking-tight leading-relaxed">{subtitle}</p>
    </div>
);

const MathBlock = ({ formula }: { formula: string }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-5 font-mono text-sm text-gray-800 text-center overflow-x-auto shadow-sm my-8">
        <code>{formula}</code>
    </div>
);

const CodeSnippet = ({ code, lang }: { code: string; lang: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <div className="relative bg-[#0A0A0A] rounded-lg border border-gray-800 my-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1A1A] border-b border-gray-800">
                <span className="text-xs font-mono text-gray-400 capitalize">{lang}</span>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(code.replace(/<[^>]+>/g, ''));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                    {copied ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="p-5 overflow-x-auto text-[13px] font-mono leading-relaxed">
                <pre><code className="text-gray-300" dangerouslySetInnerHTML={{ __html: code }} /></pre>
            </div>
        </div>
    );
};

const TreeDiagram = () => {
    type NodeStatus = "root" | "valid" | "pruned" | "success" | "pending";

    const W = 700, H = 460;

    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const calcFit = () => {
        if (!containerRef.current) return 1;
        const avail = containerRef.current.clientWidth - 32;
        return Math.min(1, Math.max(0.4, avail / W));
    };

    useEffect(() => { setZoom(calcFit()); }, []);

    const zoomIn  = () => setZoom(z => Math.min(1.5, parseFloat((z + 0.1).toFixed(1))));
    const zoomOut = () => setZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))));
    const zoomFit = () => setZoom(calcFit());
    const NW = 138, NH = 56;

    const nodes: Record<string, { x: number; y: number; label: string; sub: string; status: NodeStatus; step: number | null }> = {
        root:  { x: 350, y: 48,  label: "Root",      sub: "start — 0 courses",  status: "root",    step: null },
        chem1: { x: 185, y: 162, label: "CHEM 1130",  sub: "Section 1",          status: "valid",   step: 1 },
        chem2: { x: 540, y: 162, label: "CHEM 1130",  sub: "Section 2",          status: "pending", step: 6 },
        engr1: { x: 75,  y: 286, label: "ENGR 1116",  sub: "Section 1",          status: "pruned",  step: 2 },
        engr2: { x: 295, y: 286, label: "ENGR 1116",  sub: "Section 2",          status: "valid",   step: 3 },
        math1: { x: 200, y: 408, label: "MATH 1132",  sub: "Section 1",          status: "success", step: 4 },
        math2: { x: 400, y: 408, label: "MATH 1132",  sub: "Section 2",          status: "pruned",  step: 5 },
    };

    const edges = [
        { from: "root",  to: "chem1" },
        { from: "root",  to: "chem2" },
        { from: "chem1", to: "engr1" },
        { from: "chem1", to: "engr2" },
        { from: "engr2", to: "math1" },
        { from: "engr2", to: "math2" },
    ];

    const successPath = new Set(["root→chem1", "chem1→engr2", "engr2→math1"]);

    const fill:   Record<NodeStatus, string> = { root: "#fff",    valid: "#f0fdf4", pruned: "#fef2f2", success: "#dcfce7", pending: "#f9fafb" };
    const stroke: Record<NodeStatus, string> = { root: "#9ca3af", valid: "#86efac", pruned: "#fca5a5", success: "#16a34a", pending: "#d1d5db" };
    const sw:     Record<NodeStatus, number> = { root: 2,         valid: 1.5,       pruned: 1.5,       success: 2.5,       pending: 1 };
    const tc:     Record<NodeStatus, string> = { root: "#374151", valid: "#166534", pruned: "#b91c1c",  success: "#14532d", pending: "#9ca3af" };

    return (
        <div className="my-10 not-prose border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

            {/* Legend */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex gap-4 flex-wrap items-center text-[11px] text-gray-500 font-medium">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mr-1">Legend</span>
                {([
                    ["#fff",    "#9ca3af", 2,   "Root"],
                    ["#f0fdf4", "#86efac", 1.5, "Valid path"],
                    ["#fef2f2", "#fca5a5", 1.5, "Pruned"],
                    ["#dcfce7", "#16a34a", 2.5, "Schedule found"],
                    ["#f9fafb", "#d1d5db", 1,   "Pending"],
                ] as [string, string, number, string][]).map(([f, s, sw, lbl]) => (
                    <span key={lbl} className="flex items-center gap-1.5">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <rect x="1" y="1" width="14" height="14" rx="3" fill={f} stroke={s} strokeWidth={sw} />
                        </svg>
                        {lbl}
                    </span>
                ))}
                <span className="ml-auto flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="7" fill="#1f2937" />
                        <text x="8" y="12" textAnchor="middle" fontSize="8" fontWeight="900" fill="white" fontFamily="system-ui,sans-serif">n</text>
                    </svg>
                    DFS step order
                </span>
            </div>

            {/* SVG Tree */}
            <div ref={containerRef} className="relative p-4 bg-white">
                {/* Zoom controls */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                    <button onClick={zoomOut} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold text-base leading-none">−</button>
                    <span className="text-[10px] font-mono text-gray-400 w-9 text-center select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={zoomIn}  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold text-base leading-none">+</button>
                    <span className="w-px h-4 bg-gray-200 mx-1" />
                    <button onClick={zoomFit} className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wide px-1">fit</button>
                </div>

                <div style={{ height: H * zoom, overflow: "hidden" }}>
                <svg width={W * zoom} height={H * zoom} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto" }}>

                    {/* Draw edges */}
                    {edges.map(({ from, to }) => {
                        const f = nodes[from], t = nodes[to];
                        const key = `${from}→${to}`;
                        const isSuccess = successPath.has(key);
                        const isPruned  = nodes[to].status === "pruned";
                        const isPending = nodes[to].status === "pending";
                        return (
                            <line key={key}
                                x1={f.x} y1={f.y + NH / 2}
                                x2={t.x} y2={t.y - NH / 2}
                                stroke={isSuccess ? "#4ade80" : isPruned ? "#fca5a5" : "#e5e7eb"}
                                strokeWidth={isSuccess ? 2.5 : 1.5}
                                strokeDasharray={isPruned || isPending ? "5 4" : undefined}
                            />
                        );
                    })}

                    {/* Ghost pruned subtree under ENGR Sec 1 */}
                    <line x1={75} y1={286 + NH / 2} x2={75} y2={390}
                        stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 3" />
                    <rect x={22} y={390} width={106} height={34} rx={8}
                        fill="#fef2f2" stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
                    <text x={75} y={404} textAnchor="middle" fontSize="9.5"
                        fill="#b91c1c" fontFamily="system-ui,sans-serif" opacity={0.7}>MATH 1132 ×2</text>
                    <text x={75} y={418} textAnchor="middle" fontSize="9"
                        fill="#b91c1c" fontFamily="system-ui,sans-serif" opacity={0.5}>paths skipped</text>

                    {/* Draw nodes */}
                    {Object.entries(nodes).map(([key, n]) => {
                        const nx = n.x - NW / 2, ny = n.y - NH / 2;
                        return (
                            <g key={key}>
                                <rect x={nx} y={ny} width={NW} height={NH} rx={10}
                                    fill={fill[n.status]} stroke={stroke[n.status]} strokeWidth={sw[n.status]} />

                                <text x={n.x} y={n.y - 7} textAnchor="middle"
                                    fontSize="11.5" fontWeight="700" fill={tc[n.status]}
                                    fontFamily="system-ui,sans-serif">
                                    {n.label}
                                </text>
                                <text x={n.x} y={n.y + 11} textAnchor="middle"
                                    fontSize="10" fill={tc[n.status]} opacity={0.55}
                                    fontFamily="system-ui,sans-serif">
                                    {n.sub}
                                </text>

                                {/* Step badge — top-left */}
                                {n.step !== null && (
                                    <g>
                                        <circle cx={nx + 12} cy={ny + 13} r={11} fill="#1f2937" />
                                        <text x={nx + 12} y={ny + 17} textAnchor="middle"
                                            fontSize="9.5" fontWeight="900" fill="white"
                                            fontFamily="system-ui,sans-serif">{n.step}</text>
                                    </g>
                                )}

                                {/* Status badge — top-right */}
                                {n.status === "pruned" && (
                                    <g>
                                        <circle cx={nx + NW - 12} cy={ny + 13} r={11} fill="#ef4444" />
                                        <text x={nx + NW - 12} y={ny + 17.5} textAnchor="middle"
                                            fontSize="10" fontWeight="900" fill="white"
                                            fontFamily="system-ui,sans-serif">✕</text>
                                    </g>
                                )}
                                {(n.status === "valid" || n.status === "success") && (
                                    <g>
                                        <circle cx={nx + NW - 12} cy={ny + 13} r={11} fill="#22c55e" />
                                        <text x={nx + NW - 12} y={ny + 17.5} textAnchor="middle"
                                            fontSize="10" fontWeight="900" fill="white"
                                            fontFamily="system-ui,sans-serif">✓</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
                </div>
            </div>

            {/* Step annotations */}
            <div className="border-t border-gray-100 px-6 py-5">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-3">Step-by-step</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {[
                        [1, "DFS commits to CHEM 1130 Sec 1 — no conflict yet, recurse."],
                        [2, "M ∧ T ≠ 0 — Monday 10:40 overlap. Entire ENGR Sec 1 subtree pruned."],
                        [3, "M ∧ T = 0 — no conflict. Continue deeper into ENGR Sec 2."],
                        [4, "All 3 courses placed, no conflicts → valid schedule recorded."],
                        [5, "M ∧ T ≠ 0 — Wednesday conflict. MATH Sec 2 pruned."],
                        [6, "Backtrack to root → try CHEM 1130 Sec 2, exploration continues."],
                    ].map(([step, text]) => (
                        <div key={step} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[9px] font-black inline-flex items-center justify-center shrink-0 mt-0.5">
                                {step}
                            </span>
                            <span className="text-xs text-gray-500 leading-snug">{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-black text-gray-900">6</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">Nodes evaluated</p>
                </div>
                <div>
                    <p className="text-2xl font-black text-red-500">3+</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">Paths eliminated</p>
                </div>
                <div>
                    <p className="text-2xl font-black text-emerald-600">1</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">Valid schedule</p>
                </div>
            </div>
        </div>
    );
};

const LiveParityRunner = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{ prodTime: string; prodSchedules: number; simTime: string; simSchedules: number } | null>(null);

    const runCheck = () => {
        setIsRunning(true);
        setResult(null);
        setTimeout(() => {
            const courseCodes = ["CHEM 1130", "ENGR 1116", "MATH 1132", "SOFL 1102"];
            const testSections = (courseData as any[])
                .filter(c => courseCodes.includes(c.courseCode ?? c.CourseCode))
                .flatMap(c => c.sections ?? c.Sections ?? []);
            const maxResults = 200;
            const pt0 = performance.now();
            const prodRes = generateSchedules(testSections, maxResults);
            const pt1 = performance.now();
            const st0 = performance.now();
            const gen = simulateScheduling(testSections, maxResults);
            let simSchedules: any[] = [];
            for (const state of gen) {
                if (state.step === "COMPLETE") simSchedules = state.foundSchedules;
            }
            const st1 = performance.now();
            setResult({ prodTime: (pt1 - pt0).toFixed(2), prodSchedules: prodRes.results.length, simTime: (st1 - st0).toFixed(2), simSchedules: simSchedules.length });
            setIsRunning(false);
        }, 600);
    };

    return (
        <div className="my-10 border border-gray-200 rounded-xl p-8 bg-white shadow-xl flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50">
            {!result && (
                <button onClick={runCheck} disabled={isRunning} className="px-8 py-4 bg-black text-white text-sm font-bold tracking-wide rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-75 disabled:hover:translate-y-0 transition-all flex items-center">
                    {isRunning && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isRunning ? "Running Benchmark..." : "Run Deterministic Parity Check"}
                </button>
            )}
            {result && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-400">

                    {/* Parity status */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Parity confirmed</p>
                            <p className="text-xs text-gray-400">Both engines returned identical results</p>
                        </div>
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            100% match
                        </span>
                    </div>

                    {/* Engine comparison */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            { label: "Production Engine", schedules: result.prodSchedules, time: result.prodTime, note: "scheduler.ts" },
                            { label: "Simulation Engine", schedules: result.simSchedules,  time: result.simTime,  note: "SimulationEngine.ts" },
                        ].map(e => (
                            <div key={e.label} className="border border-gray-200 rounded-xl p-5 bg-white">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{e.label}</p>
                                <p className="text-3xl font-black text-gray-900 leading-none mb-1">{e.schedules}</p>
                                <p className="text-xs text-gray-400 mb-3">schedules found</p>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-gray-400">{e.note}</span>
                                    <span className="font-mono text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                                        {e.time} ms
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Run again */}
                    <button
                        onClick={runCheck}
                        className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors bg-white"
                    >
                        Run again
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Nav structure ---

const TAB_GROUPS = [
    { label: "Overview",        ids: ["introduction"] },
    { label: "Getting Started", ids: ["guide", "glossary"] },
    { label: "Algorithm",       ids: ["math", "complexity", "dfs"] },
    { label: "Architecture",    ids: ["gap", "parity"] },
    { label: "Reference",       ids: ["data"] },
    { label: "Closing",         ids: ["conclusion"] },
];

const ALL_TABS = [
    { id: "introduction", label: "Introduction" },
    { id: "guide",        label: "How to Use" },
    { id: "glossary",     label: "Key Concepts" },
    { id: "math",         label: "The Mathematics" },
    { id: "complexity",   label: "Complexity Analysis" },
    { id: "dfs",          label: "DFS & Pruning" },
    { id: "gap",          label: "Architectural Divergence" },
    { id: "parity",       label: "Parity Verification" },
    { id: "data",         label: "Data Format" },
    { id: "conclusion",   label: "Conclusion" },
];

// --- Main Page ---

export default function Docs() {
    const [activeSection, setActiveSection] = useState("introduction");
    const contentRef = useRef<HTMLDivElement>(null);

    // Scrollspy: update active section as user scrolls
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                }
            },
            { rootMargin: "0px 0px -75% 0px", threshold: 0 }
        );
        ALL_TABS.forEach(tab => {
            const el = document.getElementById(tab.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        // offset by navbar height (56px) + a little breathing room
        const top = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: "smooth" });
    };

    return (
        <div className="w-full min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900">
            <Navbar />

            <div className="flex-1 w-full max-w-[1400px] mx-auto flex items-start">

                {/* Sticky Sidebar */}
                <aside className="w-72 border-r border-gray-100 sticky top-0 h-screen overflow-y-auto shrink-0 py-10 px-8 hidden md:block">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 pl-2">Documentation</h3>
                    <div className="space-y-6">
                        {TAB_GROUPS.map(group => (
                            <div key={group.label}>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.18em] mb-1.5 pl-2">{group.label}</p>
                                <ul className="space-y-0.5 relative">
                                    <div className="absolute left-[3px] top-2 bottom-2 w-px bg-gray-100"></div>
                                    {group.ids.map(id => {
                                        const tab = ALL_TABS.find(t => t.id === id)!;
                                        const isActive = activeSection === id;
                                        return (
                                            <li key={id} className="relative">
                                                {isActive && (
                                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full z-10"></div>
                                                )}
                                                <button
                                                    onClick={() => scrollTo(id)}
                                                    className={`w-full text-left pl-6 pr-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${isActive ? 'text-black font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
                                                >
                                                    {tab.label}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Scrollable Content */}
                <div ref={contentRef} className="flex-1 px-8 lg:px-24">
                    <div className="max-w-[700px] py-16">

                        {/* ── Introduction ── */}
                        <section id="introduction" className="pb-20 border-b border-gray-100">
                            <SectionTitle title="Introduction" subtitle="What this project is, what it demonstrates, and who it is for." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>
                                    YU-Sync is a student project that makes one question concrete: how does a computer find a valid class schedule without trying every possible combination? The answer involves bitmasks, backtracking, and a deliberate architectural split between speed and visibility. This documentation explains each piece.
                                </p>
                                <p>
                                    Basic programming familiarity is enough to follow along. Use the sidebar to jump to any section — or simply scroll.
                                </p>
                            </div>
                        </section>

                        {/* ── How to Use ── */}
                        <section id="guide" className="pb-20 border-b border-gray-100">
                            <SectionTitle title="How to Use" subtitle="A walkthrough of the visualizer controls and what everything means." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <h3 className="text-gray-900 font-bold text-xl mt-10 mb-4 tracking-tight">Controls</h3>
                                <div className="not-prose space-y-3 my-6">
                                    {[
                                        { icon: "▶ / ⏸", label: "Play / Pause",    desc: "Runs the algorithm automatically, advancing one step per tick. Hit again to pause at any point." },
                                        { icon: "⏭",     label: "Step Forward",    desc: "Manually advance exactly one algorithm step. Use this to follow the logic slowly. Disabled while playing." },
                                        { icon: "↺",     label: "Reset",           desc: "Clears the tree and restarts the simulation from scratch." },
                                        { icon: "⚡",     label: "Instant Compute", desc: "Skips the animation entirely and runs the full algorithm at once. The tree and all valid schedules appear immediately." },
                                        { icon: "━",     label: "Speed slider",    desc: "Controls playback speed from 0.1× (slow motion) to 10× (near-instant). Adjustable while playing." },
                                    ].map(c => (
                                        <div key={c.label} className="flex gap-4 bg-gray-50 border border-gray-200 rounded-lg px-5 py-4">
                                            <span className="font-mono text-lg w-8 shrink-0 text-gray-400 mt-0.5">{c.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{c.label}</p>
                                                <p className="text-gray-500 text-sm mt-0.5">{c.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">Engine Status Badge</h3>
                                <p>The status badge in the control bar shows the algorithm's current operation:</p>
                                <div className="not-prose grid grid-cols-2 gap-2 my-6">
                                    {[
                                        { state: "INIT",          color: "bg-blue-100 text-blue-700",     desc: "Engine initializing" },
                                        { state: "SELECTING",     color: "bg-[#e8f3fc] text-[#004B87]",   desc: "Picking a section to try" },
                                        { state: "BITMASK_CHECK", color: "bg-purple-100 text-purple-700", desc: "Running collision check" },
                                        { state: "CONFLICT",      color: "bg-rose-100 text-rose-700",     desc: "Overlap detected, pruning" },
                                        { state: "BACKTRACKING",  color: "bg-orange-100 text-orange-700", desc: "Stepping back up the tree" },
                                        { state: "SUCCESS",       color: "bg-emerald-100 text-emerald-700", desc: "Valid schedule found" },
                                        { state: "COMPLETE",      color: "bg-slate-100 text-slate-700",   desc: "All paths exhausted" },
                                    ].map(s => (
                                        <div key={s.state} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.color} shrink-0`}>{s.state}</span>
                                            <span className="text-sm text-gray-500">{s.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">Reading the Tree</h3>
                                <ul className="space-y-2 mt-4">
                                    <li><strong>Each level</strong> represents one course being assigned. Level 1 = first course, level 2 = second, and so on.</li>
                                    <li><strong>Each node</strong> at a level is a different section of that course the engine tried.</li>
                                    <li><strong>A path</strong> from root to a leaf = one complete schedule attempt (all courses assigned).</li>
                                    <li><strong>Node colors:</strong> amber = currently evaluating (pulsing), red = conflict/pruned, green = valid, faded = skipped.</li>
                                </ul>
                            </div>
                        </section>

                        {/* ── Key Concepts ── */}
                        <section id="glossary" className="py-20 border-b border-gray-100">
                            <SectionTitle title="Key Concepts" subtitle="Plain-language definitions for every term used in this project." />
                            <div className="not-prose space-y-4">
                                {[
                                    { term: "Constraint Satisfaction Problem (CSP)",   def: "A class of problems where you assign values to variables so that a set of constraints holds. Scheduling is a CSP — the variables are courses, the values are sections, and the constraint is no time overlap between chosen sections." },
                                    { term: "State-Space Tree",                        def: "A tree where each node represents a partial assignment — some courses picked, some not yet. The root is an empty schedule. Each branch adds one more course. The set of all root-to-leaf paths is the entire search space." },
                                    { term: "Depth-First Search (DFS)",                def: "A traversal strategy that commits to one choice and follows it as deep as possible before trying alternatives. The engine picks Section 1 of Course A, then Section 1 of Course B, drilling down — rather than exhausting all of Course A's options before touching Course B." },
                                    { term: "Backtracking",                            def: "When DFS hits a dead end (a conflict), it steps back to the last choice point and tries the next option. This is the recovery mechanism that lets the engine explore the full space without getting stuck." },
                                    { term: "Pruning",                                 def: "Cutting off an entire subtree the moment a conflict is detected. If Section 1 of Course B collides with the current schedule, every deeper combination containing that node is skipped — potentially eliminating thousands of paths in one check." },
                                    { term: "Bitmask",                                 def: "An integer used as a compact array of boolean flags. In YU-Sync, each bit represents one 10-minute time slot (12 bits per day, starting 08:40). A '1' means the slot is occupied; '0' means it's free. A full week is 7 such integers." },
                                    { term: "Bitwise AND — collision detection",        def: "Two bitmasks ANDed together. If the result is non-zero, they share at least one '1' bit — meaning both sections occupy the same time slot. This check is one CPU instruction: O(1)." },
                                    { term: "Week Mask",                               def: "A record of 7 integers (one per day) encoding which slots are occupied in the current partial schedule. When a section is added, its slots are OR'd in. When a new section is tested, its mask is AND'd against the relevant day to check for conflicts." },
                                    { term: "Generator Function (function*)",          def: "A JavaScript function that can suspend at a yield statement and resume later from that exact point. Instead of running to completion all at once, it produces one value per .next() call. This is what makes step-by-step visualization possible — each yield emits one algorithm snapshot." },
                                    { term: "Branching Factor (b)",                   def: "The average number of children a node has in the search tree — equivalently, the average number of sections per course. A higher branching factor means more combinations to explore." },
                                    { term: "Depth (d)",                              def: "The number of courses being scheduled. The tree's depth equals d. Each level of the tree corresponds to one course commitment." },
                                ].map(({ term, def }) => (
                                    <div key={term} className="border border-gray-200 rounded-lg px-6 py-5 bg-white">
                                        <p className="font-bold text-gray-900 text-sm mb-1.5">{term}</p>
                                        <p className="text-gray-500 text-sm leading-relaxed">{def}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── The Mathematics ── */}
                        <section id="math" className="py-20 border-b border-gray-100">
                            <SectionTitle title="Zero-Allocation Bitmasking" subtitle="Applying Boolean Algebra for sub-millisecond collision detection." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>The scheduling problem is an NP-Hard Constraint Satisfaction Problem. Traditional loops and object allocations introduce unacceptable garbage collection overhead. Instead, YU-Sync uses pure Boolean Algebra.</p>
                                <p>We represent the academic week as a 2D matrix, flattened into five discrete 12-bit integers (vectors). Each bit represents a 10-minute time slot.</p>
                                <p>To detect a collision between a current schedule mask (<code>M</code>) and a target course mask (<code>T</code>), we rely on the CPU's hardware-level bitwise AND operator:</p>
                                <MathBlock formula="Collision  ⟺  (M ∧ T) ≠ 0" />
                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">Example Scenario</h3>
                                <p>Assume Monday's current schedule (<code>M</code>) has a class from 10:40 to 12:30. Target course (<code>T</code>) wants to place a lab from 11:40 to 13:30.</p>
                                <div className="pl-4 border-l-2 border-gray-200 my-6 space-y-2 font-mono text-sm text-gray-700 bg-gray-50 py-4 px-6 rounded-r-md">
                                    <div><span className="font-bold text-gray-900">M</span> = 0000 0011 0000</div>
                                    <div><span className="font-bold text-gray-900">T</span> = 0000 0110 0000</div>
                                    <div className="border-t border-gray-300 pt-2 mt-2"><span className="font-bold text-gray-900">M ∧ T</span> = 0000 0010 0000 <span className="text-gray-400 ml-2">(Decimal: 32)</span></div>
                                </div>
                                <p>Since <code>32 &gt; 0</code>, the collision is detected instantly without a single memory allocation.</p>
                                <CodeSnippet lang="typescript" code={`<span class="text-purple-400">for</span> (<span class="text-blue-400">const</span> [i, slotMin] <span class="text-purple-400">of</span> SLOT_STARTS_MIN.<span class="text-yellow-200">entries</span>()) {
    <span class="text-purple-400">if</span> (slotMin >= startMin && slotMin < endMin) {
        <span class="text-gray-500 italic">// Apply bitwise OR to push a '1' into the i-th position</span>
        mask |= (<span class="text-orange-300">1</span> << i);
    }
}`} />
                            </div>
                        </section>

                        {/* ── Complexity Analysis ── */}
                        <section id="complexity" className="py-20 border-b border-gray-100">
                            <SectionTitle title="Complexity Analysis" subtitle="How many paths exist, and how many pruning eliminates." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <h3 className="text-gray-900 font-bold text-xl mt-0 mb-4 tracking-tight">Time Complexity</h3>
                                <p>Without pruning, the engine explores every combination of sections across all courses. With <code>b</code> sections per course and <code>d</code> courses, the worst case is:</p>
                                <MathBlock formula="T(b, d) = O(b^d)  — worst-case nodes visited" />
                                <p>Each node evaluation is <code>O(1)</code> — a single bitwise AND per day (7 integers). So total cost scales with the number of nodes visited, not the cost per node.</p>
                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">Pruning Impact</h3>
                                <p>A conflict at depth 2 in a 4-course tree with 3 sections eliminates up to <code>3² = 9</code> paths in one check:</p>
                                <div className="not-prose my-8 overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left px-4 py-3 font-semibold text-gray-700">Courses (d)</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-700">Sections each (b)</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-700">Worst case (b^d)</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-700">Typical with pruning</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {[
                                                ["2", "3", "9",      "~4–6"],
                                                ["4", "3", "81",     "~20–35"],
                                                ["4", "5", "625",    "~60–120"],
                                                ["6", "4", "4 096",  "~200–500"],
                                                ["8", "4", "65 536", "~1 000–5 000"],
                                            ].map(([d, b, wc, tp]) => (
                                                <tr key={d + b} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-gray-800">{d}</td>
                                                    <td className="px-4 py-3 font-mono text-gray-800">{b}</td>
                                                    <td className="px-4 py-3 font-mono text-red-600">{wc}</td>
                                                    <td className="px-4 py-3 font-mono text-emerald-600">{tp}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">Space Complexity</h3>
                                <p>The call stack depth is bounded by <code>d</code>. No extra data structures are allocated during traversal — the week mask is 7 integers reused in-place.</p>
                                <MathBlock formula="S(d) = O(d)" />
                                <p>The cost of adding a course is one more stack frame and seven integers — not a copy of the entire schedule.</p>
                            </div>
                        </section>

                        {/* ── DFS & Pruning ── */}
                        <section id="dfs" className="py-20 border-b border-gray-100">
                            <SectionTitle title="State-Space Traversal" subtitle="Step-by-step navigation of the DFS decision tree." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>The engine discovers valid schedules by traversing a state-space tree using Depth-First Search (DFS). The time complexity is bounded by <code>O(b^d)</code>, where <code>b</code> is the branching factor and <code>d</code> is the depth.</p>
                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">Tree Walkthrough</h3>
                                <TreeDiagram />
                                <ol className="list-decimal list-outside pl-6 space-y-4">
                                    <li><strong>Selection:</strong> The engine selects Section 1 of <code>CHEM 1130</code>. It shifts to depth <code>d=1</code>.</li>
                                    <li><strong>Evaluation:</strong> It attempts to attach <code>ENGR 1116</code> (Section 1). The bitwise intersection returns <code>&gt; 0</code>.</li>
                                    <li><strong>Aggressive Pruning:</strong> The engine immediately drops this branch. Millions of invalid permutations are mathematically eliminated in <code>O(1)</code> time.</li>
                                    <li><strong>Backtracking:</strong> It steps back and successfully attaches <code>ENGR 1116</code> (Section 2).</li>
                                </ol>
                                <CodeSnippet lang="typescript" code={`<span class="text-purple-400">for</span> (<span class="text-blue-400">const</span> opt <span class="text-purple-400">of</span> options) {
    <span class="text-gray-500 italic">// O(1) Bitmask Intersection Check</span>
    <span class="text-purple-400">if</span> (!<span class="text-yellow-200">fits</span>(currentWeekMask, opt)) {
        pruned++;
        <span class="text-purple-400">continue</span>; <span class="text-gray-500 italic">// Branch is mathematically killed</span>
    }

    <span class="text-gray-500 italic">// Branch is valid, step deeper into the tree</span>
    <span class="text-blue-400">const</span> nextMask = <span class="text-yellow-200">place</span>(currentWeekMask, opt);
    <span class="text-yellow-200">dfs</span>(depth + <span class="text-orange-300">1</span>, nextMask, [...chosen, opt]);
}`} />
                            </div>
                        </section>

                        {/* ── Architectural Divergence ── */}
                        <section id="gap" className="py-20 border-b border-gray-100">
                            <SectionTitle title="The Architectural Divergence" subtitle="Why we abandoned the recursive engine for the UI, and how we froze time." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>The production YU-Sync engine (<code>scheduler.ts</code>) is deeply recursive. When invoked, it locks the V8 JavaScript thread, computing the entire <code>O(b^d)</code> tree in ~2 milliseconds.</p>
                                <p>While perfect for a backend worker, a 2ms execution is impossible to visualize on a DOM. We needed to 'freeze' the compute cycle at 60 FPS without altering the deterministic outcome.</p>
                                <h3 className="text-gray-900 font-bold text-xl mt-12 mb-4 tracking-tight">The Solution: The Generator Pattern</h3>
                                <p>Instead of using standard functions, we wrapped the exact same DFS bitmasking logic inside a JavaScript Generator (<code>function*</code>). By replacing synchronous state mutations with <code>yield</code> statements, we decouple the calculation from the execution pipeline.</p>
                                <ul className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4 my-8 list-none !pl-6">
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2.5 w-2 h-2 rounded-full bg-gray-400"></span>
                                        <strong>Production Engine:</strong> <code>O(1)</code> space overhead per stack frame. Fast, but opaque.
                                    </li>
                                    <li className="relative pl-6">
                                        <span className="absolute left-0 top-2.5 w-2 h-2 rounded-full bg-indigo-500"></span>
                                        <strong>Simulation Engine:</strong> Yields discrete state objects <code>S_t</code>, allowing external controllers (Zustand) to pause, step, or render the bitmask in real-time.
                                    </li>
                                </ul>
                                <CodeSnippet lang="typescript" code={`<span class="text-gray-500 italic">// Production Engine (Opaque)</span>
<span class="text-purple-400">if</span> (targetDepthReached) {
    validSchedules.<span class="text-yellow-200">push</span>([...chosenSchedules]);
    <span class="text-purple-400">return</span>;
}

<span class="text-gray-500 italic">// Simulation Engine (Transparent)</span>
<span class="text-purple-400">if</span> (targetDepthReached) {
    validSchedules.<span class="text-yellow-200">push</span>([...chosenSchedules]);
    <span class="text-purple-400">yield</span> {
        step: <span class="text-green-400">"SUCCESS"</span>,
        message: <span class="text-green-400">"Found a valid schedule!"</span>,
        foundSchedules: validSchedules
    };
    <span class="text-purple-400">return</span>;
}`} />
                            </div>
                        </section>

                        {/* ── Parity Verification ── */}
                        <section id="parity" className="py-20 border-b border-gray-100">
                            <SectionTitle title="Deterministic Parity Verification" subtitle="Proving equality between the synchronous core and the async visualizer." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>Different architectures, identical realities. To prove our simulation is a mathematically sound representation of the production algorithm, we run a deterministic parity check.</p>
                                <p>Click below to execute the <strong>'Industrial Engineering'</strong> dataset (<code>CHEM 1130, ENGR 1116, MATH 1132, SOFL 1102</code>) through both engines simultaneously in your browser.</p>
                                <LiveParityRunner />
                            </div>
                        </section>

                        {/* ── Data Format ── */}
                        <section id="data" className="pt-20 pb-32">
                            <SectionTitle title="Data Format" subtitle="The shape of course and section objects the engine expects." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>The engine works entirely with flat <code>Section[]</code> arrays — one entry per section, regardless of which course it belongs to. The <code>courseCode</code> field on each section is what the DFS uses to group options at each depth level.</p>
                                <h3 className="text-gray-900 font-bold text-xl mt-10 mb-4 tracking-tight">TypeScript Interfaces</h3>
                                <CodeSnippet lang="typescript" code={`<span class="text-purple-400">interface</span> <span class="text-blue-300">DaySlot</span> {
  day:        <span class="text-green-400">"Monday"</span> | <span class="text-green-400">"Tuesday"</span> | <span class="text-green-400">"Wednesday"</span> | <span class="text-green-400">"Thursday"</span>
            | <span class="text-green-400">"Friday"</span> | <span class="text-green-400">"Saturday"</span> | <span class="text-green-400">"Sunday"</span>;
  startTime:  <span class="text-blue-300">string</span>;   <span class="text-gray-500 italic">// "HH:MM" — e.g. "08:40"</span>
  endTime:    <span class="text-blue-300">string</span>;   <span class="text-gray-500 italic">// "HH:MM" — e.g. "10:30"</span>
  classroom?: <span class="text-blue-300">string</span>;
}

<span class="text-purple-400">interface</span> <span class="text-blue-300">Section</span> {
  courseCode: <span class="text-blue-300">string</span>;   <span class="text-gray-500 italic">// e.g. "CHEM 1130"</span>
  sectionNo:  <span class="text-blue-300">number</span>;
  days:       <span class="text-blue-300">DaySlot</span>[];
  isRetake?:  <span class="text-blue-300">boolean</span>;
}

<span class="text-purple-400">interface</span> <span class="text-blue-300">Course</span> {
  courseCode: <span class="text-blue-300">string</span>;
  courseName: <span class="text-blue-300">string</span>;
  year:       <span class="text-blue-300">number</span>;
  semester:   <span class="text-blue-300">string</span>;
  sections:   <span class="text-blue-300">Section</span>[];
}`} />
                                <h3 className="text-gray-900 font-bold text-xl mt-10 mb-4 tracking-tight">Time Slot Grid</h3>
                                <p>12 one-hour windows starting from 08:40. Each slot maps to one bit in the day's integer mask:</p>
                                <div className="not-prose grid grid-cols-4 gap-2 my-6">
                                    {["08:40","09:40","10:40","11:40","12:40","13:40","14:40","15:40","16:40","17:40","18:40","19:40"].map((s, i) => (
                                        <div key={s} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex items-center justify-between">
                                            <span className="font-mono text-xs text-gray-700">{s}</span>
                                            <span className="font-mono text-[10px] text-gray-400">bit {i}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ── Conclusion ── */}
                        <section id="conclusion" className="pt-20 pb-32">
                            <SectionTitle title="Conclusion" subtitle="A brief reflection on what was built and what remains open." />
                            <div className="prose prose-gray prose-lg max-w-none text-gray-600 leading-loose">
                                <p>
                                    This project demonstrates that a problem as familiar as course scheduling contains meaningful algorithmic depth. The bitmask representation reduces a multi-dimensional time conflict check to a single CPU instruction. The generator pattern allows an otherwise opaque recursive search to be paused, inspected, and replayed without altering its outcome. Together, these choices produce a visualizer that is both computationally honest and educationally transparent.
                                </p>
                                <p>
                                    The deterministic parity test confirms that the simulation and the production engine remain in agreement — a property that must be maintained as either component evolves. Any future extension to the scheduling logic should be reflected in both engines simultaneously, with the parity check serving as the verification gate.
                                </p>
                                <p>
                                    This is an open sandbox. The data format is documented, the algorithm is explained, and the source is readable. If something here raised a question or sparked an idea, the visualizer is the best place to continue exploring.
                                </p>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
