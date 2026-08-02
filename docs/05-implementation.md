# 5. Implementation

This section describes how the algorithm of [Section 4](./04-algorithm.md) is
realised, at the level of design rationale rather than line by line. It then
states the equivalence of the two implementations as a theorem backed by an
executable test.

## 5.1 Two implementations of one algorithm

The repository contains two independent realisations.

| Implementation | File | Form |
|---|---|---|
| Production engine | [`app/src/core/scheduler.ts`](../app/src/core/scheduler.ts) | Ordinary recursive function, runs to completion in one call |
| Simulation engine | [`app/src/core/SimulationEngine.ts`](../app/src/core/SimulationEngine.ts) | Generator, suspends after each step |

The duplication is deliberate and is worth justifying, because duplicated logic
is normally a defect.

The production engine must run to completion as fast as possible. The
visualizer must be able to stop between any two steps of the search, render the
intermediate state, and resume where it left off, under the control of a user
who may pause, step backwards, or change speed. These are incompatible demands
on a single function. Instrumenting the production engine with callbacks would
impose the observation cost on every production run and would still not allow
suspension, since a callback cannot pause its caller.

The chosen resolution is a generator. The simulation engine is written as a
`function*` in which each meaningful transition is a `yield` of a
`SimulationState` snapshot rather than a silent mutation.

```ts
// Production engine, opaque
if (i === groupedMasked.length) {
  results.push(chosen.slice());
  return;
}

// Simulation engine, transparent
if (i === groupedMasked.length) {
  foundSchedules.push([...chosen]);
  yield { step: "SUCCESS", currentMask: w, chosenSections: [...chosen], /* ... */ };
  return;
}
```

The generator suspends at each `yield`. The store in
[`app/src/store/useSimulationStore.ts`](../app/src/store/useSimulationStore.ts)
calls `generator.next()` on each playback tick and receives one snapshot. The
interface re-renders from that snapshot and never touches the engine's internal
state, so the search cannot be perturbed by the act of observing it.

The cost of the approach is that the two engines can drift apart. That risk is
what Section 5.4 addresses.

### Yields and the state-space tree

The store constructs the visible tree from the yield stream alone. Node status
is a direct function of the step type. A `SELECTING` or `BITMASK_CHECK` yield
marks a node as under evaluation, a `CONFLICT` yield marks it failed, a
`BACKTRACKING` yield marks it pruned unless it already failed, and a `SUCCESS`
yield marks the whole active path succeeded.

The consequence for anyone modifying the engine is that adding, removing or
moving a `yield` changes the rendered tree, not merely the pacing of the
animation. It also changes the counters described in Section 5.4, which is why
the parity test asserts on them.

## 5.2 Allocation behaviour

The earlier documentation for this repository stated that the traversal performs
zero allocation. That is false as stated, and the correct statement is narrower.

**The conflict test allocates nothing.** The function `fits` reads the running
week mask and the candidate section's precomputed day masks and performs integer
conjunctions. No object is created, and no slot list is walked.

**The traversal allocates at every placement.** Two allocations occur per
accepted candidate.

```ts
function place(weekMask: WeekMask, option): WeekMask {
  const next = { ...weekMask };                       // one object per placement
  for (const { day, mask } of option.masks) next[day] |= mask;
  return next;
}

dfs(i + 1, nextMask, [...chosen, opt.section]);       // one array per placement
```

