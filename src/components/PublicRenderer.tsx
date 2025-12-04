"use client";

import { useMemo, useEffect, useState, RefObject, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, Clock, Plus, Minus, ShoppingBag, Wifi, Phone, Mail, ChevronUp, ChevronDown, X, Facebook, Instagram, Youtube, Globe, MessageCircle, Star, Send } from "lucide-react";
import { trackPageView, trackInteraction, trackCheckout, trackSectionOpen, trackSearch, initAnalytics, startTimeTracking } from "@/lib/analytics";

import Image, { ImageLoaderProps } from "next/image";

// --- Cloudinary URL helpers ---

// 1. DYNAMIC LOADER for Next.js <Image> (Replaces manual width calculations)
function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src) return "";
  // If not cloudinary, return as is
  if (!src.includes("res.cloudinary.com")) return src;

  // Find the upload path to inject params
  const i = src.indexOf('/upload/');
  if (i === -1) return src;

  // Params: Auto format, Auto quality (eco for speed), Limit width to Next.js requested width
  // q_auto:good provides slightly better compression than default q_auto with virtually no visual difference
  const params = ['f_auto', 'q_auto:good', 'c_limit', `w_${width}`];
  if (quality) params.push(`q_${quality}`);

  const prefix = src.slice(0, i + 8); // keep "/upload/"
  const suffix = src.slice(i + 8);

  return `${prefix}${params.join(',')}/${suffix}`;
}

// 2. Helper for raw strings (e.g. Video Posters, non-Next images)
function cldImg(url: string, opts?: { w?: number; h?: number; fit?: 'fill' | 'contain' | 'cover' }) {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;

  const i = url.indexOf('/upload/');
  if (i === -1) return url;

  const w = opts?.w ? `w_${opts.w}` : '';
  const h = opts?.h ? `h_${opts.h}` : '';
  const c = opts?.fit ? `c_${opts.fit}` : 'c_limit'; // Default to limit to preserve aspect if not specified

  // Clean up empty params
  const base = ['f_auto', 'q_auto:good', c, w, h].filter(Boolean).join(',');

  const prefix = url.slice(0, i + 8);
  const suffix = url.slice(i + 8);
  return `${prefix}${base}/${suffix}`;
}

function cldVideo(url: string, w = 1280) {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;

  const i = url.indexOf('/upload/');
  if (i === -1) return url;

  const base = `f_auto,vc_auto,q_auto:good,w_${w}`;
  const prefix = url.slice(0, i + 8);
  const suffix = url.slice(i + 8);
  return `${prefix}${base}/${suffix}`;
}

/* ---------------- Types ---------------- */
type ItemRow = {
  id: string;
  label: string;
  price: number | null;
  note?: string;
  imageUrl?: string;
  simpleSectionId?: string;
  hidden?: boolean;
  soldOut?: boolean;
  badge?: string;
  unit?: string;
  customUnit?: string;
  discountPercent?: number;
  // imageLayout is now controlled globally via meta.imageLayout (Design tab)
  actionUrl?: string;
  actionLabel?: string;
  duration?: string; // e.g. "30 min", "1h", etc.
  pricePrefix?: string; // e.g. "from", "starting at"
};

type SimpleSection = {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  collapsed?: boolean;
};

type PublicRendererProps = {
  calc: any;
  scrollContainer?: RefObject<HTMLElement | null>;
};

