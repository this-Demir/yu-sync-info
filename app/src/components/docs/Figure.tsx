import type { ReactNode } from "react";

// Shared framing for every interactive figure on the Docs page.
//
// Each figure states the claim it is bound to. A figure that illustrates
// nothing in particular is decoration, and decoration in a document that is
// otherwise making provable claims costs more credibility than it adds.

interface FigureProps {
    label: string;
    title: string;
    /** The specific claim this figure lets the reader check. */
    claim: string;
    /** Where that claim is stated and proved or measured. */
    source?: string;
    children: ReactNode;
    caption?: ReactNode;
}

export default function Figure({ label, title, claim, source, children, caption }: FigureProps) {
    return (
        <figure className="not-prose my-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {label}
                    </span>
                    <span className="text-sm font-bold tracking-tight text-gray-900">{title}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    <span className="font-semibold text-gray-600">Checks: </span>
                    {claim}
                    {source && <span className="text-gray-400"> ({source})</span>}
                </p>
            </div>

            <div className="p-5">{children}</div>

            {caption && (
                <figcaption className="border-t border-gray-100 px-5 py-3 text-[11px] leading-relaxed text-gray-500">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
