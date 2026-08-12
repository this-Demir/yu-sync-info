import { BookText, PlayCircle, Images } from "lucide-react";
import { useRouteStore, type Page } from "../../store/useRouteStore";

// The only site navigation below md, where Navbar hides its tab strip.
//
// Rendered once from App.tsx rather than per page, so every route inherits it.
// Pages reserve room for it with the --tabbar-h token, which is zero at md and
// above so no desktop layout has to know this component exists.

const TABS: { id: Page; label: string; Icon: typeof BookText }[] = [
    { id: "docs", label: "Docs", Icon: BookText },
    { id: "simulator", label: "Simulator", Icon: PlayCircle },
    { id: "media", label: "Media Kit", Icon: Images },
];

export default function MobileTabBar() {
    const currentPage = useRouteStore(state => state.currentPage);
    const navigate = useRouteStore(state => state.navigate);

    return (
        <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <ul className="flex items-stretch">
                {TABS.map(({ id, label, Icon }) => {
                    const active = currentPage === id;
                    return (
                        <li key={id} className="flex-1">
                            <button
                                onClick={() => navigate(id)}
                                aria-current={active ? "page" : undefined}
                                className={`flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-1 transition-colors ${
                                    active ? "text-[#004B87]" : "text-gray-400 active:text-gray-600"
                                }`}
                            >
                                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                                <span className={`text-[10px] tracking-wide ${active ? "font-semibold" : "font-medium"}`}>
                                    {label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
