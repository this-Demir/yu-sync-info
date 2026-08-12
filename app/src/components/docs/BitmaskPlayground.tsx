import { useState } from "react";
import { SLOTS } from "../../core/time";
import { Tex } from "../ui/Tex";
import Figure from "./Figure";

// Bound to Proposition 1 of docs/01-preliminaries.md:
//   M and N intersect  <=>  beta(M) AND beta(N) != 0
//
// The reader toggles periods on two masks and reads the conjunction. The point
// is that the overlap question and the integer question give the same answer
// every time, which is what makes the encoding usable.

const PERIODS = SLOTS.length;

function toBeta(bits: boolean[]): number {
    return bits.reduce((acc, on, i) => (on ? acc | (1 << i) : acc), 0);
}

function toBinary(value: number): string {
    return value.toString(2).padStart(PERIODS, "0");
}

/** Slots occupied by both masks, which is what the conjunction reports. */
function sharedIndices(a: boolean[], b: boolean[]): number[] {
    const out: number[] = [];
    for (let i = 0; i < PERIODS; i++) if (a[i] && b[i]) out.push(i);
    return out;
}

const PRESETS: { name: string; w: number[]; s: number[] }[] = [
    { name: "Overlap", w: [2, 3], s: [3, 4] },
    { name: "Adjacent, no overlap", w: [2, 3], s: [4, 5] },
    { name: "Contained", w: [1, 2, 3, 4], s: [2, 3] },
    { name: "Disjoint", w: [0, 1], s: [8, 9] },
];

function fromIndices(indices: number[]): boolean[] {
    const bits = new Array<boolean>(PERIODS).fill(false);
    for (const i of indices) bits[i] = true;
    return bits;
}

