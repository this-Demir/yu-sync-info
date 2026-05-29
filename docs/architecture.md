# Architecture

## Two Engines, One Algorithm

The project deliberately maintains two implementations of the same DFS + bitmask algorithm:

| Engine | File | Purpose |
|--------|------|---------|
| Recursive | `app/src/core/scheduler.ts` | Synchronous, runs in a Web Worker. Locks the JS thread for ~2ms. Opaque — no external visibility into steps. |
| Iterative | `app/src/core/SimulationEngine.ts` | Generator-based (`function*`). Yields one state snapshot per algorithm step. Drives the step-by-step visualizer. |

Both must always produce identical schedules. `app/src/__tests__/EngineParity.test.ts` verifies this on every run.

---

## The Generator Pattern

The production engine is a standard recursive function — it runs to completion in one synchronous call. Visualizing it frame-by-frame requires pausing execution mid-traversal without modifying the algorithm.

The solution: replace the recursive function with a `function*` generator. Every meaningful state transition becomes a `yield` instead of a silent mutation:

```typescript
// Production engine (opaque)
if (targetDepthReached) {
  validSchedules.push([...chosen]);
  return;
}

// Simulation engine (transparent)
if (targetDepthReached) {
  validSchedules.push([...chosen]);
  yield { step: "SUCCESS", foundSchedules: validSchedules };
  return;
}
```

The generator suspends at each `yield`. The Zustand store calls `generator.next()` on each playback tick, receiving one `SimulationState` snapshot. The UI re-renders from that snapshot without ever touching the engine's internal state.

---

## State Management

`useSimulationStore` (Zustand) owns the generator instance and all playback logic:

- **`step()`** — calls `generator.next()`, applies the yielded state to the store, and updates the tree
- **`play()`** / **`pause()`** — starts/stops a `setInterval` that calls `step()` on each tick
- **`instantCompute()`** — drains the generator in a loop, building the full tree at once
- **`reset()`** — creates a fresh generator instance and clears all state

The state-space tree is built incrementally as the generator yields. Each node is inserted into the tree in-place; the store deep-clones the tree before each update to trigger React re-renders.

---

## Parity Invariant

The production and simulation engines must produce identical results for any input. This is verified by a dedicated test that runs both engines against the same fixture data and asserts schedule equality:

```typescript
// EngineParity.test.ts
const prodResult = generateSchedules(sections, limit);
const simResult  = drainGenerator(simulateScheduling(sections, limit));
expect(simResult.schedules).toEqual(prodResult.results);
```

Any change to one engine's algorithm must be reflected in the other. The test is the enforcement gate.

---

## Routing

Navigation is client-side only with no router library. `useRouteStore` (Zustand) holds a `currentPage` string. `App.tsx` conditionally renders one of four pages:

- `Landing` — project overview
- `Visualizer` — the interactive simulation sandbox
- `Docs` — full in-app documentation
- `Media` — assets and branding
