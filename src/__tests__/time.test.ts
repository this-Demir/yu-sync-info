import { describe, it, expect } from "vitest";
import { parseHHMM, sectionMaskForRange } from "../core/time";

describe("Time & Bitmask Math", () => {
    describe("parseHHMM", () => {
        it("should correctly convert HH:MM to minutes", () => {
            expect(parseHHMM("08:40")).toBe(8 * 60 + 40); // 520
            expect(parseHHMM("10:40")).toBe(10 * 60 + 40); // 640
            expect(parseHHMM("00:00")).toBe(0);
            expect(parseHHMM("23:59")).toBe(23 * 60 + 59); // 1439
        });

        it("should return 0 for empty or invalid strings", () => {
            expect(parseHHMM("")).toBe(0);
        });
    });

    describe("Bitwise Overlap Logic", () => {
        it("should generate correct bitmasks for time ranges", () => {
            // SLOTS starts with 08:40 (index 0), 09:40 (index 1)...
            // 08:40 - 09:40 -> 1 slot -> mask 1 (1 << 0)
            const mask1 = sectionMaskForRange("08:40", "09:40");
            expect(mask1).toBe(1);

            // 08:40 - 10:40 -> 2 slots -> 08:40, 09:40 -> mask 3 (1 | 2)
            const mask2 = sectionMaskForRange("08:40", "10:40");
            expect(mask2).toBe(3);

            // 09:40 - 10:40 -> 1 slot -> 09:40 -> mask 2 (1 << 1)
            const mask3 = sectionMaskForRange("09:40", "10:40");
            expect(mask3).toBe(2);
        });

        it("should detect bitwise collisions", () => {
            const mask1 = sectionMaskForRange("08:40", "10:40"); // 3 (1 | 2)
            const mask2 = sectionMaskForRange("09:40", "11:40"); // 6 (2 | 4)
            const mask3 = sectionMaskForRange("10:40", "12:40"); // 12 (4 | 8)

            // mask1 and mask2 overlap at 09:40 (bit 2)
            expect((mask1 & mask2) > 0).toBe(true);

            // mask1 and mask3 do not overlap
            expect((mask1 & mask3) > 0).toBe(false);

            // mask2 and mask3 overlap at 10:40 (bit 4)
            expect((mask2 & mask3) > 0).toBe(true);
        });
    });
});