// --- THEME DEFINITIONS ---
// Each theme needs: bg, surface, card, text, muted, border, brand colors
// PLUS: glass (for glassmorphism), alternate (for section zebra), overlay (for modals)
const THEMES: Record<string, any> = {
  tierless: {
    "--bg": "#020617",           // Slate 950 - Canvas (darkest)
    "--surface": "#0f172a",      // Slate 900 - Surface layer
    "--card": "#1e293b",         // Slate 800 - Card layer (lightest)
    "--text": "#f8fafc",         // Almost white
    "--muted": "#94a3b8",        // Slate 400
    "--border": "rgba(255, 255, 255, 0.08)",
    "--glass": "rgba(255, 255, 255, 0.1)",    // For glassmorphism buttons
    "--glass-hover": "rgba(255, 255, 255, 0.15)",
    "--alternate": "rgba(255, 255, 255, 0.03)", // Section zebra
    "--overlay": "rgba(0, 0, 0, 0.6)",         // Modal backdrop
    "--brand-1": "#4F46E5",
    "--brand-2": "#22D3EE",
    "--isDark": "1",
  },
  minimal: {
    "--bg": "#f1f5f9",           // Slate 100 - Gray canvas (NOT white!)
    "--surface": "#f8fafc",      // Slate 50 - Lighter surface
    "--card": "#ffffff",         // Pure white cards "float"
    "--text": "#0f172a",         // Slate 900
    "--muted": "#64748b",        // Slate 500
    "--border": "#e2e8f0",       // Slate 200
    "--glass": "rgba(0, 0, 0, 0.04)",
    "--glass-hover": "rgba(0, 0, 0, 0.08)",
    "--alternate": "rgba(0, 0, 0, 0.02)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#0f172a",
    "--brand-2": "#334155",
    "--isDark": "0",
  },
  midnight: {
    "--bg": "#09090b",           // Zinc 950 - Warm near-black
    "--surface": "#18181b",      // Zinc 900
    "--card": "#27272a",         // Zinc 800
    "--text": "#fafafa",
    "--muted": "#a1a1aa",
    "--border": "rgba(255, 255, 255, 0.08)",
    "--glass": "rgba(255, 255, 255, 0.08)",
    "--glass-hover": "rgba(255, 255, 255, 0.12)",
    "--alternate": "rgba(255, 255, 255, 0.02)",
    "--overlay": "rgba(0, 0, 0, 0.7)",
    "--brand-1": "#fafafa",
    "--brand-2": "#d4d4d8",
    "--isDark": "1",
  },
  luxury: {
    "--bg": "#0a0a0a",           // Near black with warmth
    "--surface": "#171717",
    "--card": "#262626",
    "--text": "#d4af37",         // Gold
    "--muted": "#a3a3a3",
    "--border": "rgba(212, 175, 55, 0.2)",
    "--glass": "rgba(212, 175, 55, 0.1)",
    "--glass-hover": "rgba(212, 175, 55, 0.15)",
    "--alternate": "rgba(212, 175, 55, 0.03)",
    "--overlay": "rgba(0, 0, 0, 0.8)",
    "--brand-1": "#d4af37",
    "--brand-2": "#f5d77a",
    "--isDark": "1",
  },
  elegant: {
    "--bg": "#faf8f5",           // Warm off-white
    "--surface": "#f5f3f0",
    "--card": "#ffffff",
    "--text": "#292524",         // Stone 800
    "--muted": "#78716c",        // Stone 500
    "--border": "#e7e5e4",
    "--glass": "rgba(0, 0, 0, 0.03)",
    "--glass-hover": "rgba(0, 0, 0, 0.06)",
    "--alternate": "rgba(0, 0, 0, 0.015)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#b8860b",      // Dark goldenrod
    "--brand-2": "#d4a84b",
    "--isDark": "0",
  },
  cafe: {
    "--bg": "#f5f5f0",           // Warm cream
    "--surface": "#edebe5",
    "--card": "#fefefe",
    "--text": "#3f3f3f",
    "--muted": "#737373",
    "--border": "#e5e3dc",
    "--glass": "rgba(0, 0, 0, 0.03)",
    "--glass-hover": "rgba(0, 0, 0, 0.06)",
    "--alternate": "rgba(139, 69, 19, 0.03)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#92400e",
    "--brand-2": "#b45309",
    "--isDark": "0",
  },
  ocean: {
    "--bg": "#f0f9ff",           // Sky 50
    "--surface": "#e0f2fe",      // Sky 100
    "--card": "#ffffff",
    "--text": "#0c4a6e",         // Sky 900
    "--muted": "#64748b",
    "--border": "#bae6fd",
    "--glass": "rgba(14, 165, 233, 0.08)",
    "--glass-hover": "rgba(14, 165, 233, 0.12)",
    "--alternate": "rgba(14, 165, 233, 0.04)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#0284c7",
    "--brand-2": "#0ea5e9",
    "--isDark": "0",
  },
  forest: {
    "--bg": "#f0fdf4",           // Green 50
    "--surface": "#dcfce7",      // Green 100
    "--card": "#ffffff",
    "--text": "#14532d",         // Green 900
    "--muted": "#4b5563",
    "--border": "#bbf7d0",
    "--glass": "rgba(34, 197, 94, 0.08)",
    "--glass-hover": "rgba(34, 197, 94, 0.12)",
    "--alternate": "rgba(34, 197, 94, 0.04)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#15803d",
    "--brand-2": "#22c55e",
    "--isDark": "0",
  },
  sunset: {
    "--bg": "#fff1f2",           // Rose 50
    "--surface": "#ffe4e6",
    "--card": "#ffffff",
    "--text": "#881337",
    "--muted": "#9f1239",
    "--border": "#fecdd3",
    "--glass": "rgba(244, 63, 94, 0.08)",
    "--glass-hover": "rgba(244, 63, 94, 0.12)",
    "--alternate": "rgba(244, 63, 94, 0.04)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#e11d48",
    "--brand-2": "#f43f5e",
    "--isDark": "0",
  },
  rosegold: {
    "--bg": "#fef3f2",
    "--surface": "#fee2e2",
    "--card": "#ffffff",
    "--text": "#7f1d1d",
    "--muted": "#b91c1c",
    "--border": "#fecaca",
    "--glass": "rgba(225, 29, 72, 0.06)",
    "--glass-hover": "rgba(225, 29, 72, 0.1)",
    "--alternate": "rgba(225, 29, 72, 0.03)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#e0a899",
    "--brand-2": "#d4af37",
    "--isDark": "0",
  },
  emerald: {
    "--bg": "#052e16",           // Green 950
    "--surface": "#14532d",      // Green 900
    "--card": "#166534",         // Green 800
    "--text": "#d4af37",         // Gold accent
    "--muted": "#86efac",        // Green 300
    "--border": "rgba(212, 175, 55, 0.15)",
    "--glass": "rgba(212, 175, 55, 0.1)",
    "--glass-hover": "rgba(212, 175, 55, 0.15)",
    "--alternate": "rgba(212, 175, 55, 0.03)",
    "--overlay": "rgba(0, 0, 0, 0.7)",
    "--brand-1": "#d4af37",
    "--brand-2": "#22c55e",
    "--isDark": "1",
  },
  sapphire: {
    "--bg": "#0c1222",           // Deep blue-black
    "--surface": "#1e293b",      // Slate 800
    "--card": "#334155",         // Slate 700
    "--text": "#e2e8f0",         // Slate 200
    "--muted": "#94a3b8",
    "--border": "rgba(96, 165, 250, 0.15)",
    "--glass": "rgba(96, 165, 250, 0.1)",
    "--glass-hover": "rgba(96, 165, 250, 0.15)",
    "--alternate": "rgba(96, 165, 250, 0.03)",
    "--overlay": "rgba(0, 0, 0, 0.7)",
    "--brand-1": "#60a5fa",
    "--brand-2": "#93c5fd",
    "--isDark": "1",
  },
  obsidian: {
    "--bg": "#09090b",           // Zinc 950 - NOT pure black
    "--surface": "#18181b",      // Zinc 900
    "--card": "#27272a",         // Zinc 800
    "--text": "#fafafa",
    "--muted": "#a1a1aa",
    "--border": "rgba(255, 255, 255, 0.06)",
    "--glass": "rgba(255, 255, 255, 0.06)",
    "--glass-hover": "rgba(255, 255, 255, 0.1)",
    "--alternate": "rgba(255, 255, 255, 0.02)",
    "--overlay": "rgba(0, 0, 0, 0.75)",
    "--brand-1": "#fafafa",
    "--brand-2": "#d4d4d8",
    "--isDark": "1",
  },
  goldluxury: {
    "--bg": "#0a0a0a",           // Rich black
    "--surface": "#141414",
    "--card": "#1f1f1f",
    "--text": "#d4af37",         // Gold
    "--muted": "#a3a3a3",
    "--border": "rgba(212, 175, 55, 0.15)",
    "--glass": "rgba(212, 175, 55, 0.08)",
    "--glass-hover": "rgba(212, 175, 55, 0.12)",
    "--alternate": "rgba(212, 175, 55, 0.02)",
    "--overlay": "rgba(0, 0, 0, 0.8)",
    "--brand-1": "#f4d03f",
    "--brand-2": "#d4af37",
    "--isDark": "1",
  },
  // Light mode alias
  light: {
    "--bg": "#f1f5f9",
    "--surface": "#f8fafc",
    "--card": "#ffffff",
    "--text": "#0f172a",
    "--muted": "#64748b",
    "--border": "#e2e8f0",
    "--glass": "rgba(0, 0, 0, 0.04)",
    "--glass-hover": "rgba(0, 0, 0, 0.08)",
    "--alternate": "rgba(0, 0, 0, 0.02)",
    "--overlay": "rgba(0, 0, 0, 0.5)",
    "--brand-1": "#0f172a",
    "--brand-2": "#334155",
    "--isDark": "0",
  },
  // Dark mode alias
  dark: {
    "--bg": "#09090b",
    "--surface": "#18181b",
    "--card": "#27272a",
    "--text": "#fafafa",
    "--muted": "#a1a1aa",
    "--border": "rgba(255, 255, 255, 0.06)",
    "--glass": "rgba(255, 255, 255, 0.06)",
    "--glass-hover": "rgba(255, 255, 255, 0.1)",
    "--alternate": "rgba(255, 255, 255, 0.02)",
    "--overlay": "rgba(0, 0, 0, 0.75)",
    "--brand-1": "#fafafa",
    "--brand-2": "#d4d4d8",
    "--isDark": "1",
  },
};

const BADGE_LABELS: Record<string, string> = {
  popular: "⭐ Popular",
  spicy: "🌶️ Spicy",
  vegan: "🌱 Vegan",
  new: "🔥 New",
  sale: "💰 -20%",
  chef: "👨‍🍳 Chef's",
  gf: "Gluten Free"
};

const BADGE_STYLES: Record<string, string> = {
  popular: "bg-yellow-100 text-yellow-800 border-yellow-200",
  spicy: "bg-red-100 text-red-800 border-red-200",
  vegan: "bg-green-100 text-green-800 border-green-200",
  new: "bg-orange-100 text-orange-800 border-orange-200",
  sale: "bg-blue-100 text-blue-800 border-blue-200",
  chef: "bg-slate-100 text-slate-800 border-slate-200",
  gf: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

// WiFi Display Component
function WifiDisplay({ ssid, password }: { ssid: string; password?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  if (!password) {
    return (
      <span className="flex items-center gap-1.5 bg-[var(--glass)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)]">
        <Wifi className="w-3.5 h-3.5" />
        <span>{ssid}</span>
      </span>
    );
  }
  return (
    <button
      onClick={() => setShowPassword(!showPassword)}
      className="flex items-center gap-1.5 bg-[var(--glass)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--glass-hover)] transition cursor-pointer group"
    >
      <Wifi className="w-3.5 h-3.5" />
      <span className="flex items-center gap-1.5">
        <span>{ssid}</span>
        <span className="opacity-50">•</span>
        {showPassword ? <span>{password}</span> : <span className="text-xs opacity-70 group-hover:opacity-100 transition">Click to show password</span>}
      </span>
    </button>
  );
}

function WifiDisplayThemed({ ssid, password }: { ssid: string; password?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  if (!password) {
    return (
      <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full">
        <Wifi className="w-4 h-4 text-[var(--brand-1)]" />
        <span>{ssid}</span>
      </span>
    );
  }
  return (
    <button
      onClick={() => setShowPassword(!showPassword)}
      className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition cursor-pointer group"
    >
      <Wifi className="w-4 h-4 text-[var(--brand-1)]" />
      <span className="flex items-center gap-1.5">
        <span>{ssid}</span>
        <span className="opacity-50">•</span>
        {showPassword ? <span>{password}</span> : <span className="text-xs opacity-70 group-hover:opacity-100 transition">Click to show password</span>}
      </span>
    </button>
  );
}



function RatingWidget({ pageId, initialAvg, initialCount, initialUserScore, allowRating }: { pageId: string; initialAvg: number; initialCount: number; initialUserScore: number; allowRating: boolean }) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [userScore, setUserScore] = useState(initialUserScore);
  const [hoverScore, setHoverScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch latest status on mount to get user's rating if not provided or stale
  useEffect(() => {
    if (!allowRating) return;
    fetch(`/api/rating/status?pageId=${pageId}`)
      .then(res => res.json())
      .then(data => {
        if (data.avg !== undefined) {
          setAvg(data.avg);
          setCount(data.count);
          setUserScore(data.userScore);
        }
      })
      .catch(console.error);
  }, [pageId, allowRating]);

  if (!allowRating) return null;

  const handleRate = async (score: number) => {
    if (loading) return;

    // Optimistic update
    const prevUserScore = userScore;
    const prevAvg = avg;
    const prevCount = count;

    setUserScore(score);
    // Simple optimistic math: remove old score if exists, add new
    let newTotal = prevAvg * prevCount;
    let newCount = prevCount;

    if (prevUserScore > 0) {
      newTotal -= prevUserScore;
    } else {
      newCount += 1;
    }
    newTotal += score;
    const newAvg = newCount > 0 ? newTotal / newCount : 0;

    setAvg(newAvg);
    setCount(newCount);
    setLoading(true);

    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, score }),
      });
      const data = await res.json();
      if (data.ok) {
        setAvg(data.avg);
        setCount(data.count);
        setUserScore(data.userScore);
      } else {
        // Rollback
        setUserScore(prevUserScore);
        setAvg(prevAvg);
        setCount(prevCount);
      }
    } catch (err) {
      // Rollback
      setUserScore(prevUserScore);
      setAvg(prevAvg);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 group/rating">
      <div className="flex items-center gap-0.5 bg-[var(--glass)] backdrop-blur-md px-2 py-1 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--glass-hover)]">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            className="p-0.5 focus:outline-none transition-transform hover:scale-110"
            title={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                (hoverScore || userScore) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-white/40 fill-transparent"
              )}
            />
          </button>
        ))}
      </div>
      <div className="text-xs font-medium text-white/80 flex flex-col leading-tight">
        <span className="flex items-center gap-1">
          <span className="text-white font-bold">{avg.toFixed(1)}</span>
          <span className="opacity-60">({count})</span>
        </span>
        {userScore > 0 && <span className="text-[10px] opacity-60">Your rating: {userScore}</span>}
      </div>
    </div>
  );
}

