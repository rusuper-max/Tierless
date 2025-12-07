"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search, Layout, Camera, Utensils, Briefcase,
    Sparkles, Zap, Monitor, Lock, ChevronLeft, ChevronRight
} from "lucide-react";
import { CALC_TEMPLATES } from "@/data/calcTemplates";
import UseTemplateButton from "@/components/UseTemplateButton";
import TemplateMiniPreview from "@/components/TemplateMiniPreview";
import { useT } from "@/i18n";

// --- Types & Mapping ---

type CategoryId = "all" | "wedding" | "hospitality" | "agency" | "saas" | "services";

// Feature badges for templates with special capabilities
type FeatureBadge = "locked-style" | "custom-animations" | "tier-based" | "custom-theme" | "editorial";

const FEATURE_BADGE_CONFIG: Record<FeatureBadge, { label: string; icon: string; color: string }> = {
    "locked-style": { label: "Locked Style", icon: "🔒", color: "bg-amber-500/90 text-white" },
    "custom-animations": { label: "Animations", icon: "✨", color: "bg-purple-500/90 text-white" },
    "tier-based": { label: "Tier Based", icon: "📊", color: "bg-blue-500/90 text-white" },
    "custom-theme": { label: "Custom Theme", icon: "🎨", color: "bg-pink-500/90 text-white" },
    "editorial": { label: "Editorial", icon: "📰", color: "bg-slate-700/90 text-white" },
};

interface TemplateMeta {
    category: CategoryId;
    categoryLabel: string;
    imageColor: string;
    accentColor: string;
    features?: FeatureBadge[]; // Special features this template has
    isComingSoon?: boolean;
}

// Map existing slugs to visual metadata
const TEMPLATE_META: Record<string, TemplateMeta> = {
    "wedding-photographer": {
        category: "wedding",
        categoryLabel: "Photography",
        imageColor: "from-amber-800 to-orange-900",
        accentColor: "bg-orange-200",
        features: ["locked-style", "tier-based"],
    },
    "web-agency-packages": {
        category: "agency",
        categoryLabel: "SaaS / Service",
        imageColor: "from-violet-900 to-indigo-900",
        accentColor: "bg-blue-400",
    },
    "cleaning-service-packages": {
        category: "hospitality",
        categoryLabel: "Service",
        imageColor: "from-teal-900 to-emerald-900",
        accentColor: "bg-emerald-400",
    },
    "personal-trainer-list": {
        category: "services",
        categoryLabel: "Personal",
        imageColor: "from-slate-800 to-zinc-900",
        accentColor: "bg-zinc-200",
    },
    "coffee-shop-menu": {
        category: "hospitality",
        categoryLabel: "Cafe / Restaurant",
        imageColor: "from-amber-900 to-yellow-900",
        accentColor: "bg-amber-400",
    },
    "saas-pricing-pro": {
        category: "saas",
        categoryLabel: "SaaS",
        imageColor: "from-purple-900 to-violet-950",
        accentColor: "bg-purple-400",
    },
    "neon-creative-studio": {
        category: "agency",
        categoryLabel: "Creative Agency",
        imageColor: "from-cyan-600 via-purple-600 to-pink-600",
        accentColor: "bg-cyan-400",
        features: ["locked-style", "custom-animations", "tier-based", "custom-theme"],
    },
};

