import { describe, it, expect } from "vitest";
import { generateSchedules } from "../core/scheduler";
import {
  buildReductionInstance,
  selectionToColouring,
  improperEdges,
  PRESET_GRAPHS,
  COLOURS,
  type Edge,
} from "../bench/reduction";
import { UNBOUNDED, EXHAUSTIVE_MAX_RESULTS } from "../bench/experiments";

// Executes the reduction proved in docs/03-complexity.md.
//
// Lemma 2 says a proper colouring yields a conflict-free selection, and Lemma 3
// says a conflict-free selection yields a proper colouring. Both directions are
// checked here against the shipped engine, on graphs whose 3-colourability is
// known independently. A reduction that were stated but wrong would show up as
// a satisfiable K4 or as a decoded colouring with a monochromatic edge.

function isThreeColourableByBruteForce(vertices: number, edges: Edge[]): boolean {
  const colouring = new Array<number>(vertices).fill(1);
  const total = Math.pow(3, vertices);
  for (let n = 0; n < total; n++) {
    let x = n;
    for (let v = 0; v < vertices; v++) {
      colouring[v] = (x % 3) + 1;
      x = Math.floor(x / 3);
    }
    if (edges.every(([u, v]) => colouring[u] !== colouring[v])) return true;
  }
  return false;
}

describe("the 3-colouring reduction", () => {
  for (const graph of PRESET_GRAPHS) {
    it(`${graph.name} reduces correctly (${graph.note})`, () => {
      const instance = buildReductionInstance(graph.vertices, graph.edges);
      const expected = isThreeColourableByBruteForce(graph.vertices, graph.edges);

      const { results } = generateSchedules(instance.sections, EXHAUSTIVE_MAX_RESULTS, UNBOUNDED);

      // Lemma 2 and Lemma 3 combined: satisfiable exactly when 3-colourable.
      expect(results.length > 0, `${graph.name} satisfiability`).toBe(expected);

      // Lemma 3 in detail: every returned selection decodes to a proper colouring.
      for (const schedule of results) {
        expect(schedule.length).toBe(graph.vertices);
        const colouring = selectionToColouring(schedule, graph.vertices);
        expect(improperEdges(graph.edges, colouring)).toEqual([]);
      }
    });
  }

  it("K4 is unsatisfiable, so the engine exhausts all 3^4 selections", () => {
    const k4 = PRESET_GRAPHS.find(g => g.name === "Complete K4")!;
    const instance = buildReductionInstance(k4.vertices, k4.edges);
    const { results, stats } = generateSchedules(instance.sections, EXHAUSTIVE_MAX_RESULTS, UNBOUNDED);

    expect(results).toEqual([]);
    expect(stats.pruned).toBeGreaterThan(0);
  });

  it("builds the instance sizes the construction predicts", () => {
    for (const graph of PRESET_GRAPHS) {
      const instance = buildReductionInstance(graph.vertices, graph.edges);

      // One course per vertex, three sections each.
      expect(instance.sections.length).toBe(graph.vertices * COLOURS.length);

      // |T| = 3|E| distinct slots.
      expect(instance.slotLabels.length).toBe(graph.edges.length * COLOURS.length);

      // Total mask size is 6|E|, by the handshake identity used in Lemma 1.
      const totalMask = [...instance.maskOf.values()].reduce((a, m) => a + m.length, 0);
      expect(totalMask).toBe(6 * graph.edges.length);
    }
  });

  it("matches the worked example in docs/03-complexity.md", () => {
    // Triangle on {1,2,3} with edges ordered e12, e13, e23, as in section 3.3.
    const instance = buildReductionInstance(3, [[0, 1], [0, 2], [1, 2]]);

    // beta values quoted in the document, recomputed from the built masks.
    const beta = (key: string) =>
      instance.maskOf.get(key)!.reduce((acc, slot) => acc | (1 << slot), 0);

    expect(beta("0:1")).toBe(9);
    expect(beta("0:2")).toBe(18);
    expect(beta("0:3")).toBe(36);
    expect(beta("1:1")).toBe(65);
    expect(beta("1:2")).toBe(130);
    expect(beta("1:3")).toBe(260);
    expect(beta("2:1")).toBe(72);
    expect(beta("2:2")).toBe(144);
    expect(beta("2:3")).toBe(288);

    // The proper colouring 1,2,3 is conflict-free.
    expect(beta("0:1") & beta("1:2")).toBe(0);
    expect(beta("0:1") & beta("2:3")).toBe(0);
    expect(beta("1:2") & beta("2:3")).toBe(0);

    // The improper colouring 1,1,2 collides on slot 0, which is t(12,1).
    expect(beta("0:1") & beta("1:1")).toBe(1);
  });
});
