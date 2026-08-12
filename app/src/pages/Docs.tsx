import { useState, useEffect, useRef } from 'react';
import Navbar from "../components/layout/Navbar";
import { useRouteStore } from "../store/useRouteStore";
import { generateSchedules } from "../core/scheduler";
import { simulateScheduling } from "../core/SimulationEngine";
import courseData from "../data/yu_sync_test_courses.json";
import type { Section } from "../core/types";
import { RESULTS } from "../bench/results.generated";
import { Tex } from "../components/ui/Tex";
import Figure from "../components/docs/Figure";
import BitmaskPlayground from "../components/docs/BitmaskPlayground";
import ReductionExplorer from "../components/docs/ReductionExplorer";
import ComplexityExplorer from "../components/docs/ComplexityExplorer";
import PhaseTransitionRunner from "../components/docs/PhaseTransitionRunner";
import MobileToc from "../components/docs/MobileToc";
import { ALL_TABS, TAB_GROUPS } from "./docsNav";

// The in-app edition of the write-up under docs/.
//
// The Markdown files are the authoritative document and are complete without
// this page. What this page adds is the ability to operate the results rather
// than only read them, so every claim here links back to the section that
// proves or measures it, and every measured number is imported from
// results.generated.ts rather than typed in by hand.

/** The bundled dataset accepts either field-naming convention, as the engines do. */
interface RawCourse {
    courseCode?: string;
    CourseCode?: string;
    sections?: Section[];
    Sections?: Section[];
}

// --- Shared presentation ---

const SectionTitle = ({ number, title, subtitle, source }: { number: string; title: string; subtitle?: string; source: string }) => (
    <div className="mb-8 lg:mb-10">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rounded-md bg-gray-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">{number}</span>
            <span className="font-mono text-[11px] text-gray-400">{source}</span>
        </div>
        <h1 className={`text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl ${subtitle ? "mb-3" : ""}`}>{title}</h1>
        {subtitle && <p className="text-base font-medium leading-relaxed tracking-tight text-gray-500 sm:text-lg lg:text-xl">{subtitle}</p>}
    </div>
);

/**
 * A stated result, marked with how it is established.
 *
 * The label is set in the same quiet monospace the section headers use for
 * their source file, rather than in a coloured pill.
 */
const Claim = ({ kind, title, children }: { kind: "Proved" | "Measured" | "Cited"; title: string; children: React.ReactNode }) => (
    <div className="not-prose my-8 border-l-2 border-gray-200 py-1 pl-5">
        <p className="mb-1 font-mono text-[11px] lowercase tracking-wide text-gray-400">{kind}</p>
        <p className="mb-2 text-sm font-bold tracking-tight text-gray-900">{title}</p>
        <div className="text-[13px] leading-relaxed text-gray-600">{children}</div>
    </div>
);

const CodeSnippet = ({ code, lang }: { code: string; lang: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <div className="relative my-8 overflow-hidden rounded-lg border border-gray-800 bg-[#0A0A0A] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#1A1A1A] px-4 py-2.5">
                <span className="font-mono text-xs capitalize text-gray-400">{lang}</span>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(code.replace(/<[^>]+>/g, ''));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-white"
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed sm:p-5 sm:text-[13px]">
                <pre><code className="text-gray-300" dangerouslySetInnerHTML={{ __html: code }} /></pre>
            </div>
        </div>
    );
};