The week mask copy is a fresh seven-field object, and the assignment copy is a
fresh array of length $i$. Along a root-to-leaf path this is
$O(d \cdot |D| + d^{2})$ live memory, as derived in
[Section 4.5](./04-algorithm.md#45-complexity-of-the-search).

The honest claim is therefore that **conflict detection** is allocation-free
while the traversal is not. The persistent style was presumably chosen because
it makes backtracking implicit, since an abandoned branch simply drops its
copies rather than having to undo mutations. A mutate-and-undo implementation
would remove the allocation at the cost of explicit restoration, and would
reduce the live memory to $O(d + |D|)$. That change is not made here, and the
current behaviour is recorded as it is rather than as previously described.

## 5.3 Precomputation and ordering

Both engines perform the same preparation before searching.

1. **Normalisation.** Input sections are accepted in either of two field-naming
   conventions and are reduced to a canonical shape. Sections with no usable
   meeting days are discarded.
2. **Mask construction.** Each meeting is converted from a pair of wall-clock
   strings into a period mask once, before the search begins. No string is
   parsed inside the traversal.
3. **Grouping.** Sections are grouped by course code, which defines the depth
   levels of the tree.
4. **Ordering.** Courses are sorted by ascending section count and sections by
   ascending population count of their masks, as described in
   [Section 4.1](./04-algorithm.md#41-the-algorithm).

Step 4 is where the two engines are most fragile with respect to each other. The
orderings do not affect which selections are found, but they do affect the order
in which the tree is traversed and therefore every counter that the parity test
compares.

A structural hazard is worth recording. The two engines do not share their
helper functions. Each defines its own `normalizeSections`, `rangeToMask`,
`popcount`, `buildSectionMasks`, `fits` and `place`, and
`scheduler.ts` hardcodes its own copy of the period list rather than importing
`SLOTS` from [`app/src/core/time.ts`](../app/src/core/time.ts). Editing a helper
in one file has no effect on the other. The duplication is what makes the test
of Section 5.4 necessary rather than merely reassuring.

## 5.4 The parity theorem

> **Theorem 6 (engine parity).** For every input in the tested set, the
> production engine and the simulation engine produce identical schedule
> sequences, and perform identical amounts of work as measured by nodes
> visited, branches pruned, depth reached and conflict checks executed.

This is not proved analytically here, and the two implementations are not shown
equivalent by any argument over their source. The statement is established
empirically over a fixed set of inputs by
[`app/src/__tests__/EngineParity.test.ts`](../app/src/__tests__/EngineParity.test.ts),
which runs on every invocation of `npm run test`.

The test covers four scenarios drawn from the bundled course data.

| Scenario | Courses |
|---|---|
| Software Engineering year 2 | MATH 2261, SE 2226, SE 2228, SE 2230, SE 2232 |
| Psychology year 1 | MATH 1114, PHIL 1100, PSYC 1020, PSYC 1102, SOFL 1102 |
| Industrial Engineering year 1 | CHEM 1130, ENGR 1116, MATH 1132, SOFL 1102 |
| Cross-semester edge case | MATH 1131, SE 2226, SE 3332, SE 4458 |

For each scenario the test asserts the following.

1. The two engines return the same number of schedules, and the same schedules
   in the same order, compared by deep equality.
2. The number of `SELECTING` yields equals the production engine's node counter,
   and the number of `CONFLICT` yields equals its prune counter. This ties the
   observable yield stream to the internal accounting.
3. The simulation engine's own counters agree with its yield stream, which
   detects a `yield` that has been added, removed or moved away from the counter
   it accompanies.
4. The conflict check counts and the depths reached agree across engines.

Assertion 4 is the strongest of the four. Two implementations can return
identical answers while exploring the tree differently, for instance by ordering
sections differently, and assertions 1 to 3 would not notice. Requiring the
conflict check counts to match means the engines must perform the same work in
the same order, not merely reach the same conclusion.

The scope of Theorem 6 is exactly the four scenarios and no more. It is a
regression barrier, not a proof of equivalence for all inputs. Establishing the
latter would require either a shared implementation or a proof over the source
of both, and neither is attempted here. This limitation is restated in
[Section 8](./08-limitations.md).

> Run this live. The **parity runner** on the application's Docs page executes
> both engines on the same input in the browser and reports the comparison.

## 5.5 Metrics and export

Both engines report a common set of counters.

| Counter | Meaning |
|---|---|
| `nodes` | Sections considered, one per node of the tree below the root |
| `pruned` | Candidates rejected by the conflict test |
| `depthReached` | Deepest level entered |
| `conflictChecks` | Individual day-mask conjunctions evaluated |
| `solutionCount` | Conflict-free selections reported |
| `timeMs` | Wall-clock duration |

In the production engine these are gathered only when statistics are requested,
so that the ordinary path pays nothing for them. In the simulation engine they
are gathered unconditionally, since that engine is already an order of magnitude
slower by construction and the additional counters are immaterial against the
cost of suspending a generator.

The simulation engine attaches a snapshot of its counters to **every** yielded
state rather than only to the final one. This allows the visualizer to export
metrics from a partially completed run, and it was implemented by adding a field
to existing yields rather than by adding a yield, precisely so that assertion 3
of Theorem 6 continues to hold.

The Visualizer page exposes these counters as a JSON download, which is the
machine-readable output that the experiments in
[Section 6](./06-evaluation.md) consume in bulk form.

## 5.6 Application structure

The application is a React and Vite single-page app with no router library.
A small store holds the current page and the top-level component renders one of
four pages. The relevant modules for this document are the following.

| Path | Role |
|---|---|
| [`app/src/core/`](../app/src/core) | Both engines, the time and mask definitions, and the shared types |
| [`app/src/bench/`](../app/src/bench) | Instance generation, the naive baseline, and the four experiments |
| [`app/scripts/`](../app/scripts) | The figure generator that writes `docs/data` and `docs/figures` |
| [`app/src/store/`](../app/src/store) | Playback control and construction of the state-space tree |

The experiments in [Section 6](./06-evaluation.md) import from
[`app/src/bench/`](../app/src/bench), and so do the interactive figures on the
Docs page. A published figure and its live counterpart therefore execute the
same code, which is what prevents a figure from disagreeing with the claim it
supports.
