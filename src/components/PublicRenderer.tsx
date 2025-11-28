"use client";

import { useMemo, useEffect, useState, RefObject } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, Clock, Plus, Minus, ShoppingBag, Wifi, Phone, Mail, ChevronUp, ChevronDown, X } from "lucide-react";

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
const THEMES: Record<string, any> = {
  tierless: {
    "--bg": "#020617",
    "--card": "#0B0C15",
    "--text": "#f8fafc",
    "--muted": "#94a3b8",
    "--border": "#1e293b",
    "--brand-1": "#4F46E5", // Indigo
    "--brand-2": "#22D3EE", // Cyan
  },
  minimal: {
    "--bg": "#ffffff",
    "--card": "#ffffff",
    "--text": "#111827",
    "--muted": "#6b7280",
    "--border": "#e5e7eb",
    "--brand-1": "#111827",
    "--brand-2": "#374151",
  },
  midnight: {
    "--bg": "#000000",
    "--card": "#111111",
    "--text": "#ededed",
    "--muted": "#a1a1a1",
    "--border": "#333333",
    "--brand-1": "#ffffff",
    "--brand-2": "#cccccc",
  },
  luxury: {
    "--bg": "#0f0f0f",
    "--card": "#1a1a1a",
    "--text": "#d4af37",
    "--muted": "#8a7e57",
    "--border": "#332f1e",
    "--brand-1": "#d4af37",
    "--brand-2": "#fcf6ba",
  },
  elegant: {
    "--bg": "#fdfbf7",
    "--card": "#ffffff",
    "--text": "#2c2c2c",
    "--muted": "#858585",
    "--border": "#e6dfc8",
    "--brand-1": "#c5a059",
    "--brand-2": "#d4af37",
  },
  cafe: {
    "--bg": "#f5f5f0",
    "--card": "#ffffff",
    "--text": "#4a3b32",
    "--muted": "#8c7b70",
    "--border": "#e6e6e0",
    "--brand-1": "#d97706",
    "--brand-2": "#b45309",
  },
  ocean: {
    "--bg": "#f0f9ff",
    "--card": "#ffffff",
    "--text": "#0c4a6e",
    "--muted": "#64748b",
    "--border": "#bae6fd",
    "--brand-1": "#0ea5e9",
    "--brand-2": "#0284c7",
  },
  forest: {
    "--bg": "#f2f8f5",
    "--card": "#ffffff",
    "--text": "#064e3b",
    "--muted": "#6b7280",
    "--border": "#d1fae5",
    "--brand-1": "#059669",
    "--brand-2": "#10b981",
  },
  sunset: {
    "--bg": "#fff1f2",
    "--card": "#ffffff",
    "--text": "#881337",
    "--muted": "#9f1239",
    "--border": "#fecdd3",
    "--brand-1": "#e11d48",
    "--brand-2": "#f43f5e",
  },
  rosegold: {
    "--bg": "#fef3f2",
    "--card": "#ffffff",
    "--text": "#9f1239",
    "--muted": "#be123c",
    "--border": "#fecdd3",
    "--brand-1": "#e0a899",
    "--brand-2": "#d4af37",
  },
  emerald: {
    "--bg": "#0a1f1a",
    "--card": "#0f2922",
    "--text": "#d4af37",
    "--muted": "#a89968",
    "--border": "#2d5a45",
    "--brand-1": "#d4af37",
    "--brand-2": "#10b981",
  },
  sapphire: {
    "--bg": "#0f1729",
    "--card": "#1e293b",
    "--text": "#cbd5e1",
    "--muted": "#94a3b8",
    "--border": "#475569",
    "--brand-1": "#60a5fa",
    "--brand-2": "#cbd5e1",
  },
  obsidian: {
    "--bg": "#000000",
    "--card": "#0a0a0a",
    "--text": "#ffffff",
    "--muted": "#a3a3a3",
    "--border": "#1a1a1a",
    "--brand-1": "#ffffff",
    "--brand-2": "#d4d4d4",
  },
  goldluxury: {
    "--bg": "#0a0a0a",
    "--card": "#141414",
    "--text": "#d4af37",
    "--muted": "#8b7355",
    "--border": "#2a2520",
    "--brand-1": "#f4d03f",
    "--brand-2": "#d4af37",
  }
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
      <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <Wifi className="w-3.5 h-3.5" />
        <span>{ssid}</span>
      </span>
    );
  }
  return (
    <button
      onClick={() => setShowPassword(!showPassword)}
      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition cursor-pointer group"
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

export default function PublicRenderer({ calc, scrollContainer }: PublicRendererProps) {
  const meta = calc?.meta || {};
  const i18n = calc?.i18n || {};
  const items: ItemRow[] = calc?.items || [];

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
  const showUnits = meta.simpleShowUnits ?? false;
  const layoutMode = meta.layoutMode || 'scroll'; // 'scroll' | 'accordion'
  const accordionSolo = meta.layoutAccordionSolo ?? false;

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      if (accordionSolo) {
        // Solo mode: if clicking already open, close it (empty set). If clicking closed, open ONLY it.
        if (prev.has(sectionId)) return new Set();
        return new Set([sectionId]);
      }
      // Normal mode: toggle
      const next = new Set(prev);
      if (next.has(sectionId)) {
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

  // Flying dot animation state
  const [flyingDots, setFlyingDots] = useState<Array<{ id: string; fromX: number; fromY: number }>>([]);

  const triggerFlyingDot = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dotId = `dot-${Date.now()}-${Math.random()}`;

    setFlyingDots(prev => [...prev, {
      id: dotId,
      fromX: rect.left + rect.width / 2,
      fromY: rect.top + rect.height / 2
    }]);

    // Remove dot after animation completes
    setTimeout(() => {
      setFlyingDots(prev => prev.filter(d => d.id !== dotId));
    }, 600);
  };
  const [orderModalOpen, setOrderModalOpen] = useState(false);



  const totalAmount = useMemo(() => {
    let sum = 0;
    items.forEach(it => {
      const qty = quantities[it.id] || 0;
      if (qty > 0 && it.price) sum += it.price * qty;
    });
    return sum;
  }, [items, quantities]);

  const totalCount = Object.values(quantities).reduce((a, b) => a + b, 0);

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

  const setQuantity = (id: string, value: number) => {
    setQuantities(prev => {
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

  return (
    <div
      className={cn("min-h-screen w-full pb-32 transition-colors duration-300", fontClass)}
      style={{
        ...themeStyles,
        backgroundColor: 'var(--bg)',
        color: 'var(--text)'
      }}
    >
      {/* 1. HERO / COVER */}
      <div className="relative w-full bg-black/5 group">
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={simpleCoverImage} alt="Cover" className="w-full h-full object-cover animate-in fade-in duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 text-white">
              {simpleLogo && (
                <div className="w-28 h-28 mb-6 rounded-2xl bg-white p-1.5 shadow-xl overflow-hidden border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={simpleLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
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
                {business.hours && <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"><Clock className="w-3.5 h-3.5" /> <span>{business.hours}</span></span>}
                {business.location && <a href={business.location} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition cursor-pointer"><MapPin className="w-3.5 h-3.5" /> <span>Location</span></a>}
                {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition cursor-pointer"><Phone className="w-3.5 h-3.5" /> <span>Call</span></a>}
                {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition cursor-pointer"><Mail className="w-3.5 h-3.5" /> <span>Email</span></a>}
                {business.wifiSsid && <WifiDisplay ssid={business.wifiSsid} password={business.wifiPass} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-24 pb-10 text-center bg-gradient-to-b from-transparent to-black/5">
            {simpleLogo && (
              <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-[var(--card)] p-1.5 shadow-md overflow-hidden border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={simpleLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
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
            </div>
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
                    : "bg-black/5 border-transparent hover:bg-black/10 text-inherit opacity-70 hover:opacity-100"
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
                      : "bg-black/5 border-transparent hover:bg-black/10 text-inherit opacity-70 hover:opacity-100"
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
          <div id="sec-uncategorized" className="scroll-mt-32">
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2 tracking-tight">🔥 Popular</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClass}`}>
              {unsectioned
                .filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()) || it.note?.toLowerCase().includes(search.toLowerCase()))
                .map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    formatPrice={formatPrice}
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
              <div key={section.id} className="scroll-mt-32">
                {/* Accordion Header (Clickable) */}
                <div
                  onClick={() => toggleSection(section.id)}
                  className="cursor-pointer group relative overflow-hidden rounded-3xl mb-6 transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
                >
                  {section.videoUrl ? (
                    <div className="w-full h-48 sm:h-64 relative">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        poster={section.imageUrl}
                      >
                        <source src={section.videoUrl} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end justify-between">
                        <div>
                          <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg mb-2">{section.label}</h2>
                          {section.description && <p className="text-white/90 text-sm sm:text-base max-w-xl line-clamp-2">{section.description}</p>}
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  ) : section.imageUrl ? (
                    <div className="w-full h-48 sm:h-64 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={section.imageUrl} alt={section.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex items-end justify-between">
                        <div>
                          <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg mb-2">{section.label}</h2>
                          {section.description && <p className="text-white/90 text-sm sm:text-base max-w-xl line-clamp-2">{section.description}</p>}
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
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
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClass} transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  {visibleItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      formatPrice={formatPrice}
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
                    />
                  ))}
                </div>
              </div>
            );
          }

          // SCROLL MODE (Default)
          return (
            <div key={section.id} id={`sec-${section.id}`} className="scroll-mt-32">
              <div className="mb-6">
                {section.videoUrl ? (
                  <div className="w-full h-36 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-sm relative group">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
                      poster={section.imageUrl}
                    >
                      <source src={section.videoUrl} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{section.label}</h2>
                    </div>
                  </div>
                ) : section.imageUrl ? (
                  <div className="w-full h-36 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-sm relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={section.imageUrl} alt={section.label} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{section.label}</h2>
                    </div>
                  </div>
                ) : null}
                {!section.videoUrl && !section.imageUrl && (
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">{section.label}</h2>
                )}
                {section.description && <p className="text-sm sm:text-base opacity-70 max-w-2xl leading-relaxed">{section.description}</p>}
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClass}`}>
                {visibleItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    formatPrice={formatPrice}
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
            {flyingDots.map(dot => {
              // Calculate the position of the cart total (bottom center)
              return (
                <div
                  key={dot.id}
                  className="fixed z-[100] pointer-events-none"
                  style={{
                    left: `${dot.fromX}px`,
                    top: `${dot.fromY}px`,
                    width: '16px',
                    height: '16px',
                    animation: 'flyToCart 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                  }}
                >
                  <div className="w-full h-full rounded-full bg-[var(--brand-1)] shadow-lg" />
                </div>
              );
            })}

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
                          <span className="font-bold text-[var(--brand-1)] text-base">{quantities[it.id]}x</span>
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
            <div className="w-full max-w-md pointer-events-auto p-4 pb-6">
              <div
                className="bg-[var(--card)] text-[var(--text)] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-3 flex items-center justify-between border border-[var(--brand-1)]/50 cursor-pointer hover:scale-[1.02] transition-all active:scale-95 relative z-50"
                onClick={() => setCartOpen(!cartOpen)}
              >
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-11 h-11 rounded-xl bg-[var(--bg)] flex items-center justify-center shadow-inner border border-[var(--border)]">
                    <span className="font-bold text-lg text-[var(--brand-1)]">{totalCount}</span>
                  </div>
                  <div>
                    <div className="text-xs opacity-60 font-medium uppercase tracking-wide">Total</div>
                    <div className="text-xl font-extrabold leading-none">{formatPrice(totalAmount)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[var(--brand-1)]">
                    {cartOpen ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
                  </div>
                  {/* --- FIX: CHECKOUT BUTTON VISIBILITY --- */}
                  {addCheckout && (
                    <button
                      className="px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-transform cursor-pointer"
                      style={{ background: "linear-gradient(90deg,var(--brand-1),var(--brand-2))" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCartOpen(false);
                        setOrderModalOpen(true);
                      }}
                    >
                      Checkout
                    </button>
                  )}
                </div>
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

      {/* Order/Checkout Modal */}
      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        items={items}
        quantities={quantities}
        formatPrice={formatPrice}
        onSubmitOrder={async (orderData: any) => {
          // API call to submit order
          const response = await fetch(`/api/orders/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...orderData,
              pageTitle: simpleTitle,
              accountId: calc.accountId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to submit order');
          }

          const result = await response.json();

          // Show success message (if customSuccessMessage is set)
          const successMessage = meta.customSuccessMessage || "";
          if (successMessage.trim()) {
            alert(successMessage);
          } else {
            alert('Order submitted successfully!');
          }

          // Clear cart
          setQuantities({});
        }}
      />
    </div >
  );
}

/* --------------------------------------------------------- */
/* Component: Order/Checkout Modal                           */
/* --------------------------------------------------------- */
function OrderModal({ isOpen, onClose, items, quantities, formatPrice, onSubmitOrder }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Build order items list
  const orderItems = items
    .filter((item: any) => quantities[item.id] > 0)
    .map((item: any) => ({
      ...item,
      quantity: quantities[item.id],
    }));

  const totalAmount = orderItems.reduce((sum: number, item: any) => {
    return sum + (item.price || 0) * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert("Phone number is required!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitOrder({ name, phone, note, items: orderItems });
      // Reset form
      setName("");
      setPhone("");
      setNote("");
      onClose();
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-[var(--border)] bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)]">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Complete Your Order</h2>
          <p className="text-white/80 text-sm mt-1">Fill in your details to submit the order</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-3">Order Summary</h3>
            <div className="space-y-2 bg-[var(--bg)] rounded-2xl p-4 border border-[var(--border)]">
              {orderItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--brand-1)]">{item.quantity}x</span>
                    <span className="text-[var(--text)]">{item.label}</span>
                  </div>
                  <span className="font-semibold text-[var(--text)]">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-[var(--border)] flex justify-between items-center">
                <span className="font-bold text-[var(--text)]">Total</span>
                <span className="text-xl font-black text-[var(--brand-1)]">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text)]">Your Details</h3>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]/50 transition-all placeholder-[var(--muted)]"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]/50 transition-all placeholder-[var(--muted)]"
              />
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special requests or comments?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]/50 transition-all resize-none placeholder-[var(--muted)]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !phone.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Send Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- */
/* Component: Item Detail Modal (Popup)                      */
/* --------------------------------------------------------- */
/* --------------------------------------------------------- */
/* Component: Item Detail Modal (Popup)                      */
/* --------------------------------------------------------- */
function ItemDetailModal({ item, onClose, quantity, setQuantity, formatPrice, showUnits }: any) {
  if (!item) return null;

  // Local state for quantity editing inside modal before saving? 
  // For now, let's edit directly on the global state for simplicity and instant feedback.

  // Step logic: pcs=1, kg/l=0.1 (100g/ml), g/ml=1, custom=1
  const step = item.unit === "pcs" || !item.unit ? 1 : (item.unit === "kg" || item.unit === "l") ? 0.1 : 1;
  const unitLabel = item.unit === "custom" ? item.customUnit || "unit" : item.unit || "pcs";
  const isSoldOut = item.soldOut;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image Header */}
        {item.imageUrl && (
          <div className="w-full h-64 sm:h-72 shrink-0 relative bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent opacity-60"></div>

            {/* Sold Out Badge in Modal */}
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
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
            {item.badge && BADGE_LABELS[item.badge] && (
              <span className={`inline-block px-2 py-1 mb-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                {BADGE_LABELS[item.badge]}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] leading-tight mb-2">{item.label}</h2>
            <div className="text-xl font-bold text-[var(--brand-1)]">
              {formatPrice(item.price)}
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
                  {formatPrice((item.price || 0) * (quantity || 0))}
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
function ItemCard({ item, formatPrice, quantity, onClick, onQuickAdd, showUnits, enableCalculations }: any) {
  // Step logic: pcs=1, kg/l=0.1 (100g/ml), g/ml=1, custom=1
  const step = item.unit === "pcs" || !item.unit ? 1 : (item.unit === "kg" || item.unit === "l") ? 0.1 : 1;
  const hasImage = !!item.imageUrl;

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

  // --- COMPACT LAYOUT (No Image) ---
  if (!hasImage) {
    return (
      <div
        onClick={canInteract ? onClick : undefined}
        className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] transition-all duration-300 min-h-[140px] ${canInteract ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}`}
      >
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              {item.badge && BADGE_LABELS[item.badge] && (
                <span className={`inline-block px-1.5 py-0.5 mb-1.5 rounded text-[9px] font-bold uppercase tracking-wide border ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                  {BADGE_LABELS[item.badge]}
                </span>
              )}
              <h3 className={`font-bold text-lg leading-tight text-[var(--text)] line-clamp-2 transition-colors ${canInteract ? 'group-hover:text-[var(--brand-1)]' : ''}`}>
                {item.label}
              </h3>
            </div>
            {/* Quantity Badge (Compact) */}
            {quantity > 0 && (
              <div className="bg-[var(--brand-1)] text-white text-xs font-bold px-2 py-1 rounded-full shrink-0 animate-in zoom-in">
                {quantity}{item.unit === "pcs" || !item.unit ? "" : item.unit}
              </div>
            )}
          </div>

          {item.note && (
            <p className="text-sm text-[var(--muted)] line-clamp-2 mb-3 opacity-80">
              {item.note}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]/50">
          <div className="font-bold text-lg text-[var(--brand-1)]">
            {formatPrice(item.price)}
            {showUnitLabel && <span className="text-xs font-normal text-[var(--muted)] ml-1">/ {unitLabel}</span>}
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
      className={`group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 bg-[var(--card)] border border-[var(--border)] ${canInteract ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
      style={{
        minHeight: "280px",
      }}
    >
      {/* Image Area */}
      <div className="w-full h-48 relative bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.label}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${canInteract ? 'group-hover:scale-110' : ''}`}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent opacity-80"></div>

        {/* Quantity Badge */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 bg-[var(--brand-1)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 animate-in zoom-in">
            <span>{quantity}</span>
            <span className="text-[10px] opacity-80 uppercase">{item.unit === "pcs" || !item.unit ? "x" : (item.unit === "custom" ? item.customUnit : item.unit)}</span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {item.soldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
            <span className="px-4 py-2 bg-red-500/20 text-red-500 text-sm font-bold uppercase tracking-widest rounded-xl border border-red-500/30 shadow-2xl transform -rotate-6 backdrop-blur-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 relative">
        <div className="mb-2">
          {item.badge && BADGE_LABELS[item.badge] && (
            <span className={`inline-block px-1.5 py-0.5 mb-2 rounded text-[9px] font-bold uppercase tracking-wide border ${BADGE_STYLES[item.badge] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
              {BADGE_LABELS[item.badge]}
            </span>
          )}
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
          <div className="font-bold text-lg text-[var(--brand-1)]">
            {formatPrice(item.price)}
            {showUnitLabel && <span className="text-xs font-normal text-[var(--muted)] ml-1">/ {unitLabel}</span>}
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

{/* CSS for flying dot animation */ }
<style jsx global>{`
  @keyframes flyToCart {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(calc((50vw - var(--from-x, 0px)) * 0.5), calc((100vh - 100px - var(--from-y, 0px)) * 0.5)) scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: translate(calc(50vw - var(--from-x, 0px)), calc(100vh - 100px - var(--from-y, 0px))) scale(0.3);
      opacity: 0;
    }
  }
`}</style>