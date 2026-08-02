import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Guards the claim docs/README.md makes, that every number printed in the
// evaluation appears in the committed experiment output.
//
// Only structural quantities are checked. Wall-clock and nanosecond columns are
// hardware dependent and change on every run, so asserting on them would make
// this test fail on any machine other than the one that generated the figures.
// The evaluation says as much and presents those columns as illustrative.
//
// If this test fails after `npm run bench`, the data moved and the prose did
// not. Update the prose rather than relaxing the test.

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..", "..", "..", "docs");

const readDoc = (name: string) => readFileSync(join(DOCS, name), "utf8");
const readData = <T,>(name: string): T =>
  JSON.parse(readFileSync(join(DOCS, "data", name), "utf8")) as T;

// Shapes of the committed experiment output. Declaring them here means this
// test also documents the schema the evaluation depends on, and a renamed field
// in the runner fails the type check rather than silently skipping a column.
interface Dataset<P> {
  deterministic: P[];
}

interface ScalingPoint {
  courses: number;
  worstCaseNodes: number;
  completeAssignments: number;
  meanNodes: number;
  exploredFraction: number;
  meanSolutions: number;
  meanDensity: number;
}

interface PruningPoint {
  courses: number;
  naiveCombinations: number;
  meanNaiveConflictChecks: number;
  meanDfsConflictChecks: number;
  checkReduction: number;
  meanDfsNodes: number;
  meanSolutions: number;
  agree: boolean;
}

interface MicrobenchPoint {
  slots: number;
  words: number;
}

interface PhasePoint {
  placementPool: number;
  meanDensity: number;
  meanNodes: number;
  medianNodes: number;
  solvableFraction: number;
}

interface PhaseDataset extends Dataset<PhasePoint> {
  criticalPoint: { meanDensity: number };
  solvabilityCrossover: { meanDensity: number };
}

/**
 * Turns a Markdown table cell into a number.
 *
 * Handles the forms the evaluation actually uses: digit grouping with spaces,
 * inline math delimiters, LaTeX scientific notation, percent signs, and the
 * multiplication sign used for speedups.
 */
function cellToNumber(cell: string): number {
  let s = cell.trim().replace(/\*\*/g, "").replace(/\$/g, "").trim();

  const sci = s.match(/^(-?[\d.]+)\s*\\times\s*10\^\{(-?\d+)\}$/);
  if (sci) return Number(sci[1]) * Math.pow(10, Number(sci[2]));

  s = s.replace(/\\times/g, "").replace(/\\%/g, "").replace(/%/g, "");
  s = s.replace(/\\,/g, "").replace(/\s+/g, "").replace(/,/g, "");
  return Number(s);
}

/** Extracts the body rows of the first table whose header contains `marker`. */
function tableRows(md: string, marker: string): string[][] {
  const lines = md.split("\n");
  const headerIdx = lines.findIndex(l => l.includes("|") && l.includes(marker));
  if (headerIdx === -1) throw new Error(`no table header containing "${marker}"`);

  const rows: string[][] = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim().startsWith("|")) break;
    rows.push(line.split("|").slice(1, -1).map(c => c.trim()));
  }
  return rows;
}

/**
 * Compares a documented cell against a source value at the precision the cell
 * was written to.
 *
 * Precision is derived from the cell text rather than from the parsed number.
 * Deriving it from the number fails on scientific notation, because
 * `5.98e-1` stringifies as `0.5980000000000001` and would demand sixteen
 * decimal places of agreement.
 */
function expectAtCellPrecision(cellText: string, actual: number, label: string) {
  const documented = cellToNumber(cellText);
  const clean = cellText.trim().replace(/\*\*/g, "").replace(/\$/g, "").trim();

  const sci = clean.match(/^(-?[\d.]+)\s*\\times\s*10\^\{(-?\d+)\}$/);
  const mantissa = sci ? sci[1]! : clean.replace(/\\times|\\%|%|\\,|\s|,/g, "");
  const exponent = sci ? Number(sci[2]) : 0;

  const decimals = mantissa.includes(".") ? mantissa.split(".")[1]!.length : 0;
  const unit = Math.pow(10, -decimals + exponent);
  const tolerance = unit / 2 + Math.abs(actual) * 1e-9;

  expect(Math.abs(documented - actual), `${label}: doc ${documented} vs data ${actual}`)
    .toBeLessThanOrEqual(tolerance);
}

