<div align="center">
  <img src="./app/public/yu-sync-media/blue-logo-bg-removed.png" alt="YU-Sync Logo" width="80" />
  <h1>YU-Sync · Algorithm Visualizer</h1>
  <p>Interactive step-by-step visualization of the DFS + bitmask engine that powers conflict-free university scheduling.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
  [![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev)

  **[yu-sync.com](https://yu-sync.com)** — the production scheduler this engine runs in
</div>

---

![YU-Sync Visualizer Preview](./app/public/og-image.jpg)

## What is this?

This is the open-source companion to **YU-Sync** — a university course scheduler. The visualizer exposes the algorithm internals so you can watch it think: every DFS branch explored, every bitmask conflict detected, every backtrack taken.

## Try it: run the sandbox locally

```bash
git clone https://github.com/this-demir/yu-sync-info
cd yu-sync-info/app
npm install
npm run dev       # opens at http://localhost:5173
```

Once running, head to the **Visualizer** page. Load a preset scenario or configure your own courses, then hit play — or step through the DFS one move at a time. The state-space tree grows live as the engine explores and prunes branches.

For the full documentation — algorithm walkthrough, complexity analysis, bitmask math, generator pattern explanation, and an interactive parity benchmark you can run directly in the browser — open the **Docs** page inside the app.

## Features

| Feature | Description |
|---|---|
| **Step-by-step simulation** | Play, pause, step forward/back through the DFS with variable speed |
| **Bitmask conflict detection** | See the bitwise `AND` operations live on the timetable grid |
| **State-space tree** | Watch the decision tree grow — successful paths and pruned branches |
| **Parity benchmarking** | Run the production engine vs. visualizer engine side-by-side to verify 100% deterministic equality |
| **Test scenarios** | Pre-configured edge cases: cross-semester collisions, heavy lab blocks |
| **Interactive whitepaper** | Academic-grade documentation with Boolean algebra and DFS proofs, built into the app |

## Algorithm

The scheduler combines **bitmask conflict detection** with **DFS backtracking**:

```
For each course, iterate candidate sections:
  mask = scheduledDays[day] & section.timeMask
  if mask === 0 → no conflict → recurse deeper
  else         → conflict detected → prune the subtree, backtrack
```

Each day's schedule is a single integer. An `AND` with a section's bitmask detects any overlap without iterating over time slots.

## The paper

[`docs/`](./docs) contains a self-contained academic write-up of the problem and the engine, complete on its own without running the app.

- The problem is defined formally and **proved NP-complete** by reduction from graph 3-colouring — [`docs/03-complexity.md`](./docs/03-complexity.md)
- The engine is **proved sound and complete** via a loop invariant — [`docs/04-algorithm.md`](./docs/04-algorithm.md)
- Four **reproducible experiments** with committed data and figures, including a constraint-density phase transition — [`docs/06-evaluation.md`](./docs/06-evaluation.md)
- What the work does *not* establish — [`docs/08-limitations.md`](./docs/08-limitations.md)

Start at [`docs/README.md`](./docs/README.md). Regenerate every number and figure with `cd app && npm run bench`.

Three claims made by earlier versions of these docs did not survive that scrutiny. The conflict check is constant-time only for a fixed slot universe ([`docs/04-algorithm.md`](./docs/04-algorithm.md)), the traversal is not allocation-free ([`docs/05-implementation.md`](./docs/05-implementation.md)), and the pruning benefit is a function of size and density rather than a constant ([`docs/06-evaluation.md`](./docs/06-evaluation.md)).


## Repo layout

```
yu-sync-info/
├── app/                  # the full React + Vite frontend
│   ├── src/
│   │   ├── core/         # SimulationEngine.ts · scheduler.ts · time.ts · types.ts
│   │   ├── bench/        # instance generation · the four experiments
│   │   ├── store/        # useSimulationStore · useRouteStore
│   │   ├── pages/        # Landing · Visualizer · Docs · Media
│   │   └── components/
│   ├── scripts/          # figure generator writing docs/data + docs/figures
│   ├── public/
│   ├── index.html
│   └── package.json
└── docs/                 # the numbered paper, plus data/ and figures/
    ├── 00-abstract.md … 09-references.md
    ├── data/             # raw experiment output (JSON)
    └── figures/          # generated SVG figures
```

```bash
# from app/
npm run test      # Vitest watch mode
npm run coverage  # V8 coverage report
npm run bench     # rerun all experiments, regenerate docs/data + docs/figures
npm run build     # type-check + production build
```

**Key invariant:** `scheduler.ts` and `SimulationEngine.ts` must always produce identical schedules. `EngineParity.test.ts` enforces this automatically.

## License

[MIT](./LICENSE) © [this-Demir](https://github.com/this-demir)
