// src/bench/reduction.ts
//
// The 3-colouring reduction of docs/03-complexity.md, built as a real
// Section Selection instance.
//
// This exists so the hardness proof can be executed rather than only read. A
// graph is turned into courses and sections by exactly the construction the
// proof describes, and the result is handed to the shipped scheduler. If the
// engine finds a conflict-free selection, decoding it yields a proper colouring
// of the original graph, and if it finds none, the graph is not 3-colourable.
//
// The construction, restated:
//
//   slots     T = { t(e,k) : e in E, k in 1..3 },        |T| = 3|E|
//   courses   one per vertex v
//   sections  s(v,k) for k in 1..3, meaning "colour v with k"
//   masks     mu(s(v,k)) = { t(e,k) : e incident to v }
//
// Two selected sections share a slot exactly when their vertices are adjacent
// and were given the same colour, which is what makes the equivalence work.

import { SLOTS, DAYS } from "../core/time";
import type { DayName, Section } from "../core/types";

export type Edge = readonly [number, number];

export const COLOURS = [1, 2, 3] as const;
export type Colour = (typeof COLOURS)[number];

/** Slot boundaries, extended by one so a section in the last period has an end time. */
const SLOT_BOUNDS: string[] = [...SLOTS, "20:40"];

/** Slots available before the engine's fixed universe is exhausted. */
export const MAX_SLOTS = DAYS.length * SLOTS.length;

export function maxEdgesRepresentable(): number {
  return Math.floor(MAX_SLOTS / COLOURS.length);
}

export interface ReductionInstance {
  sections: Section[];
  /** Slot index assigned to each (edge index, colour) pair. */
  slotIndex: (edgeIndex: number, colour: Colour) => number;
  /** Human-readable slot labels, indexed by slot. */
  slotLabels: string[];
  /** Mask of each section as a slot-index set, for display. */
  maskOf: Map<string, number[]>;
  edges: Edge[];
  vertices: number;
}

export function courseCodeFor(vertex: number): string {
  return `V${vertex}`;
}

/**
 * Maps an abstract slot index onto the engine's day and period grid.
 *
 * The engine's universe is fixed at seven days of twelve periods, so a
 * reduction instance is representable only while 3|E| stays within it. That is
 * a limit of this demonstration, not of the reduction, which is stated over an
 * unbounded slot universe. See docs/03-complexity.md section 3.5.
 */
function slotToMeeting(slot: number): { day: DayName; startTime: string; endTime: string } {
  const day = DAYS[Math.floor(slot / SLOTS.length)]!;
  const period = slot % SLOTS.length;
  return {
    day,
    startTime: SLOT_BOUNDS[period]!,
    endTime: SLOT_BOUNDS[period + 1]!,
  };
}

export function buildReductionInstance(vertices: number, edges: Edge[]): ReductionInstance {
  if (edges.length * COLOURS.length > MAX_SLOTS) {
    throw new Error(
      `3|E| = ${edges.length * COLOURS.length} exceeds the engine's ${MAX_SLOTS} slot universe`
    );
  }

  const slotIndex = (edgeIndex: number, colour: Colour) =>
    edgeIndex * COLOURS.length + (colour - 1);

  const slotLabels: string[] = [];
  edges.forEach(([u, v], e) => {
    for (const k of COLOURS) slotLabels[slotIndex(e, k)] = `t(${u}${v},${k})`;
  });

  const sections: Section[] = [];
  const maskOf = new Map<string, number[]>();

  for (let v = 0; v < vertices; v++) {
    for (const k of COLOURS) {
      // Every edge incident to v contributes its colour-k slot.
      const slots: number[] = [];
      edges.forEach((edge, e) => {
        if (edge[0] === v || edge[1] === v) slots.push(slotIndex(e, k));
      });

      sections.push({
        courseCode: courseCodeFor(v),
        sectionNo: k,
        days: slots.map(slotToMeeting),
      });
      maskOf.set(`${v}:${k}`, slots);
    }
  }

  return { sections, slotIndex, slotLabels, maskOf, edges, vertices };
}

/** Decodes a conflict-free selection back into a colouring of the graph. */
export function selectionToColouring(schedule: Section[], vertices: number): Colour[] {
  const colouring = new Array<Colour>(vertices).fill(1);
  for (const s of schedule) {
    const v = Number(s.courseCode.slice(1));
    colouring[v] = s.sectionNo as Colour;
  }
  return colouring;
}

/** Edges whose endpoints share a colour, which are exactly the induced conflicts. */
export function improperEdges(edges: Edge[], colouring: Colour[]): Edge[] {
  return edges.filter(([u, v]) => colouring[u] === colouring[v]);
}

/** A few graphs worth starting from, including one that is not 3-colourable. */
export const PRESET_GRAPHS: { name: string; vertices: number; edges: Edge[]; note: string }[] = [
  {
    name: "Triangle K3",
    vertices: 3,
    edges: [[0, 1], [0, 2], [1, 2]],
    note: "3-colourable, and needs all three colours",
  },
  {
    name: "Path P4",
    vertices: 4,
    edges: [[0, 1], [1, 2], [2, 3]],
    note: "3-colourable, and two colours suffice",
  },
  {
    name: "Cycle C5",
    vertices: 5,
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
    note: "Odd cycle, so it needs three colours",
  },
  {
    name: "Complete K4",
    vertices: 4,
    edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
    note: "Not 3-colourable, so the instance is unsatisfiable",
  },
];
