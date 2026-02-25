# YU-Sync Info & Algorithm Visualizer

An interactive educational platform designed to visualize the scheduling engine behind **YU-Sync**. This project demonstrates how zero-allocation bitmasking and Depth-First Search (DFS) backtracking algorithms work together to generate conflict-free university schedules in real-time.

## Live Application

Looking for the actual schedule creator? Visit the official platform:
**[yu-sync.com](https://yu-sync.com)**

## Key Features

* **Algorithm Simulation:** Watch the DFS backtracking process step-by-step with play, pause, and speed controls.
* **Zero-Allocation Bitmasking:** See real-time bitwise `AND` operations directly on the timetable grid to understand hardware-level conflict detection.
* **State-Space Tree:** Visualize the decision tree, including successful paths and aggressively pruned branches.
* **Interactive Whitepaper:** A fully integrated, academic-grade documentation page detailing the mathematics, state-space traversal, and architectural patterns.
* **Live Parity Benchmarking:** Run real-time execution benchmarks in the browser to prove 100% deterministic equality between the synchronous production engine and the asynchronous visualizer.
* **Test Scenarios:** Instantly load pre-configured edge cases (cross-semester collisions, heavy lab blocks) to watch the engine handle complex constraints.

## Technical Stack

* **Framework:** React + Vite
* **Language:** TypeScript
* **State Management:** Zustand (Observer Pattern)
* **Architecture:** Generator Pattern (`function*`) for state freezing and stepping.
* **Styling:** Tailwind CSS v3
* **Testing:** Vitest (Featuring mathematical core parity verification and scoped coverage).

## Documentation & Architecture

The project features a minimalist, SaaS-inspired "Developer Lab" aesthetic. 

For a deep dive into the architecture, Boolean algebra, and design patterns used in this project, please explore the interactive **Docs** route within the application. 

*(Note: The core Algorithm Simulator and Architecture Docs are fully functional and populated. The supplementary Media Kit and Landing Page serve as structural placeholders for future branding).*

---

**Developed for the YU-Sync community.**