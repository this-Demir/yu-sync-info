# System Instructions: YU-Sync Info & Algorithm Visualizer

## 1. Project Overview & Objective
You are acting as the primary developer for the "YU-Sync Info Repository." 
This is a standalone web application designed to document, explain, and visually simulate the core scheduling algorithm of YU-Sync.
**Primary Goal:** To interactively visualize the bitmasking and backtracking algorithms used in schedule generation, allowing users to understand the logic step-by-step.

## 2. Design & UI/UX Guidelines (SaaS Developer Lab Aesthetic)
- **Visual Identity:** Pivot to a highly professional, minimalist "SaaS Developer Lab" aesthetic (inspired by Vercel, Linear, Stripe). Maintain core brand colors but avoid the bubbly consumer feel. Tailwind CSS v3 is used.
- **Shapes (No Pills):** Explicitly ban "pill" shapes (`rounded-full`, `rounded-2xl`, `rounded-3xl` on large components). Enforce crisp, professional curves (`rounded-md` or `rounded-lg` maximum).
- **Highlights & Shadows (No Neon):** Ban aggressive neon glows and bright colored drop-shadows (especially in the `GraphTree`). Enforce solid, elegant highlighting (e.g., deep emerald for success, clean primary blue for active paths, muted gray for inactive). Use very subtle shadows (`shadow-sm`) for depth.
- **Clean Grid & Borders (Whitespace over Lines):** Enforce the reduction of "border fatigue". Rely on background contrast (e.g., white cards on `bg-slate-50`) and generous whitespace instead of heavy CSS borders.
- **Typography:** Enforce modern sans-serif for general UI and strict `font-mono` exclusively for metrics, math, and data points.
- **Brand Components:** The UI must include a distinct Lab Header (Navbar) and Footer, using the official `Wordmark` and `yu_sync_full_logo.png`, while clearly framing itself as an educational "ALGORITHM LAB".
- **Component Quality:** Use React and TypeScript. Enforce modular component architecture, Clean Code principles, and strict UI/UX consistency.

## 3. Core Engine: Algorithm Simulation (Strict Requirements)
The original scheduling logic (specifically `src/core/scheduler.ts` and `src/core/time.ts`) must be adapted for UI simulation.
- **Steppable Logic:** Rewrite the standard recursive backtracking function using **Generator Functions (`function*`)**. This is mandatory to allow external `next()`, `pause()`, and `resume()` commands from the UI.
- **Time Control:** Implement an adjustable Speed Multiplier for the simulation.
- **State Management:** Expose the current simulation state globally (e.g., "currently evaluating course", "current bitmask", "conflict detected", "backtracking") using Zustand.

## 4. Visualization Requirements
- **Bitmasking Visualization:** Display how timeslots are converted into binary sequences and how conflicts are detected in real-time using the bitwise `AND (&)` operator directly on the timetable grid.
- **Decision Tree:** Render the backtracking process as a graph/tree. Highlight successful paths, conflicts, and visually demonstrate branch pruning.
- **Timetable Rendering:** Render the currently evaluated schedule on a weekly grid. Dynamically highlight conflicting courses during the simulation.

## 5. Coding Standards & Practices
- Manage all state using `immutable` principles.
- Use strict TypeScript interfaces and types.
- Provide comprehensive inline comments for all complex algorithms, particularly bitwise operations and state transitions.
- Do not hallucinate or use external UI libraries for complex trees/grids unless explicitly approved. Build custom, lightweight components where possible.