export default function BitmaskPlayground() {
    const [weekMask, setWeekMask] = useState<boolean[]>(fromIndices([2, 3]));
    const [candidate, setCandidate] = useState<boolean[]>(fromIndices([3, 4]));

    const betaW = toBeta(weekMask);
    const betaS = toBeta(candidate);
    const conjunction = betaW & betaS;
    const shared = sharedIndices(weekMask, candidate);
    const conflicts = conjunction !== 0;

    const toggle = (row: "w" | "s", index: number) => {
        const setter = row === "w" ? setWeekMask : setCandidate;
        setter(prev => prev.map((on, i) => (i === index ? !on : on)));
    };

    const rows: { key: "w" | "s"; label: string; sub: string; bits: boolean[]; colour: string }[] = [
        { key: "w", label: "W", sub: "already occupied", bits: weekMask, colour: "bg-gray-800" },
        { key: "s", label: "s", sub: "candidate section", bits: candidate, colour: "bg-blue-600" },
    ];

    return (
        <Figure
            label="Figure A"
            title="Bitmask playground"
            claim="that two masks share a slot exactly when the bitwise AND of their integer encodings is non-zero"
            source="Proposition 1, section 1.3"
            caption={
                <>
                    Toggle any period on either row. The verdict is computed as{" "}
                    <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">betaW &amp; betaS</code>, the
                    same expression the engine evaluates per day inside <code className="font-mono text-[10px]">fits()</code>.
                    Bit <em>i</em> is the period starting at {SLOTS[0]} plus <em>i</em> hours.
                </>
            }
        >
            <div className="mb-5 flex flex-wrap gap-2">
                {PRESETS.map(p => (
                    <button
                        key={p.name}
                        onClick={() => { setWeekMask(fromIndices(p.w)); setCandidate(fromIndices(p.s)); }}
                        className="rounded-md border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* The row of twelve bits is the figure. Reflowing it into a grid at
                a phone width would destroy the thing being demonstrated, so it
                stays linear and scrolls, with the cells sized for a fingertip. */}
            <p className="mb-2 text-[10px] text-gray-400 sm:hidden">Scroll sideways for all twelve periods.</p>

            <div className="scroll-hint overflow-x-auto">
                <div className="min-w-[540px] sm:min-w-[572px]">
                    {/* Period headings */}
                    <div className="mb-1 flex gap-1 pl-[60px] sm:pl-[86px]">
                        {SLOTS.map((t, i) => (
                            <div key={t} className="w-10 text-center">
                                <div className="font-mono text-[9px] leading-none text-gray-400">{t}</div>
                                <div className="mt-0.5 font-mono text-[9px] leading-none text-gray-300">{i}</div>
                            </div>
                        ))}
                    </div>

                    {rows.map(row => (
                        <div key={row.key} className="mb-1.5 flex items-center gap-1">
                            <div className="w-[60px] shrink-0 pr-2 text-right sm:w-[86px]">
                                <div className="font-mono text-xs font-bold text-gray-900">{row.label}</div>
                                <div className="text-[9px] leading-tight text-gray-400">{row.sub}</div>
                            </div>
                            {row.bits.map((on, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggle(row.key, i)}
                                    aria-pressed={on}
                                    aria-label={`${row.label} period ${SLOTS[i]}`}
                                    className={`h-10 w-10 rounded border text-[10px] font-bold transition-colors ${
                                        on
                                            ? `${row.colour} border-transparent text-white`
                                            : "border-gray-200 bg-white text-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {on ? "1" : "0"}
                                </button>
                            ))}
                        </div>
                    ))}

                    {/* Conjunction */}
                    <div className="mt-2 flex items-center gap-1 border-t border-gray-200 pt-2.5">
                        <div className="w-[86px] shrink-0 pr-2 text-right">
                            <div className="font-mono text-xs font-bold text-gray-900">W &amp; s</div>
                            <div className="text-[9px] leading-tight text-gray-400">conjunction</div>
                        </div>
                        {Array.from({ length: PERIODS }, (_, i) => {
                            const hit = shared.includes(i);
                            return (
                                <div
                                    key={i}
                                    className={`flex h-10 w-10 items-center justify-center rounded border text-[10px] font-bold ${
                                        hit
                                            ? "border-transparent bg-red-500 text-white"
                                            : "border-gray-100 bg-gray-50 text-gray-300"
                                    }`}
                                >
                                    {hit ? "1" : "0"}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Readout */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                    { label: "\\beta(W)", value: betaW },
                    { label: "\\beta(\\mu(s))", value: betaS },
                    { label: "\\beta(W) \\wedge \\beta(\\mu(s))", value: conjunction },
                ].map(item => (
                    <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-[11px] text-gray-500">
                            <Tex>{item.label}</Tex>
                        </div>
                        <div className="mt-1 font-mono text-lg font-black leading-none text-gray-900">{item.value}</div>
                        <div className="mt-1 font-mono text-[10px] text-gray-400">{toBinary(item.value)}</div>
                    </div>
                ))}
            </div>

            <div
                className={`mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    conflicts ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
                }`}
            >
                <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
                        conflicts ? "bg-red-500" : "bg-emerald-500"
                    }`}
                >
                    {conflicts ? "✕" : "✓"}
                </span>
                <p className={`text-xs leading-relaxed ${conflicts ? "text-red-900" : "text-emerald-900"}`}>
                    {conflicts ? (
                        <>
                            The conjunction is <strong>{conjunction}</strong>, which is non-zero, so the masks intersect
                            and the placement is rejected. Shared periods:{" "}
                            <strong>{shared.map(i => SLOTS[i]).join(", ")}</strong>.
                        </>
                    ) : (
                        <>
                            The conjunction is <strong>0</strong>, so the masks are disjoint and the placement is
                            accepted. The engine would then set{" "}
                            <code className="rounded bg-white/60 px-1 font-mono text-[10px]">W |= betaS</code> and recurse.
                        </>
                    )}
                </p>
            </div>
        </Figure>
    );
}
