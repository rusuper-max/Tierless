"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, ArrowUpRight, ArrowDownRight, MousePointerClick, Users, Star,
  TrendingUp, Calendar, Clock, Activity, Smartphone, Monitor, Globe, X,
  Layers, ExternalLink, Edit, Share2, Zap, Target, PieChart, AlertTriangle,
  Tablet, Filter, RefreshCw, ChevronDown, Search, Info, Lightbulb
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ShareQrModal from "@/components/share/ShareQrModal";

// --- Public URL helper: /p/{id}-{slug} (fallback /p/slug) -------
async function getPublicUrlForSlug(slug: string): Promise<string> {
  try {
    const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      const id = j?.meta?.id;
      if (id && typeof id === "string") {
        return `/p/${encodeURIComponent(id)}-${encodeURIComponent(slug)}`;
      }
    }
  } catch { }
  // Fallback
  return `/p/${encodeURIComponent(slug)}`;
}

// Format seconds to human readable time
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

// --- TYPES ---
interface PageStats {
  views: number;
  uniqueVisitors: number;
  interactions: number;
  checkouts: number;
  checkoutMethods: Record<string, number>;
  avgRating: number;
  ratingsCount: number;
  devices: Record<string, number>;
  referrers: Record<string, number>;
  countries: Record<string, number>;
  interactionTypes: Record<string, number>;
}

interface DailyStats {
  date: string;
  views: number;
  interactions: number;
  checkouts: number;
}

interface StatsResponse {
  ok: boolean;
  period: { days: number; from: string; to: string };
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    totalInteractions: number;
    totalCheckouts: number;
    conversionRate: string;
    interactionRate: string;
    engagedSessions: number;
    avgTimeOnPage?: number;
    timeBuckets?: Record<string, number>;
    scrollDepth?: Record<number, number>;
  };
  perPage: Record<string, PageStats>;
  dailyStats: DailyStats[];
  referrers: { name: string; count: number }[];
  utmSources: { name: string; count: number }[];
  devices: { name: string; count: number; percent: string }[];
  countries: { name: string; count: number }[];
}

interface Page {
  id?: string;
  meta: {
    id?: string;
    name: string;
    slug: string;
    published?: boolean;
    avgRating?: number;
    ratingsCount?: number;
  };
}