// Placeholder templates to fill the grid (Coming Soon)
const COMING_SOON_TEMPLATES = [
    { slug: "event-planner", name: "Event Planner Quote", category: "services", description: "Comprehensive event planning calculator with venue, catering, and staff options." },
    { slug: "marketing-retainer", name: "Marketing Retainer", category: "agency", description: "Monthly retainer calculator for digital marketing agencies." },
    { slug: "gym-membership", name: "Gym Membership", category: "hospitality", description: "Membership plan builder with signup fees and add-ons." },
    { slug: "consulting-fees", name: "Consulting Fee Calculator", category: "services", description: "Hourly vs project-based fee estimator for consultants." },
    { slug: "interior-design", name: "Interior Design Project", category: "services", description: "Room-by-room design cost estimator." },
    { slug: "catering-menu", name: "Catering Menu Builder", category: "hospitality", description: "Build your own menu with per-head pricing and dietary restrictions." },
    { slug: "software-dev-quote", name: "Software Dev Quote", category: "agency", description: "Estimation tool for custom software development projects." },
    { slug: "social-media-packages", name: "Social Media Packages", category: "agency", description: "Package builder for social media management services." },
    { slug: "copywriting-rates", name: "Copywriting Rate Card", category: "services", description: "Price list for blog posts, landing pages, and email sequences." },
    { slug: "seo-audit", name: "SEO Audit Calculator", category: "agency", description: "Cost estimator for technical SEO audits and implementation." },
    { slug: "videography-packages", name: "Videography Packages", category: "wedding", description: "Video packages for events and commercials." },
    { slug: "virtual-assistant", name: "Virtual Assistant Plans", category: "services", description: "Hourly packages for VA services." },
    { slug: "home-renovation", name: "Home Renovation", category: "services", description: "Kitchen and bath renovation cost estimator." },
];

const DEFAULT_META: TemplateMeta = {
    category: "agency",
    categoryLabel: "General",
    imageColor: "from-slate-800 to-slate-900",
    accentColor: "bg-slate-200",
};

const ITEMS_PER_PAGE = 6;

