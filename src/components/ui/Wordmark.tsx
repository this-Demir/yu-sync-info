export default function Wordmark({ className = "" }: { className?: string }) {
    return (
        <div
            className={`flex items-center gap-2 text-white ${className}`}
            style={{ fontFamily: "'Nunito', ui-sans-serif", letterSpacing: "0.05em" }}
            aria-label="YU-Sync"
        >
            <span className="font-extrabold text-xl md:text-2xl">YU Sync</span>
        </div>
    );
}
