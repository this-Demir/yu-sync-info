// src/bench/experiments.ts
//
// The four experiments reported in docs/06-evaluation.md.
//
// Every function here is pure with respect to the filesystem. It takes a
// configuration, runs the real engine from src/core, and returns plain data.
// The static figure generator (app/scripts/run-experiments.bench.ts) and the
// live components on the Docs page both call these same functions, which is
// what guarantees a published figure cannot drift from the claim it supports.

import { generateSchedules } from "../core/scheduler";
import type { Section } from "../core/types";
import {
  generateInstance,
  measureDensity,
  stateSpaceSize,
  searchTreeSize,
  maxPlacementPool,
  DEFAULT_PARAMS,
} from "./instances";
import { enumerateNaive, canonicalKey } from "./naive";
import {
  buildDisjointVectors,
  wordAndConflicts,
  slotScanConflicts,
  fixedWeekConflicts,
  timeNsPerOp,
  WORD_BITS,
} from "./maskVariants";

/**
 * Options that disable every production guard in scheduler.ts.
 *
 * The deployed engine bails out on a 1200 ms deadline, a one million node cap
 * and a five million state-space estimate. Those exist to protect a browser
 * session and are correct there, but an experiment that silently hit one would
 * report a truncated traversal as if it were a complete one. Measuring the
 * algorithm requires turning them off explicitly.
 *
 * `maxResults` must stay finite. scheduler.ts floors a non-finite value to
 * zero, which would return immediately with no results at all.
 */
export const UNBOUNDED = {
  deadlineMs: Number.MAX_SAFE_INTEGER,
  maxNodes: Number.MAX_SAFE_INTEGER,
  estSpaceLimit: Number.MAX_SAFE_INTEGER,
  enableStats: true,
} as const;

export const EXHAUSTIVE_MAX_RESULTS = 1_000_000;

export interface ExperimentMeta {
  seed: number;
  generatedAt: string;
  hardware: string;
  runtime: string;
}

// ---------------------------------------------------------------------------
// Experiment 1: scaling in the number of courses
// ---------------------------------------------------------------------------

export interface ScalingPoint {
  courses: number;
  sectionsPerCourse: number;
  /** Total nodes in the fully expanded tree, the bound the node counter is measured against. */
  worstCaseNodes: number;
  /** Complete assignments, the leaves of that tree. */
  completeAssignments: number;
  meanNodes: number;
  meanConflictChecks: number;
  meanTimeMs: number;
  meanSolutions: number;
  meanDensity: number;
  /** meanNodes / worstCaseNodes. */
  exploredFraction: number;
  instances: number;
  /** True if any run hit the result cap, which would make the traversal partial. */
  truncated: boolean;
}

export interface ScalingConfig {
  minCourses: number;
  maxCourses: number;
  sectionsPerCourse: number;
  placementPool: number;
  instancesPerPoint: number;
  baseSeed: number;
}

export const SCALING_CONFIG: ScalingConfig = {
  minCourses: 2,
  maxCourses: 14,
  sectionsPerCourse: 4,
  placementPool: 18,
  instancesPerPoint: 10,
  baseSeed: 20260801,
};

