// src/core/filtering.ts
import type { DaySlot, Section, FilterOptions } from "./types";
import { SLOTS, sectionMaskForRange } from "./time";

function allOnMask(): number {
  return (1 << SLOTS.length) - 1;
}

function allowedMaskForDay(day: string, filters?: FilterOptions): number {
  if (!filters || !filters.allowedTimeSlots) return allOnMask();
  const map = filters.allowedTimeSlots as Record<string, string[]>;
  if (Object.keys(map).length === 0) return allOnMask();

  const allowedStarts = map[day];
  if (allowedStarts === undefined) return allOnMask(); 
  if (allowedStarts.length === 0) return 0;            

  let mask = 0;
  for (const [idx, slotStart] of (SLOTS as readonly string[]).entries()) {
    if (allowedStarts.includes(slotStart)) {
      mask |= (1 << idx);
    }
  }
  return mask;
}

export function isDaySlotAllowed(slot: DaySlot, filters?: FilterOptions): boolean {
  const allowedMask = allowedMaskForDay(slot.day, filters);
  const slotMask = sectionMaskForRange(slot.startTime, slot.endTime);
  return (slotMask & ~allowedMask) === 0;
}

export function isSectionAllowed(section: Section, filters?: FilterOptions): boolean {
  return section.days.every((slot) => isDaySlotAllowed(slot, filters));
}

export function filterSections(sections: Section[], filters?: FilterOptions): Section[] {
  if (!filters || !filters.allowedTimeSlots) return sections.slice();
  if (Object.keys(filters.allowedTimeSlots).length === 0) return sections.slice();
  return sections.filter((section) => isSectionAllowed(section, filters));
}