// --- MAIN COMPONENT ---
export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("7");
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Share state
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareLoading, setShareLoading] = useState(false);

  const openShareModal = async (slug: string) => {
    try {
      setShareSlug(slug);
      setShareUrl("");
      setShareLoading(true);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const path = await getPublicUrlForSlug(slug);
      setShareUrl(`${origin}${path}`);
    } catch (err) {
      console.error("openShareModal failed:", err);
      setShareSlug(null);
      setShareUrl("");
    } finally {
      setShareLoading(false);
    }
  };

  const closeShareModal = () => {
    setShareSlug(null);
    setShareUrl("");
  };

  const loadStats = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Fetch pages
      const pagesRes = await fetch("/api/calculators", { cache: "no-store" });
      const pagesData = await pagesRes.json();
      const pagesList = Array.isArray(pagesData) ? pagesData : (pagesData.rows || []);
      console.log("[Stats] Pages loaded:", pagesList.length, pagesList.map((p: any) => p.meta?.slug));
      setPages(pagesList);

      // Fetch stats
      const statsRes = await fetch(`/api/stats?days=${timeRange}`, { cache: "no-store" });
      const statsData = await statsRes.json();
      console.log("[Stats] Stats response:", statsData);

      if (statsData.ok) {
        setStats(statsData);
      } else {
        // Set empty stats so pages still show
        setStats({
          ok: true,
          period: { days: parseInt(timeRange), from: "", to: "" },
          summary: { totalViews: 0, uniqueVisitors: 0, totalInteractions: 0, totalCheckouts: 0, conversionRate: "0", interactionRate: "0", engagedSessions: 0 },
          perPage: {},
          dailyStats: [],
          referrers: [],
          utmSources: [],
          devices: [],
          countries: [],
        });
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
      // Set empty stats on error so pages still show
      setStats({
        ok: true,
        period: { days: parseInt(timeRange), from: "", to: "" },
        summary: { totalViews: 0, uniqueVisitors: 0, totalInteractions: 0, totalCheckouts: 0, conversionRate: "0", interactionRate: "0", engagedSessions: 0 },
        perPage: {},
        dailyStats: [],
        referrers: [],
        utmSources: [],
        devices: [],
        countries: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  // Compute score for each page (50% conv, 30% interaction rate, 20% engagement)
  const pagesWithScores = useMemo(() => {
    if (!pages.length) return [];

    const perPage = stats?.perPage || {};

    return pages.map(page => {
      const slug = page.meta?.slug || "";
      const pageStats = perPage[slug] || {
        views: 0, uniqueVisitors: 0, interactions: 0, checkouts: 0,
        avgRating: 0, ratingsCount: 0, devices: {}, referrers: {}, countries: {}, interactionTypes: {}, checkoutMethods: {}
      };

      const convRate = pageStats.views > 0 ? (pageStats.checkouts / pageStats.views) * 100 : 0;
      const interactRate = pageStats.views > 0 ? (pageStats.interactions / pageStats.views) * 100 : 0;

      // Normalize scores (assuming max 20% conv, 100% interaction rate)
      const normConv = Math.min(convRate / 20, 1);
      const normInteract = Math.min(interactRate / 100, 1);
      const normEngagement = pageStats.uniqueVisitors > 0
        ? Math.min(pageStats.interactions / pageStats.uniqueVisitors / 5, 1)
        : 0;

      const score = Math.round((normConv * 0.5 + normInteract * 0.3 + normEngagement * 0.2) * 100);

      return {
        ...page,
        id: page.meta?.id || page.id || slug, // Ensure we have an id
        stats: pageStats,
        score,
        convRate: convRate.toFixed(1),
      };
    }).sort((a, b) => b.score - a.score);
  }, [stats, pages]);

  // Smart insights
  const insights = useMemo(() => {
    if (!stats) return [];
    const hints: { type: "warning" | "success" | "info"; message: string }[] = [];

    const { summary } = stats;
    const bounceRate = summary.totalViews > 0
      ? ((summary.totalViews - summary.engagedSessions) / summary.totalViews * 100).toFixed(0)
      : "0";

    if (parseInt(bounceRate) > 60) {
      hints.push({
        type: "warning",
        message: `High bounce rate: ${bounceRate}% of visitors leave without interaction. Consider adding a clear CTA above the fold.`
      });
    }

    if (parseFloat(summary.conversionRate) < 2) {
      hints.push({
        type: "warning",
        message: `Low conversion rate (${summary.conversionRate}%). Try simplifying your checkout flow or adding trust signals.`
      });
    }

    if (parseFloat(summary.conversionRate) > 10) {
      hints.push({
        type: "success",
        message: `Excellent conversion rate (${summary.conversionRate}%)! Your pages are performing well above average.`
      });
    }

    // Device insights
    const mobilePercent = stats.devices.find(d => d.name === "mobile")?.percent || "0";
    if (parseFloat(mobilePercent) > 60) {
      hints.push({
        type: "info",
        message: `${mobilePercent}% of your traffic is mobile. Ensure your pages are optimized for small screens.`
      });
    }

    return hints;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#22D3EE] mx-auto" />
          <p className="text-sm text-[var(--muted)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container-page space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#22D3EE]" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Track performance across all your Tierless pages
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
              showFilters
                ? "border-[#22D3EE] bg-[#22D3EE]/5 text-[#22D3EE]"
                : "border-[var(--border)] hover:bg-[var(--surface)] text-[var(--muted)]"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {/* Time Range */}
          <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-lg p-1">
            {(["7", "30", "90"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeRange === range
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                )}
              >
                {range === "7" ? "7 days" : range === "30" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* FILTERS ROW (Collapsible) */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[var(--surface)]/50 rounded-xl border border-[var(--border)] animate-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-medium text-[var(--muted)]">Quick filters:</span>
          <button
            onClick={() => setDeviceFilter(deviceFilter === "mobile" ? null : "mobile")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              deviceFilter === "mobile"
                ? "bg-[#22D3EE] text-white border-[#22D3EE]"
                : "border-[var(--border)] hover:border-[#22D3EE] text-[var(--muted)]"
            )}
          >
            <Smartphone className="w-3 h-3 inline mr-1" /> Mobile only
          </button>
          <button
            onClick={() => setDeviceFilter(deviceFilter === "desktop" ? null : "desktop")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              deviceFilter === "desktop"
                ? "bg-[#22D3EE] text-white border-[#22D3EE]"
                : "border-[var(--border)] hover:border-[#22D3EE] text-[var(--muted)]"
            )}
          >
            <Monitor className="w-3 h-3 inline mr-1" /> Desktop only
          </button>
        </div>
      )}

      {/* SMART INSIGHTS */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                insight.type === "warning" && "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400",
                insight.type === "success" && "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                insight.type === "info" && "bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400"
              )}
            >
              <Lightbulb className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm">{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={stats?.summary.totalViews || 0}
          subtitle={`${stats?.summary.uniqueVisitors || 0} unique visitors`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Interactions"
          value={stats?.summary.totalInteractions || 0}
          subtitle={`${stats?.summary.interactionRate || 0}% of visitors`}
          icon={Zap}
          color="amber"
        />
        <StatCard
          title="Checkouts"
          value={stats?.summary.totalCheckouts || 0}
          subtitle="Completed actions"
          icon={Target}
          color="emerald"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats?.summary.conversionRate || 0}%`}
          subtitle="Views → Checkout"
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CHART */}
        <section className="lg:col-span-2 p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide">Views vs Interactions</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Daily breakdown over the selected period</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22D3EE]"></span>
                <span className="text-[var(--muted)]">Views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[var(--muted)]">Interactions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22D3EE]"></span>
                <span className="text-[var(--muted)]">Checkouts</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <DualLineChart data={stats?.dailyStats || []} />
          </div>
        </section>

        {/* FUNNEL */}
        <section className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide mb-6 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--muted)]" /> Conversion Funnel
          </h3>
          <div className="space-y-4">
            <FunnelStep
              label="Page Views"
              value={stats?.summary.totalViews || 0}
              percent="100%"
              color="bg-[var(--surface)]"
              icon={Users}
            />
            <FunnelStep
              label="Engaged"
              value={stats?.summary.engagedSessions || 0}
              percent={`${stats?.summary.interactionRate || 0}%`}
              color="bg-amber-500/20 text-amber-600"
              icon={MousePointerClick}
            />
            <FunnelStep
              label="Converted"
              value={stats?.summary.totalCheckouts || 0}
              percent={`${stats?.summary.conversionRate || 0}%`}
              color="bg-emerald-500/20 text-emerald-600"
              icon={Target}
            />
          </div>

          {stats && stats.summary.totalViews > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
              <strong>{(100 - parseFloat(stats.summary.interactionRate)).toFixed(0)}%</strong> of visitors leave without interacting.
            </div>
          )}
        </section>
      </div>

      {/* ENGAGEMENT METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time on Page */}
        <section className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Time on Page
          </h4>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-[var(--text)]">
              {stats?.summary?.avgTimeOnPage ? formatTime(stats.summary.avgTimeOnPage) : "0s"}
            </span>
            <span className="text-sm text-[var(--muted)]">average</span>
          </div>
          <div className="space-y-2">
            {Object.entries(stats?.summary?.timeBuckets || {}).map(([bucket, count]) => (
              <div key={bucket} className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)] w-16">{bucket}</span>
                <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22D3EE] rounded-full"
                    style={{ width: `${stats?.summary?.totalViews ? (count as number / stats.summary.totalViews * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-[var(--muted)] w-8">{count as number}</span>
              </div>
            ))}
            {!stats?.summary?.timeBuckets || Object.keys(stats.summary.timeBuckets).length === 0 && (
              <p className="text-xs text-[var(--muted)] italic">No data yet</p>
            )}
          </div>
        </section>

        {/* Scroll Depth */}
        <section className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Scroll Depth
          </h4>
          <div className="space-y-3">
            {[25, 50, 75, 100].map((depth) => {
              const count = (stats?.summary?.scrollDepth as Record<number, number>)?.[depth] || 0;
              const percent = stats?.summary?.totalViews ? Math.round((count / stats.summary.totalViews) * 100) : 0;
              return (
                <div key={depth} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)] w-10">{depth}%</span>
                  <div className="flex-1 h-3 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        depth === 100 ? "bg-emerald-500" : depth >= 75 ? "bg-blue-500" : depth >= 50 ? "bg-amber-500" : "bg-[#22D3EE]"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[var(--muted)] w-12">{percent}%</span>
                </div>
              );
            })}
            {!stats?.summary?.scrollDepth && (
              <p className="text-xs text-[var(--muted)] italic">No data yet</p>
            )}
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-3 pt-3 border-t border-[var(--border)]">
            Shows how far down visitors scroll on your pages
          </p>
        </section>
      </div>

      {/* BREAKDOWNS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Devices */}
        <section className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Devices
          </h4>
          <div className="space-y-3">
            {(stats?.devices || []).slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {d.name === "mobile" && <Smartphone className="w-4 h-4 text-rose-500" />}
                  {d.name === "desktop" && <Monitor className="w-4 h-4 text-blue-500" />}
                  {d.name === "tablet" && <Tablet className="w-4 h-4 text-[#22D3EE]" />}
                  {!["mobile", "desktop", "tablet"].includes(d.name) && <Globe className="w-4 h-4 text-[var(--muted)]" />}
                  <span className="text-sm text-[var(--text)] capitalize">{d.name}</span>
                </div>
                <span className="text-sm font-mono font-medium text-[var(--muted)]">{d.percent}%</span>
              </div>
            ))}
            {(!stats?.devices || stats.devices.length === 0) && (
              <p className="text-xs text-[var(--muted)] italic">No data yet</p>
            )}
          </div>
        </section>

        {/* Top Referrers */}
        <section className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-4 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Top Referrers
          </h4>
          <div className="space-y-3">
            {(stats?.referrers || []).slice(0, 5).map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text)] truncate max-w-[150px]">{r.name}</span>
                <span className="text-sm font-mono font-medium text-[var(--muted)]">{r.count}</span>
              </div>
            ))}
            {(!stats?.referrers || stats.referrers.length === 0) && (
              <p className="text-xs text-[var(--muted)] italic">No data yet</p>
            )}
          </div>
        </section>

        {/* Countries */}
        <section className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Top Countries
          </h4>
          <div className="space-y-3">
            {(stats?.countries || []).slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text)]">{c.name}</span>
                <span className="text-sm font-mono font-medium text-[var(--muted)]">{c.count}</span>
              </div>
            ))}
            {(!stats?.countries || stats.countries.length === 0) && (
              <p className="text-xs text-[var(--muted)] italic">No data yet</p>
            )}
          </div>
        </section>
      </div>

      {/* PAGES TABLE */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text)]">Performance by Page</h3>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface)] text-[var(--muted)] uppercase text-xs font-semibold border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3">Page</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Interactions</th>
                <th className="px-4 py-3 text-right">Checkouts</th>
                <th className="px-4 py-3 text-right">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {pagesWithScores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--muted)]">
                    No pages found. Create your first page to start tracking.
                  </td>
                </tr>
              ) : (
                pagesWithScores.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() => setSelectedPage(page)}
                    className="hover:bg-[var(--surface)] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#22D3EE]/20 to-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] text-xs font-bold border border-[#22D3EE]/20">
                          {page.meta.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text)] group-hover:text-[#22D3EE] transition-colors">
                            {page.meta.name}
                          </div>
                          <div className="text-[10px] text-[var(--muted)]">/{page.meta.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {page.meta.published ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Live</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn(
                          "font-bold",
                          page.score >= 70 ? "text-emerald-500" : page.score >= 40 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {page.score}
                        </span>
                        <div className="w-10 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              page.score >= 70 ? "bg-emerald-500" : page.score >= 40 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${page.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-[var(--text)]">
                      {page.stats.views}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-[var(--text)]">
                      {page.stats.interactions}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-[var(--text)]">
                      {page.stats.checkouts}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded",
                        parseFloat(page.convRate) >= 5 ? "bg-emerald-500/10 text-emerald-600" : "text-[var(--muted)]"
                      )}>
                        {page.convRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* NO DATA STATE */}
      {stats && stats.summary.totalViews === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">No analytics data yet</h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              Share your pages to start collecting visitor data
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#22D3EE] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View your pages <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* PAGE DETAILS DRAWER */}
      <PageDetailsDrawer
        page={selectedPage}
        stats={selectedPage && stats?.perPage ? stats.perPage[selectedPage.meta.slug] || null : null}
        onClose={() => setSelectedPage(null)}
        onShare={() => selectedPage && openShareModal(selectedPage.meta.slug)}
      />

      <ShareQrModal
        open={!!shareSlug}
        url={shareUrl}
        loading={shareLoading && !shareUrl}
        onClose={closeShareModal}
      />
    </main>
  );
}

// --- COMPONENTS ---

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  color: "blue" | "emerald" | "cyan" | "amber";
}) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className={cn("p-2.5 rounded-xl border", colors[color], "transition-transform group-hover:scale-110")}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-[var(--text)] tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm font-medium text-[var(--muted)] mt-1">{title}</div>
        <div className="text-[10px] text-[var(--muted)] opacity-70 mt-2 pt-2 border-t border-[var(--border)] border-dashed">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, percent, color, icon: Icon }: {
  label: string;
  value: number;
  percent: string;
  color: string;
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wide font-medium">{label}</div>
          <div className="text-lg font-bold text-[var(--text)]">{value.toLocaleString()}</div>
        </div>
      </div>
      <div className="text-sm font-bold text-[#22D3EE]">{percent}</div>
    </div>
  );
}

