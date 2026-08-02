import { ExternalLink } from "lucide-react";
import { useRouteStore } from "../../store/useRouteStore";

export default function Navbar() {
    const { currentPage, navigate } = useRouteStore();

    return (
        <header className="sticky top-0 z-50 shrink-0 bg-white border-b border-gray-200" role="banner">
            <div className="mx-auto w-full px-4 md:px-6 h-14 flex items-center justify-between">

                {/* Left Side (Breadcrumbs) */}
                <div className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => navigate('landing')}>
                    <img
                        src="/yu-sync-media/blue-logo-bg-removed.png"
                        alt="YU-Sync"
                        width="22"
                        height="22"
                        fetchPriority="high"
                        className="h-[22px] w-[22px] object-contain opacity-90"
                    />
                    <span className="text-gray-300">/</span>
                    <span className="font-mono text-gray-600 hover:text-gray-900 transition-colors">yu-sync-info</span>
                    <span className="text-gray-300">/</span>
                    <span className="font-semibold text-gray-900">{currentPage === 'landing' ? 'overview' : currentPage}</span>
                </div>

                {/* Center (Tabs) */}
                <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2 h-full">
                    <button
                        onClick={() => navigate('simulator')}
                        className={`h-full flex items-center border-b-2 px-1 text-sm font-medium transition-colors ${currentPage === 'simulator' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        Simulator
                    </button>
                    <button
                        onClick={() => navigate('docs')}
                        className={`h-full flex items-center border-b-2 px-1 text-sm font-medium transition-colors ${currentPage === 'docs' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        The Paper
                    </button>
                    <button
                        onClick={() => navigate('media')}
                        className={`h-full flex items-center border-b-2 px-1 text-sm font-medium transition-colors ${currentPage === 'media' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        Media Kit
                    </button>
                </nav>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    <a
                        href="https://yu-sync.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                    >
                        <span>yu-sync.com</span>
                        <ExternalLink size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>

            </div>
        </header>
    );
}
