"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Utensils,
    Scissors,
    Stethoscope,
    Briefcase,
    ExternalLink,
    Search,
    Plus
} from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import ShinyButton from "@/components/marketing/ShinyButton";

// --- MOCK DATA ---
const EXAMPLES = [
    {
        id: "restoran-xyz",
        title: "Restaurant XYZ",
        category: "food",
        description: "Digital menu with categories, search, and cart functionality.",
        tags: ["Menu", "QR Code", "Ordering"],
        color: "from-orange-500 to-red-600",
        previewType: "restaurant_dark",
        liveUrl: "https://www.tierless.net/p/kxzq4pJU2RYU-jelovnik-xyz"
    },
    {
        id: "luxe-salon",
        title: "Luxe Salon",
        category: "beauty",
        description: "Elegant service list for hair and beauty treatments.",
        tags: ["Booking", "Services", "Instagram"],
        color: "from-pink-400 to-rose-500",
        previewType: "beauty_light",
        liveUrl: "https://tierless.app/p/demo-salon"
    },
    {
        id: "happy-tooth-dental",
        title: "Happy Tooth Dental",
        category: "medical",
        description: "Clean, trustworthy price list for dental services.",
        tags: ["Medical", "Trust", "Clean"],
        color: "from-cyan-400 to-blue-500",
        previewType: "medical_clean",
        liveUrl: "https://www.tierless.net/p/Fky6eZG0UJiq-dentist-htd"
    },
    {
        id: "agency-pro",
        title: "Web Agency",
        category: "professional",
        description: "Tiered packages for services and subscriptions.",
        tags: ["B2B", "SaaS", "Tiers"],
        color: "from-indigo-500 to-purple-600",
        previewType: "tiers_dark",
        liveUrl: "https://tierless.app/p/demo-agency"
    }
];