function DualLineChart({ data }: { data: DailyStats[] }) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--muted)] text-sm">
        No data for this period
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.views, d.interactions, d.checkouts))) * 1.1 || 1;
  const height = 280;
  const width = 1000;
  const padding = 40;

  const getY = (val: number) => height - padding - ((val / maxVal) * (height - padding * 2));
  const getX = (i: number) => padding + (i / (data.length - 1 || 1)) * (width - padding * 2);

  const pathViews = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.views)}`).join(' ');
  const pathInteractions = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.interactions)}`).join(' ');
  const pathCheckouts = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.checkouts)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1={padding}
          y1={padding + tick * (height - padding * 2)}
          x2={width - padding}
          y2={padding + tick * (height - padding * 2)}
          stroke="var(--border)"
          strokeDasharray="4"
          opacity="0.5"
        />
      ))}

      {/* Area fill for views */}
      <defs>
        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathViews} L${getX(data.length - 1)},${height - padding} L${getX(0)},${height - padding} Z`}
        fill="url(#viewsGrad)"
      />

      {/* Lines */}
      <path d={pathViews} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pathInteractions} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pathCheckouts} fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />

      {/* Data points */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={getX(i)} cy={getY(d.views)} r="4" fill="var(--bg)" stroke="#22D3EE" strokeWidth="2" />
          <circle cx={getX(i)} cy={getY(d.interactions)} r="3" fill="var(--bg)" stroke="#10b981" strokeWidth="2" />
          <circle cx={getX(i)} cy={getY(d.checkouts)} r="3" fill="var(--bg)" stroke="#22D3EE" strokeWidth="2" />
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={getX(i)}
          y={height - 10}
          textAnchor="middle"
          className="text-[10px] fill-[var(--muted)]"
        >
          {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  );
}

function PageDetailsDrawer({ page, stats, onClose, onShare }: {
  page: Page | null;
  stats: PageStats | null;
  onClose: () => void;
  onShare: () => void;
}) {
  if (!page) return null;

  const s = stats || {
    views: 0, uniqueVisitors: 0, interactions: 0, checkouts: 0,
    avgRating: 0, ratingsCount: 0, devices: {}, referrers: {}, countries: {}, interactionTypes: {}, checkoutMethods: {}
  };

  const convRate = s.views > 0 ? ((s.checkouts / s.views) * 100).toFixed(1) : "0";
  const interactRate = s.views > 0 ? ((s.interactions / s.views) * 100).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)]/30 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">{page.meta.name}</h2>
            <a href={`/p/${page.meta.slug}`} target="_blank" className="text-xs text-[#22D3EE] hover:underline flex items-center gap-1 mt-1">
              /p/{page.meta.slug} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface)] rounded-full text-[var(--muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--surface)]/50 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-xs mb-1">Views</div>
              <div className="text-2xl font-bold text-[var(--text)]">{s.views.toLocaleString()}</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">{s.uniqueVisitors} unique</div>
            </div>
            <div className="p-4 bg-[var(--surface)]/50 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-xs mb-1">Conversion</div>
              <div className="text-2xl font-bold text-[var(--text)]">{convRate}%</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">{s.checkouts} checkouts</div>
            </div>
          </div>

          {/* Funnel */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] mb-4">Page Funnel</h3>
            <div className="space-y-2">
              <FunnelBar label="Views" value={s.views} max={s.views} color="bg-[#22D3EE]" />
              <FunnelBar label="Interactions" value={s.interactions} max={s.views} color="bg-amber-500" />
              <FunnelBar label="Checkouts" value={s.checkouts} max={s.views} color="bg-emerald-500" />
            </div>
          </div>

          {/* Interaction Types */}
          {Object.keys(s.interactionTypes).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] mb-4">Interaction Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(s.interactionTypes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="text-[var(--muted)] capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-[var(--text)]">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Rating */}
          {s.ratingsCount > 0 && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-xl font-bold text-[var(--text)]">{s.avgRating.toFixed(1)}</span>
                <span className="text-sm text-[var(--muted)]">({s.ratingsCount} ratings)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)]/30 flex gap-3 shrink-0">
          <Link
            href={`/editor/${page.id}`}
            className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--text)] text-sm font-medium"
          >
            <Edit className="w-4 h-4" /> Edit Page
          </Link>
          <button
            onClick={onShare}
            className="flex-1 bg-[#22D3EE] text-white py-2.5 flex items-center justify-center gap-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = max > 0 ? (value / max * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
        <span>{label}</span>
        <span>{value.toLocaleString()} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
