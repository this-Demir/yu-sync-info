import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function Media() {
    return (
        <div className="w-full min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 flex flex-col p-6 w-full max-w-5xl mx-auto pt-12 pb-20">
                {/* Header Section */}
                <div className="mb-12 border-b border-gray-200 pb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Brand Assets & Media Kit</h1>
                    <p className="text-gray-500 max-w-2xl">
                        Official logos, typography, and color guidelines for the YU-Sync Algorithm Lab.
                    </p>
                </div>

                {/* Logo Grid */}
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Logos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
                    {/* Primary Logo */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
                        <div className="flex-1 bg-gray-50 rounded border border-gray-100 flex items-center justify-center p-8 mb-4 min-h-[160px]">
                            <img src="/logo-2.webp" alt="Primary Logo" className="h-16 w-16 object-contain" />
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                            <span className="text-sm font-medium text-gray-900">Primary Mark</span>
                            <div className="flex gap-2">
                                <button className="font-mono text-[10px] text-gray-500 hover:text-gray-900 transition-colors uppercase font-semibold">SVG</button>
                                <span className="text-gray-300">|</span>
                                <button className="font-mono text-[10px] text-gray-500 hover:text-gray-900 transition-colors uppercase font-semibold">PNG</button>
                            </div>
                        </div>
                    </div>

                    {/* Wordmark */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
                        <div className="flex-1 bg-gray-900 rounded border border-gray-800 flex items-center justify-center p-8 mb-4 min-h-[160px]">
                            <span className="text-white font-bold tracking-tighter text-2xl">yu-sync</span>
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                            <span className="text-sm font-medium text-gray-900">Wordmark Inverted</span>
                            <div className="flex gap-2">
                                <button className="font-mono text-[10px] text-gray-500 hover:text-gray-900 transition-colors uppercase font-semibold">SVG</button>
                                <span className="text-gray-300">|</span>
                                <button className="font-mono text-[10px] text-gray-500 hover:text-gray-900 transition-colors uppercase font-semibold">PNG</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colors Section */}
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Core Palette</h2>
                <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-[#FAFAFA] border border-gray-200 shadow-sm"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Canvas</span>
                            <span className="font-mono text-[10px] text-gray-500 uppercase">#FAFAFA</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-white border border-gray-200 shadow-sm"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Panel</span>
                            <span className="font-mono text-[10px] text-gray-500 uppercase">#FFFFFF</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-black border border-gray-900 shadow-sm"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Primary TXT</span>
                            <span className="font-mono text-[10px] text-gray-500 uppercase">#000000</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-gray-500 border border-gray-600 shadow-sm"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Muted TXT</span>
                            <span className="font-mono text-[10px] text-gray-500 uppercase">gray-500</span>
                        </div>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}