export default function ExamplesClient() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
            <MarketingHeader />

            {/* HEADER SECTION */}
            <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <ParticlesBackground />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/50 via-[#020617]/80 to-[#020617]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/30 px-3 py-1 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-sm"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        Inspiration Gallery
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
                    >
                        Built with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">Tierless</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-2xl mx-auto mb-12"
                    >
                        Explore real examples of pricing pages, menus, and rate cards created by our users.
                        Check out the live demos to see how they work.
                    </motion.p>
                </div>
            </div>

            {/* GRID SECTION */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {EXAMPLES.map((ex) => (
                            <motion.div
                                layout
                                key={ex.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                onMouseEnter={() => setHoveredId(ex.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className="group relative h-[560px] rounded-3xl border border-white/10 bg-[#0B0F19] overflow-hidden hover:border-cyan-500/30 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.15)] transition-all duration-500 flex flex-col"
                            >
                                {/* Browser Chrome */}
                                <div className="h-10 bg-[#0f1115] border-b border-white/5 flex items-center px-4 gap-2 z-20 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] group-hover:bg-[#ef4444]/80 transition-colors" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#eab308] group-hover:bg-[#eab308]/80 transition-colors" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] group-hover:bg-[#22c55e]/80 transition-colors" />
                                    </div>
                                    <div className="ml-4 flex-1 h-6 rounded-md bg-[#16181c] flex items-center px-3 border border-white/5">
                                        <span className="text-[10px] text-slate-500 font-mono">tierless.app/{ex.id}</span>
                                    </div>
                                </div>

                                {/* Preview Container */}
                                <div className="relative flex-1 bg-[#0f1115] overflow-hidden">
                                    <div className="w-full h-full overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 origin-top">
                                        <MockPreview type={ex.previewType} title={ex.title} />
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className={`absolute inset-0 bg-[#020617]/80 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 z-30 ${hoveredId === ex.id ? "opacity-100" : "opacity-0"}`}>
                                        <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">

                                            {/* CTA BUTTON */}
                                            <Link
                                                href={ex.liveUrl}
                                                target="_blank"
                                                className="flex items-center gap-2 bg-cyan-500 text-black px-6 py-3 rounded-full font-bold hover:bg-cyan-400 hover:scale-105 transition-all shadow-lg shadow-cyan-500/25"
                                            >
                                                <ExternalLink size={18} />
                                                See Live Demo
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Details */}
                                <div className="p-6 bg-gradient-to-t from-[#020617] to-[#0B0F19] border-t border-white/5 z-20 relative shrink-0">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                {ex.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-1">{ex.title}</h3>
                                            <p className="text-sm text-slate-400 line-clamp-1">{ex.description}</p>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ex.color} opacity-80 blur-sm`} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* CTA Footer */}
                <div className="mt-24 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Don't see what you need?</h2>
                    <p className="text-slate-400 mb-8">You can build any layout from scratch using our advanced editor.</p>
                    <ShinyButton href="/start">
                        Start Building from Scratch
                    </ShinyButton>
                </div>
            </div>
            <Footer />
        </div>
    );
}

// --- MOCK PREVIEW COMPONENT ---
function MockPreview({ type, title }: { type: string, title: string }) {
    if (type === "restaurant_dark") {
        return (
            <div className="w-full h-full bg-[#0f1115] font-sans flex flex-col relative overflow-hidden p-4">

                {/* 1. Hero Card */}
                <div className="relative w-full h-36 rounded-2xl bg-gradient-to-br from-orange-900/40 to-[#050505] p-4 flex flex-col justify-end mb-4 border border-white/5 overflow-hidden">
                    {/* Background glow effect inside card */}
                    <div className="absolute top-[-50%] right-[-20%] w-32 h-32 bg-orange-600/20 rounded-full blur-3xl" />

                    <div className="w-10 h-10 rounded-full bg-[#3f2e22] border border-white/10 mb-2 relative z-10" />
                    <h2 className="text-white font-bold text-lg leading-tight relative z-10">{title}</h2>
                    <p className="text-gray-400 text-[9px] relative z-10">Est. 1983 • City Center</p>
                </div>

                {/* 2. Search Bar */}
                <div className="w-full h-8 bg-[#1e2029] rounded-lg mb-4 flex items-center px-3 border border-white/5">
                    <Search size={12} className="text-gray-500 mr-2" />
                    <div className="h-2 w-16 bg-[#2a2d38] rounded-full" />
                </div>

                {/* 3. Grid Items */}
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-[#16181c] rounded-xl p-2 border border-white/5 flex flex-col gap-2 relative group">
                            {/* Image Placeholder */}
                            <div className="w-full aspect-video bg-[#252830] rounded-lg relative overflow-hidden">
                                {i === 3 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="text-gray-200 font-bold text-[10px] mb-1">Burger Deluxe</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-400 font-bold text-[10px]">24 EUR</span>
                                    <div className="w-4 h-4 bg-[#252830] rounded-full flex items-center justify-center text-gray-400">
                                        <Plus size={8} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 4. Bottom Overlay / Footer - Floating Style */}
                <div className="absolute bottom-0 left-0 right-0 pt-12 pb-4 px-4 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/90 to-transparent z-10 flex flex-col gap-3">
                    {/* Floating Orange Glow */}
                    <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-orange-600/30 rounded-full blur-3xl pointer-events-none" />

                    {/* Title Repeat */}
                    <div>
                        <h3 className="text-white font-bold text-lg leading-none">{title}</h3>
                        <p className="text-gray-500 text-[10px] mt-1">Digital menu with categories, search...</p>
                    </div>

                    {/* Pill Tabs */}
                    <div className="flex gap-2 mt-1">
                        <div className="px-3 py-1 rounded-md bg-white/10 border border-white/5 text-white text-[9px] font-bold tracking-wide backdrop-blur-sm">MENU</div>
                        <div className="px-3 py-1 rounded-md bg-[#1e2029] border border-white/5 text-gray-400 text-[9px] font-bold tracking-wide">QR CODE</div>
                        <div className="px-3 py-1 rounded-md bg-[#1e2029] border border-white/5 text-gray-400 text-[9px] font-bold tracking-wide">ORDERING</div>
                    </div>
                </div>

            </div>
        );
    }

    if (type === "beauty_light") {
        return (
            <div className="w-full h-full bg-[#fffbf7] p-4 text-slate-800 font-serif relative">
                <div className="text-center mb-6 mt-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-pink-100 mb-2" />
                    <div className="font-bold text-xl">{title}</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Beauty & Spa</div>
                </div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center border-b border-pink-900/10 pb-2">
                            <div>
                                <div className="font-bold text-xs">Treatment {i}</div>
                                <div className="text-[8px] text-slate-400">45 mins • Full service</div>
                            </div>
                            <div className="font-bold text-pink-600">45$</div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 w-full bg-pink-500 text-white py-1.5 rounded text-center text-[10px] font-bold shadow-lg shadow-pink-500/20">
                    Book Appointment
                </div>
            </div>
        );
    }

    if (type === "medical_clean") {
        return (
            <div className="w-full h-full bg-white p-4 text-slate-800 font-sans relative overflow-hidden">
                {/* Header with tooth icon */}
                <div className="text-center mb-6 mt-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 mb-3 flex items-center justify-center">
                        {/* Tooth icon placeholder */}
                        <div className="w-6 h-7 bg-cyan-400 rounded-sm relative">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-cyan-400 rounded-b-full" />
                        </div>
                    </div>
                    <div className="font-bold text-lg text-slate-800">{title}</div>
                    <div className="text-[9px] text-cyan-600 uppercase tracking-widest mt-1">Dental Services</div>
                </div>

                {/* Search bar */}
                <div className="w-full h-8 bg-slate-50 rounded-lg mb-4 flex items-center px-3 border border-slate-200">
                    <Search size={12} className="text-slate-400 mr-2" />
                    <div className="h-2 w-20 bg-slate-200 rounded-full" />
                </div>

                {/* Service List */}
                <div className="space-y-3">
                    {[
                        { name: "Ceramic Crown", desc: "Zirconia/Metal-free", price: "350 EUR", unit: "/per tooth" },
                        { name: "Teeth Whitening", desc: "LED Laser treatment", price: "250 EUR", unit: "/session" },
                        { name: "Root Canal", desc: "Anesthesia included", price: "150 EUR", unit: "/canal" },
                        { name: "Deep Cleaning", desc: "Scale & Polish", price: "80 EUR", unit: "/session" }
                    ].map((service, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-3 group hover:bg-cyan-50/30 transition-colors px-2 -mx-2 rounded-lg">
                            <div className="flex-1">
                                <div className="font-bold text-xs text-slate-800">{service.name}</div>
                                <div className="text-[8px] text-slate-500 mt-0.5">{service.desc}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-sm text-cyan-600">{service.price}</div>
                                <div className="text-[7px] text-slate-400">{service.unit}</div>
                            </div>
                            <div className="ml-2 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={10} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cyan-50/50 to-transparent pointer-events-none" />
            </div>
        );
    }

    // Generic fallback
    return (
        <div className="w-full h-full bg-slate-900 p-4 relative">
            <div className="w-1/2 h-4 bg-slate-800 rounded mb-4" />
            <div className="grid grid-cols-1 gap-2">
                <div className="h-16 bg-slate-800/50 rounded border border-slate-700" />
                <div className="h-16 bg-slate-800/50 rounded border border-slate-700" />
                <div className="h-16 bg-slate-800/50 rounded border border-slate-700" />
            </div>
        </div>
    );
}