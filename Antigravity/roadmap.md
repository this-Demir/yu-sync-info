# Antigravity Development Roadmap: YU-Sync Info

## Phase 1: Project Scaffolding & Core Verification [COMPLETED]
- Verify the Vite + React + TypeScript + Tailwind v3 setup.
- Verify `src/core/` contains `time.ts`, `scheduler.ts` (original), and `types.ts`.
- Verify `src/data/` contains the mock course data.
- Install and configure `vitest` for unit testing.

## Phase 2: The Simulation Engine (Generator Pattern) [COMPLETED]
- Create `src/core/SimulationEngine.ts`.
- Refactor the original recursive `scheduler.ts` algorithm into a **Generator Function (`function*`)**.
- Yield detailed state objects at every logical step (`INIT`, `SELECTING`, `BITMASK_CHECK`, `CONFLICT`, `BACKTRACKING`, `SUCCESS`).

## Phase 3: Unit Testing (Headless Verification) [COMPLETED]
- Create `src/__tests__/SimulationEngine.test.ts`.
- Write unit tests using `vitest` to run the generator function headlessly.
- Assert that the generator correctly yields conflicts, backtracks, and eventually finds a valid schedule.

## Phase 4: State Management (Zustand) [COMPLETED]
- Create `src/store/useSimulationStore.ts` using Zustand.
- Implement actions to control the Simulation Engine: `play()`, `pause()`, `stepForward()`, `stepBackward()`, `reset()`, and `setSpeed()`.
- Ensure the store strictly holds the current yielded state from the engine.

## Phase 5: Building the Visualizer Panels (UI) [COMPLETED]
- **Control Deck:** Playback controls and speed slider.
- **Visualizer Layout:** Integrated dashboard grid.
- **Decision Tree:** Hierarchical graph visualizing the backtracking paths and persistent branches.
- **Live Timetable & Bitmask Overlay:** A weekly grid rendering the current state of the schedule, directly visualising bitwise AND operations (`1 & 1`) during overlap checks.
- **Course Selector:** YU-Sync parity component for searching, adding, and filtering courses across all semesters.

## Phase 6: UI/UX Polish & Brand Parity [COMPLETED]
- **Port CSS Variables:** Extract and implement the exact color palette and root variables from the original `src/index.css`.
- **Integrate Brand Components:** Rebuild and integrate the original `Navbar` and `Footer` layouts.
- **Build Wordmark:** Create the official `Wordmark` component and integrate `yu_sync_full_logo.png`.
- **Component Polish:** Apply the soft, highly rounded "YU-Sync Vibe" aesthetic (e.g., `rounded-2xl`, soft drop-shadows) across all existing simulator panels, stripping away the current rigid/boxy look.

## Phase 6.5: SaaS Aesthetic Overhaul
- **Refine Shapes:** Remove excessive border-radiuses and enforce `rounded-md`/`rounded-lg`.
- **Strip Neon:** Remove blooming glowing effects and bright colored drop-shadows from the `GraphTree`.
- **Layout & Contrast:** Apply the clean Vercel/Linear design language to `GraphTree`, `LiveGrid`, and `ControlDeck`.
- **Refine Typography:** Enforce `font-mono` strictly for all metrics, state variables, and data items.

## Phase 7: Documentation & Media Kit
- Create final Markdown-based architecture docs detailing the bitmasking and state-space logic.
- Setup an asset showcase and media kit for the UI visuals.