function RatingWidgetThemed({ pageId, initialAvg, initialCount, initialUserScore, allowRating }: { pageId: string; initialAvg: number; initialCount: number; initialUserScore: number; allowRating: boolean }) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [userScore, setUserScore] = useState(initialUserScore);
  const [hoverScore, setHoverScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!allowRating) return;
    fetch(`/api/rating/status?pageId=${pageId}`)
      .then(res => res.json())
      .then(data => {
        if (data.avg !== undefined) {
          setAvg(data.avg);
          setCount(data.count);
          setUserScore(data.userScore);
        }
      })
      .catch(console.error);
  }, [pageId, allowRating]);

  if (!allowRating) return null;

  const handleRate = async (score: number) => {
    if (loading) return;
    const prevUserScore = userScore;
    const prevAvg = avg;
    const prevCount = count;
    setUserScore(score);
    let newTotal = prevAvg * prevCount;
    let newCount = prevCount;
    if (prevUserScore > 0) newTotal -= prevUserScore;
    else newCount += 1;
    newTotal += score;
    const newAvg = newCount > 0 ? newTotal / newCount : 0;
    setAvg(newAvg);
    setCount(newCount);
    setLoading(true);

    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, score }),
      });
      const data = await res.json();
      console.log("[Rating] API response:", data, "Status:", res.status);
      if (data.ok) {
        setAvg(data.avg);
        setCount(data.count);
        setUserScore(data.userScore);
      } else {
        console.warn("[Rating] API returned not ok, rolling back");
        setUserScore(prevUserScore);
        setAvg(prevAvg);
        setCount(prevCount);
      }
    } catch (err) {
      console.error("[Rating] API error:", err);
      setUserScore(prevUserScore);
      setAvg(prevAvg);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 group/rating justify-center sm:justify-start">
      <div className="flex items-center gap-0.5 bg-[var(--card)] px-2 py-1 rounded-lg border border-[var(--border)] transition-colors hover:border-[var(--brand-1)]">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            className="p-0.5 focus:outline-none transition-transform hover:scale-110"
            title={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                (hoverScore || userScore) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-[var(--muted)] fill-transparent"
              )}
            />
          </button>
        ))}
      </div>
      <div className="text-xs font-medium text-[var(--muted)] flex flex-col leading-tight text-left">
        <span className="flex items-center gap-1">
          <span className="text-[var(--text)] font-bold">{avg.toFixed(1)}</span>
          <span className="opacity-60">({count})</span>
        </span>
        {userScore > 0 && <span className="text-[10px] opacity-60">Your rating: {userScore}</span>}
      </div>
    </div>
  );
}

