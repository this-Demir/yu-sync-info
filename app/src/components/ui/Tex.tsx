import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Typeset mathematics for the Docs page.
//
// The Markdown paper under docs/ writes its mathematics in LaTeX, which GitHub
// renders natively. This component gives the in-app version of the paper the
// same notation rather than a monospace approximation of it, so that a formula
// reads identically in both places.
//
// Rendering goes through renderToString once per formula and is memoised on the
// source string. KaTeX is synchronous and has no layout reflow phase, so there
// is nothing to coordinate with React beyond handing it the resulting markup.

interface TexProps {
    children: string;
    /** Render as a centred display equation rather than inline. */
    block?: boolean;
    className?: string;
}

function render(formula: string, displayMode: boolean): string {
    return katex.renderToString(formula, {
        displayMode,
        // A malformed formula should show itself in red rather than take the
        // page down. Docs content is authored, not user supplied, so a visible
        // failure is the useful behaviour.
        throwOnError: false,
        errorColor: "#dc2626",
        strict: false,
        output: "htmlAndMathml",
    });
}

export function Tex({ children, block = false, className = "" }: TexProps) {
    const html = useMemo(() => render(children, block), [children, block]);

    if (block) {
        return (
            <div
                className={`my-6 overflow-x-auto py-1 text-center ${className}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * A display equation in a bordered panel, for the handful of results the page
 * wants to set apart from the prose around them.
 */
export function TexPanel({ children, caption }: { children: string; caption?: string }) {
    const html = useMemo(() => render(children, true), [children]);

    return (
        <div className="my-8 rounded-md border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <div className="overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: html }} />
            {caption && (
                <p className="mt-3 text-center text-[11px] font-medium text-gray-400">{caption}</p>
            )}
        </div>
    );
}

export default Tex;
