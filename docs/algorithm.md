# The Scheduling Algorithm

## Core Idea

The scheduler solves a **Constraint Satisfaction Problem**: assign one section per course such that no two selected sections overlap in time. The approach combines two techniques:

1. **Bitmask collision detection** — O(1) time conflict check using a single CPU instruction
2. **DFS backtracking** — depth-first traversal of all section combinations, cutting dead branches immediately

---

## Bitmask Representation

The academic week is encoded as **7 integers**, one per day. Each integer is a 12-bit vector where bit `i` represents the `i`-th time slot (starting at 08:40, one slot per hour):

| Bit | Slot start |
|-----|------------|
| 0   | 08:40      |
| 1   | 09:40      |
| 2   | 10:40      |
| ...  | ...        |
| 11  | 19:40      |

When a section is placed, its slots are OR'd into the current day mask. When a new section is tested, its mask is AND'd against the relevant day:

```
Collision  ⟺  (M ∧ T) ≠ 0
```

If the result is non-zero, at least one bit is shared — the two sections overlap. No allocation, no iteration over slots — one hardware instruction.

**Example:**

```
M = 0000 0011 0000   (10:40–12:30 occupied)
T = 0000 0110 0000   (11:40–13:30 requested)
─────────────────
M ∧ T = 0000 0010 0000  → 32 > 0 → CONFLICT
```

---

## DFS Backtracking

The engine traverses a state-space tree where each level corresponds to one course and each node corresponds to one section of that course:

```
Root
├── CHEM 1130 Sec 1
│   ├── ENGR 1116 Sec 1  → CONFLICT, pruned
│   └── ENGR 1116 Sec 2
│       ├── MATH 1132 Sec 1  → valid schedule found
│       └── MATH 1132 Sec 2  → CONFLICT, pruned
└── CHEM 1130 Sec 2
    └── ...
```

Pruning a node at depth `k` eliminates the entire subtree below it — up to `b^(d-k)` paths in one check, where `b` is average sections per course and `d` is total courses.

---

## Complexity

| Metric | Value |
|--------|-------|
| Worst case (no pruning) | O(b^d) nodes visited |
| Per-node cost | O(1) — one AND per day |
| Stack space | O(d) — one frame per course |
| Memory allocation | Zero during traversal |

Typical pruning reduces visited nodes by 80–95% relative to the worst case.

| Courses (d) | Sections (b) | Worst case | Typical with pruning |
|-------------|-------------|------------|----------------------|
| 2 | 3 | 9 | ~4–6 |
| 4 | 3 | 81 | ~20–35 |
| 4 | 5 | 625 | ~60–120 |
| 6 | 4 | 4 096 | ~200–500 |
| 8 | 4 | 65 536 | ~1 000–5 000 |

---

## Data Format

The engine consumes flat `Section[]` arrays. The `courseCode` field groups sections into courses for DFS depth assignment:

```typescript
interface Section {
  courseCode: string;   // e.g. "CHEM 1130" — groups sections into one DFS level
  sectionNo:  number;
  days: {
    day:       "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    startTime: string;  // "HH:MM"
    endTime:   string;  // "HH:MM"
    classroom?: string;
  }[];
  isRetake?: boolean;
}
```

> For a deeper walkthrough with live examples and interactive diagrams, open the **Docs** page inside the running app.
