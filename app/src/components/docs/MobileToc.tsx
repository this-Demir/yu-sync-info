import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ALL_TABS, TAB_GROUPS } from "../../pages/docsNav";

// The contents list below lg, where the sticky sidebar is hidden.
//
// Collapsed it is one row naming the section being read, which is the same
// answer the sidebar shows and comes from the same readingPosition scoring in
// Docs.tsx. The hairline underneath is that section's progress, so the reader
// keeps both position and extent without opening anything.

interface MobileTocProps {
    activeSection: string;
    /** Fraction of the active section already scrolled past, 0 to 1. */
    sectionProgress: number;
    onSelect: (id: string) => void;
}

export default function MobileToc({ activeSection, sectionProgress, onSelect }: MobileTocProps) {
    const [open, setOpen] = useState(false);
    const activeLabel = ALL_TABS.find(t => t.id === activeSection)?.label ?? "Contents";

    // The panel covers what it is a map of, so scrolling the page dismisses it.
    // This has to watch the document scroll rather than raw touch, since the
    // list itself scrolls and a touchmove listener would close it mid-drag.
    // A selection closes the panel before it jumps, so this never races that.
    useEffect(() => {
        if (!open) return;

        const close = () => setOpen(false);
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };

        window.addEventListener("scroll", close, { passive: true });
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("scroll", close);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const select = (id: string) => {
        setOpen(false);
        onSelect(id);
    };

    return (
        <div className="sticky top-14 z-40 -mx-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm sm:-mx-6 lg:hidden">
            <button
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-6"
            >
                <span className="min-w-0 truncate text-[13px] font-semibold text-gray-900">{activeLabel}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Contents
                    <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                </span>
            </button>

            {/* Progress through the section named above. */}
            <div aria-hidden className="h-px w-full bg-gray-100">
                <div
                    className="h-px bg-gray-900 transition-[width] duration-150"
                    style={{ width: `${Math.max(2, sectionProgress * 100)}%` }}
                />
            </div>

            {open && (
                <div className="max-h-[60vh] overflow-y-auto border-t border-gray-100 px-4 py-3 sm:px-6">
                    {TAB_GROUPS.map(group => (
                        <div key={group.label} className="mb-3 last:mb-0">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {group.label}
                            </p>
                            {group.ids.map(id => {
                                const tab = ALL_TABS.find(t => t.id === id)!;
                                const active = activeSection === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => select(id)}
                                        aria-current={active ? "true" : undefined}
                                        className={`block w-full border-l-2 py-2 pl-3 text-left text-[13px] ${
                                            active
                                                ? "border-gray-900 font-semibold text-gray-900"
                                                : "border-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
