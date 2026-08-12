import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Docs from "../pages/Docs";
import BitmaskPlayground from "../components/docs/BitmaskPlayground";
import ReductionExplorer from "../components/docs/ReductionExplorer";
import ComplexityExplorer from "../components/docs/ComplexityExplorer";
import PhaseTransitionRunner from "../components/docs/PhaseTransitionRunner";
import { RESULTS } from "../bench/results.generated";

// A render smoke test for the documentation page and its figures.
//
// Type checking catches the shape of things and says nothing about whether a
// component throws when it actually runs. Three of these figures execute the
// scheduler during render, one typesets LaTeX, and one reads the generated
// results module, so a render pass exercises real work rather than only JSX.
//
// This is server rendering, so effects and event handlers do not run. It
// establishes that the initial render is sound, not that the interactions are.

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "docs");

describe("the documentation page renders", () => {
    it("renders the whole page without throwing", () => {
        const html = renderToString(<Docs />);
        expect(html.length).toBeGreaterThan(5000);
    });

    it("carries a section for every numbered part of the docs", () => {
        const html = renderToString(<Docs />);

        // The Markdown under docs/ is the authoritative document. If a file
        // exists there, the in-app edition must have somewhere to put it.
        // Section 7 was omitted from the page on the first pass while the
        // Markdown had it, which is exactly what this guards against.
        const required = [
            ["abstract", "Section Selection Scheduling"],
            ["preliminaries", "Preliminaries"],
            ["problem", "The Problem"],
            ["complexity", "Complexity"],
            ["algorithm", "The Algorithm"],
            ["cost", "Cost of the Search"],
            ["implementation", "Implementation"],
            ["evaluation", "Evaluation"],
            ["related", "Related Work"],
            ["limitations", "Limitations"],
            ["references", "References"],
        ] as const;

        for (const [id, heading] of required) {
            expect(html, `no <section id="${id}">`).toContain(`id="${id}"`);
            expect(html, `section ${id} is missing its heading`).toContain(heading);
        }

        // Every doc file except the table of contents needs a home on the page.
        const docFiles = readdirSync(DOCS_DIR).filter(f => /^\d\d-.*\.md$/.test(f));
        for (const file of docFiles) {
            expect(html, `nothing on the page cites ${file}`).toContain(file);
        }
    });

    it("renders every interactive figure", () => {
        const figures = [
            ["BitmaskPlayground", <BitmaskPlayground key="a" />],
            ["ReductionExplorer", <ReductionExplorer key="b" />],
            ["ComplexityExplorer", <ComplexityExplorer key="c" />],
            ["PhaseTransitionRunner", <PhaseTransitionRunner key="d" />],
        ] as const;

        for (const [name, element] of figures) {
            const html = renderToString(element);
            expect(html.length, `${name} rendered nothing`).toBeGreaterThan(200);
            // Every figure states the claim it is bound to.
            expect(html, `${name} is missing its claim`).toContain("Checks:");
        }
    });

    it("typesets every formula without a KaTeX failure", () => {
        const html = renderToString(<Docs />);

        // Typesetting happened at all.
        expect(html).toContain("katex-mathml");

        // Tex.tsx sets throwOnError false so a bad formula degrades rather than
        // taking the page down, which means a failure is silent unless it is
        // asserted on. KaTeX marks an unparsable command by colouring it with
        // the configured errorColor, so its absence is the check.
        //
        // This caught \textsc, which KaTeX does not implement and which was
        // rendering as literal red source text.
        expect(html, "a formula failed to parse").not.toContain('mathcolor="#dc2626"');
        expect(html).not.toContain("katex-error");
    });

    it("quotes measured values from the generated results, not hardcoded text", () => {
        const html = renderToString(<Docs />);

        const peakDensity = RESULTS.phaseTransition.peak!.meanDensity.toFixed(3);
        const branching = RESULTS.scaling.effectiveBranchingFactor.toFixed(2);
        const speedup = RESULTS.microbench.widest.speedup.toFixed(1);

        expect(html, "phase transition peak missing").toContain(peakDensity);
        expect(html, "effective branching factor missing").toContain(branching);
        expect(html, "microbenchmark speedup missing").toContain(speedup);
    });

    it("states the limits of the deployed engine plainly", () => {
        const html = renderToString(<Docs />);
        expect(html).toContain("An empty result from the deployed engine is not a proof");
    });

    it("no longer repeats the claims that were found to be false", () => {
        const html = renderToString(<Docs />);
        // The previous page led with these. They are wrong as stated.
        expect(html).not.toContain("Zero-Allocation Bitmasking");
        expect(html).not.toContain("without a single memory allocation");
        expect(html).not.toContain("reused in-place");
    });
});
