"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Star,
    TrendingUp,
    Trophy,
    ExternalLink,
} from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import ShinyButton from "@/components/marketing/ShinyButton";

type ShowcaseCard = {
    slug: string;
    title: string;
    cover: string | null;
    avgRating: number;
    ratingsCount: number;
    description?: string | null;
};

type TopPageRow = {
    rank: number;
    slug: string;
    title: string;
    author: string;
    avgRating: number;
    ratingsCount: number;
    totalViews: number;
};

export default function ExamplesPage() {
    const [featured, setFeatured] = useState<ShowcaseCard[]>([]);
    const [community, setCommunity] = useState<ShowcaseCard[]>([]);
    const [topPages, setTopPages] = useState<TopPageRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/showcase")
            .then((r) => r.json())
            .then((data) => {
                setFeatured(Array.isArray(data?.featured) ? data.featured : []);
                setCommunity(Array.isArray(data?.community) ? data.community : []);
                setTopPages(Array.isArray(data?.topPages) ? data.topPages : []);
            })
            .catch((e) => {
                console.error(e);
                setFeatured([]);
                setCommunity([]);
                setTopPages([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
            <MarketingHeader />

            {/* HERO */}
            <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
                        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        Showcase
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
                    >
                        Made with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">
                            Tierless
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-2xl mx-auto mb-8"
                    >
                        See real price pages from the community. Discover designs that fit your business.
                    </motion.p>
                </div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">

                {/* OFFICIAL SHOWCASE (opciono) */}
                {(!loading && featured.length > 0) && (
                    <section className="mb-24">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                <Star className="text-yellow-500 w-5 h-5 fill-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Official Showcase</h2>
                                <p className="text-slate-400 text-sm">Hand-picked pages to demonstrate what’s possible.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {featured.map((ex) => (
                                <Card key={ex.slug} card={ex} tall />
                            ))}
                        </div>
                    </section>
                )}

                {/* GRID + SIDEBAR */}
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* LEFT: Community */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                    <TrendingUp className="text-indigo-400 w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Trending Community</h2>
                                    <p className="text-slate-400 text-sm">Top rated public pages (owner opted in).</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonGrid />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {community.map((ex) => (
                                    <Card key={ex.slug} card={ex} />
                                ))}
                                {community.length === 0 && (
                                    <EmptyState text="No community pages yet." />
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Top Rated Pages */}
                    <aside className="w-full lg:w-80 shrink-0">
                        <div className="sticky top-24">
                            <div className="rounded-2xl border border-white/10 bg-[#0B0F19] p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trophy className="text-yellow-500 w-5 h-5" />
                                    <h3 className="font-bold text-white">Top Rated Pages</h3>
                                </div>

                                {loading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {topPages.slice(0, 100).map((page) => (
                                            <Link
                                                key={`${page.rank}-${page.slug}`}
                                                href={page.slug.startsWith('empty-') ? '#' : `/p/${page.slug}`}
                                                className={`flex items-start gap-3 group hover:bg-white/5 p-2 rounded-lg transition-colors ${page.slug.startsWith('empty-') ? 'pointer-events-none opacity-50' : ''
                                                    }`}
                                                title={`${page.avgRating.toFixed(2)} (${page.ratingsCount} ratings)`}
                                            >
                                                <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center text-xs font-bold
                            ${page.rank === 1 ? "bg-yellow-500 text-black"
                                                        : page.rank === 2 ? "bg-slate-300 text-black"
                                                            : page.rank === 3 ? "bg-orange-700 text-white"
                                                                : "bg-slate-800 text-slate-400"}`}>
                                                    {page.rank}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-slate-200 font-medium group-hover:text-cyan-400 truncate transition-colors">
                                                        {page.title}
                                                    </div>
                                                    {page.author && (
                                                        <div className="text-[10px] text-slate-500 truncate">
                                                            by {page.author}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-slate-300">{page.avgRating.toFixed(2)}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>

                {/* CTA */}
                <div className="mt-24 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Build your own pricing page</h2>
                    <p className="text-slate-400 mb-8">Join creators building with Tierless.</p>
                    <ShinyButton href="/start">Start for Free</ShinyButton>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Card({ card, tall = false }: { card: ShowcaseCard; tall?: boolean }) {
    return (
        <div className={`group relative rounded-2xl border border-white/10 bg-[#0B0F19] overflow-hidden hover:border-cyan-500/30 hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.15)] transition-all duration-500 flex flex-col ${tall ? "h-[420px]" : "h-[340px]"}`}>
            {/* Chrome */}
            <div className="h-8 bg-[#0f1115] border-b border-white/5 flex items-center px-3 gap-1.5 z-20 shrink-0">
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                    <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
            </div>

            {/* Preview */}
            <div className="relative flex-1 bg-[#0f1115] overflow-hidden">
                <div className="w-full h-full overflow-hidden group-hover:scale-[1.03] transition-transform duration-700 origin-top">
                    {card.cover ? (
                        // koristimo <img> da izbegnemo next/image domain issues na ovoj stranici
                        <img src={card.cover} alt={card.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-700">
                            <span className="text-3xl font-bold opacity-30">Tierless</span>
                        </div>
                    )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-[#020617]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-center justify-center">
                    <Link
                        href={`/p/${card.slug}`}
                        className="inline-flex items-center gap-2 bg-cyan-500 text-black px-5 py-2.5 rounded-full font-bold text-sm hover:bg-cyan-400 transition-all shadow-lg"
                    >
                        <ExternalLink size={16} />
                        View Page
                    </Link>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-gradient-to-t from-[#020617] to-[#0B0F19] border-t border-white/5 z-20 relative shrink-0">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-white group-hover:text-cyan-400 transition-colors ${tall ? "text-lg" : "text-sm"}`}>
                        {card.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star size={12} fill="currentColor" />
                        <span className="text-slate-300">{card.avgRating?.toFixed(1) ?? "0.0"}</span>
                        <span className="text-[10px] text-slate-500">({card.ratingsCount ?? 0})</span>
                    </div>
                </div>
                {tall && card.description && (
                    <p className="text-xs text-slate-500 mb-1 line-clamp-2">{card.description}</p>
                )}
            </div>
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[340px] rounded-2xl bg-white/5 animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="col-span-full text-center py-16 text-slate-500">
            {text}
        </div>
    );
}