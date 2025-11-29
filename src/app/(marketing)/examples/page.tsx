"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ExampleCalc = {
    meta: {
        name: string;
        slug: string;
        avgRating?: number;
        ratingsCount?: number;
        simpleCoverImage?: string;
        business?: {
            coverUrl?: string;
            description?: string;
        };
    };
};

export default function ExamplesPage() {
    const [examples, setExamples] = useState<ExampleCalc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/examples")
            .then((res) => res.json())
            .then((data) => {
                if (data.examples) {
                    setExamples(data.examples);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#05010d] text-[#020617] dark:text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                <div className="text-center mb-12 sm:mb-20">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
                        Calculator Examples
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Explore what others have built with Tierless. Rate your favorites and get inspired.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {examples.map((ex) => {
                            const cover = ex.meta.business?.coverUrl || ex.meta.simpleCoverImage;
                            const rating = ex.meta.avgRating || 0;
                            const count = ex.meta.ratingsCount || 0;

                            return (
                                <Link
                                    key={ex.meta.slug}
                                    href={`/p/${ex.meta.slug}`}
                                    className="group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-[#0B0C15] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                                        {cover ? (
                                            <img
                                                src={cover}
                                                alt={ex.meta.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
                                                <span className="text-4xl font-bold opacity-20">Tierless</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
                                                <span className="text-[10px] text-white/70">({count})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col p-6">
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-500 transition-colors">
                                            {ex.meta.name}
                                        </h3>
                                        {ex.meta.business?.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                {ex.meta.business.description}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-slate-400">
                                            <span>View Calculator</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}