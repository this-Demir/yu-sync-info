// scripts/run-experiments.bench.ts
//
// Regenerates every measured number and every figure in docs/06-evaluation.md.
//
//   cd app && npm run bench
//
// This runs under Vitest purely to reuse the TypeScript pipeline that is
// already installed. It is not a test of behaviour, and it is excluded from
// `npm run test` by its .bench.ts suffix so the ordinary suite stays fast.
//
// Output is split into two parts per experiment. `deterministic` holds
// structural quantities (nodes explored, conflict checks, solution counts,
// measured densities) which are fully determined by the seeds and must
// reproduce byte for byte on any machine. `timing` holds wall-clock and
// nanosecond measurements, which are hardware and load dependent and are not
// expected to reproduce exactly. docs/06-evaluation.md states which of its
// claims rest on which.

import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import os from "node:os";

import {
  runScaling, SCALING_CONFIG,
  runPruning, PRUNING_CONFIG,
  runMicrobench, MICROBENCH_CONFIG,
  runPhaseTransition, PHASE_CONFIG,
  criticalPoint, crossoverPoint,
} from "../src/bench/experiments";
import { lineChart } from "../src/bench/svg";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..", "..", "docs");
const DATA = join(DOCS, "data");
const FIGS = join(DOCS, "figures");
const GENERATED = join(HERE, "..", "src", "bench", "results.generated.ts");

mkdirSync(DATA, { recursive: true });
mkdirSync(FIGS, { recursive: true });

// Numbers quoted by the in-app docs are collected here and written as a
// TypeScript module at the end of the run. The Docs page imports that module
// instead of hardcoding figures, so a number shown in the browser and the same
// number printed in docs/06-evaluation.md always come from one measurement.
const generated: Record<string, unknown> = {};

const COLORS = {
  measured: "#2563eb",
  bound: "#dc2626",
  second: "#059669",
  third: "#d97706",
};

function writeJson(name: string, value: unknown): void {
  writeFileSync(join(DATA, name), JSON.stringify(value, null, 2) + "\n", "utf8");
}

function writeSvg(name: string, svg: string): void {
  writeFileSync(join(FIGS, name), svg + "\n", "utf8");
}

function environment() {
  const cpus = os.cpus();
  return {
    cpu: cpus[0]?.model ?? "unknown",
    logicalCores: cpus.length,
    totalMemoryGB: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    runtime: `Node ${process.version}`,
  };
}

