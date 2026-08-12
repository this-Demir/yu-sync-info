import React from "react";
import { Download } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

type Asset = {
    label: string;
    path: string;
    bg: string;
    description: string;
    checker?: boolean;
};

const LOGOS: Asset[] = [
    {
        label: "Primary Logo",
        path: "/yu-sync-media/clasic-icons/logo-2.webp",
        bg: "bg-[#004B87]",
        description: "Primary logo on blue background",
    },
    {
        label: "Blue Logo",
        path: "/yu-sync-media/blue-logo-bg-removed.png",
        bg: "",
        checker: true,
        description: "Transparent background, blue variant",
    },
    {
        label: "Holiday Edition",
        path: "/yu-sync-media/clasic-icons/holiday-logo.png",
        bg: "bg-[#004B87]",
        description: "Seasonal holiday variant",
    },
];

const APP_ICONS: Asset[] = [
    {
        label: "App Icon 192×192",
        path: "/yu-sync-media/clasic-icons/icon-192.png",
        bg: "bg-[#004B87]",
        description: "PWA / Android home screen",
    },
    {
        label: "App Icon 512×512",
        path: "/yu-sync-media/clasic-icons/icon-512.png",
        bg: "bg-[#004B87]",
        description: "PWA splash / high-res",
    },
];

const QR_CODES: Asset[] = [
    {
        label: "QR Code, Standard",
        path: "/yu-sync-media/yu-sync-qr-480.png",
        bg: "bg-white",
        description: "480 px, print & web",
    },
    {
        label: "QR Code, Large",
        path: "/yu-sync-media/yu-sync-qr-980.png",
        bg: "bg-white",
        description: "980 px, poster / banner",
    },
    {
        label: "QR Code, Inverted",
        path: "/yu-sync-media/yu-sync-qr-inverted.png",
        bg: "bg-gray-900",
        description: "Dark background variant",
    },
];

const SOCIAL: Asset[] = [
    {
        label: "OG Image",
        path: "/yu-sync-media/og-image .jpg",
        bg: "bg-gray-900",
        description: "Open Graph / social card (1200×630)",
    },
    {
        label: "Promo Poster",
        path: "/yu-sync-media/yu-sync-poster-1.jpg",
        bg: "bg-gray-900",
        description: "Promotional poster, print ready",
    },
];

const PALETTE = [
    { name: "Blue", hex: "#004B87", tw: "bg-[#004B87]" },
    { name: "Canvas", hex: "#FAFAFA", tw: "bg-[#FAFAFA] border border-gray-200" },
    { name: "Panel", hex: "#FFFFFF", tw: "bg-white border border-gray-200" },
    { name: "Ink", hex: "#111827", tw: "bg-gray-900" },
    { name: "Muted", hex: "#6B7280", tw: "bg-gray-500" },
    { name: "Success", hex: "#10B981", tw: "bg-emerald-500" },
    { name: "Warning", hex: "#F59E0B", tw: "bg-amber-400" },
    { name: "Danger", hex: "#EF4444", tw: "bg-red-500" },
];

function DownloadBtn({ path, label }: { path: string; label: string }) {
    const filename = path.split("/").pop() ?? label;
    return (
        <a
            href={path}
            download={filename}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:text-[#004B87] transition-colors"
        >
            <Download size={11} />
            Download
        </a>
    );
}

const CHECKER_STYLE: React.CSSProperties = {
    backgroundImage:
        "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
    backgroundSize: "14px 14px",
    backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
    backgroundColor: "#f9fafb",
};

function AssetCard({ asset, tall }: { asset: Asset; tall?: boolean }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col group">
            <div
                className={`${asset.checker ? "" : asset.bg} flex items-center justify-center ${tall ? "min-h-[200px]" : "min-h-[140px]"} p-6 border-b border-gray-100`}
                style={asset.checker ? CHECKER_STYLE : undefined}
            >
                <img
                    src={asset.path}
                    alt={asset.label}
                    className="max-h-full max-w-full object-contain"
                    style={{ maxHeight: tall ? 180 : 100 }}
                />
            </div>
            {/* At a two-up phone grid the card is about 160px wide, so the label
                and the download action stack rather than compete for one row. */}
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-gray-900">{asset.label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{asset.description}</p>
                </div>
                <DownloadBtn path={asset.path} label={asset.label} />
            </div>
        </div>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-4 mt-10 first:mt-0">
            {children}
        </h2>
    );
}

export default function Media() {
    return (
        <div className="w-full min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-sans">
            <Navbar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-12">

                {/* Header */}
                <div className="mb-10 border-b border-gray-200 pb-8">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#004B87]">Media Kit</p>
                    <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Assets & Media</h1>
                    <p className="text-gray-500 text-sm max-w-xl">
                        Logos, icons, QR codes, and social imagery for YU-Sync.
                    </p>
                </div>

                {/* Logos */}
                <SectionHeading>Logos</SectionHeading>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {LOGOS.map(a => <AssetCard key={a.label} asset={a} />)}
                </div>

                {/* App Icons */}
                <SectionHeading>App Icons</SectionHeading>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {APP_ICONS.map(a => <AssetCard key={a.label} asset={a} />)}
                </div>

                {/* QR Codes */}
                <SectionHeading>QR Codes</SectionHeading>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {QR_CODES.map(a => <AssetCard key={a.label} asset={a} />)}
                </div>

                {/* Social / Poster */}
                <SectionHeading>Social & Poster</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SOCIAL.map(a => <AssetCard key={a.label} asset={a} tall />)}
                </div>

                {/* Color Palette */}
                <SectionHeading>Core Palette</SectionHeading>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PALETTE.map(c => (
                        <div key={c.hex} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                            <div className={`w-10 h-10 rounded-md ${c.tw} shrink-0`} />
                            <div>
                                <p className="text-sm font-semibold text-gray-900 leading-tight">{c.name}</p>
                                <p className="font-mono text-[10px] text-gray-400 uppercase mt-0.5">{c.hex}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
            <Footer />
        </div>
    );
}
