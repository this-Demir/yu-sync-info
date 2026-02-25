# YU-Sync Info & Algorithm Visualizer

An interactive educational platform designed to visualize the scheduling engine behind **YU-Sync**. This project demonstrates how bitmasking and backtracking algorithms work together to generate conflict-free university schedules.

## Live Application

Looking for the actual schedule creator? Visit the official platform:
**[yu-sync.com](https://yu-sync.com)**

## Key Features

* **Algorithm Simulation:** Watch the backtracking process step-by-step with play, pause, and speed controls.
* **Bitmask Overlay:** See real-time bitwise AND operations directly on the timetable grid to understand conflict detection.
* **State-Space Tree:** Visualize the decision tree, including successful paths and pruned branches (dead ends).
* **Core Parity:** Uses the same bitmasking logic and course data as the production environment.

## Technical Stack

* **Framework:** React + Vite
* **Language:** TypeScript
* **State Management:** Zustand (Observer Pattern)
* **Styling:** Tailwind CSS v3
* **Testing:** Vitest

## Documentation

For a deep dive into the architecture, bitmasking math, and design patterns used in this project, please refer to the `/docs` directory.

---

Developed for the YU-Sync community.