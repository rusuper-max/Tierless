"use client";

import { useMemo, useEffect, useState, RefObject } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, Clock, Info, Plus, Minus, ShoppingBag } from "lucide-react";

/* --------------------------------------------------------- */
/* Types                                                     */
/* --------------------------------------------------------- */
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
  calc: any; // CalcJson
  // NOVO: Opcioni ref ka kontejneru za skrol (za Preview mod)
  scrollContainer?: RefObject<HTMLElement | null>;
};

/* --------------------------------------------------------- */
/* Main Component                                            */
/* --------------------------------------------------------- */
export default function PublicRenderer({ calc, scrollContainer }: PublicRendererProps) {
  const meta = calc?.meta || {};
  const i18n = calc?.i18n || {};
  const items: ItemRow[] = calc?.items || [];

  // --- Styles Config ---
  const simpleBg = meta.simpleBg || "";
  const simpleBgGrad1 = meta.simpleBgGrad1 || "#f9fafb";
  const simpleBgGrad2 = meta.simpleBgGrad2 || "#e5e7eb";

  const simpleTextColor = meta.simpleTextColor || "#111827";
  const simpleBorderColor = meta.simpleBorderColor || "rgba(0,0,0,0.08)";

  const fontMode = meta.simpleFont || "system";
  const spacingMode = meta.simpleSpacing || "cozy";
  const showBadge = meta.simpleShowBadge ?? true;
  const simpleSectionOutlinePublic = meta.simpleSectionOutlinePublic ?? false;
  const allowSelection = meta.simpleAllowSelection ?? false;

  const currency = i18n.currency || "";
  const decimals = typeof i18n.decimals === "number" ? i18n.decimals : 0;

  // --- Data Setup ---
  const simpleCoverImage = meta.simpleCoverImage || "";
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

  // --- State ---
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  // Background Style
  const isGradient = simpleBg.startsWith("linear-gradient");
  const bgStyle = isGradient
    ? { backgroundImage: simpleBg }
    : simpleBg
      ? { backgroundColor: simpleBg }
      : { background: `linear-gradient(180deg, ${simpleBgGrad1} 0%, ${simpleBgGrad2} 100%)` };

  const fontClass =
    fontMode === "serif" ? "font-serif" :
      fontMode === "mono" ? "font-mono" :
        fontMode === "rounded" ? "font-sans rounded-none" : "font-sans";

  const gapClass = spacingMode === "compact" ? "gap-3" : spacingMode === "relaxed" ? "gap-6" : "gap-4";

  // --- FIX: Intersection Observer (Active Tab) ---
  useEffect(() => {
    // Ako imamo scrollContainer ref (Preview), koristimo njega kao root. 
    // Ako ne (Public), root je null (viewport).
    const root = scrollContainer?.current || null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      root: root,
      rootMargin: "-20% 0px -60% 0px"
    });

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

  // --- FIX: Scroll Handler ---
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (scrollContainer?.current) {
      // --- PREVIEW MOD (Skrolujemo div) ---
      const container = scrollContainer.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Računamo relativnu poziciju elementa unutar kontejnera
      const offset = elRect.top - containerRect.top + container.scrollTop;

      // Oduzmemo malo za header (140px)
      container.scrollTo({ top: offset - 140, behavior: "smooth" });

    } else {
      // --- PUBLIC MOD (Skrolujemo window) ---
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
      className={cn("min-h-screen w-full pb-32", fontClass)}
      style={{ ...bgStyle, color: simpleTextColor }}
    >
      {/* 1. HERO / COVER */}
      <div className="relative w-full bg-black/5 group">

        {/* POWERED BY TIERLESS */}
        {showBadge && (
          <div className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <a
              href="https://tierless.com"
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto group/badge relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
            >
              <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#020617_0%,#4F46E5_50%,#22D3EE_100%)] opacity-80" />
              <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  Powered by Tierless
                </span>
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
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-3 shadow-black drop-shadow-lg leading-tight">
                {simpleTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium opacity-90">
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5" /> <span>Open</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <MapPin className="w-3.5 h-3.5" /> <span>Location</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-16 pb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">{simpleTitle}</h1>
            <p className="text-sm opacity-60">Menu</p>
          </div>
        )}
      </div>

      {/* 2. STICKY NAVIGATION */}
      {(simpleSections.length > 0) && (
        <div className="sticky top-0 z-40 w-full bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]/10 shadow-sm py-3 px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {unsectioned.length > 0 && (
              <button
                onClick={() => scrollToSection("sec-uncategorized")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border",
                  activeSection === "sec-uncategorized"
                    ? "bg-[var(--brand-1,#111827)] text-white border-transparent shadow-md transform scale-105"
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
                    "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border",
                    activeSection === `sec-${s.id}`
                      ? "bg-[var(--brand-1,#111827)] text-white border-transparent shadow-md transform scale-105"
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-12">

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[var(--brand-1,#4F46E5)] transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/5 border-none outline-none focus:ring-2 focus:ring-[var(--brand-1,#4F46E5)]/50 transition-all text-base shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Unsectioned */}
        {unsectioned.length > 0 && (
          <div id="sec-uncategorized" className="scroll-mt-32">
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2 tracking-tight">🔥 Popular</h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass}`}>
              {unsectioned
                .filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()))
                .map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    formatPrice={formatPrice}
                    borderColor={simpleBorderColor}
                    allowSelection={allowSelection}
                    quantity={quantities[item.id] || 0}
                    onUpdateQty={updateQty}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {simpleSections.map(section => {
          const sItems = bySection.get(section.id) ?? [];
          const visibleItems = sItems.filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()));
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
                  <ItemCard
                    key={item.id}
                    item={item}
                    formatPrice={formatPrice}
                    borderColor={simpleBorderColor}
                    allowSelection={allowSelection}
                    quantity={quantities[item.id] || 0}
                    onUpdateQty={updateQty}
                  />
                ))}
              </div>
              {simpleSectionOutlinePublic && (
                <div className="w-full h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-10 mt-12" />
              )}
            </div>
          );
        })}
      </div>

      {/* 4. TOTAL BAR */}
      {allowSelection && totalCount > 0 && (
        <div className="fixed bottom-0 left-0 w-full p-4 z-50 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-md bg-[#111827] text-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] p-4 flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[var(--brand-2,#22D3EE)]" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">{totalCount} items</div>
                <div className="text-lg font-bold text-white">{formatPrice(totalAmount)}</div>
              </div>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-lg">
              Checkout
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

/* --------------------------------------------------------- */
/* Sub-components                                            */
/* --------------------------------------------------------- */
function ItemCard({
  item,
  formatPrice,
  borderColor,
  allowSelection,
  quantity,
  onUpdateQty
}: {
  item: ItemRow,
  formatPrice: (n: number | null) => string,
  borderColor: string,
  allowSelection: boolean,
  quantity: number,
  onUpdateQty: (id: string, delta: number) => void
}) {
  return (
    <div
      className="group relative flex gap-4 p-4 rounded-3xl bg-[var(--card,#ffffff)]/80 hover:bg-[var(--card,#ffffff)] transition-all duration-300"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)"
      }}
    >
      {item.imageUrl && (
        <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 relative shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        </div>
      )}
      <div className="flex-1 flex flex-col h-full min-h-[100px]">
        <div className="flex-1">
          <div className="flex justify-between items-start gap-3 mb-1">
            <h3 className="font-bold text-base sm:text-lg leading-snug tracking-tight">{item.label}</h3>
            {item.price !== null && (
              <span className="shrink-0 font-bold text-[var(--brand-1,#4F46E5)] text-base sm:text-lg bg-[var(--brand-1)]/5 px-2 py-0.5 rounded-lg">
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
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold min-w-[20px] text-center">{quantity}</span>
              </>
            )}
            <button
              onClick={() => onUpdateQty(item.id, 1)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                quantity > 0
                  ? "bg-[var(--brand-1)] text-white"
                  : "bg-black/5 text-[var(--brand-1)] group-hover:bg-[var(--brand-1)] group-hover:text-white"
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