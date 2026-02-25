# System Instructions: YU-Sync Info & Algorithm Visualizer

## 1. Project Overview & Objective
You are acting as the primary developer for the "YU-Sync Info Repository." 
This is a standalone web application designed to document, explain, and visually simulate the core scheduling algorithm of YU-Sync.
**Primary Goal:** To interactively visualize the bitmasking and backtracking algorithms used in schedule generation, allowing users to understand the logic step-by-step.

## 2. Design & UI/UX Guidelines (The "YU-Sync Vibe")
- **Visual Identity:** Maintain the original YU-Sync branding, utilizing clean whites, slate backgrounds, and modern components. Tailwind CSS v3 is used.
- **Context:** The UI must clearly indicate that this is an informational/educational portal (via Hero section, Headers, and Layout), not the actual scheduling tool.
- **Component Quality:** Use React and TypeScript. Enforce modular component architecture, Clean Code principles, and strict UI/UX consistency.

## 3. Core Engine: Algorithm Simulation (Strict Requirements)
The original scheduling logic (specifically `src/core/scheduler.ts` and `src/core/time.ts`) must be adapted for UI simulation.
- **Steppable Logic:** Rewrite the standard recursive backtracking function using **Generator Functions (`function*`)**. This is mandatory to allow external `next()`, `pause()`, and `resume()` commands from the UI.
- **Time Control:** Implement an adjustable Speed Multiplier for the simulation.
- **State Management:** Expose the current simulation state globally (e.g., "currently evaluating course", "current bitmask", "conflict detected", "backtracking") using Zustand.

## 4. Visualization Requirements
- **Bitmasking Visualization:** Display how timeslots are converted into binary sequences and how conflicts are detected in real-time using the bitwise `AND (&)` operator.
- **Decision Tree:** Render the backtracking process as a graph/tree. Highlight successful paths, conflicts, and visually demonstrate branch pruning.
- **Timetable Rendering:** Render the currently evaluated schedule on a weekly grid. Dynamically highlight conflicting courses during the simulation.

## 5. Coding Standards & Practices
- Manage all state using `immutable` principles.
- Use strict TypeScript interfaces and types.
- Provide comprehensive inline comments for all complex algorithms, particularly bitwise operations and state transitions.
- Do not hallucinate or use external UI libraries for complex trees/grids unless explicitly approved. Build custom, lightweight components where possible.