export function runScaling(config: ScalingConfig = SCALING_CONFIG): ScalingPoint[] {
  const points: ScalingPoint[] = [];

  for (let d = config.minCourses; d <= config.maxCourses; d++) {
    let nodes = 0;
    let checks = 0;
    let timeMs = 0;
    let solutions = 0;
    let density = 0;
    let worstCase = 0;
    let leaves = 0;
    let truncated = false;

    for (let k = 0; k < config.instancesPerPoint; k++) {
      const sections = generateInstance({
        ...DEFAULT_PARAMS,
        courses: d,
        sectionsPerCourse: config.sectionsPerCourse,
        placementPool: config.placementPool,
        seed: config.baseSeed + k * 1000 + d,
      });

      const { results, stats } = generateSchedules(sections, EXHAUSTIVE_MAX_RESULTS, UNBOUNDED);

      nodes += stats.nodes;
      checks += stats.conflictChecks;
      timeMs += stats.timeMs;
      solutions += results.length;
      density += measureDensity(sections);
      worstCase = searchTreeSize(sections);
      leaves = stateSpaceSize(sections);
      if (results.length >= EXHAUSTIVE_MAX_RESULTS) truncated = true;
    }

    const n = config.instancesPerPoint;
    points.push({
      courses: d,
      sectionsPerCourse: config.sectionsPerCourse,
      worstCaseNodes: worstCase,
      completeAssignments: leaves,
      meanNodes: nodes / n,
      meanConflictChecks: checks / n,
      meanTimeMs: timeMs / n,
      meanSolutions: solutions / n,
      meanDensity: density / n,
      exploredFraction: worstCase === 0 ? 0 : nodes / n / worstCase,
      instances: n,
      truncated,
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Experiment 2: pruning effectiveness against uninformed enumeration
// ---------------------------------------------------------------------------

export interface PruningPoint {
  courses: number;
  sectionsPerCourse: number;
  meanDensity: number;
  /** Complete assignments the baseline constructs, which is every leaf. */
  naiveCombinations: number;
  meanNaiveConflictChecks: number;
  meanNaiveTimeMs: number;
  /** Tree nodes the engine visits, partial assignments included. */
  meanDfsNodes: number;
  meanDfsConflictChecks: number;
  meanDfsTimeMs: number;
  /** Total nodes in the fully expanded tree. */
  searchTreeSize: number;
  meanSolutions: number;
  /**
   * Reduction in conflict checks, the one quantity both methods count in the
   * same unit: one AND of one day mask.
   */
  checkReduction: number;
  /** Reduction in visited nodes against the fully expanded tree. */
  nodeReduction: number;
  /** Whether both methods returned exactly the same solution set on every instance. */
  agree: boolean;
  instances: number;
}

export interface PruningConfig {
  minCourses: number;
  maxCourses: number;
  sectionsPerCourse: number;
  placementPool: number;
  instancesPerPoint: number;
  baseSeed: number;
}

export const PRUNING_CONFIG: PruningConfig = {
  minCourses: 2,
  maxCourses: 11,
  sectionsPerCourse: 4,
  placementPool: 18,
  instancesPerPoint: 5,
  baseSeed: 20260802,
};

export function runPruning(config: PruningConfig = PRUNING_CONFIG): PruningPoint[] {
  const points: PruningPoint[] = [];

  for (let d = config.minCourses; d <= config.maxCourses; d++) {
    let naiveChecks = 0;
    let naiveTime = 0;
    let dfsNodes = 0;
    let dfsChecks = 0;
    let dfsTime = 0;
    let solutions = 0;
    let density = 0;
    let leaves = 0;
    let treeSize = 0;
    let agree = true;

    for (let k = 0; k < config.instancesPerPoint; k++) {
      const sections = generateInstance({
        ...DEFAULT_PARAMS,
        courses: d,
        sectionsPerCourse: config.sectionsPerCourse,
        placementPool: config.placementPool,
        seed: config.baseSeed + k * 1000 + d,
      });

      const naive = enumerateNaive(sections);
      const { results, stats } = generateSchedules(sections, EXHAUSTIVE_MAX_RESULTS, UNBOUNDED);

      const dfsKeys = results.map(canonicalKey).sort();
      if (dfsKeys.length !== naive.solutions.length || !dfsKeys.every((key, i) => key === naive.solutions[i])) {
        agree = false;
      }

      naiveChecks += naive.conflictChecks;
      naiveTime += naive.timeMs;
      dfsNodes += stats.nodes;
      dfsChecks += stats.conflictChecks;
      dfsTime += stats.timeMs;
      solutions += results.length;
      density += measureDensity(sections);
      leaves = stateSpaceSize(sections);
      treeSize = searchTreeSize(sections);
    }

    const n = config.instancesPerPoint;
    points.push({
      courses: d,
      sectionsPerCourse: config.sectionsPerCourse,
      meanDensity: density / n,
      naiveCombinations: leaves,
      meanNaiveConflictChecks: naiveChecks / n,
      meanNaiveTimeMs: naiveTime / n,
      meanDfsNodes: dfsNodes / n,
      meanDfsConflictChecks: dfsChecks / n,
      meanDfsTimeMs: dfsTime / n,
      searchTreeSize: treeSize,
      meanSolutions: solutions / n,
      checkReduction: naiveChecks === 0 ? 0 : 1 - dfsChecks / naiveChecks,
      nodeReduction: treeSize === 0 ? 0 : 1 - dfsNodes / n / treeSize,
      agree,
      instances: n,
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Experiment 3: cost of the conflict check as the slot universe grows
// ---------------------------------------------------------------------------

export interface MicrobenchPoint {
  slots: number;
  words: number;
  wordAndNs: number;
  slotScanNs: number;
  /** slotScanNs / wordAndNs. */
  speedup: number;
}

export interface MicrobenchConfig {
  slotSizes: number[];
  reps: number;
  trials: number;
}

export const MICROBENCH_CONFIG: MicrobenchConfig = {
  slotSizes: [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192],
  reps: 200_000,
  trials: 7,
};

export interface MicrobenchResult {
  points: MicrobenchPoint[];
  /** The deployed encoding, 7 days of one word each, for reference. */
  deployedWeekNs: number;
  wordBits: number;
}

export function runMicrobench(config: MicrobenchConfig = MICROBENCH_CONFIG): MicrobenchResult {
  const points: MicrobenchPoint[] = config.slotSizes.map(slots => {
    const v = buildDisjointVectors(slots);
    const wordAndNs = timeNsPerOp(() => wordAndConflicts(v.wordsA, v.wordsB), config.reps, config.trials);
    const slotScanNs = timeNsPerOp(() => slotScanConflicts(v.slotsA, v.slotsB), config.reps, config.trials);
    return {
      slots,
      words: Math.ceil(slots / WORD_BITS),
      wordAndNs,
      slotScanNs,
      speedup: slotScanNs / wordAndNs,
    };
  });

  // The deployed case: seven days, one 12-bit word each, disjoint.
  const weekA = [0b000000111000, 0, 0b000011000000, 0, 0, 0, 0];
  const weekB = [0b111000000000, 0, 0b000000000111, 0, 0, 0, 0];
  const deployedWeekNs = timeNsPerOp(() => fixedWeekConflicts(weekA, weekB), config.reps, config.trials);

  return { points, deployedWeekNs, wordBits: WORD_BITS };
}

// ---------------------------------------------------------------------------
// Experiment 4: constraint density phase transition
// ---------------------------------------------------------------------------

export interface PhasePoint {
  placementPool: number;
  meanDensity: number;
  meanNodes: number;
  medianNodes: number;
  meanConflictChecks: number;
  meanTimeMs: number;
  /** Fraction of instances admitting at least one conflict-free schedule. */
  solvableFraction: number;
  instances: number;
}

export interface PhaseConfig {
  courses: number;
  sectionsPerCourse: number;
  /** Placement pool sizes to sweep. Small pool means high density. */
  pools: number[];
  instancesPerPoint: number;
  baseSeed: number;
}

function defaultPools(): number[] {
  const max = maxPlacementPool(DEFAULT_PARAMS.meetingLength);
  const pools: number[] = [];
  for (let p = 1; p <= max; p++) pools.push(p);
  return pools;
}

export const PHASE_CONFIG: PhaseConfig = {
  courses: 12,
  sectionsPerCourse: 4,
  pools: defaultPools(),
  instancesPerPoint: 200,
  baseSeed: 20260804,
};

/**
 * Sweeps constraint density and measures search cost.
 *
 * The engine is asked for a single solution rather than all of them, because
 * the object of study is the decision problem defined in
 * docs/02-problem-formulation.md. Under that framing an underconstrained
 * instance is easy because a solution is found almost immediately, and an
 * overconstrained instance is easy because unsatisfiability is proven close to
 * the root. The cost peaks in between, which is the effect being measured.
 */
export function runPhaseTransition(config: PhaseConfig = PHASE_CONFIG): PhasePoint[] {
  const points: PhasePoint[] = [];

  for (const pool of config.pools) {
    const nodeCounts: number[] = [];
    let checks = 0;
    let timeMs = 0;
    let density = 0;
    let solvable = 0;

    for (let k = 0; k < config.instancesPerPoint; k++) {
      const sections: Section[] = generateInstance({
        ...DEFAULT_PARAMS,
        courses: config.courses,
        sectionsPerCourse: config.sectionsPerCourse,
        placementPool: pool,
        seed: config.baseSeed + k * 10007 + pool,
      });

      const { results, stats } = generateSchedules(sections, 1, UNBOUNDED);

      nodeCounts.push(stats.nodes);
      checks += stats.conflictChecks;
      timeMs += stats.timeMs;
      density += measureDensity(sections);
      if (results.length > 0) solvable++;
    }

    const n = config.instancesPerPoint;
    const sorted = [...nodeCounts].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;

    points.push({
      placementPool: pool,
      meanDensity: density / n,
      meanNodes: nodeCounts.reduce((a, b) => a + b, 0) / n,
      medianNodes: median,
      meanConflictChecks: checks / n,
      meanTimeMs: timeMs / n,
      solvableFraction: solvable / n,
      instances: n,
    });
  }

  return points;
}

/** The density at which mean search cost peaks. */
export function criticalPoint(points: PhasePoint[]): PhasePoint | null {
  if (points.length === 0) return null;
  return points.reduce((best, p) => (p.meanNodes > best.meanNodes ? p : best), points[0]!);
}

/** The point whose solvable fraction is closest to one half. */
export function crossoverPoint(points: PhasePoint[]): PhasePoint | null {
  if (points.length === 0) return null;
  return points.reduce(
    (best, p) => (Math.abs(p.solvableFraction - 0.5) < Math.abs(best.solvableFraction - 0.5) ? p : best),
    points[0]!
  );
}
