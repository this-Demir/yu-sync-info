

export default function Footer({
    className = "",
}: { className?: string }) {
    return (
        <footer className={`mt-auto shrink-0 bg-transparent border-t border-gray-200 ${className}`} aria-label="Site footer">
            <div className="mx-auto w-full px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                {/* Brand / Copy */}
                <div className="text-xs text-gray-500 font-medium">
                    <span>An interactive visualizer for the YU-Sync engine.</span>
                </div>

                {/* Footer navigation */}
                <nav aria-label="Footer navigation" className="flex items-center gap-4">
                    <a
                        href="https://yu-sync.com"
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        title="Main Site"
                    >
                        yu-sync.com
                    </a>
                </nav>
            </div>
        </footer>
    );
}
