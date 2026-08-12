// Section index for the Docs page.
//
// Held apart from Docs.tsx so the desktop sidebar and the mobile contents bar
// read the same list without either importing the other.

export const TAB_GROUPS = [
    { label: "Overview", ids: ["abstract"] },
    { label: "Theory", ids: ["preliminaries", "problem", "complexity"] },
    { label: "Algorithm", ids: ["algorithm", "cost"] },
    { label: "Practice", ids: ["implementation", "evaluation"] },
    { label: "Closing", ids: ["related", "limitations", "references"] },
];

export const ALL_TABS = [
    { id: "abstract", label: "Abstract" },
    { id: "preliminaries", label: "1. Preliminaries" },
    { id: "problem", label: "2. Problem" },
    { id: "complexity", label: "3. Complexity" },
    { id: "algorithm", label: "4. Algorithm" },
    { id: "cost", label: "4.5 Search cost" },
    { id: "implementation", label: "5. Implementation" },
    { id: "evaluation", label: "6. Evaluation" },
    { id: "related", label: "7. Related work" },
    { id: "limitations", label: "8. Limitations" },
    { id: "references", label: "9. References" },
];
