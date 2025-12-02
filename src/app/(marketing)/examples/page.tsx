"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Star,
    TrendingUp,
    Trophy,
    ExternalLink,
    ChevronDown,
    ArrowUpRight,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";

// Cloudinary optimization helper
function optimizeCloudinaryUrl(url: string | null, width: number = 600): string | null {
    if (!url) return null;
    if (!url.includes("res.cloudinary.com")) return url;

    const i = url.indexOf('/upload/');
    if (i === -1) return url;

    const params = `f_auto,q_auto:eco,c_limit,w_${width}`;
    const prefix = url.slice(0, i + 8);
    const suffix = url.slice(i + 8);

    return `${prefix}${params}/${suffix}`;
}

type ShowcaseCard = {
    slug: string;
    title: string;
    description: string;
    cover: string | null;
    views: number;
    avgRating?: number;
    ratingsCount?: number;
    author?: string;
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
    const [visibleCommunity, setVisibleCommunity] = useState(20);

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

    const handleLoadMore = () => {
        setVisibleCommunity(prev => Math.min(prev + 20, community.length));
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <MarketingHeader />

            {/* HERO - Light Theme */}
            <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 mb-6"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                        Showcase
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900"
                    >
                        Made with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-400">
                            Tierless
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 max-w-2xl mx-auto mb-8"
                    >
                        See real price pages from the community. Discover designs that fit your business.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200/40 ring-1 ring-transparent transition-all hover:border-indigo-200 hover:text-indigo-700 hover:shadow-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <ArrowLeft size={16} className="text-indigo-500" />
                            Back to Home
                        </Link>
                    </motion.div>
                </div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">

                {/* OFFICIAL SHOWCASE */}
                {(!loading && featured.length > 0) && (
                    <section className="mb-24 hidden lg:block">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-amber-100 rounded-lg border border-amber-200">
                                <Star className="text-amber-600 w-5 h-5 fill-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Official Showcase</h2>
                                <p className="text-slate-500 text-sm">Hand-picked pages to demonstrate what's possible.</p>
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
                    <div className="flex-1 hidden lg:block">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg border border-indigo-200">
                                    <TrendingUp className="text-indigo-600 w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Trending Community</h2>
                                    <p className="text-slate-500 text-sm">Top rated public pages (owner opted in).</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonGrid />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {community.slice(0, visibleCommunity).map((ex) => (
                                    <Card key={ex.slug} card={ex} />
                                ))}
                                {community.length === 0 && (
                                    <EmptyState text="No community pages yet." />
                                )}
                            </div>
                        )}

                        {/* Load More Button */}
                        {!loading && community.length > visibleCommunity && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    className="group flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition-all text-sm font-medium text-slate-600 hover:text-slate-900"
                                >
                                    <span>Load More Examples</span>
                                    <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Top Rated Pages */}
                    <aside className="w-full lg:w-80 shrink-0">
                        <div className="lg:sticky lg:top-24">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trophy className="text-amber-500 w-5 h-5" />
                                    <h3 className="font-bold text-slate-900">Top Rated Pages</h3>
                                </div>

                                {loading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(() => {
                                            const filled = [...topPages];
                                            while (filled.length < 100) {
                                                filled.push({
                                                    rank: filled.length + 1,
                                                    slug: `empty-${filled.length + 1}`,
                                                    title: "Empty Spot",
                                                    author: "-",
                                                    avgRating: 0,
                                                    ratingsCount: 0,
                                                    totalViews: 0
                                                });
                                            }
                                            return filled.map((page) => (
                                                <Link
                                                    key={`${page.rank}-${page.slug}`}
                                                    href={page.slug.startsWith('empty-') ? '#' : `/p/${page.slug}`}
                                                    className={`flex items-start gap-3 group hover:bg-white p-2 rounded-lg transition-colors ${page.slug.startsWith('empty-') ? 'pointer-events-none opacity-30 grayscale' : ''}`}
                                                    title={page.slug.startsWith('empty-') ? "Available Spot" : `${page.avgRating.toFixed(2)} (${page.ratingsCount} ratings)`}
                                                >
                                                    <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center text-xs font-bold
                                                        ${page.rank === 1 ? "bg-amber-400 text-amber-900"
                                                            : page.rank === 2 ? "bg-slate-300 text-slate-700"
                                                                : page.rank === 3 ? "bg-orange-300 text-orange-800"
                                                                    : "bg-slate-200 text-slate-500"}`}>
                                                        {page.rank}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-slate-700 font-medium group-hover:text-cyan-600 truncate transition-colors">
                                                            {page.title}
                                                        </div>
                                                        {page.author && (
                                                            <div className="text-[10px] text-slate-400 truncate">
                                                                {page.slug.startsWith('empty-') ? "Waiting for you" : `by ${page.author}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!page.slug.startsWith('empty-') && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-slate-600">{page.avgRating.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </Link>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>

                {/* CTA */}
                <div className="mt-24 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Build your own pricing page</h2>
                    <p className="text-slate-600 mb-8">Join creators building with Tierless.</p>
                    <Link
                        href="/login"
                        className="group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105"
                    >
                        Start for Free
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Card({ card, tall = false }: { card: ShowcaseCard; tall?: boolean }) {
    return (
        <div className={`group relative rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-500 flex flex-col ${tall ? "h-[420px]" : "h-[340px]"}`}>
            {/* Chrome */}
            <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5 z-20 shrink-0">
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
            </div>

            {/* Preview */}
            <div className="relative flex-1 bg-slate-100 overflow-hidden">
                <div className="w-full h-full overflow-hidden group-hover:scale-[1.03] transition-transform duration-700 origin-top">
                    {card.cover ? (
                        <img
                            src={optimizeCloudinaryUrl(card.cover, tall ? 500 : 400) || card.cover}
                            alt={card.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <span className="text-3xl font-bold opacity-30">Tierless</span>
                        </div>
                    )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-center justify-center">
                    <Link
                        href={`/p/${card.slug}`}
                        className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-lg"
                    >
                        <ExternalLink size={16} />
                        View Page
                    </Link>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-white border-t border-slate-100 z-20 relative shrink-0">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-slate-900 group-hover:text-cyan-600 transition-colors ${tall ? "text-lg" : "text-sm"}`}>
                        {card.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Star size={12} fill="currentColor" />
                        <span className="text-slate-600">{card.avgRating?.toFixed(1) ?? "0.0"}</span>
                        <span className="text-[10px] text-slate-400">({card.ratingsCount ?? 0})</span>
                    </div>
                </div>
                {tall && card.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{card.description}</p>
                )}

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-600">
                            {card.author?.charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="truncate max-w-[80px]">{card.author || "Unknown"}</span>
                    </div>
                    <Link 
                        href={`/p/${card.slug}`}
                        className="flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
                    >
                        Visit Page <ArrowUpRight size={12} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[340px] rounded-2xl bg-slate-100 animate-pulse" />
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
