<div align="center">
  <img src="./app/public/yu-sync-media/blue-logo-bg-removed.png" alt="YU-Sync Logo" width="80" />
  <h1>YU-Sync · How it works</h1>
  <p>Docs and an interactive simulator for the DFS + bitmask engine that powers conflict-free university scheduling.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
  [![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev)

  **[info.yu-sync.com](https://info.yu-sync.com)** · see this repo on the web

  **[yu-sync.com](https://yu-sync.com)** · the production site

  <img src="./app/public/og-image.jpg" alt="YU-Sync Visualizer Preview" width="880" />
</div>

## What is this?

**[yu-sync.com](https://yu-sync.com)** is a live university course scheduler. This repo explains how it works. The docs state the problem formally and prove what the engine does, and the simulator shows it thinking: every DFS branch explored, every bitmask conflict detected, every backtrack taken.

Everything here is readable on **[info.yu-sync.com](https://info.yu-sync.com)**, where the figures are interactive and the simulator is one click away in the nav.

## The algorithm

```
For each course, iterate candidate sections:
  mask = scheduledDays[day] & section.timeMask
  if mask === 0 → no conflict → recurse deeper
  else         → conflict detected → prune the subtree, backtrack
```

Each day's schedule is a single integer. An `AND` with a section's bitmask detects any overlap without iterating over time slots, and the search backtracks the moment a section does not fit.

## The docs

[`docs/`](./docs) is a numbered write-up, complete on its own without running anything. Start at [`docs/README.md`](./docs/README.md).

- [`03-complexity.md`](./docs/03-complexity.md), the problem defined formally and **proved NP-complete** by reduction from graph 3-colouring
- [`04-algorithm.md`](./docs/04-algorithm.md), the engine **proved sound and complete** via a loop invariant
- [`06-evaluation.md`](./docs/06-evaluation.md), four seeded experiments with committed data and figures, including a constraint-density phase transition
- [`08-limitations.md`](./docs/08-limitations.md), what the work does *not* establish

Three claims made by earlier versions of these docs did not survive that scrutiny and are corrected in place. The conflict check is constant-time only for a fixed slot universe, the traversal is not allocation-free, and the pruning benefit is a function of size and density rather than a constant.

## License

[MIT](./LICENSE) © [this-Demir](https://github.com/this-demir)