describe("experiment suite", () => {
  it("records the execution environment", () => {
    const env = environment();
    writeJson("environment.json", {
      note: "Hardware and runtime for the timing figures in docs/06-evaluation.md. Structural results are hardware independent.",
      generatedAt: new Date().toISOString(),
      ...env,
    });
    generated.environment = env;
    expect(env.logicalCores).toBeGreaterThan(0);
  });

  it("Experiment 1: scaling in the number of courses", () => {
    const points = runScaling();

    // A truncated traversal would silently understate the node count.
    for (const p of points) expect(p.truncated).toBe(false);

    writeJson("experiment-1-scaling.json", {
      experiment: "Scaling in the number of courses",
      claim: "Exhaustive traversal cost grows exponentially in the number of courses, while remaining far below the fully expanded tree.",
      note: "worstCaseNodes is the total size of the fully expanded tree, which is the bound the engine's node counter is measured against. completeAssignments is the product of the section counts, which counts only the leaves.",
      config: SCALING_CONFIG,
      deterministic: points.map(p => ({
        courses: p.courses,
        worstCaseNodes: p.worstCaseNodes,
        completeAssignments: p.completeAssignments,
        meanNodes: p.meanNodes,
        meanConflictChecks: p.meanConflictChecks,
        meanSolutions: p.meanSolutions,
        meanDensity: p.meanDensity,
        exploredFraction: p.exploredFraction,
        instances: p.instances,
      })),
      timing: points.map(p => ({ courses: p.courses, meanTimeMs: p.meanTimeMs })),
    });

    writeSvg("fig-1-scaling.svg", lineChart({
      title: "Figure 1. Search cost against the fully expanded tree",
      subtitle: `${SCALING_CONFIG.sectionsPerCourse} sections per course, mean of ${SCALING_CONFIG.instancesPerPoint} instances per point, seed ${SCALING_CONFIG.baseSeed}`,
      xLabel: "Courses (d)",
      yLabel: "Nodes (log scale)",
      yLog: true,
      series: [
        { label: "Fully expanded tree", color: COLORS.bound, dashed: true, points: points.map(p => ({ x: p.courses, y: p.worstCaseNodes })) },
        { label: "Nodes explored", color: COLORS.measured, points: points.map(p => ({ x: p.courses, y: p.meanNodes })) },
      ],
      caption: "Both series are straight on a log axis, so pruning changes the base of the exponential and not the fact that it is one.",
    }));

    const first = points[0]!;
    const last = points[points.length - 1]!;
    generated.scaling = {
      config: SCALING_CONFIG,
      points: points.map(p => ({
        courses: p.courses,
        worstCaseNodes: p.worstCaseNodes,
        completeAssignments: p.completeAssignments,
        meanNodes: p.meanNodes,
        exploredFraction: p.exploredFraction,
        meanSolutions: p.meanSolutions,
        meanDensity: p.meanDensity,
      })),
      // Geometric mean of the successive growth ratios across the whole range.
      effectiveBranchingFactor: Math.pow(last.meanNodes / first.meanNodes, 1 / (last.courses - first.courses)),
    };

    expect(points.length).toBeGreaterThan(0);
  });

  it("Experiment 2: pruning against uninformed enumeration", () => {
    const points = runPruning();

    // The optimised engine must agree with the reference implementation.
    for (const p of points) expect(p.agree).toBe(true);

    writeJson("experiment-2-pruning.json", {
      experiment: "Pruning effectiveness",
      claim: "Bitmask DFS performs a small fraction of the conflict checks that uninformed enumeration performs, and returns exactly the same solution set.",
      note: "Both methods count one conflict check as one AND of one day mask, and both iterate only the days a section meets. checkReduction is therefore the unit-fair comparison. Node counts and complete-assignment counts are reported alongside but are different units and are not compared directly.",
      config: PRUNING_CONFIG,
      deterministic: points.map(p => ({
        courses: p.courses,
        meanDensity: p.meanDensity,
        naiveCombinations: p.naiveCombinations,
        searchTreeSize: p.searchTreeSize,
        meanNaiveConflictChecks: p.meanNaiveConflictChecks,
        meanDfsConflictChecks: p.meanDfsConflictChecks,
        meanDfsNodes: p.meanDfsNodes,
        meanSolutions: p.meanSolutions,
        checkReduction: p.checkReduction,
        nodeReduction: p.nodeReduction,
        agree: p.agree,
        instances: p.instances,
      })),
      timing: points.map(p => ({ courses: p.courses, meanNaiveTimeMs: p.meanNaiveTimeMs, meanDfsTimeMs: p.meanDfsTimeMs })),
    });

    writeSvg("fig-2-pruning.svg", lineChart({
      title: "Figure 2. Conflict checks performed, pruned against unpruned",
      subtitle: `${PRUNING_CONFIG.sectionsPerCourse} sections per course, mean of ${PRUNING_CONFIG.instancesPerPoint} instances per point, seed ${PRUNING_CONFIG.baseSeed}`,
      xLabel: "Courses (d)",
      yLabel: "Conflict checks (log scale)",
      yLog: true,
      series: [
        { label: "Naive enumeration", color: COLORS.bound, dashed: true, points: points.map(p => ({ x: p.courses, y: p.meanNaiveConflictChecks })) },
        { label: "Bitmask DFS", color: COLORS.measured, points: points.map(p => ({ x: p.courses, y: p.meanDfsConflictChecks })) },
      ],
      caption: "Both series count the same primitive operation. Both methods return an identical solution set at every point, asserted in the experiment rather than assumed.",
    }));

    generated.pruning = {
      config: PRUNING_CONFIG,
      points: points.map(p => ({
        courses: p.courses,
        naiveCombinations: p.naiveCombinations,
        meanNaiveConflictChecks: p.meanNaiveConflictChecks,
        meanDfsConflictChecks: p.meanDfsConflictChecks,
        checkReduction: p.checkReduction,
        meanSolutions: p.meanSolutions,
        agree: p.agree,
      })),
      allAgree: points.every(p => p.agree),
    };

    expect(points.length).toBeGreaterThan(0);
  });

  it("Experiment 3: conflict check cost as the slot universe grows", () => {
    const result = runMicrobench();

    writeJson("experiment-3-microbench.json", {
      experiment: "Conflict check microbenchmark",
      claim: "The word-wise check costs a constant factor of about the word size less than the slot-wise check, but both grow linearly in the size of the slot universe. Constant time holds only for a fixed universe.",
      config: MICROBENCH_CONFIG,
      deterministic: result.points.map(p => ({ slots: p.slots, words: p.words })),
      timing: {
        wordBits: result.wordBits,
        deployedWeekNs: result.deployedWeekNs,
        points: result.points.map(p => ({
          slots: p.slots,
          wordAndNs: p.wordAndNs,
          slotScanNs: p.slotScanNs,
          speedup: p.speedup,
        })),
      },
    });

    writeSvg("fig-3-microbench.svg", lineChart({
      title: "Figure 3. Cost of one conflict check against universe size",
      subtitle: `Worst case (disjoint) operands, minimum of ${MICROBENCH_CONFIG.trials} trials of ${MICROBENCH_CONFIG.reps.toLocaleString("en-US")} calls`,
      xLabel: "Slots in the universe (log scale)",
      yLabel: "Nanoseconds per check (log scale)",
      xLog: true,
      yLog: true,
      series: [
        { label: "Slot-wise scan", color: COLORS.bound, points: result.points.map(p => ({ x: p.slots, y: p.slotScanNs })) },
        { label: "Word-wise AND", color: COLORS.measured, points: result.points.map(p => ({ x: p.slots, y: p.wordAndNs })) },
      ],
      caption: "Both lines rise with the universe size. The bitmask encoding buys a large constant factor, not a change of complexity class.",
    }));

    const widest = result.points[result.points.length - 1]!;
    generated.microbench = {
      config: MICROBENCH_CONFIG,
      wordBits: result.wordBits,
      deployedWeekNs: result.deployedWeekNs,
      points: result.points,
      widest: {
        slots: widest.slots,
        speedup: widest.speedup,
        nsPerWord: widest.wordAndNs / widest.words,
        nsPerSlot: widest.slotScanNs / widest.slots,
      },
    };

    expect(result.points.length).toBe(MICROBENCH_CONFIG.slotSizes.length);
  });

  it("Experiment 4: constraint density phase transition", () => {
    const points = runPhaseTransition();
    const peak = criticalPoint(points);
    const crossover = crossoverPoint(points);

    writeJson("experiment-4-phase-transition.json", {
      experiment: "Constraint density phase transition",
      claim: "Mean search cost for the decision problem is low at both extremes of constraint density and peaks near the density at which half the instances are solvable.",
      config: PHASE_CONFIG,
      criticalPoint: peak && {
        placementPool: peak.placementPool,
        meanDensity: peak.meanDensity,
        meanNodes: peak.meanNodes,
        solvableFraction: peak.solvableFraction,
      },
      solvabilityCrossover: crossover && {
        placementPool: crossover.placementPool,
        meanDensity: crossover.meanDensity,
        meanNodes: crossover.meanNodes,
        solvableFraction: crossover.solvableFraction,
      },
      deterministic: points.map(p => ({
        placementPool: p.placementPool,
        meanDensity: p.meanDensity,
        meanNodes: p.meanNodes,
        medianNodes: p.medianNodes,
        meanConflictChecks: p.meanConflictChecks,
        solvableFraction: p.solvableFraction,
        instances: p.instances,
      })),
      timing: points.map(p => ({ placementPool: p.placementPool, meanTimeMs: p.meanTimeMs })),
    });

    const sweepSubtitle = `${PHASE_CONFIG.courses} courses, ${PHASE_CONFIG.sectionsPerCourse} sections each, ${PHASE_CONFIG.instancesPerPoint} instances per point, seed ${PHASE_CONFIG.baseSeed}`;

    // Density is plotted on a log axis. It spans 0.05 to 1.0, and on a linear
    // axis the entire transition would be compressed into the leftmost tenth
    // of the plot while the flat, uninformative high-density tail took the
    // rest. A log axis shows the whole sweep without discarding any point.
    writeSvg("fig-4-phase-transition.svg", lineChart({
      title: "Figure 4. Easy, hard, easy across constraint density",
      subtitle: sweepSubtitle,
      xLabel: "Measured constraint density, log scale",
      yLabel: "Nodes explored to decide the instance, log scale",
      xLog: true,
      yLog: true,
      series: [
        { label: "Mean nodes", color: COLORS.measured, points: points.map(p => ({ x: p.meanDensity, y: p.meanNodes })) },
        { label: "Median nodes", color: COLORS.third, dashed: true, points: points.map(p => ({ x: p.meanDensity, y: Math.max(p.medianNodes, 1) })) },
      ],
      vRule: peak ? { x: peak.meanDensity, label: `peak ${peak.meanDensity.toFixed(3)}` } : undefined,
      caption: "Cost is low at both extremes and peaks in between. The median falls away far faster than the mean on the underconstrained side, which says the residual cost there comes from a minority of hard instances.",
    }));

    writeSvg("fig-5-solvability.svg", lineChart({
      title: "Figure 5. Solvability across the same sweep",
      subtitle: sweepSubtitle,
      xLabel: "Measured constraint density, log scale",
      yLabel: "Fraction of instances with a solution",
      xLog: true,
      yMin: 0,
      yMax: 1,
      series: [
        { label: "Solvable fraction", color: COLORS.second, points: points.map(p => ({ x: p.meanDensity, y: p.solvableFraction })) },
      ],
      vRule: peak ? { x: peak.meanDensity, label: `cost peak ${peak.meanDensity.toFixed(3)}` } : undefined,
      caption: "The cost peak in Figure 4 sits close to, but not exactly at, the density where half the instances are still solvable. Read the two figures against the same x axis.",
    }));

    const easiest = points[points.length - 1]!;
    generated.phaseTransition = {
      config: { ...PHASE_CONFIG, pools: undefined, poolRange: [PHASE_CONFIG.pools[0], PHASE_CONFIG.pools[PHASE_CONFIG.pools.length - 1]] },
      peak: peak && { meanDensity: peak.meanDensity, meanNodes: peak.meanNodes, medianNodes: peak.medianNodes, solvableFraction: peak.solvableFraction },
      crossover: crossover && { meanDensity: crossover.meanDensity, meanNodes: crossover.meanNodes, solvableFraction: crossover.solvableFraction },
      easiest: { meanDensity: easiest.meanDensity, meanNodes: easiest.meanNodes, medianNodes: easiest.medianNodes },
      peakOverEasiest: peak ? peak.meanNodes / easiest.meanNodes : 0,
      points: points.map(p => ({
        meanDensity: p.meanDensity,
        meanNodes: p.meanNodes,
        medianNodes: p.medianNodes,
        solvableFraction: p.solvableFraction,
      })),
    };

    expect(points.length).toBeGreaterThan(0);
  });

  // Runs last. Vitest executes the `it` blocks of a file in declaration order,
  // so every experiment above has populated `generated` by this point.
  it("emits the generated results module consumed by the Docs page", () => {
    const banner = [
      "// GENERATED FILE. Do not edit by hand.",
      "//",
      "// Written by app/scripts/run-experiments.bench.ts on `npm run bench`.",
      "// The Docs page imports these values instead of hardcoding measurements,",
      "// so a number rendered in the browser and the same number printed in",
      "// docs/06-evaluation.md always come from a single run of the experiments.",
      "//",
      "// Structural values are reproducible from the seeds in each `config`.",
      "// Values in nanoseconds or milliseconds are hardware dependent.",
      "",
      `export const RESULTS = ${JSON.stringify(generated, null, 2)} as const;`,
      "",
      "export type Results = typeof RESULTS;",
      "",
    ].join("\n");

    writeFileSync(GENERATED, banner, "utf8");

    for (const key of ["environment", "scaling", "pruning", "microbench", "phaseTransition"]) {
      expect(generated[key], `experiment "${key}" did not record its results`).toBeDefined();
    }
  });
});