export default function TemplatesPage() {
    const t = useT();
    const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const categories = [
        { id: "all", label: t("All Templates"), icon: <Layout size={14} /> },
        { id: "wedding", label: t("Wedding"), icon: <Camera size={14} /> },
        { id: "hospitality", label: t("Hospitality"), icon: <Utensils size={14} /> },
        { id: "agency", label: t("Agency"), icon: <Briefcase size={14} /> },
        { id: "saas", label: t("SaaS"), icon: <Monitor size={14} /> },
        { id: "services", label: t("Services"), icon: <Zap size={14} /> },
    ];

    // 1. Merge Real + Coming Soon Templates
    const allTemplates = useMemo(() => {
        // Real templates
        const real = CALC_TEMPLATES.map((tmpl) => {
            const meta = TEMPLATE_META[tmpl.slug] || DEFAULT_META;
            return { ...tmpl, ...meta, isComingSoon: false, isPremiumTemplate: tmpl.isPremium };
        });

        // Coming soon templates with varied colors
        const comingSoonColors = [
            "from-violet-900 to-purple-950",
            "from-rose-900 to-pink-950",
            "from-sky-900 to-cyan-950",
            "from-amber-900 to-orange-950",
            "from-emerald-900 to-teal-950",
            "from-fuchsia-900 to-pink-950",
        ];

        const comingSoon = COMING_SOON_TEMPLATES.map((tmpl, idx) => {
            return {
                ...tmpl,
                defaultName: tmpl.name,
                mode: "packages" as const,
                config: {},
                category: tmpl.category as CategoryId,
                categoryLabel: tmpl.category.charAt(0).toUpperCase() + tmpl.category.slice(1),
                imageColor: comingSoonColors[idx % comingSoonColors.length],
                accentColor: "bg-slate-500",
                isComingSoon: true,
                features: [],
            };
        });

        return [...real, ...comingSoon];
    }, []);

    // 2. Filter
    const filteredTemplates = useMemo(() => {
        return allTemplates.filter((tmpl) => {
            const matchesCategory = activeCategory === "all" || tmpl.category === activeCategory;
            const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tmpl.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery, allTemplates]);

    // 3. Paginate
    const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
    const paginatedTemplates = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTemplates.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTemplates, currentPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, searchQuery]);

    return (
        <div className="h-full">
            <div className="container-page">{/* max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 */}

                {/* Header Section - compact */}
                <header className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm mb-2">
                        <Sparkles size={11} className="text-amber-400" />
                        <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                            {t("Premium Collection")}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
                        {t("Choose from our professionally designed templates. Fully customizable, mobile-optimized, and ready to use.")}
                    </p>
                </header>

                {/* Search + Filters Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                        <input
                            type="text"
                            placeholder={t("Search templates...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/30 focus:border-[var(--brand-1)]/50 transition-all"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id as CategoryId)}
                                className={`
                                    inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                                    ${activeCategory === cat.id
                                        ? 'bg-[var(--text)] text-[var(--bg)] shadow-md'
                                        : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--text)] border border-[var(--border)]'}
                                `}
                            >
                                {cat.icon}
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid - 6 per page, no scroll needed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedTemplates.map((template) => (
                        <article
                            key={template.slug}
                            onMouseEnter={() => setHoveredCard(template.slug)}
                            onMouseLeave={() => setHoveredCard(null)}
                            className={`
                                group relative flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden 
                                transition-all duration-300 hover:shadow-xl hover:shadow-black/5
                                ${template.isComingSoon ? "opacity-70" : "hover:border-[var(--brand-1)]/40"}
                            `}
                        >
                            {/* Preview Area - full bleed themed background */}
                            <div className="relative h-36 overflow-hidden">
                                {/* Themed icon background - takes full area */}
                                <TemplateMiniPreview
                                    slug={template.slug}
                                    isPremium={(template as any).isPremium}
                                    accentColor={(template as any).lockedStyle?.accentColor}
                                    isHovered={hoveredCard === template.slug}
                                    className="absolute inset-0"
                                />

                                {/* Hover Overlay - subtle darkening */}
                                <div className={`
                                    absolute inset-0 flex items-center justify-center 
                                    transition-all duration-300
                                    ${hoveredCard === template.slug ? 'bg-black/40' : 'bg-transparent'}
                                `}>
                                    <div className={`transition-all duration-300 ${hoveredCard === template.slug ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        {!template.isComingSoon ? (
                                            <UseTemplateButton
                                                slug={template.slug}
                                                name={template.defaultName || template.name}
                                                className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-semibold text-sm shadow-xl hover:bg-slate-50 transition-colors !border-none"
                                            >
                                                {t("Use Template")}
                                            </UseTemplateButton>
                                        ) : (
                                            <div className="px-4 py-2 bg-black/70 text-white/90 border border-white/20 rounded-xl text-sm font-medium backdrop-blur-md flex items-center gap-2">
                                                <Lock size={14} />
                                                {t("Coming Soon")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                                    {/* Premium badge for paid tier templates */}
                                    {(template as any).isPremium && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wide rounded-md shadow-sm flex items-center gap-1">
                                            <Sparkles size={10} />
                                            Premium
                                        </span>
                                    )}
                                    {/* Feature badges - show special capabilities */}
                                    {(template as any).features?.slice(0, 2).map((feature: FeatureBadge) => {
                                        const config = FEATURE_BADGE_CONFIG[feature];
                                        if (!config) return null;
                                        return (
                                            <span
                                                key={feature}
                                                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md shadow-sm flex items-center gap-1 ${config.color}`}
                                            >
                                                <span className="text-[9px]">{config.icon}</span>
                                                {config.label}
                                            </span>
                                        );
                                    })}
                                    {/* Coming Soon badge */}
                                    {template.isComingSoon && (
                                        <span className="px-2 py-1 bg-slate-600/90 text-white/90 text-[10px] font-bold uppercase tracking-wide rounded-md shadow-sm">
                                            Coming Soon
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1 block">
                                    {template.categoryLabel}
                                </span>
                                <h3 className="text-base font-semibold text-[var(--text)] mb-2 transition-colors">
                                    {template.name}
                                </h3>
                                <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                                    {template.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-[var(--muted)] mb-4">{t("No templates found for this category.")}</p>
                        <button
                            onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
                            className="text-sm text-[var(--brand-1)] font-medium hover:underline"
                        >
                            {t("Show all templates")}
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-6">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium text-[var(--muted)] px-3">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}


            </div>
        </div>
    );
}