export default function PublicRenderer({ calc, scrollContainer }: PublicRendererProps) {
  const meta = calc?.meta || {};
  const i18n = calc?.i18n || {};
  const items: ItemRow[] = calc?.items || [];

  // Analytics page ID
  const pageId = meta.slug || calc?.id || "unknown";

  const business = meta.business || {};
  const simpleCoverImage = business.coverUrl || meta.simpleCoverImage || "";
  const simpleLogo = business.logoUrl || "";
  const simpleTitle = meta.simpleTitle || "Menu";

  const themeName = (meta.theme || "tierless").toLowerCase();
  let activeKey = themeName;
  if (activeKey === 'classic') activeKey = 'minimal';
  if (activeKey === 'light') activeKey = 'minimal';
  if (activeKey === 'dark') activeKey = 'midnight';

  const activeTheme = THEMES[activeKey] || THEMES["tierless"];
  const isTierlessTheme = activeKey === "tierless";
  const isLuxuryTheme = activeKey === "luxury" || activeKey === "elegant";

  const customBg = meta.simpleBg;
  const customText = meta.simpleTextColor;

  const themeStyles = {
    ...activeTheme,
    ...(customBg ? { "--bg": customBg, "--card": customBg } : {}),
    ...(customText ? { "--text": customText } : {}),
  } as React.CSSProperties;

  const simpleBorderColor = meta.simpleBorderColor || activeTheme["--border"];

  const fontClass = isLuxuryTheme
    ? "font-serif"
    : (meta.simpleFont === "mono" ? "font-mono" : meta.simpleFont === "rounded" ? "font-sans rounded-none" : "font-sans");

  const spacingMode = meta.simpleSpacing || "cozy";
  const showBadge = meta.simpleShowBadge ?? true;
  const allowSelection = meta.simpleAllowSelection ?? false;
  const enableCalculations = meta.simpleEnableCalculations ?? false;
  const addCheckout = meta.simpleAddCheckout ?? false;
  const checkoutButtonText = meta.checkoutButtonText || "Checkout";
  const showUnits = meta.simpleShowUnits ?? false;
  const imageLayout = meta.imageLayout || 'cover'; // 'cover' | 'thumbnail' - global layout setting
  const layoutMode = meta.layoutMode || 'scroll'; // 'scroll' | 'accordion'
  const accordionSolo = layoutMode === 'accordion'
    ? (meta.layoutAccordionSolo ?? true) // default to single-open behavior in accordion
    : (meta.layoutAccordionSolo ?? false);

  const currency = i18n.currency || "";
  const decimals = typeof i18n.decimals === "number" ? i18n.decimals : 0;

  const simpleSections: SimpleSection[] = meta.simpleSections || [];

  const { unsectioned, bySection } = useMemo(() => {
    const unsec: ItemRow[] = [];
    const map = new Map<string, ItemRow[]>();
    items.forEach(it => {
      if (it.hidden) return;
      if (it.simpleSectionId) {
        if (!map.has(it.simpleSectionId)) map.set(it.simpleSectionId, []);
        map.get(it.simpleSectionId)!.push(it);
      } else {
        unsec.push(it);
      }
    });
    return { unsectioned: unsec, bySection: map };
  }, [items]);

  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Track search with debounce
  useEffect(() => {
    if (!search || search.length < 2) return;
    const timeout = setTimeout(() => {
      trackSearch(pageId, search);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [search, pageId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const wasOpen = prev.has(sectionId);

      // Track section open (only when opening, not closing)
      if (!wasOpen) {
        trackSectionOpen(pageId, sectionId);
      }

      if (accordionSolo) {
        // Solo mode: if clicking already open, close it (empty set). If clicking closed, open ONLY it.
        if (wasOpen) return new Set();
        return new Set([sectionId]);
      }
      // Normal mode: toggle
      const next = new Set(prev);
      if (wasOpen) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Offset for sticky header
      const y = el.getBoundingClientRect().top + window.pageYOffset - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);

      // If Accordion mode, expand the section we jumped to
      if (layoutMode === 'accordion') {
        const sectionId = id.replace('sec-', '');
        if (sectionId !== 'uncategorized') {
          setExpandedSections(prev => {
            if (accordionSolo) return new Set([sectionId]);
            const next = new Set(prev);
            next.add(sectionId);
            return next;
          });
        }
      }
    }
  };

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemRow | null>(null);
  const cartTargetRef = useRef<HTMLDivElement | null>(null);

  // Flying dot animation state
  const [flyingDots, setFlyingDots] = useState<Array<{ id: string; fromX: number; fromY: number; deltaX: number; deltaY: number }>>([]);

  const triggerFlyingDot = (event: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dotId = `dot-${Date.now()}-${Math.random()}`;

    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const targetRect = cartTargetRef.current?.getBoundingClientRect();
    const targetX = targetRect ? (targetRect.left + targetRect.width / 2) : window.innerWidth / 2;
    const targetY = targetRect ? (targetRect.top + targetRect.height / 2) : window.innerHeight - 80;

    setFlyingDots(prev => [
      ...prev,
      {
        id: dotId,
        fromX: startX,
        fromY: startY,
        deltaX: targetX - startX,
        deltaY: targetY - startY,
      },
    ]);

    // Remove dot after animation completes
    setTimeout(() => {
      setFlyingDots(prev => prev.filter(d => d.id !== dotId));
    }, 600);
  };

  const totalAmount = useMemo(() => {
    let sum = 0;
    items.forEach(it => {
      const qty = quantities[it.id] || 0;
      if (qty > 0 && it.price) {
        const discount = it.badge === 'sale' ? (it.discountPercent || 0) : 0;
        const price = it.price * (1 - discount / 100);
        sum += price * qty;
      }
    });
    return sum;
  }, [items, quantities]);

  const totalCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  // Read contact info from meta.contact (injected by Publish) OR meta.contactOverride (Editor Preview)
  const rawContact = (meta?.contact || meta?.contactOverride || {}) as any;

  // Normalize if it's from override (which uses generic 'value')
  const contact = { ...rawContact };
  if (rawContact.value && rawContact.type) {
    if (rawContact.type === 'whatsapp') contact.whatsapp = rawContact.value;
    if (rawContact.type === 'telegram') contact.telegram = rawContact.value;
    if (rawContact.type === 'email') contact.email = rawContact.value;
  }

  const contactEmail = (contact.email || "").trim();
  const contactWhatsapp = (contact.whatsapp || "").replace(/[^\d]/g, "");
  const contactTelegram = (contact.telegram || "").replace(/^@/, "");

  const resolvedContactType = (() => {
    const normalized = (contact.type || "").toLowerCase();

    if (normalized === "whatsapp" && contactWhatsapp) return "whatsapp";
    if (normalized === "telegram" && contactTelegram) return "telegram";
    if (normalized === "email" && contactEmail) return "email";

    if (contactWhatsapp) return "whatsapp";
    if (contactTelegram) return "telegram";
    if (contactEmail) return "email";

    return "";
  })();

  // Debug visibility
  console.log("[PublicRenderer] Checkout Debug:", {
    addCheckout,
    resolvedContactType,
    contactSource: meta?.contact ? "meta.contact" : (meta?.contactOverride ? "meta.contactOverride" : "none"),
    contact
  });

  const handleCheckout = () => {
    console.log("Checkout Contact:", contact);

    if (!resolvedContactType) {
      alert("Order destination is not configured yet.");
      return;
    }

    const selectedItems = items.filter((it) => (quantities[it.id] || 0) > 0);
    if (!selectedItems.length) {
      alert("Add at least one item to your order first.");
      return;
    }

    const lines: string[] = [];
    lines.push(`New order from ${simpleTitle}`);
    lines.push("");
    selectedItems.forEach((item) => {
      const qty = quantities[item.id] || 0;
      const discount = item.badge === "sale" ? (item.discountPercent || 0) : 0;
      const price = (item.price || 0) * (1 - discount / 100);
      lines.push(`${formatQuantityDisplay(qty)} x ${item.label} - ${formatPrice(price * qty)}`);
    });
    lines.push("");
    lines.push(`Total: ${formatPrice(totalAmount)}`);

    const encodedMessage = encodeURIComponent(lines.join("\n"));

    const sendEmail = () => {
      if (!contactEmail) {
        alert("Contact email is not available yet.");
        return;
      }
      setCartOpen(false);
      trackCheckout(pageId, "email");
      setQuantities({});
      const subject = encodeURIComponent(`${simpleTitle} order`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${encodedMessage}`;
    };

    const sendWhatsapp = () => {
      if (!contactWhatsapp) {
        if (contactTelegram) {
          sendTelegram();
          return;
        }
        sendEmail();
        return;
      }
      setCartOpen(false);
      trackCheckout(pageId, "whatsapp");
      setQuantities({});
      window.open(`https://wa.me/${contactWhatsapp}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
    };

    const sendTelegram = () => {
      if (!contactTelegram) {
        sendEmail();
        return;
      }
      setCartOpen(false);
      trackCheckout(pageId, "telegram");
      setQuantities({});
      window.open(`https://t.me/${contactTelegram}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
    };

    switch (resolvedContactType) {
      case "whatsapp":
        sendWhatsapp();
        break;
      case "telegram":
        sendTelegram();
        break;
      default:
        sendEmail();
    }
  };

  // Button styling based on contact preference
  const getCheckoutButtonStyle = () => {
    // Priority 1: Custom button text from meta.buttonText or meta.checkoutButtonText
    const customText = meta.buttonText || meta.checkoutButtonText || "";

    const baseClasses = "relative overflow-hidden py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 group";

    switch (resolvedContactType) {
      case "whatsapp":
        return {
          className: `${baseClasses} bg-gradient-to-br from-[#11998e] to-[#38ef7d] shadow-[#11998e]/30`,
          text: customText || "Checkout",
          icon: <MessageCircle className="w-4 h-4" />,
        };
      case "telegram":
        return {
          className: `${baseClasses} bg-gradient-to-br from-[#0088cc] to-[#005f8f] shadow-[#0088cc]/30`,
          text: customText || "Checkout",
          icon: <Send className="w-4 h-4" />,
        };
      default:
        if (!contactEmail) {
          return null;
        }
        return {
          className: `${baseClasses} bg-gradient-to-br from-[#1f2937] to-[#000000] shadow-black/30`,
          text: customText || "Checkout",
          icon: <Mail className="w-4 h-4" />,
        };
    }
  };

  const checkoutButtonConfig = getCheckoutButtonStyle();
  const canShowCheckoutButton = addCheckout && !!checkoutButtonConfig;

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const setQuantity = (id: string, value: number, interactionType?: "qty_plus" | "qty_minus") => {
    setQuantities(prev => {
      // Track interaction
      if (interactionType) {
        trackInteraction(pageId, interactionType);
      }
      // Allow 0 to exist so input stays open while typing (e.g. deleting "1" to type "0.5")
      return { ...prev, [id]: value };
    });
  };

  const removeQuantity = (id: string) => {
    setQuantities(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const gapClass = spacingMode === "compact" ? "gap-3" : spacingMode === "relaxed" ? "gap-6" : "gap-4";

  // Analytics: Track page view on mount
  useEffect(() => {
    initAnalytics();
    trackPageView(pageId);
    startTimeTracking(pageId);
  }, [pageId]);

  // Embed Resize Protocol
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sendHeight = () => {
      const height = document.body.scrollHeight;
      // Send to parent window (if embedded)
      window.parent.postMessage({ type: 'tierless-resize', height }, '*');
    };

    // Send initial height
    sendHeight();

    // Observe resizing of the body
    const observer = new ResizeObserver(() => {
      sendHeight();
    });
    observer.observe(document.body);

    // Also listen for image loads which might change height
    window.addEventListener('load', sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', sendHeight);
    };
  }, []);

  useEffect(() => {
    const root = scrollContainer?.current || null;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { root: root, rootMargin: "-20% 0px -60% 0px" });

    const sections = document.querySelectorAll(".section-observer");
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [simpleSections, unsectioned.length, scrollContainer]);

  // scrollToSection is defined above

  const formatPrice = (p: number | null) => {
    if (p === null || p === undefined) return "";
    return p.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + (currency ? ` ${currency}` : "");
  };
  const formatQuantityDisplay = (value: number | undefined | null) => {
    const normalized = typeof value === "number" ? value : 0;
    return Number(normalized.toFixed(2)).toString();
  };

  return (
    <>
      <div
        className={cn("min-h-screen w-full pb-32 transition-colors duration-300", fontClass)}
        style={{
          ...themeStyles,
          backgroundColor: 'var(--bg)',
          color: 'var(--text)'
        }}
      >
        {/* 1. HERO / COVER */}
        <div className="relative w-full bg-[var(--alternate)] group">
          {showBadge && (
            <div className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <a href="/" className="pointer-events-auto group/badge relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer">
                <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#4F46E5_100%)] opacity-80" />
                <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-[#0B0C15]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Powered by Tierless
                  </span>
                </span>
              </a>
            </div>
          )}

          {simpleCoverImage ? (
            <div className="relative w-full h-64 sm:h-80 md:h-[400px] overflow-hidden">
              {/* INSTANT FIX: Removed animate-in fade-in duration-700 to make it appear instantly */}
              <Image
                loader={cloudinaryLoader}
                src={simpleCoverImage}
                alt="Cover"
                fill
                sizes="100vw"
                priority
                fetchPriority="high"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 text-white">
                {simpleLogo && (
                  <div className="w-28 h-28 mb-6 rounded-2xl bg-white p-1.5 shadow-xl overflow-hidden border border-white/20">
                    <Image
                      loader={cloudinaryLoader}
                      src={simpleLogo}
                      alt="Logo"
                      width={224}
                      height={224}
                      priority
                      fetchPriority="high"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                )}
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-3 shadow-black drop-shadow-lg leading-tight">
                  {simpleTitle}
                </h1>
                {business.description && (
                  <p className="text-sm sm:text-base opacity-90 max-w-2xl leading-relaxed mb-4 drop-shadow-md font-medium">
                    {business.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium opacity-90">
                  {business.hours && <span className="flex items-center gap-1.5 bg-[var(--glass)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)]"><Clock className="w-3.5 h-3.5" /> <span>{business.hours}</span></span>}
                  {business.location && <a href={business.location} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[var(--glass)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--glass-hover)] transition cursor-pointer"><MapPin className="w-3.5 h-3.5" /> <span>Location</span></a>}
                  {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 bg-[var(--glass)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--glass-hover)] transition cursor-pointer"><Phone className="w-3.5 h-3.5" /> <span>Call</span></a>}
                  {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 bg-[var(--glass)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--glass-hover)] transition cursor-pointer"><Mail className="w-3.5 h-3.5" /> <span>Email</span></a>}
                  {business.wifiSsid && <WifiDisplay ssid={business.wifiSsid} password={business.wifiPass} />}

                  {/* Social Icons (Hero) */}
                  {business.social && (
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
                      {business.social.instagram && <a href={business.social.instagram} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><Instagram className="w-3.5 h-3.5" /></a>}
                      {business.social.facebook && <a href={business.social.facebook} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><Facebook className="w-3.5 h-3.5" /></a>}
                      {business.social.tiktok && <a href={business.social.tiktok} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><span className="font-bold text-[10px]">Tk</span></a>}
                      {business.social.youtube && <a href={business.social.youtube} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><Youtube className="w-3.5 h-3.5" /></a>}
                      {business.social.whatsapp && <a href={business.social.whatsapp} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><MessageCircle className="w-3.5 h-3.5" /></a>}
                      {business.social.telegram && <a href={business.social.telegram} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><MessageCircle className="w-3.5 h-3.5" /></a>}
                      {business.social.website && <a href={business.social.website} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--glass)] rounded-full hover:bg-[var(--glass-hover)] transition"><Globe className="w-3.5 h-3.5" /></a>}
                    </div>
                  )}
                </div>
                <RatingWidget
                  pageId={meta.slug || ""}
                  initialAvg={meta.avgRating || 0}
                  initialCount={meta.ratingsCount || 0}
                  initialUserScore={0}
                  allowRating={meta.allowRating || false}
                />
              </div>
            </div>
          ) : (
            <div className="px-5 pt-24 pb-10 text-center bg-gradient-to-b from-transparent to-black/5">
              {simpleLogo && (
                <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-[var(--card)] p-1.5 shadow-md overflow-hidden border border-[var(--border)]">
                  <Image
                    loader={cloudinaryLoader}
                    src={simpleLogo}
                    alt="Logo"
                    width={224}
                    height={224}
                    priority
                    fetchPriority="high"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">{simpleTitle}</h1>
              {business.description && (
                <p className="text-[var(--muted)] max-w-xl mx-auto text-base sm:text-lg mb-6 leading-relaxed">
                  {business.description}
                </p>
              )}
              <div className="flex flex-wrap justify-center items-center gap-3 text-sm font-medium text-[var(--muted)] mt-4">
                {business.hours && <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full"><Clock className="w-4 h-4 text-[var(--brand-1)]" /> {business.hours}</span>}
                {business.location && <a href={business.location} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition cursor-pointer"><MapPin className="w-4 h-4" /> Location</a>}
                {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition cursor-pointer"><Phone className="w-4 h-4" /> Call</a>}
                {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition cursor-pointer"><Mail className="w-4 h-4" /> Email</a>}
                {business.wifiSsid && <WifiDisplayThemed ssid={business.wifiSsid} password={business.wifiPass} />}

                {/* Social Icons (Simple Header) */}
                {business.social && (
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--border)]">
                    {business.social.instagram && <a href={business.social.instagram} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><Instagram className="w-4 h-4" /></a>}
                    {business.social.facebook && <a href={business.social.facebook} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><Facebook className="w-4 h-4" /></a>}
                    {business.social.tiktok && <a href={business.social.tiktok} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><span className="font-bold text-[10px]">Tk</span></a>}
                    {business.social.youtube && <a href={business.social.youtube} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><Youtube className="w-4 h-4" /></a>}
                    {business.social.whatsapp && <a href={business.social.whatsapp} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><MessageCircle className="w-4 h-4" /></a>}
                    {business.social.telegram && <a href={business.social.telegram} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><MessageCircle className="w-4 h-4" /></a>}
                    {business.social.website && <a href={business.social.website} target="_blank" rel="noreferrer" className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><Globe className="w-4 h-4" /></a>}
                  </div>
                )}
              </div>
              <RatingWidgetThemed
                pageId={meta.slug || ""}
                initialAvg={meta.avgRating || 0}
                initialCount={meta.ratingsCount || 0}
                initialUserScore={0}
                allowRating={meta.allowRating || false}
              />
            </div>
          )}
        </div>

        {/* 2. STICKY NAVIGATION */}
        {/* 2. STICKY NAVIGATION (For both Scroll and Accordion) */}
        {(simpleSections.length > 0) && (
          <div className="sticky top-0 z-40 w-full bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]/10 shadow-sm py-3 px-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {unsectioned.length > 0 && (
                <button
                  onClick={() => scrollToSection("sec-uncategorized")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border cursor-pointer",
                    activeSection === "sec-uncategorized"
                      ? "bg-[var(--brand-1)] text-[var(--bg)] border-transparent shadow-md transform scale-105"
                      : "bg-[var(--glass)] border-transparent hover:bg-[var(--glass-hover)] text-inherit opacity-70 hover:opacity-100"
                  )}
                >
                  Popular
                </button>
              )}
              {simpleSections.map(s => {
                const hasItems = (bySection.get(s.id)?.length ?? 0) > 0;
                if (!hasItems) return null;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(`sec-${s.id}`)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border cursor-pointer",
                      activeSection === `sec-${s.id}`
                        ? "bg-[var(--brand-1)] text-[var(--bg)] border-transparent shadow-md transform scale-105"
                        : "bg-[var(--glass)] border-transparent hover:bg-[var(--glass-hover)] text-inherit opacity-70 hover:opacity-100"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. MAIN CONTENT */}
        <div className="max-w-full mx-auto px-4 sm:px-8 mt-8 space-y-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)] group-focus-within:text-[var(--brand-1)] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]/50 transition-all text-base shadow-sm placeholder-[var(--muted)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {unsectioned.length > 0 && (
            <div id="sec-uncategorized" className="scroll-mt-32 section-observer">
              <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2 tracking-tight">🔥 Popular</h2>
              <div className={imageLayout === 'thumbnail'
                ? "flex flex-col divide-y divide-[var(--border)] rounded-2xl bg-[var(--card)]/30"
                : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClass}`}>
                {unsectioned
                  .filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()) || it.note?.toLowerCase().includes(search.toLowerCase()))
                  .map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      formatPrice={formatPrice}
                      formatQuantityDisplay={formatQuantityDisplay}
                      borderColor={simpleBorderColor}
                      quantity={quantities[item.id] || 0}
                      onClick={() => setSelectedItem(item)}
                      onQuickAdd={(id: string, step: number, e?: React.MouseEvent) => {
                        const current = quantities[id] || 0;
                        setQuantity(id, current + step);
                        if (e) triggerFlyingDot(e);
                      }}
                      isTierlessTheme={isTierlessTheme}
                      showUnits={showUnits}
                      enableCalculations={enableCalculations}
                      globalImageLayout={imageLayout}
                    />
                  ))}
              </div>
            </div>
          )}

          {simpleSections.map(section => {
            const sItems = bySection.get(section.id) ?? [];
            const visibleItems = sItems.filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()) || it.note?.toLowerCase().includes(search.toLowerCase()));
            if (visibleItems.length === 0 && search) return null;

            // ACCORDION MODE LOGIC
            if (layoutMode === 'accordion') {
              const isExpanded = expandedSections.has(section.id) || !!search; // Always expand if searching

              return (
                <div key={section.id} id={`sec-${section.id}`} className="scroll-mt-32 section-observer">
                  {/* Accordion Header (Clickable) */}
                  <div
                    onClick={() => {
                      const wasOpen = expandedSections.has(section.id);
                      toggleSection(section.id);

                      // If opening in accordion mode, scroll to top after a brief delay
                      // to account for layout shift from other sections closing
                      if (!wasOpen && accordionSolo) {
                        setTimeout(() => {
                          const el = document.getElementById(`sec-${section.id}`);
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.pageYOffset - 140;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }, 150);
                      }
                    }}
                    className="cursor-pointer group relative overflow-hidden rounded-3xl mb-6 transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
                  >
                    {(section as any).videoUrl ? (
                      <div className="w-full h-48 sm:h-64 relative">
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          poster={section.imageUrl ? cldImg(section.imageUrl, { w: 1200, h: 256, fit: 'cover' }) : undefined}
                          preload="metadata"
                        >
                          <source src={cldVideo((section as any).videoUrl)} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end justify-between">
                          <div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg mb-2">{section.label}</h2>
                            {section.description && <p className="text-white/90 text-sm sm:text-base max-w-xl line-clamp-2">{section.description}</p>}
                          </div>
                          <div className={`w-10 h-10 rounded-full bg-[var(--glass)] backdrop-blur-md flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    ) : section.imageUrl ? (
                      <div className="w-full h-48 sm:h-64 relative">
                        <Image
                          loader={cloudinaryLoader}
                          src={section.imageUrl}
                          alt={section.label}
                          fill
                          sizes="100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end justify-between">
                          <div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg mb-2">{section.label}</h2>
                            {section.description && <p className="text-white/90 text-sm sm:text-base max-w-xl line-clamp-2">{section.description}</p>}
                          </div>
                          <div className={`w-10 h-10 rounded-full bg-[var(--glass)] backdrop-blur-md flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full p-6 sm:p-8 bg-[var(--card)] border border-[var(--border)] flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mb-2">{section.label}</h2>
                          {section.description && <p className="text-[var(--muted)] text-sm sm:text-base max-w-xl">{section.description}</p>}
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion Content */}
                  <div
                    className={`${imageLayout === 'thumbnail'
                      ? "flex flex-col divide-y divide-[var(--border)]"
                      : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClass}`
                      } transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}
                    style={{ contentVisibility: isExpanded ? 'auto' : undefined }}
                  >
                    {visibleItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        formatPrice={formatPrice}
                        formatQuantityDisplay={formatQuantityDisplay}
                        borderColor={simpleBorderColor}
                        quantity={quantities[item.id] || 0}
                        onClick={() => setSelectedItem(item)}
                        onQuickAdd={(id: string, step: number, e?: React.MouseEvent) => {
                          const current = quantities[id] || 0;
                          setQuantity(id, current + step);
                          if (e) triggerFlyingDot(e);
                        }}
                        isTierlessTheme={isTierlessTheme}
                        showUnits={showUnits}
                        enableCalculations={enableCalculations}
                        globalImageLayout={imageLayout}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // SCROLL MODE (Default)
            // Add alternating background for visual breathing room
            const sectionIndex = simpleSections.indexOf(section);
            const isAlternate = sectionIndex % 2 === 1;

            return (
              <div
                key={section.id}
                id={`sec-${section.id}`}
                className={`scroll-mt-32 section-observer -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 ${isAlternate ? 'bg-[var(--alternate)]' : ''}`}
              >
                <div className="mb-6">
                  {(section as any).videoUrl ? (
                    <div className="w-full h-36 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-sm relative group" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 256px' }}>
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
                        poster={section.imageUrl ? cldImg(section.imageUrl, { w: 1200, h: 256, fit: 'cover' }) : undefined}
                        preload="metadata"
                      >
                        <source src={cldVideo((section as any).videoUrl)} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{section.label}</h2>
                      </div>
                    </div>
                  ) : section.imageUrl ? (
                    <div className="w-full h-36 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-sm relative group" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 256px' }}>
                      <Image
                        loader={cloudinaryLoader}
                        src={section.imageUrl}
                        alt={section.label}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                        className="object-cover transform group-hover:scale-105 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{section.label}</h2>
                      </div>
                    </div>
                  ) : null}
                  {!(section as any).videoUrl && !section.imageUrl && (
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">{section.label}</h2>
                  )}
                  {section.description && <p className="text-sm sm:text-base opacity-70 max-w-2xl leading-relaxed">{section.description}</p>}
                </div>
                <div className={imageLayout === 'thumbnail'
                  ? "flex flex-col divide-y divide-[var(--border)]"
                  : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClass}`}
                >
                  {visibleItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      formatPrice={formatPrice}
                      formatQuantityDisplay={formatQuantityDisplay}
                      borderColor={simpleBorderColor}
                      quantity={quantities[item.id] || 0}
                      onClick={() => setSelectedItem(item)}
                      onQuickAdd={(id: string, step: number, e?: React.MouseEvent) => {
                        const current = quantities[id] || 0;
                        setQuantity(id, current + step);
                        if (e) triggerFlyingDot(e);
                      }}
                      isTierlessTheme={isTierlessTheme}
                      showUnits={showUnits}
                      enableCalculations={enableCalculations}
                      globalImageLayout={imageLayout}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. TOTAL BAR / CART DRAWER */}
        {/* Show Total Bar if (calculations OR selection) AND there is a total */}
        {
          ((enableCalculations) || allowSelection) && totalCount > 0 && (
            <div className="fixed bottom-0 left-0 w-full z-50 flex flex-col items-center pointer-events-none">

              {/* EXPANDED CART LIST (Popup) */}
              {/* Flying Dot Animations */}
              {flyingDots.map(dot => (
                <div
                  key={dot.id}
                  className="fixed z-[100] pointer-events-none"
                  style={{
                    left: `${dot.fromX - 8}px`,
                    top: `${dot.fromY - 8}px`,
                    width: "16px",
                    height: "16px",
                    "--delta-x": `${dot.deltaX}px`,
                    "--delta-y": `${dot.deltaY}px`,
                  } as React.CSSProperties}
                >
                  <div className="w-full h-full rounded-full bg-[var(--brand-1)] shadow-lg animate-flyToCart" />
                </div>
              ))}

              {cartOpen && (
                <div className="w-full max-w-md bg-[var(--card)] text-[var(--text)] rounded-t-3xl shadow-[0_-10px_60px_-5px_rgba(0,0,0,0.7)] border-x border-t border-[var(--border)] pointer-events-auto animate-in slide-in-from-bottom-20 duration-300 overflow-hidden flex flex-col max-h-[65vh] mb-[-20px] pb-[20px]">
                  {/* Header of Expanded List */}
                  <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[var(--brand-1)]" />
                      <span className="font-bold text-base">Your Order</span>
                    </div>
                    <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* List Items */}
                  <div className="overflow-y-auto p-4 space-y-4 flex-1 pb-24">
                    {items.filter(it => (quantities[it.id] || 0) > 0).map(it => (
                      <div key={it.id} className="flex justify-between items-start gap-3 pb-3 border-b border-[var(--border)] last:border-0">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[var(--brand-1)] text-base">{formatQuantityDisplay(quantities[it.id])}x</span>
                            <span className="text-sm font-medium">{it.label}</span>
                          </div>
                          {it.note && <div className="text-xs text-[var(--muted)] pl-6 line-clamp-1">{it.note}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{formatPrice((it.price || 0) * quantities[it.id])}</div>
                          <div className="flex items-center gap-2 mt-1 justify-end">
                            <button onClick={() => updateQty(it.id, -1)} className="w-6 h-6 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg)] cursor-pointer"><Minus className="w-3 h-3" /></button>
                            <button onClick={() => updateQty(it.id, 1)} className="w-6 h-6 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg)] cursor-pointer"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOTAL BAR BUTTON */}
              <div className="w-full max-w-md pointer-events-auto px-4 pb-6">
                <div
                  ref={cartTargetRef}
                  className="bg-[var(--card)] text-[var(--text)] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] px-3 py-2.5 flex items-center justify-between gap-2 border border-[var(--brand-1)]/50 cursor-pointer hover:scale-[1.01] transition-all active:scale-[0.99] relative z-50"
                  onClick={() => setCartOpen(!cartOpen)}
                >
                  {/* Left: Count + Total (single line) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center shadow-inner border border-[var(--border)]">
                      <span className="font-bold text-base text-[var(--brand-1)]">{formatQuantityDisplay(totalCount)}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] opacity-50 font-medium uppercase">Total</span>
                      <span className="text-lg font-bold whitespace-nowrap">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="text-[var(--brand-1)]">
                      {cartOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Right: Checkout Button */}
                  {canShowCheckoutButton && checkoutButtonConfig && (
                    <button
                      className={checkoutButtonConfig.className}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout();
                      }}
                    >
                      {/* Icon */}
                      <div className="relative z-10">
                        {checkoutButtonConfig.icon}
                      </div>
                      {/* Text */}
                      <span className="relative z-10 whitespace-nowrap">
                        {checkoutButtonConfig.text}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        }

        {
          selectedItem && (
            <ItemDetailModal
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              quantity={quantities[selectedItem.id] || 0}
              setQuantity={setQuantity}
              formatPrice={formatPrice}
              showUnits={showUnits}
            />
          )
        }


      </div>
      <style jsx global>{`
        @keyframes shine {
          0% { left: -100%; opacity: 0; }
          20% { left: 100%; opacity: 0.6; }
          100% { left: 100%; opacity: 0; }
        }
        .animate-shine {
          animation: shine 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-flyToCart {
          animation: flyToCart 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes flyToCart {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          60% {
            opacity: 0.85;
          }
          100% {
            transform: translate(var(--delta-x, 0px), var(--delta-y, 0px)) scale(0.35);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

function ItemDetailModal({ item, onClose, quantity, setQuantity, formatPrice, showUnits }: any) {
  if (!item) return null;

  // Local state for quantity editing inside modal before saving? 
  // For now, let's edit directly on the global state for simplicity and instant feedback.

  // Step logic: pcs=1, kg/l=0.1 (100g/ml), g/ml=1, custom=1
  const step = item.unit === "pcs" || !item.unit ? 1 : (item.unit === "kg" || item.unit === "l") ? 0.1 : 1;
  const unitLabel = item.unit === "custom" ? item.customUnit || "unit" : item.unit || "pcs";
  const isSoldOut = item.soldOut;

  const discount = item.badge === 'sale' ? (item.discountPercent || 0) : 0;
  const finalPrice = item.price ? item.price * (1 - discount / 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[var(--glass)] backdrop-blur-md flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image Header */}
        {item.imageUrl && (
          <div className="w-full h-64 sm:h-72 shrink-0 relative bg-gray-100">
            <Image
              loader={cloudinaryLoader}
              src={item.imageUrl}
              alt={item.label}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent opacity-60"></div>

            {/* Sold Out Badge in Modal */}
            {isSoldOut && (
              <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <span className="px-6 py-2 bg-red-500/20 text-red-500 text-lg font-bold uppercase tracking-widest rounded-xl border border-red-500/30 shadow-2xl transform -rotate-6 backdrop-blur-md">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col flex-1 overflow-y-auto">
          <div className="mb-4">
            {item.badge && (
              <span className={`inline-block px-2 py-1 mb-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                {item.badge === 'sale' && item.discountPercent ? `💰 -${item.discountPercent}%` : (BADGE_LABELS[item.badge] || item.badge)}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] leading-tight mb-2">{item.label}</h2>
            <div className="text-xl font-bold text-[var(--brand-1)] flex items-center gap-2">
              {discount > 0 && (
                <span className="text-base text-[var(--muted)] line-through decoration-red-500/50">{formatPrice(item.price)}</span>
              )}
              <span>{formatPrice(finalPrice)}</span>
              {showUnits && item.unit && item.unit !== "pcs" && <span className="text-sm font-normal text-[var(--muted)] ml-1">/ {unitLabel}</span>}
            </div>
          </div>

          {item.note && (
            <p className="text-[var(--muted)] text-base leading-relaxed mb-8">
              {item.note}
            </p>
          )}

          <div className="mt-auto pt-6 border-t border-[var(--border)]">
            <div className="flex items-center justify-between gap-4">

              {/* Quantity Controls */}
              <div className={`flex items-center gap-3 bg-[var(--bg)] rounded-2xl p-1.5 border border-[var(--border)] ${isSoldOut ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <button
                  onClick={() => setQuantity(item.id, Math.max(0, (quantity || 0) - step))}
                  className="w-10 h-10 rounded-xl bg-[var(--card)] shadow-sm flex items-center justify-center text-[var(--text)] hover:bg-[var(--brand-1)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  disabled={!quantity || isSoldOut}
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center min-w-[3rem]">
                  <input
                    type="number"
                    step={step}
                    min="0"
                    value={quantity === undefined ? "" : quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setQuantity(item.id, 0);
                      } else {
                        const num = parseFloat(val);
                        setQuantity(item.id, isNaN(num) ? 0 : num);
                      }
                    }}
                    disabled={isSoldOut}
                    className="w-16 bg-transparent text-center text-lg font-bold text-[var(--text)] outline-none p-0 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)]">{unitLabel}</span>
                </div>

                <button
                  onClick={() => setQuantity(item.id, (quantity || 0) + step)}
                  className="w-10 h-10 rounded-xl bg-[var(--brand-1)] text-white shadow-lg shadow-[var(--brand-1)]/30 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSoldOut}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Total Price Display */}
              <div className="text-right">
                <div className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider mb-1">Total</div>
                <div className="text-2xl font-black text-[var(--text)]">
                  {formatPrice(finalPrice * (quantity || 0))}
                </div>
              </div>

            </div>

            {/* Add to Order Button (Visual confirmation mostly, since state is live) */}
            <button
              onClick={onClose}
              disabled={isSoldOut}
              className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${isSoldOut
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                : 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90 active:scale-[0.98]'}`}
            >
              {isSoldOut ? "Sold Out" : (quantity > 0 ? "Update Order" : "Close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- */
/* Component: Item Card (Interactive & Compact)              */
/* --------------------------------------------------------- */
/* --------------------------------------------------------- */
/* Component: Item Card (Interactive & Compact)              */
/* --------------------------------------------------------- */
function ItemCard({ item, formatPrice, formatQuantityDisplay, quantity, onClick, onQuickAdd, showUnits, enableCalculations, globalImageLayout }: any) {
  // Step logic: pcs=1, kg/l=0.1 (100g/ml), g/ml=1, custom=1
  const step = item.unit === "pcs" || !item.unit ? 1 : (item.unit === "kg" || item.unit === "l") ? 0.1 : 1;
  const hasImage = !!item.imageUrl;

  // Discount Logic
  const discount = item.badge === 'sale' ? (item.discountPercent || 0) : 0;
  const finalPrice = item.price ? item.price * (1 - discount / 100) : null;

  // Unit Label Logic
  const unitLabel = item.unit === "custom" ? item.customUnit : item.unit;
  const showUnitLabel = showUnits && unitLabel && unitLabel !== "pcs";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal opening
    onQuickAdd(item.id, step, e);
  };

  // Interaction Logic
  // If calculations are disabled, the card is purely visual (no click, no quick add)
  const canInteract = enableCalculations;

  // Use global layout setting (strict separation of design and content)
  const effectiveLayout = globalImageLayout || 'cover';

  // --- LIST/ROW VIEW LAYOUT (Adaptive - with or without image) ---
  if (effectiveLayout === 'thumbnail') {
    // Adaptive padding: more compact when no image
    const rowPadding = hasImage ? 'py-4' : 'py-3';
    const minRowHeight = hasImage ? 'min-h-[88px] md:min-h-[104px]' : 'min-h-0';

    return (
      <div
        onClick={canInteract ? onClick : undefined}
        className={`group relative flex items-center gap-3 md:gap-4 ${rowPadding} px-1 transition-all duration-200 ${minRowHeight} ${canInteract ? 'cursor-pointer hover:bg-[var(--surface)]' : ''} ${item.soldOut ? 'opacity-50' : ''}`}
      >
        {/* Left: Thumbnail Image (only if exists) */}
        {hasImage && (
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-[var(--border)]/20 shrink-0 relative shadow-sm">
            <Image
              loader={cloudinaryLoader}
              src={item.imageUrl}
              alt={item.label}
              fill
              sizes="(max-width: 768px) 64px, 80px"
              className={`object-cover transition-transform duration-300 ${canInteract ? 'group-hover:scale-105' : ''}`}
            />
            {item.soldOut && (
              <div className="absolute inset-0 bg-[var(--overlay)] flex items-center justify-center">
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Sold Out</span>
              </div>
            )}
          </div>
        )}

        {/* Middle: Content Section - expands when no image */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Title + Badges Row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-0.5">
            <h3 className={`font-semibold text-[15px] leading-tight text-[var(--text)] ${canInteract ? 'group-hover:text-[var(--brand-1)] transition-colors' : ''}`}>
              {item.label}
            </h3>
            {/* Inline Sold Out badge for text-only items */}
            {item.soldOut && !hasImage && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-100 text-red-600 border border-red-200">
                Sold Out
              </span>
            )}
          </div>

          {/* Meta Row: Duration + Badge (compact) */}
          {(item.duration || item.badge) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {item.duration && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--bg)] text-[10px] font-medium text-[var(--muted)]">
                  <Clock className="w-2.5 h-2.5" />
                  {item.duration}
                </span>
              )}
              {item.badge && (
                <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                  {item.badge === 'sale' && item.discountPercent ? `-${item.discountPercent}%` : (BADGE_LABELS[item.badge] || item.badge)}
                </span>
              )}
            </div>
          )}

          {/* Description - only show if exists */}
          {item.note && (
            <p className="text-[12px] md:text-[13px] text-[var(--muted)] line-clamp-1 md:line-clamp-2 leading-snug">
              {item.note}
            </p>
          )}
        </div>

        {/* Right: Price & Action */}
        <div className="flex flex-col items-end justify-center shrink-0 pl-2 gap-1">
          {/* Price */}
          <div className="text-right">
            {item.pricePrefix && (
              <span className="text-[9px] text-[var(--muted)] font-medium mr-1">{item.pricePrefix}</span>
            )}
            {discount > 0 && (
              <span className="text-[10px] text-[var(--muted)] line-through mr-1">{formatPrice(item.price)}</span>
            )}
            <span className="font-bold text-base md:text-lg text-[var(--text)]">
              {formatPrice(finalPrice || item.price)}
            </span>
            {showUnitLabel && (
              <span className="text-[9px] text-[var(--muted)] ml-0.5">/{unitLabel}</span>
            )}
          </div>

          {/* Action Button or Quick Add */}
          {item.actionUrl ? (
            <a
              href={item.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[var(--brand-1)] text-white text-[11px] font-bold hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
            >
              {item.actionLabel || "Book"}
            </a>
          ) : canInteract && (
            <button
              onClick={handleQuickAdd}
              disabled={item.soldOut}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--brand-1)] hover:text-white hover:border-[var(--brand-1)] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quantity Indicator */}
        {quantity > 0 && canInteract && (
          <div className="absolute -top-1 -right-1 bg-[var(--brand-1)] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
            {formatQuantityDisplay(quantity)}
          </div>
        )}
      </div>
    );
  }

  // --- COMPACT LAYOUT (No Image) ---
  if (!hasImage) {
    return (
      <div
        onClick={canInteract ? onClick : undefined}
        className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] transition-all duration-300 min-h-[140px] ${canInteract ? 'cursor-pointer hover:shadow-lg hover:border-[var(--brand-1)]/30 hover:-translate-y-0.5' : ''}`}
      >
        <div>
          {/* Header with title and quantity */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className={`font-bold text-lg leading-tight text-[var(--text)] line-clamp-2 transition-colors flex-1 ${canInteract ? 'group-hover:text-[var(--brand-1)]' : ''}`}>
              {item.label}
            </h3>
            {/* Quantity Badge */}
            {quantity > 0 && (
              <div className="bg-[var(--brand-1)] text-white text-xs font-bold px-2 py-1 rounded-full shrink-0 animate-in zoom-in">
                {formatQuantityDisplay(quantity)}
                {item.unit === "pcs" || !item.unit ? "" : item.unit}
              </div>
            )}
          </div>

          {/* Note/Description */}
          {item.note && (
            <p className="text-sm text-[var(--muted)] line-clamp-2 mb-2 opacity-80">
              {item.note}
            </p>
          )}
          
          {/* Badge - Inline below note, before price */}
          {item.badge && (
            <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border mb-2 ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
              {item.badge === 'sale' && item.discountPercent ? `💰 -${item.discountPercent}%` : (BADGE_LABELS[item.badge] || item.badge)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]/50">
          <div className="flex flex-col items-start">
            {item.pricePrefix && (
              <span className="text-[10px] text-[var(--muted)] font-medium">{item.pricePrefix}</span>
            )}
            {discount > 0 && (
              <span className="text-xs text-[var(--muted)] line-through decoration-red-500/50">{formatPrice(item.price)}</span>
            )}
            <div className="font-bold text-lg text-[var(--brand-1)]">
              {formatPrice(finalPrice || item.price)}
              {showUnitLabel && <span className="text-xs font-normal text-[var(--muted)] ml-1">/ {unitLabel}</span>}
            </div>
          </div>

          {/* Quick Add Button - Only if calculations enabled */}
          {canInteract && (
            <button
              onClick={handleQuickAdd}
              disabled={item.soldOut}
              className="w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--brand-1)] hover:text-white hover:border-[var(--brand-1)] transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg)] disabled:hover:text-[var(--text)] disabled:hover:border-[var(--border)]"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sold Out Overlay */}
        {item.soldOut && (
          <div className="absolute inset-0 bg-[var(--bg)]/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl pointer-events-none">
            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest rounded-full border border-red-500/20 shadow-sm transform -rotate-6">
              Sold Out
            </span>
          </div>
        )}
      </div>
    );
  }

  // --- STANDARD LAYOUT (With Image) ---
  return (
    <div
      onClick={canInteract ? onClick : undefined}
      className={`group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 bg-[var(--card)] border border-[var(--border)] ${canInteract ? 'cursor-pointer hover:shadow-xl hover:border-[var(--brand-1)]/30 hover:-translate-y-1' : ''}`}
      style={{
        minHeight: "280px",
      }}
    >
      {/* Image Area */}
      <div className="w-full h-48 relative bg-gray-100 overflow-hidden">
        <Image
          loader={cloudinaryLoader}
          src={item.imageUrl}
          alt={item.label}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className={`object-cover transition-transform duration-700 ${canInteract ? 'group-hover:scale-110' : ''}`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent opacity-80"></div>

        {/* Badge - Bottom left of image */}
        {item.badge && (
          <span className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shadow-lg backdrop-blur-sm z-10 ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
            {item.badge === 'sale' && item.discountPercent ? `💰 -${item.discountPercent}%` : (BADGE_LABELS[item.badge] || item.badge)}
          </span>
        )}

        {/* Quantity Badge */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 bg-[var(--brand-1)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 animate-in zoom-in">
            <span>{formatQuantityDisplay(quantity)}</span>
            <span className="text-[10px] opacity-80 uppercase">{item.unit === "pcs" || !item.unit ? "x" : (item.unit === "custom" ? item.customUnit : item.unit)}</span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {item.soldOut && (
          <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
            <span className="px-4 py-2 bg-red-500/20 text-red-500 text-sm font-bold uppercase tracking-widest rounded-xl border border-red-500/30 shadow-2xl transform -rotate-6 backdrop-blur-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className={`font-bold text-xl leading-tight text-[var(--text)] line-clamp-2 transition-colors ${canInteract ? 'group-hover:text-[var(--brand-1)]' : ''}`}>
            {item.label}
          </h3>
        </div>

        {item.note && (
          <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4 opacity-80">
            {item.note}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--border)]/50">
          <div className="flex flex-col items-start">
            {item.pricePrefix && (
              <span className="text-[10px] text-[var(--muted)] font-medium">{item.pricePrefix}</span>
            )}
            {discount > 0 && (
              <span className="text-xs text-[var(--muted)] line-through decoration-red-500/50">{formatPrice(item.price)}</span>
            )}
            <div className="font-bold text-lg text-[var(--brand-1)]">
              {formatPrice(finalPrice || item.price)}
              {showUnitLabel && <span className="text-xs font-normal text-[var(--muted)] ml-1">/ {unitLabel}</span>}
            </div>
          </div>

          {/* Quick Add Button - Only if calculations enabled */}
          {canInteract && (
            <button
              onClick={handleQuickAdd}
              disabled={item.soldOut}
              className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--text)] group-hover:bg-[var(--brand-1)] group-hover:text-white transition-colors shadow-sm active:scale-95 border border-[var(--border)] group-hover:border-[var(--brand-1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg)] disabled:hover:text-[var(--text)] disabled:hover:border-[var(--border)]"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