// The wider tables cannot be read at a phone width. Rather than let the columns
// squash and the headings wrap to three lines, the table keeps a legible
// minimum and scrolls, with the mask fading its trailing edge to say so.
const DataTable = ({ headers, rows, highlight }: { headers: string[]; rows: (string | number)[][]; highlight?: number }) => (
    <div className="not-prose scroll-hint my-8 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                    {headers.map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                    <tr key={i} className={highlight === i ? "bg-amber-50" : "transition-colors hover:bg-gray-50"}>
                        {row.map((cell, j) => (
                            <td key={j} className={`px-3 py-2 font-mono text-[12px] ${j === 0 ? "font-bold text-gray-900" : "text-gray-600"}`}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- Static counterpart to the state-space tree, matching Figure 4.1 ---

const InvariantTrace = () => {
    const rows: { indent: number; label: string; test: string; verdict: "accept" | "reject" | "solution" }[] = [
        { indent: 0, label: "A1  (3)", test: "0 AND 3 = 0", verdict: "accept" },
        { indent: 1, label: "B1  (6)", test: "3 AND 6 = 2", verdict: "reject" },
        { indent: 1, label: "B2  (48)", test: "3 AND 48 = 0", verdict: "accept" },
        { indent: 2, label: "C1  (1)", test: "51 AND 1 = 1", verdict: "reject" },
        { indent: 2, label: "C2  (8)", test: "51 AND 8 = 0", verdict: "solution" },
        { indent: 0, label: "A2  (12)", test: "0 AND 12 = 0", verdict: "accept" },
        { indent: 1, label: "B1  (6)", test: "12 AND 6 = 4", verdict: "reject" },
        { indent: 1, label: "B2  (48)", test: "12 AND 48 = 0", verdict: "accept" },
        { indent: 2, label: "C1  (1)", test: "60 AND 1 = 0", verdict: "solution" },
        { indent: 2, label: "C2  (8)", test: "60 AND 8 = 8", verdict: "reject" },
    ];

    const style = {
        accept: "text-emerald-600",
        reject: "text-red-500",
        solution: "text-emerald-700 font-bold",
    };

    return (
        <Figure
            label="Figure 4.1"
            title="One traversal, with the invariant readable at every node"
            claim="that the running mask equals the union of the masks accepted so far, and that those masks are pairwise disjoint"
            source="Lemma 4, section 4.2"
            caption="All six sections meet on Monday only, so a mask is one 12-bit integer. Ten nodes are visited and four are rejected. The unpruned tree would hold fourteen."
        >
            <div className="overflow-x-auto font-mono text-[12px] leading-relaxed">
                <div className="min-w-[420px]">
                    <div className="mb-1 text-gray-400">root                                W = 0</div>
                    {rows.map((r, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-gray-300">{"│   ".repeat(r.indent)}├──</span>
                            <span className="w-20 text-gray-800">{r.label}</span>
                            <span className="w-36 text-gray-500">{r.test}</span>
                            <span className={style[r.verdict]}>
                                {r.verdict === "solution" ? "SCHEDULE FOUND" : r.verdict === "accept" ? "accept" : "reject, prune"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Figure>
    );
};

// --- Parity runner, bound to Theorem 6 ---

interface ParityResult {
    prodSchedules: number;
    simSchedules: number;
    prodNodes: number;
    simNodes: number;
    prodPruned: number;
    simPruned: number;
    prodChecks: number;
    simChecks: number;
    identical: boolean;
    prodTime: string;
    simTime: string;
}

const LiveParityRunner = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<ParityResult | null>(null);

    const runCheck = () => {
        setIsRunning(true);
        setResult(null);
        setTimeout(() => {
            const courseCodes = ["CHEM 1130", "ENGR 1116", "MATH 1132", "SOFL 1102"];
            const testSections = (courseData as RawCourse[])
                .filter(c => courseCodes.includes(c.courseCode ?? c.CourseCode ?? ""))
                .flatMap(c => c.sections ?? c.Sections ?? []);
            const maxResults = 200;

            const pt0 = performance.now();
            const prod = generateSchedules(testSections, maxResults, { enableStats: true });
            const pt1 = performance.now();

            const st0 = performance.now();
            const gen = simulateScheduling(testSections, maxResults);
            let simSchedules: Section[][] = [];
            let simStats = { nodes: 0, pruned: 0, conflictChecks: 0 };
            let yieldedNodes = 0;
            let yieldedPruned = 0;
            for (const state of gen) {
                if (state.step === "SELECTING") yieldedNodes++;
                if (state.step === "CONFLICT") yieldedPruned++;
                if (state.step === "COMPLETE") {
                    simSchedules = state.foundSchedules;
                    simStats = state.stats;
                }
            }
            const st1 = performance.now();

            setResult({
                prodSchedules: prod.results.length,
                simSchedules: simSchedules.length,
                prodNodes: prod.stats.nodes,
                simNodes: yieldedNodes,
                prodPruned: prod.stats.pruned,
                simPruned: yieldedPruned,
                prodChecks: prod.stats.conflictChecks,
                simChecks: simStats.conflictChecks,
                identical:
                    JSON.stringify(prod.results) === JSON.stringify(simSchedules) &&
                    prod.stats.nodes === yieldedNodes &&
                    prod.stats.pruned === yieldedPruned &&
                    prod.stats.conflictChecks === simStats.conflictChecks,
                prodTime: (pt1 - pt0).toFixed(2),
                simTime: (st1 - st0).toFixed(2),
            });
            setIsRunning(false);
        }, 400);
    };

    const comparisons = result
        ? [
            { label: "Schedules returned", a: result.prodSchedules, b: result.simSchedules },
            { label: "Nodes visited", a: result.prodNodes, b: result.simNodes },
            { label: "Branches pruned", a: result.prodPruned, b: result.simPruned },
            { label: "Conflict checks", a: result.prodChecks, b: result.simChecks },
        ]
        : [];

    return (
        <Figure
            label="Figure E"
            title="Parity runner"
            claim="that the two engines return the same schedules and perform the same work, not merely reach the same conclusion"
            source="Theorem 6, section 5.4"
            caption={
                <>
                    Runs both engines on the same input in this tab. The conflict check count is the strongest of the four
                    comparisons, because two implementations can agree on every answer while exploring the tree in a
                    different order, and only that column would notice.
                </>
            }
        >
            {!result ? (
                <div className="py-6 text-center">
                    <button
                        onClick={runCheck}
                        disabled={isRunning}
                        className="rounded-lg bg-black px-7 py-3 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-75"
                    >
                        {isRunning ? "Running both engines..." : "Run the parity check"}
                    </button>
                    <p className="mt-3 text-[11px] text-gray-400">
                        Industrial Engineering year 1, one of the four scenarios in EngineParity.test.ts
                    </p>
                </div>
            ) : (
                <div>
                    <div className={`mb-5 flex items-center gap-3 rounded-lg border px-4 py-3 ${result.identical ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${result.identical ? "bg-emerald-500" : "bg-red-500"}`}>
                            {result.identical ? "✓" : "✕"}
                        </span>
                        <p className={`text-xs leading-relaxed ${result.identical ? "text-emerald-900" : "text-red-900"}`}>
                            {result.identical
                                ? "Identical on every measure. The engines returned the same schedules in the same order and performed the same number of conflict checks."
                                : "The engines diverged. This is exactly what EngineParity.test.ts exists to catch."}
                        </p>
                    </div>

                    <DataTable
                        headers={["Measure", "scheduler.ts", "SimulationEngine.ts", "Agree"]}
                        rows={comparisons.map(c => [
                            c.label,
                            c.a.toLocaleString("en-US"),
                            c.b.toLocaleString("en-US"),
                            c.a === c.b ? "yes" : "NO",
                        ])}
                    />

                    <p className="mb-4 text-[11px] leading-relaxed text-gray-400">
                        Wall clock, {result.prodTime} ms against {result.simTime} ms. The simulation engine is slower by
                        construction, since it suspends a generator and allocates a state snapshot at every step. Time is
                        not part of the parity claim.
                    </p>

                    <button
                        onClick={runCheck}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
                    >
                        Run again
                    </button>
                </div>
            )}
        </Figure>
    );
};

// --- Navigation ---

const REPO = "https://github.com/this-Demir/yu-sync-info";

// --- Which section is being read ---

/**
 * Height of the sticky chrome plus a little air. Everything below this line is
 * being read, and a jump target has to land under it.
 *
 * Below lg the mobile contents bar sits beneath the navbar and covers a further
 * 44 pixels, so a single constant would drop every jumped-to heading behind it.
 */
function bandTop(): number {
    const desktop = typeof window !== "undefined"
        && window.matchMedia("(min-width: 1024px)").matches;
    return desktop ? 88 : 112;
}

/**
 * The reading band is the viewport below the header. Attention across it is not
 * uniform, so a pixel at height y in a band of height h carries the weight
 *
 *     w(t) = 1 - t,   t = (y - BAND_TOP) / h,
 *
 * which is 1 at the top of the band and 0 at the bottom. A section's score is
 * that weight integrated over the part of the band it covers. Since w is linear
 * the integral is closed form: with a and b the clipped section edges in units
 * of h,
 *
 *     S = int_a^b (1 - t) dt = (b - a) - (b^2 - a^2) / 2.
 *
 * The greatest score wins. So a short section sitting at the top of the band
 * beats a long one that is only entering from below, and the highlight never
 * runs ahead of the reader. Ties go to the earlier section, which is the one
 * the loop reaches first.
 *
 * This replaces asking an IntersectionObserver and taking whichever entry came
 * last in the callback, which is the section furthest down the page rather than
 * the one being read.
 */
function readingPosition(ids: string[]): { id: string; progress: number } {
    const top = bandTop();
    const h = Math.max(1, window.innerHeight - top);

    let bestId = ids[0]!;
    let bestScore = -1;

    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        const a = (Math.max(rect.top, top) - top) / h;
        const b = (Math.min(rect.bottom, top + h) - top) / h;
        if (b <= a) continue; // outside the band, contributes nothing

        const score = (b - a) - (b * b - a * a) / 2;
        if (score > bestScore) {
            bestScore = score;
            bestId = id;
        }
    }

    // At the foot of the document the last sections can no longer reach the top
    // of the band, so no score would ever select them. Scrolling has stopped
    // there, so the reader is by definition at the end.
    const doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        bestId = ids[ids.length - 1]!;
    }

    // How far the reading line has travelled through the winning section.
    const winner = document.getElementById(bestId)?.getBoundingClientRect();
    const progress = winner && winner.height > 0
        ? Math.min(1, Math.max(0, (top - winner.top) / winner.height))
        : 0;

    return { id: bestId, progress };
}

// --- Page ---

export default function Docs() {
    const navigate = useRouteStore(state => state.navigate);
    const [activeSection, setActiveSection] = useState("abstract");
    const [sectionProgress, setSectionProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    // A click drives a smooth scroll across every section in between. Scoring
    // those intermediate frames would strobe the sidebar, so the click sets the
    // answer and holds it until the scroll settles or the reader takes over.
    const heldRef = useRef<number | null>(null);

    useEffect(() => {
        const ids = ALL_TABS.map(t => t.id);
        let frame = 0;

        const measure = () => {
            frame = 0;
            if (heldRef.current !== null) return;
            const { id, progress } = readingPosition(ids);
            setActiveSection(id);
            setSectionProgress(progress);
        };

        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };

        // Any deliberate input means the reader has taken the scroll back.
        const release = () => {
            if (heldRef.current !== null) {
                clearTimeout(heldRef.current);
                heldRef.current = null;
            }
        };

        measure();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        window.addEventListener("wheel", release, { passive: true });
        window.addEventListener("touchstart", release, { passive: true });
        window.addEventListener("keydown", release);

        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            window.removeEventListener("wheel", release);
            window.removeEventListener("touchstart", release);
            window.removeEventListener("keydown", release);
        };
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;

        setActiveSection(id);
        setSectionProgress(0);

        if (heldRef.current !== null) clearTimeout(heldRef.current);
        heldRef.current = window.setTimeout(() => { heldRef.current = null; }, 700);

        // scrollIntoView would put the heading under the sticky navbar.
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - bandTop() + 1,
            behavior: "smooth",
        });
    };

    const scaling = RESULTS.scaling;
    const pruning = RESULTS.pruning;
    const micro = RESULTS.microbench;
    const phase = RESULTS.phaseTransition;
    const env = RESULTS.environment;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:pt-28">
                <MobileToc
                    activeSection={activeSection}
                    sectionProgress={sectionProgress}
                    onSelect={scrollTo}
                />

                <div className="flex pt-6 lg:gap-12 lg:pt-0">

                    {/* Sidebar */}
                    <aside className="sticky top-28 hidden h-fit w-56 shrink-0 lg:block">
                        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-300">Contents</p>
                        {TAB_GROUPS.map(group => (
                            <div key={group.label} className="mb-5">
                                <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    group.ids.includes(activeSection) ? "text-gray-900" : "text-gray-400"
                                }`}>
                                    {group.label}
                                </p>
                                {group.ids.map(id => {
                                    const tab = ALL_TABS.find(t => t.id === id)!;
                                    const active = activeSection === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => scrollTo(id)}
                                            aria-current={active ? "true" : undefined}
                                            className={`group relative block w-full py-1 pl-3 text-left text-[13px] transition-colors ${
                                                active ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"
                                            }`}
                                        >
                                            {/* The rule on the left doubles as how far through this section you are. */}
                                            <span
                                                aria-hidden
                                                className="absolute left-0 top-0 h-full w-0.5 bg-gray-100 transition-colors group-hover:bg-gray-300"
                                            />
                                            {active && (
                                                <span
                                                    aria-hidden
                                                    className="absolute left-0 top-0 w-0.5 bg-gray-900"
                                                    style={{ height: `${Math.max(8, sectionProgress * 100)}%` }}
                                                />
                                            )}
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}

                        <a
                            href={`${REPO}/tree/main/docs#readme`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 block rounded-lg border border-gray-200 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
                        >
                            <strong className="block text-gray-700">Read on GitHub</strong>
                            The same docs in Markdown.
                        </a>
                    </aside>

                    {/* Content */}
                    <main ref={contentRef} className="min-w-0 flex-1 pb-[calc(6rem+var(--tabbar-h))] lg:pb-32">
                        {/* Abstract */}
                        <section id="abstract" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="0"
                                title="Section Selection Scheduling"
                                subtitle="A formal study of the problem YU-Sync solves, and of the search that solves it."
                                source="docs/00-abstract.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    University timetabling, in which rooms, instructors, periods and student groups are
                                    assigned together, is a long-studied and computationally hard family of problems [1], [6].
                                    The scheduler studied here does not solve that family. It solves a narrower problem,
                                    called <strong>Section Selection</strong>. The sections of each course already have
                                    fixed meeting times, and the task is to choose exactly one section per course so that no
                                    two chosen sections overlap.
                                </p>
                                <p>
                                    The narrowing is deliberate. A bounded result that is proved is worth more than a broad
                                    result that is asserted.
                                </p>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">Results at a glance</h3>
                                <DataTable
                                    headers={["Result", "Value", "How established"]}
                                    rows={[
                                        ["Section Selection is NP-complete", "reduction from 3-colouring", "Proved, section 3"],
                                        ["The engine is sound and complete", "loop invariant", "Proved, section 4"],
                                        ["Cost peak of the phase transition", `density ${phase.peak!.meanDensity.toFixed(3)}`, "Measured, Experiment 4"],
                                        ["Half of instances still solvable at", `density ${phase.crossover!.meanDensity.toFixed(3)}`, "Measured, Experiment 4"],
                                        ["Conflict checks avoided at d = 11", `${(pruning.points[pruning.points.length - 1]!.checkReduction * 100).toFixed(2)}%`, "Measured, Experiment 2"],
                                        ["Effective branching factor", `${scaling.effectiveBranchingFactor.toFixed(2)} against ${scaling.config.sectionsPerCourse}`, "Measured, Experiment 1"],
                                    ]}
                                />
                            </div>
                        </section>

                        {/* 1. Preliminaries */}
                        <section id="preliminaries" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="1"
                                title="Preliminaries"
                                subtitle="The objects, the notation, and the encoding every later proof depends on."
                                source="docs/01-preliminaries.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    Let <Tex>{"T"}</Tex> be a finite set of time slots, let{" "}
                                    <Tex>{"C = \\{c_1, \\dots, c_d\\}"}</Tex> be the courses, and let each course{" "}
                                    <Tex>{"c"}</Tex> offer a set of sections <Tex>{"S(c)"}</Tex> with{" "}
                                    <Tex>{"b_c = |S(c)|"}</Tex>. Each section <Tex>{"s"}</Tex> carries a mask{" "}
                                    <Tex>{"\\mu(s) \\subseteq T"}</Tex>, the slots at which it meets. Masks are given as
                                    input and are never modified. The scheduler never moves a section, it only chooses
                                    among those that exist.
                                </p>
                                <p>
                                    Fix a total order on <Tex>{"T"}</Tex> and encode a subset as an integer.
                                </p>

                                <Tex block>
                                    {String.raw`\beta(M) \;=\; \sum_{i \in M} 2^{i}
                                    \qquad\Longrightarrow\qquad
                                    \beta(M \cap N) \;=\; \beta(M) \wedge \beta(N)`}
                                </Tex>

                                <Claim kind="Proved" title="Proposition 1, the bitmask overlap test">
                                    For all <Tex>{"M, N \\subseteq T"}</Tex>,{" "}
                                    <Tex>{"M \\cap N \\neq \\emptyset"}</Tex> if and only if{" "}
                                    <Tex>{"\\beta(M) \\wedge \\beta(N) \\neq 0"}</Tex>. The map <Tex>{"\\beta"}</Tex> is a
                                    bijection with <Tex>{"\\beta(\\emptyset) = 0"}</Tex>, so the conjunction vanishes
                                    exactly when the intersection does.
                                </Claim>

                                <p>
                                    The implementation factors the universe by day, writing{" "}
                                    <Tex>{"T = D \\times P"}</Tex> with seven days of twelve hourly periods from 08:40, so{" "}
                                    <Tex>{"|T| = 84"}</Tex>. Two activities on different days can never overlap, so the
                                    test decomposes into a disjunction over days, and in practice iterates only the days a
                                    section actually meets.
                                </p>
                            </div>

                            <BitmaskPlayground />
                        </section>

                        {/* 2. Problem */}
                        <section id="problem" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="2"
                                title="The Problem"
                                subtitle="Section Selection stated as a decision problem, so the complexity claims are well posed."
                                source="docs/02-problem-formulation.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <Claim kind="Proved" title="SECTION SELECTION">
                                    <p className="mb-2">
                                        <strong>Instance.</strong> A finite slot universe <Tex>{"T"}</Tex>, courses{" "}
                                        <Tex>{"C"}</Tex>, sections <Tex>{"S(c)"}</Tex> per course, and a mask{" "}
                                        <Tex>{"\\mu(s)"}</Tex> per section.
                                    </p>
                                    <p>
                                        <strong>Question.</strong> Does a selection <Tex>{"\\sigma"}</Tex> exist, choosing
                                        one section per course, with{" "}
                                        <Tex>{"\\mu(\\sigma(c)) \\cap \\mu(\\sigma(c')) = \\emptyset"}</Tex> for every pair
                                        of distinct courses?
                                    </p>
                                </Claim>

                                <p>
                                    Conflict-freedom is a conjunction of binary constraints over pairs of courses, so this
                                    is a binary constraint satisfaction problem whose variables are courses, whose domains
                                    are section sets, and whose constraints are disjointness requirements.
                                </p>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">Ghost sections</h3>
                                <p>
                                    The deployed engine supports something the earlier documentation never mentioned. A
                                    section marked as a retake is placed with no conflict test and occupies no slot, because
                                    a student repeating a course may attend it outside the ordinary timetable. Writing{" "}
                                    <Tex>{"\\Gamma"}</Tex> for the set of such sections, the condition weakens to requiring
                                    disjointness only among the non-ghost sections chosen.
                                </p>

                                <div className="not-prose my-8 rounded-xl border border-violet-200 bg-violet-50 p-5">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-700">
                                        What this costs
                                    </p>
                                    <p className="text-[13px] leading-relaxed text-violet-900">
                                        A returned schedule is conflict-free <em>restricted to non-ghost sections</em>. Two
                                        ghosts, or a ghost and a real section, may overlap freely. Any claim that the engine
                                        returns non-overlapping timetables holds only when{" "}
                                        <Tex>{"\\Gamma = \\emptyset"}</Tex>.
                                    </p>
                                </div>

                                <p>
                                    Ghosts can only make an instance easier, never harder, since a course with a ghost
                                    section is trivially placeable. The hardness proof in section 3 is therefore stated for{" "}
                                    <Tex>{"\\Gamma = \\emptyset"}</Tex>, which is the stronger statement.
                                </p>
                            </div>
                        </section>

                        {/* 3. Complexity */}
                        <section id="complexity" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="3"
                                title="Complexity"
                                subtitle="Section Selection is NP-complete, by reduction from graph 3-colouring."
                                source="docs/03-complexity.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <Claim kind="Proved" title="Theorem 1, membership in NP">
                                    A selection is a certificate of size linear in the number of courses. Verification
                                    checks that exactly one section is chosen per course and that all{" "}
                                    <Tex>{"\\binom{d}{2}"}</Tex> pairs are disjoint, in{" "}
                                    <Tex>{"O(d \\log d + d^{2}|T|/w)"}</Tex> time.
                                </Claim>

                                <p>
                                    Hardness comes from graph 3-colouring, which is NP-complete [4] and catalogued as
                                    problem GT4 in Garey and Johnson [2]. Given a graph{" "}
                                    <Tex>{"G = (V, E)"}</Tex>, build one course per vertex with three sections, one per
                                    colour, and one slot per pair of an edge and a colour.
                                </p>

                                <Tex block>
                                    {String.raw`T = \{\, t_{e,k} : e \in E,\ k \in \{1,2,3\} \,\},
                                    \qquad
                                    \mu(s_{v,k}) = \{\, t_{e,k} : e \in E,\ v \in e \,\}`}
                                </Tex>

                                <p>
                                    Choosing section <Tex>{"s_{v,k}"}</Tex> means colouring <Tex>{"v"}</Tex> with colour{" "}
                                    <Tex>{"k"}</Tex>, which claims colour <Tex>{"k"}</Tex> along every edge at{" "}
                                    <Tex>{"v"}</Tex>. Two endpoints of an edge claiming the same colour collide on exactly
                                    the slot the construction created for that purpose.
                                </p>

                                <Claim kind="Proved" title="Theorem 3, NP-completeness">
                                    The construction is computable in <Tex>{"O(|V| + |E|)"}</Tex> with total mask size{" "}
                                    <Tex>{"6|E|"}</Tex>. A proper colouring yields a conflict-free selection, and a
                                    conflict-free selection yields a proper colouring, so{" "}
                                    <Tex>{"G"}</Tex> is 3-colourable exactly when <Tex>{"I(G)"}</Tex> is satisfiable.
                                    Combined with Theorem 1, Section Selection is NP-complete.
                                </Claim>
                            </div>

                            <ReductionExplorer />

                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    What this does not say
                                </h3>
                                <p>
                                    Theorem 3 concerns the general problem, where the slot universe is part of the input.
                                    The deployed configuration fixes it at <Tex>{"|T| = 84"}</Tex>, and that difference
                                    matters.
                                </p>

                                <Claim kind="Proved" title="Proposition 5, the fixed universe caveat">
                                    For any fixed <Tex>{"\\tau"}</Tex>, the restriction to instances with{" "}
                                    <Tex>{"|T| \\le \\tau"}</Tex> is solvable in polynomial time. Courses with an
                                    empty-mask section are placed for free, and every remaining course consumes at least
                                    one slot, so at most <Tex>{"\\tau"}</Tex> of them can be placed at all. Brute force
                                    over <Tex>{"b^{\\tau}"}</Tex> combinations is then polynomial for fixed{" "}
                                    <Tex>{"\\tau"}</Tex>.
                                    <p className="mt-2">
                                        The polynomial has degree 84 here, so this is of no practical use. It matters only
                                        for what may honestly be claimed. Section Selection is NP-complete as a general
                                        problem, and the deployed instance family is not itself NP-hard.
                                    </p>
                                </Claim>
                            </div>
                        </section>

                        {/* 4. Algorithm */}
                        <section id="algorithm" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="4"
                                title="The Algorithm"
                                subtitle="Depth-first search with a running mask, proved sound and complete."
                                source="docs/04-algorithm.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    Courses are assigned one at a time in a fixed order, maintaining a running mask{" "}
                                    <Tex>{"W"}</Tex> of the slots already claimed. A candidate is accepted only when it
                                    claims nothing already taken, and rejection prunes its entire subtree.
                                </p>

                                <CodeSnippet lang="pseudocode" code={`<span class="text-purple-400">procedure</span> EXTEND(i, W, A)
    <span class="text-purple-400">if</span> |R| >= k <span class="text-purple-400">then return</span>
    <span class="text-purple-400">if</span> i > d <span class="text-purple-400">then</span> R := R + {A}; <span class="text-purple-400">return</span>

    <span class="text-purple-400">for each</span> s <span class="text-purple-400">in</span> S(c_i) <span class="text-gray-500 italic">// ordered by ascending |mu(s)|</span>
        <span class="text-purple-400">if</span> s <span class="text-purple-400">in</span> Ghost <span class="text-purple-400">then</span>
            EXTEND(i + <span class="text-orange-300">1</span>, W, A + s)          <span class="text-gray-500 italic">// no test, no slots claimed</span>
        <span class="text-purple-400">else if</span> W <span class="text-yellow-200">AND</span> mu(s) = <span class="text-orange-300">0</span> <span class="text-purple-400">then</span>
            EXTEND(i + <span class="text-orange-300">1</span>, W <span class="text-yellow-200">OR</span> mu(s), A + s)`} />

                                <p>
                                    Courses are tried in increasing order of section count, and sections in increasing order
                                    of mask size. Both are heuristics. Neither is used by any proof, and correctness does
                                    not depend on either.
                                </p>

                                <Claim kind="Proved" title="Lemma 4, the loop invariant">
                                    At every call of <Tex>{"\\mathrm{Extend}(i, W, A)"}</Tex>, the assignment{" "}
                                    <Tex>{"A"}</Tex> covers exactly <Tex>{"c_1, \\dots, c_{i-1}"}</Tex>, the running mask
                                    satisfies <Tex>{"W = \\bigcup_{s \\in \\mathrm{real}(A)} \\mu(s)"}</Tex>, and the
                                    non-ghost sections of <Tex>{"A"}</Tex> are pairwise disjoint. Proved by induction on
                                    recursion depth, with the branch guard supplying the disjointness of each new pair.
                                </Claim>

                                <Claim kind="Proved" title="Theorem 4, soundness">
                                    Every reported selection is conflict-free, restricted to non-ghost sections. At the
                                    point of reporting, <Tex>{"i = d + 1"}</Tex>, so condition 1 of the invariant makes{" "}
                                    <Tex>{"A"}</Tex> a selection and condition 3 makes it conflict-free.
                                </Claim>

                                <Claim kind="Proved" title="Theorem 5, completeness">
                                    Without a result bound or resource cutoff, every conflict-free selection is reported.
                                    For any conflict-free <Tex>{"\\sigma"}</Tex>, the guard at depth <Tex>{"i"}</Tex>
                                    passes for <Tex>{"\\sigma(c_i)"}</Tex>, because every earlier chosen mask is disjoint
                                    from it. Induction carries the prefix of <Tex>{"\\sigma"}</Tex> all the way to depth{" "}
                                    <Tex>{"d + 1"}</Tex>.
                                </Claim>

                                <div className="not-prose my-8 rounded-xl border border-red-200 bg-red-50 p-5">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-700">
                                        The deployed cutoffs break completeness by design
                                    </p>
                                    <p className="mb-3 text-[13px] leading-relaxed text-red-900">
                                        The production engine imposes a result bound of 200, a 1200 ms deadline, a one
                                        million node cap, and a five million state-space estimate cap. The last returns an
                                        empty set <em>before searching at all</em>.
                                    </p>
                                    <p className="text-[13px] font-semibold leading-relaxed text-red-900">
                                        An empty result from the deployed engine is not a proof that no schedule exists.
                                    </p>
                                </div>
                            </div>

                            <InvariantTrace />

                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    The <strong>Visualizer</strong> page steps through this traversal on any instance you
                                    configure. Each node is annotated with its running mask and the conjunction that was
                                    evaluated there, so conditions 2 and 3 of the invariant can be checked node by node.
                                </p>
                            </div>
                        </section>

                        {/* 4.5 Search cost */}
                        <section id="cost" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="4.5"
                                title="Cost of the Search"
                                subtitle="What the exponential is, and which bound the node counter should be read against."
                                source="docs/04-algorithm.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    The engine counts one node per section considered at every depth, so it counts partial
                                    assignments as well as complete ones. The matching bound is the size of the fully
                                    expanded tree, not the product of the section counts.
                                </p>

                                <Tex block>
                                    {String.raw`N_{\max} \;=\; \sum_{i=1}^{d} \prod_{j \le i} b_{c_j}
                                    \;=\; \frac{b^{d+1} - b}{b - 1} \;=\; O(b^{d})
                                    \qquad\text{for uniform } b`}
                                </Tex>

                                <p>
                                    The product <Tex>{"\\prod_c b_c"}</Tex> counts only leaves and is smaller. For{" "}
                                    <Tex>{"b = 4"}</Tex> and <Tex>{"d = 2"}</Tex> it is 16 while the tree holds 20, so
                                    dividing a node count by the product can give a fraction above one. Conflating the two
                                    is the error the evaluation had to correct.
                                </p>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">Cost per node</h3>
                                <p>
                                    Each node evaluates one conjunction per meeting day of the candidate, so the deployed
                                    cost is <Tex>{"O(|D|)"}</Tex>. For a general unfactored universe it is{" "}
                                    <Tex>{"\\Theta(|T|/w)"}</Tex>. It is <Tex>{"O(1)"}</Tex> only when{" "}
                                    <Tex>{"|T|"}</Tex> is fixed. Combining,
                                </p>

                                <Tex block>{String.raw`O\!\left( \frac{b^{d} \cdot |T|}{w} \right)`}</Tex>

                                <p>
                                    The exponential factor is inherent given Theorem 3. The bitmask encoding acts entirely
                                    on the polynomial factor.
                                </p>
                            </div>

                            <ComplexityExplorer />
                        </section>

                        {/* 5. Implementation */}
                        <section id="implementation" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="5"
                                title="Implementation"
                                subtitle="Two engines, one algorithm, and a mechanically checked equivalence."
                                source="docs/05-implementation.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    The repository contains two realisations of the same algorithm. The production engine is
                                    an ordinary recursive function that runs to completion in one call. The simulation
                                    engine is a generator that suspends after each step, so the interface can pause,
                                    resume and step backwards without perturbing the search.
                                </p>

                                <CodeSnippet lang="typescript" code={`<span class="text-gray-500 italic">// Production engine, opaque</span>
<span class="text-purple-400">if</span> (i === groupedMasked.length) {
    results.<span class="text-yellow-200">push</span>(chosen.<span class="text-yellow-200">slice</span>());
    <span class="text-purple-400">return</span>;
}

<span class="text-gray-500 italic">// Simulation engine, transparent</span>
<span class="text-purple-400">if</span> (i === groupedMasked.length) {
    foundSchedules.<span class="text-yellow-200">push</span>([...chosen]);
    <span class="text-purple-400">yield</span> { step: <span class="text-emerald-300">"SUCCESS"</span>, currentMask: w, <span class="text-gray-500 italic">/* ... */</span> };
    <span class="text-purple-400">return</span>;
}`} />

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    Allocation, stated correctly
                                </h3>
                                <p>
                                    The earlier documentation described the traversal as allocation-free. The correct
                                    statement is narrower. The <em>conflict test</em> allocates nothing, reading the
                                    running mask and the candidate's precomputed day masks and performing integer
                                    conjunctions. The <em>traversal</em> allocates twice per accepted candidate, a fresh
                                    seven-field week mask and a fresh assignment array.
                                </p>

                                <Tex block>{String.raw`O\!\left( d \cdot |D| + d^{2} \right) \quad\text{live memory along a root-to-leaf path}`}</Tex>

                                <p>
                                    The persistent style makes backtracking implicit, since an abandoned branch simply drops
                                    its copies. A mutate-and-undo implementation would reduce this to{" "}
                                    <Tex>{"O(d + |D|)"}</Tex> at the cost of explicit restoration. The current behaviour is
                                    recorded as it is, rather than as previously described.
                                </p>

                                <Claim kind="Measured" title="Theorem 6, engine parity">
                                    For every input in the tested set, the two engines produce identical schedule sequences
                                    and perform identical work, measured by nodes visited, branches pruned, depth reached
                                    and conflict checks executed. This is established by execution over four scenarios in{" "}
                                    <a href={`${REPO}/blob/main/app/src/__tests__/EngineParity.test.ts`} target="_blank" rel="noreferrer" className="underline">
                                        EngineParity.test.ts
                                    </a>
                                    , not by any argument over the source. It is a regression barrier, not a proof of
                                    equivalence for all inputs.
                                </Claim>

                                <p>
                                    The risk it guards against is structural. The two engines share no helper functions.
                                    Each defines its own normalisation, mask construction, population count, fit test and
                                    placement, and the production engine hardcodes its own copy of the period list rather
                                    than importing the shared one. A correction applied to one file has no effect on the
                                    other, and only the test would notice.
                                </p>
                            </div>

                            <LiveParityRunner />
                        </section>

                        {/* 6. Evaluation */}
                        <section id="evaluation" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="6"
                                title="Evaluation"
                                subtitle="Four experiments, seeded and reproducible, with the raw output committed."
                                source="docs/06-evaluation.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    Every figure below is imported from the committed experiment output rather than typed
                                    in. Structural quantities are fully determined by their seeds and reproduce byte for
                                    byte. Wall-clock measurements are hardware dependent and no claim rests on one. The
                                    published run used {env.cpu} with {env.logicalCores} logical cores on {env.runtime}.
                                </p>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    Experiment 1, scaling in the number of courses
                                </h3>
                                <p>
                                    Sections per course fixed at {scaling.config.sectionsPerCourse}, courses from{" "}
                                    {scaling.config.minCourses} to {scaling.config.maxCourses},{" "}
                                    {scaling.config.instancesPerPoint} instances per point, seed {scaling.config.baseSeed}.
                                    All conflict-free selections are enumerated.
                                </p>

                                <DataTable
                                    headers={["d", "Fully expanded tree", "Mean nodes", "Fraction visited", "Mean solutions"]}
                                    rows={scaling.points
                                        .filter(p => p.courses % 2 === 0)
                                        .map(p => [
                                            p.courses,
                                            p.worstCaseNodes.toLocaleString("en-US"),
                                            Math.round(p.meanNodes).toLocaleString("en-US"),
                                            p.exploredFraction < 0.01 ? p.exploredFraction.toExponential(2) : p.exploredFraction.toFixed(3),
                                            Math.round(p.meanSolutions).toLocaleString("en-US"),
                                        ])}
                                />

                                <Claim kind="Measured" title="Pruning changes the base, not the exponential">
                                    The fully expanded tree grows with base exactly{" "}
                                    {scaling.config.sectionsPerCourse}. The measured node count grows with an effective
                                    base of <strong>{scaling.effectiveBranchingFactor.toFixed(2)}</strong>, taken as the
                                    geometric mean of successive ratios across the range. The fraction of the tree visited
                                    falls to{" "}
                                    {scaling.points[scaling.points.length - 1]!.exploredFraction.toExponential(2)} at{" "}
                                    <Tex>{`d = ${scaling.config.maxCourses}`}</Tex>. This is a descriptive summary of the
                                    measured points, not a fitted model, and no confidence interval is claimed.
                                </Claim>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    Experiment 2, pruning against uninformed enumeration
                                </h3>
                                <p>
                                    The baseline enumerates the full Cartesian product with no pruning. Both sides count
                                    one conflict check as one conjunction of one day mask, and both iterate only the days a
                                    section meets, so the ratio measures pruning rather than how the baseline was written.
                                </p>

                                <DataTable
                                    headers={["d", "Naive checks", "DFS checks", "Reduction"]}
                                    rows={pruning.points.map(p => [
                                        p.courses,
                                        Math.round(p.meanNaiveConflictChecks).toLocaleString("en-US"),
                                        Math.round(p.meanDfsConflictChecks).toLocaleString("en-US"),
                                        `${(p.checkReduction * 100).toFixed(2)}%`,
                                    ])}
                                    highlight={0}
                                />

                                <Claim kind="Measured" title="Pruning is a net cost at d = 2">
                                    The highlighted first row is negative and is not an error. The engine tests every
                                    candidate at depth 0 against an empty mask, and those tests can never fail. At two
                                    courses and this density there is almost nothing to prune, so the overhead exceeds the
                                    saving. Pruning becomes profitable from{" "}
                                    <Tex>{"d = 3"}</Tex> and reaches{" "}
                                    <strong>{(pruning.points[pruning.points.length - 1]!.checkReduction * 100).toFixed(2)}%</strong>{" "}
                                    at <Tex>{"d = 11"}</Tex>. The previously documented figure of 80 to 95 percent is not a
                                    constant of the algorithm.
                                    <p className="mt-2">
                                        At every point the experiment asserts that both methods return identical solution
                                        sets. All {pruning.points.length} points pass.
                                    </p>
                                </Claim>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    Experiment 3, cost of the conflict check
                                </h3>
                                <p>
                                    Two implementations of the same predicate are compared as the slot universe grows, one
                                    conjoining machine words and one scanning slot by slot. Operands are constructed
                                    disjoint, since both short-circuit on the first overlap and a conflicting pair would
                                    measure nothing.
                                </p>

                                <DataTable
                                    headers={["Slots", "Words", "Word-wise ns", "Slot-wise ns", "Speedup"]}
                                    rows={micro.points
                                        .filter((_, i) => i % 2 === 0 || i === micro.points.length - 1)
                                        .map(p => [
                                            p.slots.toLocaleString("en-US"),
                                            p.words,
                                            p.wordAndNs.toFixed(2),
                                            p.slotScanNs.toFixed(1),
                                            `${p.speedup.toFixed(1)}×`,
                                        ])}
                                />

                                <Claim kind="Measured" title="The check is not constant time in general">
                                    The slot-wise cost converges to about {micro.widest.nsPerSlot.toFixed(2)} ns per slot
                                    and the word-wise cost to about {micro.widest.nsPerWord.toFixed(2)} ns per word. Both
                                    settle into a constant cost per unit of work and both perform work linear in{" "}
                                    <Tex>{"|T|"}</Tex>, differing only in the size of the unit. The measured speedup reaches{" "}
                                    <strong>{micro.widest.speedup.toFixed(1)}×</strong> at{" "}
                                    {micro.widest.slots.toLocaleString("en-US")} slots, just below the word size{" "}
                                    <Tex>{`w = ${micro.wordBits}`}</Tex>, as it must. The deployed seven-day form, where{" "}
                                    <Tex>{"|T|"}</Tex> is fixed, measures {micro.deployedWeekNs.toFixed(2)} ns and is
                                    genuinely constant.
                                </Claim>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    Experiment 4, the constraint density phase transition
                                </h3>
                                <p>
                                    {phase.config.courses} courses with {phase.config.sectionsPerCourse} sections each,
                                    sweeping the placement pool across its full range with{" "}
                                    {phase.config.instancesPerPoint} instances at each of 55 points. The engine is asked for
                                    one solution, not all of them, because the object of study is the decision problem.
                                </p>

                                <Claim kind="Measured" title="Easy, hard, easy">
                                    Cost peaks at density{" "}
                                    <strong>{phase.peak!.meanDensity.toFixed(3)}</strong> with{" "}
                                    {Math.round(phase.peak!.meanNodes).toLocaleString("en-US")} mean nodes, which is{" "}
                                    <strong>{phase.peakOverEasiest.toFixed(0)}×</strong> the cost at the underconstrained
                                    extreme. The solvability crossover sits at density{" "}
                                    <strong>{phase.crossover!.meanDensity.toFixed(3)}</strong>, close to but not coincident
                                    with the peak. This reproduces the pattern described by Cheeseman, Kanefsky and Taylor
                                    [5].
                                    <p className="mt-2">
                                        The median falls away far faster than the mean past the transition, so most
                                        instances just beyond it are solved almost immediately and the mean is held up by a
                                        minority of hard ones.
                                    </p>
                                </Claim>
                            </div>

                            <PhaseTransitionRunner />

                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <p>
                                    A realistic student timetable sits far to the right of the transition, with a handful of
                                    courses and sparse conflicts. The deployed engine is fast because its instances are
                                    easy, not because the problem is easy. That distinction is the practical content of this
                                    experiment.
                                </p>
                            </div>
                        </section>

                        {/* 7. Related work */}
                        <section id="related" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="7"
                                title="Related Work"
                                subtitle="Where this sits in the literature, and what it deliberately does not engage with."
                                source="docs/07-related-work.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <h3 className="mb-4 mt-0 text-xl font-bold tracking-tight text-gray-900">
                                    Timetabling and its complexity
                                </h3>
                                <p>
                                    Automated timetabling has been studied continuously since the 1960s. De Werra's
                                    introduction [6] gives the standard framing of the field and the graph-theoretic
                                    formulations that dominate it. The complexity of the general problem was settled by
                                    Even, Itai and Shamir [1], who proved timetabling NP-complete even under substantial
                                    restrictions. Their result concerns the full problem, in which meetings must be{" "}
                                    <em>assigned</em> to periods.
                                </p>
                                <p>
                                    This work sits downstream of that setting. Section Selection takes the assignment as
                                    already performed by the institution and asks only which of the offered sections a
                                    single student should take.
                                </p>

                                <div className="not-prose my-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Why the hardness is proved here rather than cited
                                    </p>
                                    <p className="text-[13px] leading-relaxed text-gray-600">
                                        A hardness result for a general problem says nothing about a restriction of it.
                                        Section Selection is a strict restriction of timetabling, so [1] cannot be used to
                                        establish it. That is why{" "}
                                        <button onClick={() => scrollTo("complexity")} className="underline">
                                            section 3
                                        </button>{" "}
                                        proves the narrower result from first principles. The reverse also holds. Nothing
                                        proved here says anything about timetabling proper. The two problems share a
                                        vocabulary and not much else.
                                    </p>
                                </div>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    The framework of NP-completeness
                                </h3>
                                <p>
                                    The apparatus used in section 3 is standard and no new technique is introduced. Cook
                                    [3] established the existence of NP-complete problems and the method of polynomial-time
                                    reduction. Karp [4] demonstrated its reach across twenty-one combinatorial problems,
                                    among them graph colourability, which supplies the source problem for the reduction
                                    here. Garey and Johnson [2] remains the reference catalogue and records graph{" "}
                                    <Tex>{"k"}</Tex>-colourability as problem GT4, NP-complete for every fixed{" "}
                                    <Tex>{"k \\ge 3"}</Tex>.
                                </p>
                                <p>
                                    The interest of the reduction lies entirely in establishing that a specific deployed
                                    system solves a problem that is genuinely hard, rather than one that merely looks hard.
                                </p>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    Constraint satisfaction and phase transitions
                                </h3>
                                <p>
                                    Section Selection is a binary constraint satisfaction problem. Its variables are
                                    courses, its domains are section sets, and its constraints are pairwise disjointness
                                    requirements. The algorithm in section 4 is chronological backtracking with a
                                    consistency check at each assignment, which is the most basic complete method for such
                                    problems.
                                </p>
                                <p>
                                    Cheeseman, Kanefsky and Taylor [5] observed that for many NP-hard families the
                                    difficulty of random instances is not uniform across the parameter space.
                                    Underconstrained instances are easy because solutions are abundant, overconstrained
                                    ones are easy because unsatisfiability is quickly proved, and the hard instances
                                    concentrate in a narrow band near where the probability of solubility passes one half.
                                </p>

                                <Claim kind="Cited" title="What [5] is and is not cited for">
                                    Experiment 4 reproduces the easy-hard-easy shape, and [5] is cited for the existence
                                    and shape of that pattern. It is <strong>not</strong> cited for the location of the
                                    transition in this instance family, which is measured at density{" "}
                                    {phase.peak!.meanDensity.toFixed(3)} and reported without appeal to the literature, nor
                                    for the order-parameter account of why the pattern arises, which this work does not
                                    test.
                                </Claim>

                                <h3 className="mb-4 mt-12 text-xl font-bold tracking-tight text-gray-900">
                                    What this work does not engage with
                                </h3>
                                <div className="not-prose space-y-3">
                                    {[
                                        {
                                            t: "Modern constraint solvers",
                                            d: "The baseline in Experiment 2 is uninformed enumeration, the weakest comparison available. Constraint propagation, conflict-driven learning, restarts and dynamic variable ordering are absent from the engine and from the evaluation. The measured advantage of pruning says nothing about how the engine would fare against a competent solver.",
                                        },
                                        {
                                            t: "Optimisation over feasible schedules",
                                            d: "Section Selection as posed is a pure satisfaction problem with no objective function, so every conflict-free selection is equally good. Preference handling and soft constraints are a large part of the timetabling literature [6] and are entirely outside this study.",
                                        },
                                        {
                                            t: "Institution-scale scheduling",
                                            d: "The problem here is per student, with the institutional timetable given. Rooms, instructors, capacities and enrolment limits do not appear in the model at all.",
                                        },
                                    ].map(item => (
                                        <div key={item.t} className="rounded-lg border border-gray-200 bg-white px-5 py-3.5">
                                            <p className="mb-1 text-sm font-bold tracking-tight text-gray-900">{item.t}</p>
                                            <p className="text-[13px] leading-relaxed text-gray-600">{item.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* 8. Limitations */}
                        <section id="limitations" className="border-b border-gray-100 py-10 lg:py-16">
                            <SectionTitle
                                number="8"
                                title="Limitations"
                                subtitle="What this work does not establish."
                                source="docs/08-limitations.md"
                            />
                            <div className="prose prose-gray max-w-none leading-relaxed text-gray-600 lg:prose-lg lg:leading-loose">
                                <div className="not-prose space-y-3">
                                    {[
                                        {
                                            t: "The problem is narrow",
                                            d: "Rooms, capacities, instructors, prerequisites, cross-student coordination and exam periods are absent from the model entirely. A returned schedule may place a student in a section that is full.",
                                        },
                                        {
                                            t: "Hardness does not apply to the deployed configuration",
                                            d: "Theorem 3 assumes an unbounded slot universe. With the universe fixed at 84 the problem is polynomial by Proposition 5, at degree 84. The deployed instance family is not itself NP-hard.",
                                        },
                                        {
                                            t: "Completeness holds only for the unbounded algorithm",
                                            d: "Four production cutoffs each break Theorem 5. An empty result is not a proof of unsatisfiability, and the state-space cap returns empty without searching.",
                                        },
                                        {
                                            t: "Ghost sections weaken what a schedule means",
                                            d: "Conflict-freedom is guaranteed only among non-ghost sections. Two ghosts may overlap arbitrarily.",
                                        },
                                        {
                                            t: "Parity is tested, not proved",
                                            d: "Theorem 6 covers exactly four scenarios. Proving equivalence for all inputs would need a shared implementation or a proof over both sources, and neither is attempted.",
                                        },
                                        {
                                            t: "The experiments use synthetic instances",
                                            d: "Real timetables are structured, with recurring patterns and deliberately spread section times. There is no claim that they are distributed like the random family used here.",
                                        },
                                        {
                                            t: "The statistical treatment is minimal",
                                            d: "Ten and five instances per point, no confidence intervals, no variance, no significance tests. Conclusions are drawn only from effects spanning orders of magnitude.",
                                        },
                                        {
                                            t: "The baseline is the weakest available",
                                            d: "Experiment 2 compares against uninformed enumeration. Nothing here says how the engine would fare against a solver with propagation, learning or dynamic ordering.",
                                        },
                                    ].map(item => (
                                        <div key={item.t} className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3.5">
                                            <p className="mb-1 text-sm font-bold tracking-tight text-gray-900">{item.t}</p>
                                            <p className="text-[13px] leading-relaxed text-gray-600">{item.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* 9. References */}
                        <section id="references" className="py-10 lg:py-16">
                            <SectionTitle
                                number="9"
                                title="References"
                                source="docs/09-references.md"
                            />
                            <div className="not-prose space-y-4 text-[13px] leading-relaxed text-gray-600">
                                {[
                                    { n: 1, t: 'S. Even, A. Itai, and A. Shamir, "On the complexity of timetable and multicommodity flow problems," SIAM Journal on Computing, vol. 5, no. 4, pp. 691–703, 1976.', doi: "10.1137/0205048" },
                                    { n: 2, t: "M. R. Garey and D. S. Johnson, Computers and Intractability, A Guide to the Theory of NP-Completeness. San Francisco, CA, USA: W. H. Freeman, 1979." },
                                    { n: 3, t: 'S. A. Cook, "The complexity of theorem proving procedures," in Proc. 3rd Annu. ACM Symp. Theory of Computing, 1971, pp. 151–158.', doi: "10.1145/800157.805047" },
                                    { n: 4, t: 'R. M. Karp, "Reducibility among combinatorial problems," in Complexity of Computer Computations, New York, NY, USA: Plenum Press, 1972, pp. 85–103.', doi: "10.1007/978-1-4684-2001-2_9" },
                                    { n: 5, t: 'P. Cheeseman, B. Kanefsky, and W. M. Taylor, "Where the really hard problems are," in Proc. 12th Int. Joint Conf. Artificial Intelligence, 1991, pp. 331–337.' },
                                    { n: 6, t: 'D. de Werra, "An introduction to timetabling," European Journal of Operational Research, vol. 19, no. 2, pp. 151–162, 1985.', doi: "10.1016/0377-2217(85)90167-5" },
                                ].map(ref => (
                                    <div key={ref.n} className="flex gap-3">
                                        <span className="font-mono text-xs font-bold text-gray-400">[{ref.n}]</span>
                                        <p>
                                            {ref.t}
                                            {ref.doi && (
                                                <>
                                                    {" "}
                                                    <a
                                                        href={`https://doi.org/${ref.doi}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-mono text-[11px] text-blue-600 underline"
                                                    >
                                                        doi:{ref.doi}
                                                    </a>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="mb-1 text-sm font-bold tracking-tight text-gray-900">That is the whole argument</p>
                                    <p className="text-[13px] leading-relaxed text-gray-500">
                                        Every step described here runs in the simulator. Pick your own courses and watch it work.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('simulator')}
                                    className="shrink-0 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                                >
                                    Try it on the simulator
                                </button>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}
