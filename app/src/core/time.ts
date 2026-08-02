// src/core/time.ts
import type { DayName } from "./types";

export const DAYS: DayName[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
  "Saturday", "Sunday"
] as const;

export const SLOTS = [
  "08:40","09:40","10:40","11:40","12:40","13:40",
  "14:40","15:40","16:40","17:40","18:40","19:40"
] as const;

export type SlotStart = typeof SLOTS[number];


export function parseHHMM(t: string): number {
  if (!t) return 0; 
  const parts = t.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

export function slotIndex(t: string): number {
  return SLOTS.indexOf(t as SlotStart);
}


export function sectionMaskForRange(startTime: string, endTime: string): number {
  const startMin = parseHHMM(startTime);
  const endMin   = parseHHMM(endTime);
  let mask = 0;

  for (let i = 0; i < SLOTS.length; i++) {
    const slotStart = parseHHMM(SLOTS[i] as SlotStart);
    if (slotStart >= startMin && slotStart < endMin) {
      mask |= (1 << i);
    }
  }
  return mask; // 12-bit
}

export function emptyWeekMask() {
  return {
    Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0,
    Saturday: 0, Sunday: 0,
  } as Record<DayName, number>;
}

/**
 * Per-day masks for one section's meetings.
 *
 * Used by the visualizer to annotate each node of the state-space tree with
 * the mask being tested there, so that conditions 2 and 3 of the loop invariant
 * in docs/04-algorithm.md can be checked against what is on screen.
 *
 * The engines do not call this. They build their masks internally during
 * preprocessing, and this recomputes the same values for display without
 * reaching into either engine's private state.
 */
export function weekMaskForDays(
  days: { day: string; startTime: string; endTime: string }[]
): Record<DayName, number> {
  const mask = emptyWeekMask();
  for (const d of days) {
    const day = d.day as DayName;
    if (day in mask) mask[day] |= sectionMaskForRange(d.startTime, d.endTime);
  }
  return mask;
}

/** Compact rendering of a week mask, listing only the days that are occupied. */
export function formatWeekMask(mask: Record<DayName, number>): string {
  const parts = DAYS
    .filter(d => (mask[d] ?? 0) !== 0)
    .map(d => `${d.slice(0, 2)} ${mask[d]}`);
  return parts.length === 0 ? "empty" : parts.join("  ");
}
