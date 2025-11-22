"use client";

import { useMemo, useEffect, useState, RefObject } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, Clock, Info, Plus, Minus, ShoppingBag, Wifi, Phone, Mail, ChevronUp, ChevronDown, X } from "lucide-react";

/* ---------------- Types ---------------- */
// (Isti tipovi kao pre)
type ItemRow = {
  id: string;
  label: string;
  price: number | null;
  note?: string;
  imageUrl?: string;
  simpleSectionId?: string;
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

// (Iste teme kao pre)
const THEMES: Record<string, any> = {
  tierless: {
    "--bg": "#020617",
    "--card": "#0f172a",
    "--text": "#f8fafc",
    "--muted": "#94a3b8",
    "--border": "#1e293b",
    "--brand-1": "#22D3EE",
    "--brand-2": "#4F46E5",
  },
  classic: {
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
  minimal: {
    "--bg": "#f9fafb",
    "--card": "#ffffff",
    "--text": "#1f2937",
    "--muted": "#6b7280",
    "--border": "#e5e7eb",
    "--brand-1": "#374151",
    "--brand-2": "#4b5563",
  }
};

export default function PublicRenderer({ calc, scrollContainer }: PublicRendererProps) {
  const meta = calc?.meta || {};
  const i18n = calc?.i18n || {};
  const items: ItemRow[] = calc?.items || [];
  const business = meta.business || {};

  const themeName = (meta.theme || "tierless").toLowerCase();
  const activeTheme = THEMES[themeName] || THEMES["tierless"];
  const isTierlessTheme = themeName === "tierless";

  const customBg = meta.simpleBg;
  const customText = meta.simpleTextColor;

  const themeStyles = {
    ...activeTheme,
    ...(customBg ? { "--bg": customBg, "--card": customBg } : {}),
    ...(customText ? { "--text": customText } : {}),
  } as React.CSSProperties;

  // FIX: border color for Tierless theme needs to be explicit
  const simpleBorderColor = meta.simpleBorderColor || activeTheme["--border"];

  const fontMode = meta.simpleFont || "system";
  const spacingMode = meta.simpleSpacing || "cozy";
  const showBadge = meta.simpleShowBadge ?? true;
  const simpleSectionOutlinePublic = meta.simpleSectionOutlinePublic ?? false;
  const allowSelection = meta.simpleAllowSelection ?? false;

  const currency = i18n.currency || "";
  const decimals = typeof i18n.decimals === "number" ? i18n.decimals : 0;

  const simpleCoverImage = business.coverUrl || meta.simpleCoverImage || "";
  const simpleTitle = meta.simpleTitle || "Menu";
  const simpleSections: SimpleSection[] = meta.simpleSections || [];

  const { unsectioned, bySection } = useMemo(() => {
    const unsec: ItemRow[] = [];
    const map = new Map<string, ItemRow[]>();
    items.forEach(it => {
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

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

  const bgStyle = {
    backgroundImage: customBg?.startsWith("linear-gradient") ? customBg : undefined,
    backgroundColor: !customBg?.startsWith("linear-gradient") ? customBg : undefined
  }

  const fontClass =
    fontMode === "serif" ? "font-serif" :
      fontMode === "mono" ? "font-mono" :
        fontMode === "rounded" ? "font-sans rounded-none" : "font-sans";

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

    if (unsectioned.length > 0) {
      const el = document.getElementById("sec-uncategorized");
      if (el) observer.observe(el);
    }
    simpleSections.forEach(s => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [simpleSections, unsectioned.length, scrollContainer]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (scrollContainer?.current) {
      const container = scrollContainer.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: offset - 140, behavior: "smooth" });
    } else {
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setActiveSection(id);
  };

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
            <a href="https://tierless.com" target="_blank" rel="noreferrer" className="pointer-events-auto group/badge relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
              <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#020617_0%,#4F46E5_50%,#22D3EE_100%)] opacity-80" />
              <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Powered by Tierless</span>
              </span>
            </a>
          </div>
        )}

        {simpleCoverImage ? (
          <div className="relative w-full h-56 sm:h-72 md:h-96 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={simpleCoverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 text-white">
              {business.logoUrl && (
                <div className="w-16 h-16 mb-4 rounded-full bg-white p-1 shadow-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
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
                {business.location && <a href={business.location} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition"><MapPin className="w-3.5 h-3.5" /> <span>Location</span></a>}
                {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition"><Phone className="w-3.5 h-3.5" /> <span>Call</span></a>}
                {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition"><Mail className="w-3.5 h-3.5" /> <span>Email</span></a>}
                {business.wifiSsid && <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10" title={`Pass: ${business.wifiPass || 'None'}`}><Wifi className="w-3.5 h-3.5" /> <span>WiFi: {business.wifiSsid}</span></span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-16 pb-8 text-center">
            {business.logoUrl && (
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--card)] p-1 shadow-md overflow-hidden border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
            )}
            <h1 className="text-4xl font-bold tracking-tight mb-2">{simpleTitle}</h1>
            {business.description && (
              <p className="text-[var(--muted)] max-w-xl mx-auto text-base sm:text-lg mb-6 leading-relaxed">
                {business.description}
              </p>
            )}
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-[var(--muted)] mt-4">
              {business.hours && <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full"><Clock className="w-4 h-4 text-[var(--brand-1)]" /> {business.hours}</span>}
              {business.location && <a href={business.location} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><MapPin className="w-4 h-4" /> Location</a>}
              {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><Phone className="w-4 h-4" /> Call</a>}
              {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition"><Mail className="w-4 h-4" /> Email</a>}
              {business.wifiSsid && (
                <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full" title={`Pass: ${business.wifiPass || 'None'}`}>
                  <Wifi className="w-4 h-4 text-[var(--brand-1)]" /> <span>WiFi: {business.wifiSsid}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. STICKY NAVIGATION */}
      {(simpleSections.length > 0) && (
        <div className="sticky top-0 z-40 w-full bg-[var(--bg)]/85 backdrop-blur-xl border-b border-[var(--border)] shadow-sm py-3 px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {unsectioned.length > 0 && (
              <button
                onClick={() => scrollToSection("sec-uncategorized")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border",
                  activeSection === "sec-uncategorized"
                    ? "bg-[var(--brand-1)] text-white border-transparent shadow-md transform scale-105"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
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
                    "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border",
                    activeSection === `sec-${s.id}`
                      ? "bg-[var(--brand-1)] text-white border-transparent shadow-md transform scale-105"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-12">
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
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass}`}>
              {unsectioned
                .filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()) || it.note?.toLowerCase().includes(search.toLowerCase()))
                .map(item => (
                  <ItemCard key={item.id} item={item} formatPrice={formatPrice} borderColor={simpleBorderColor} allowSelection={allowSelection} quantity={quantities[item.id] || 0} onUpdateQty={updateQty} isTierlessTheme={isTierlessTheme} />
                ))}
            </div>
          </div>
        )}

        {simpleSections.map(section => {
          const sItems = bySection.get(section.id) ?? [];
          const visibleItems = sItems.filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()) || it.note?.toLowerCase().includes(search.toLowerCase()));
          if (visibleItems.length === 0 && search) return null;
          if (sItems.length === 0) return null;

          return (
            <div key={section.id} id={`sec-${section.id}`} className="scroll-mt-32">
              <div className="mb-6">
                {section.imageUrl && (
                  <div className="w-full h-36 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-sm relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={section.imageUrl} alt={section.label} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{section.label}</h2>
                    </div>
                  </div>
                )}
                {!section.imageUrl && (
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">{section.label}</h2>
                )}
                {section.description && (
                  <p className="text-sm sm:text-base opacity-70 max-w-2xl leading-relaxed">
                    {section.description}
                  </p>
                )}
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass}`}>
                {visibleItems.map(item => (
                  <ItemCard key={item.id} item={item} formatPrice={formatPrice} borderColor={simpleBorderColor} allowSelection={allowSelection} quantity={quantities[item.id] || 0} onUpdateQty={updateQty} isTierlessTheme={isTierlessTheme} />
                ))}
              </div>
              {simpleSectionOutlinePublic && (
                <div className="w-full h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-10 mt-12" />
              )}
            </div>
          );
        })}
      </div>

      {/* 4. TOTAL BAR / CART DRAWER */}
      {allowSelection && totalCount > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-50 flex flex-col items-center pointer-events-none">

          {/* EXPANDED CART LIST */}
          {cartOpen && (
            <div className="w-full max-w-md bg-[var(--card)] text-[var(--text)] rounded-t-2xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] border-x border-t border-[var(--brand-1)] pointer-events-auto animate-in slide-in-from-bottom-20 duration-300 overflow-hidden flex flex-col max-h-[60vh]">
              <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
                <span className="font-bold text-sm">Your Order</span>
                <button onClick={() => setCartOpen(false)} className="p-1 rounded-full hover:bg-[var(--card)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3 flex-1">
                {items.filter(it => (quantities[it.id] || 0) > 0).map(it => (
                  <div key={it.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--brand-1)]">{quantities[it.id]}x</span>
                      <span className="text-sm truncate max-w-[160px]">{it.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatPrice((it.price || 0) * quantities[it.id])}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(it.id, -1)} className="w-6 h-6 rounded-full bg-[var(--bg)] flex items-center justify-center hover:text-red-500"><Minus className="w-3 h-3" /></button>
                        <button onClick={() => updateQty(it.id, 1)} className="w-6 h-6 rounded-full bg-[var(--bg)] flex items-center justify-center hover:text-green-500"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOTAL BAR BUTTON */}
          <div className="w-full max-w-md pointer-events-auto p-4">
            <div
              className="bg-[var(--card)] text-[var(--text)] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] p-3 flex items-center justify-between border border-[var(--brand-1)] cursor-pointer hover:scale-[1.01] transition-transform active:scale-95"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[var(--brand-1)]" />
                </div>
                <div>
                  <div className="text-xs opacity-60 font-medium">{totalCount} items</div>
                  <div className="text-lg font-bold">{formatPrice(totalAmount)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[var(--brand-1)]">
                  {cartOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-[var(--brand-1)] text-white font-bold text-sm shadow-lg" onClick={(e) => { e.stopPropagation(); /* Checkout logic */ }}>
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- */
/* Component: Item Card                                      */
/* --------------------------------------------------------- */
function ItemCard({
  item,
  formatPrice,
  borderColor,
  allowSelection,
  quantity,
  onUpdateQty,
  isTierlessTheme // NEW PROP
}: {
  item: ItemRow,
  formatPrice: (n: number | null) => string,
  borderColor: string,
  allowSelection: boolean,
  quantity: number,
  onUpdateQty: (id: string, delta: number) => void,
  isTierlessTheme: boolean
}) {
  return (
    <div
      className="group relative flex gap-4 p-4 rounded-3xl bg-[var(--card,#ffffff)]/80 hover:bg-[var(--card,#ffffff)] transition-all duration-200 border shadow-sm"
      style={{
        // FIX: Tierless Theme Gradient Border
        borderImage: isTierlessTheme ? "linear-gradient(to bottom right, var(--brand-1), transparent) 1" : undefined,
        borderColor: isTierlessTheme ? "transparent" : borderColor,
        borderWidth: isTierlessTheme ? "1px" : "1px",
        boxShadow: isTierlessTheme ? "0 0 20px -10px var(--brand-1)" : "0 4px 20px -4px rgba(0,0,0,0.05)"
      }}
    >
      {/* Gradient Border Fix for Tierless (Alternative CSS approach if borderImage fails on rounded) */}
      {isTierlessTheme && (
        <div className="absolute inset-0 rounded-3xl border border-transparent [background:linear-gradient(var(--card),var(--card))_padding-box,linear-gradient(135deg,var(--brand-1),transparent)_border-box] pointer-events-none" />
      )}

      {item.imageUrl && (
        <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 relative shadow-sm border border-[var(--border)] z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        </div>
      )}
      <div className="flex-1 flex flex-col h-full min-h-[100px] z-10">
        <div className="flex-1">
          <div className="flex justify-between items-start gap-3 mb-1">
            <h3 className="font-bold text-base sm:text-lg leading-snug tracking-tight">{item.label}</h3>
            {item.price !== null && (
              <span className="shrink-0 font-bold text-[var(--brand-1,#4F46E5)] text-base sm:text-lg bg-[var(--brand-1)]/10 px-2 py-0.5 rounded-lg">
                {formatPrice(item.price)}
              </span>
            )}
          </div>
          {item.note && (
            <p className="text-xs sm:text-sm opacity-60 line-clamp-3 leading-relaxed font-medium">
              {item.note}
            </p>
          )}
        </div>
        {allowSelection && (
          <div className="mt-3 flex items-center justify-end gap-3">
            {quantity > 0 && (
              <>
                <button
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center hover:bg-red-100 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold min-w-[20px] text-center">{quantity}</span>
              </>
            )}
            <button
              onClick={() => onUpdateQty(item.id, 1)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-[var(--border)]",
                quantity > 0
                  ? "bg-[var(--brand-1)] text-white border-[var(--brand-1)]"
                  : "bg-[var(--bg)] text-[var(--brand-1)] hover:bg-[var(--brand-1)] hover:text-white"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}