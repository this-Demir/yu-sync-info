# Antigravity Development Roadmap: YU-Sync Info

## Phase 1: Project Scaffolding & Core Verification
- Verify the Vite + React + TypeScript + Tailwind v3 setup.
- Verify `src/core/` contains `time.ts`, `scheduler.ts` (original), and `types.ts`.
- Verify `src/data/` contains the mock course data (e.g., `yu_sync_courses_2025_fall.json`).
- Install and configure `vitest` for unit testing.

## Phase 2: The Simulation Engine (Generator Pattern)
- Create `src/core/SimulationEngine.ts`.
- Refactor the original recursive `scheduler.ts` algorithm into a **Generator Function (`function*`)**.
- The generator must `yield` detailed state objects at every logical step:
  - `INIT`: Loading data.
  - `SELECTING`: Choosing a course/section to test.
  - `BITMASK_CHECK`: Comparing the course timeslot against the current schedule mask.
  - `CONFLICT`: Intersection detected (bitwise AND `&` > 0).
  - `BACKTRACKING`: Removing a course and trying an alternative branch.
  - `SUCCESS`: Valid schedule found.

## Phase 3: Unit Testing (Headless Verification)
- Create `src/__tests__/SimulationEngine.test.ts`.
- Write unit tests using `vitest` to run the generator function headlessly.
- Feed the mock data from `src/data/` into the engine.
- Assert that the generator correctly yields conflicts, backtracks, and eventually finds a valid schedule (or fails gracefully) without any UI dependency.

## Phase 4: State Management (Zustand)
- Create `src/store/useSimulationStore.ts` using Zustand.
- Implement actions to control the Simulation Engine: `play()`, `pause()`, `stepForward()`, `stepBackward()`, `reset()`, and `setSpeed()`.
- Ensure the store strictly holds the current yielded state from the engine to trigger UI re-renders.

## Phase 5: Building the Visualizer Panels (UI)
- **Control Deck:** Playback controls and speed slider.
- **Bitmask Terminal:** Real-time visualizer for binary operations (`&`) and collisions.
- **Decision Tree:** A graph visualizing the backtracking paths and pruned branches.
- **Live Timetable:** A weekly grid rendering the current state of the schedule.

## Phase 6: Assembly & Documentation
- Assemble all panels into the main `Visualizer.tsx` dashboard.
- Create Markdown-based documentation detailing the architecture.
- Setup the Media/Brand Kit page.