describe("docs/06-evaluation.md agrees with the committed experiment data", () => {
  const evaluation = readDoc("06-evaluation.md");

  it("Experiment 1 table matches experiment-1-scaling.json", () => {
    const data = readData<Dataset<ScalingPoint>>("experiment-1-scaling.json");
    const byCourses = new Map(data.deterministic.map(p => [p.courses, p]));
    const rows = tableRows(evaluation, "Fully expanded tree");

    expect(rows.length).toBe(data.deterministic.length);

    for (const row of rows) {
      const d = cellToNumber(row[0]!);
      const p = byCourses.get(d);
      expect(p, `no data point for d=${d}`).toBeDefined();
      if (!p) continue;

      expect(cellToNumber(row[1]!)).toBe(p.worstCaseNodes);
      expect(cellToNumber(row[2]!)).toBe(p.completeAssignments);
      expectAtCellPrecision(row[3]!, p.meanNodes, `d=${d} meanNodes`);
      expectAtCellPrecision(row[4]!, p.exploredFraction, `d=${d} exploredFraction`);
      expectAtCellPrecision(row[5]!, p.meanSolutions, `d=${d} meanSolutions`);
      expectAtCellPrecision(row[6]!, p.meanDensity, `d=${d} meanDensity`);
    }
  });

  it("Experiment 2 table matches experiment-2-pruning.json", () => {
    const data = readData<Dataset<PruningPoint>>("experiment-2-pruning.json");
    const byCourses = new Map(data.deterministic.map(p => [p.courses, p]));
    const rows = tableRows(evaluation, "Check reduction");

    expect(rows.length).toBe(data.deterministic.length);

    for (const row of rows) {
      const d = cellToNumber(row[0]!);
      const p = byCourses.get(d);
      expect(p, `no data point for d=${d}`).toBeDefined();
      if (!p) continue;

      expect(cellToNumber(row[1]!)).toBe(p.naiveCombinations);
      expectAtCellPrecision(row[2]!, p.meanNaiveConflictChecks, `d=${d} naive checks`);
      expectAtCellPrecision(row[3]!, p.meanDfsConflictChecks, `d=${d} dfs checks`);
      expectAtCellPrecision(row[4]!, p.checkReduction * 100, `d=${d} checkReduction`);
      expectAtCellPrecision(row[5]!, p.meanDfsNodes, `d=${d} dfs nodes`);
      expectAtCellPrecision(row[6]!, p.meanSolutions, `d=${d} solutions`);
    }
  });

  it("Experiment 3 table matches experiment-3-microbench.json word counts", () => {
    const data = readData<Dataset<MicrobenchPoint>>("experiment-3-microbench.json");
    const bySlots = new Map(data.deterministic.map(p => [p.slots, p]));
    const rows = tableRows(evaluation, "Slot-wise ns");

    expect(rows.length).toBe(data.deterministic.length);

    for (const row of rows) {
      const slots = cellToNumber(row[0]!);
      const p = bySlots.get(slots);
      expect(p, `no data point for ${slots} slots`).toBeDefined();
      // Word counts are structural. The nanosecond columns are not asserted.
      expect(cellToNumber(row[1]!)).toBe(p!.words);
    }
  });

  it("Experiment 4 table matches experiment-4-phase-transition.json", () => {
    const data = readData<PhaseDataset>("experiment-4-phase-transition.json");
    const byPool = new Map(data.deterministic.map(p => [p.placementPool, p]));
    const rows = tableRows(evaluation, "Solvable fraction");

    expect(rows.length).toBeGreaterThan(10);

    for (const row of rows) {
      const pool = cellToNumber(row[0]!);
      const p = byPool.get(pool);
      expect(p, `no data point for pool=${pool}`).toBeDefined();
      if (!p) continue;

      expectAtCellPrecision(row[1]!, p.meanDensity, `pool=${pool} density`);
      expectAtCellPrecision(row[2]!, p.meanNodes, `pool=${pool} meanNodes`);
      expectAtCellPrecision(row[3]!, p.medianNodes, `pool=${pool} medianNodes`);
      expectAtCellPrecision(row[4]!, p.solvableFraction, `pool=${pool} solvable`);
    }
  });

  it("the highlighted critical point and crossover match the data", () => {
    const data = readData<PhaseDataset>("experiment-4-phase-transition.json");

    expect(evaluation).toContain(`\\rho = ${data.criticalPoint.meanDensity.toFixed(3)}`);
    expect(evaluation).toContain(`\\rho = ${data.solvabilityCrossover.meanDensity.toFixed(3)}`);

    // The abstract's summary table quotes the same two figures.
    const abstract = readDoc("00-abstract.md");
    expect(abstract).toContain(`density $${data.criticalPoint.meanDensity.toFixed(3)}$`);
    expect(abstract).toContain(`$${data.solvabilityCrossover.meanDensity.toFixed(3)}$`);
  });

  it("the effective branching factor quoted in the docs matches the data", () => {
    const data = readData<Dataset<ScalingPoint>>("experiment-1-scaling.json");
    const first = data.deterministic[0]!;
    const last = data.deterministic[data.deterministic.length - 1]!;
    const effective = Math.pow(last.meanNodes / first.meanNodes, 1 / (last.courses - first.courses));

    expect(effective).toBeGreaterThan(2.12);
    expect(effective).toBeLessThan(2.14);
    expect(evaluation).toContain("2.13");
  });

  it("every experiment reports that the two methods agreed", () => {
    const data = readData<Dataset<PruningPoint>>("experiment-2-pruning.json");
    for (const p of data.deterministic) {
      expect(p.agree, `d=${p.courses} disagreed`).toBe(true);
    }
  });
});
