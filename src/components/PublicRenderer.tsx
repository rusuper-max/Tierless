"use client";

import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, Clock, Info } from "lucide-react";

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
};

/* --------------------------------------------------------- */
/* Main Component                                            */
/* --------------------------------------------------------- */
export default function PublicRenderer({ calc }: PublicRendererProps) {
  const meta = calc?.meta || {};
  const i18n = calc?.i18n || {};
  const items: ItemRow[] = calc?.items || [];

  // --- Styles Config ---
  const simpleBg = meta.simpleBg || "";
  const simpleBgGrad1 = meta.simpleBgGrad1 || "#f9fafb";
  const simpleBgGrad2 = meta.simpleBgGrad2 || "#e5e7eb";

  const simpleTextColor = meta.simpleTextColor || "#111827";
  // Ako korisnik nije birao border boju, stavljamo blagu sivu da ne bude prejak kontrast na karticama
  const simpleBorderColor = meta.simpleBorderColor || "rgba(0,0,0,0.08)";

  const fontMode = meta.simpleFont || "system";
  const spacingMode = meta.simpleSpacing || "cozy";
  const showBadge = meta.simpleShowBadge ?? true;
  const simpleSectionOutlinePublic = meta.simpleSectionOutlinePublic ?? false;

  const currency = i18n.currency || "";
  const decimals = typeof i18n.decimals === "number" ? i18n.decimals : 0;

  // --- Data Setup ---
  const simpleCoverImage = meta.simpleCoverImage || "";
  const simpleTitle = meta.simpleTitle || "Menu";
  const simpleSections: SimpleSection[] = meta.simpleSections || [];

  // Grupisanje itema
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

  // Search state
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Background Style Logic
  const isGradient = simpleBg.startsWith("linear-gradient");
  const bgStyle = isGradient
    ? { backgroundImage: simpleBg }
    : simpleBg
      ? { backgroundColor: simpleBg }
      : { background: `linear-gradient(180deg, ${simpleBgGrad1} 0%, ${simpleBgGrad2} 100%)` };

  // Font Class
  const fontClass =
    fontMode === "serif" ? "font-serif" :
      fontMode === "mono" ? "font-mono" :
        fontMode === "rounded" ? "font-sans rounded-none" : "font-sans";

  // Spacing (Gap between cards)
  const gapClass = spacingMode === "compact" ? "gap-3" : spacingMode === "relaxed" ? "gap-6" : "gap-4";

  // --- Intersection Observer za Active Tab (Sticky Nav highlight) ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: "-20% 0px -60% 0px" }); // Aktivira se kad je sekcija pri vrhu ekrana

    if (unsectioned.length > 0) {
      const el = document.getElementById("sec-uncategorized");
      if (el) observer.observe(el);
    }

    simpleSections.forEach(s => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [simpleSections, unsectioned.length]);

  // --- Scroll Handler ---
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Offset za sticky header (cca 140px da ne ode pod nav)
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  // --- RENDER HELPERS ---
  const formatPrice = (p: number | null) => {
    if (p === null || p === undefined) return "";
    return p.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + (currency ? ` ${currency}` : "");
  };

  return (
    <div
      className={cn("min-h-screen w-full pb-20", fontClass)}
      style={{ ...bgStyle, color: simpleTextColor }}
    >
      {/* 1. HERO / COVER HEADER */}
      <div className="relative w-full bg-black/5">
        {simpleCoverImage ? (
          <div className="relative w-full h-56 sm:h-72 md:h-96 overflow-hidden">
            {/* Cover Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={simpleCoverImage} alt="Cover" className="w-full h-full object-cover" />

            {/* Gradient Overlay da tekst bude citljiv */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Info on Cover */}
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 text-white">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-3 shadow-black drop-shadow-lg leading-tight">
                {simpleTitle}
              </h1>

              {/* Fake Info Badges (Wolt style) */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium opacity-90">
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5" />
                  <span>10 - 23h</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Location</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <Info className="w-3.5 h-3.5" />
                  <span>Info</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback header ako nema slike - Minimalisticki */
          <div className="px-5 pt-12 pb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">{simpleTitle}</h1>
            <p className="text-sm opacity-60">Welcome to our menu</p>
          </div>
        )}
      </div>

      {/* 2. STICKY NAVIGATION (Pills) */}
      {/* Prikazujemo samo ako ima više od jedne sekcije ili ako ima unsectioned + sekcije */}
      {(simpleSections.length > 0) && (
        <div className="sticky top-0 z-40 w-full bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]/10 shadow-sm py-3 px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {/* Link ka unsectioned delu (Popular) */}
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
              // Provera da li sekcija ima iteme pre nego sto je prikazemo u navu
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

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-12">

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[var(--brand-1,#4F46E5)] transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search for food or drinks..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/5 border-none outline-none focus:ring-2 focus:ring-[var(--brand-1,#4F46E5)]/50 transition-all text-base shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Unsectioned Items (e.g. "Popular") */}
        {unsectioned.length > 0 && (
          <div id="sec-uncategorized" className="scroll-mt-32">
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2 tracking-tight">
              🔥 Popular
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass}`}>
              {unsectioned
                .filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()))
                .map(item => (
                  <ItemCard key={item.id} item={item} formatPrice={formatPrice} borderColor={simpleBorderColor} />
                ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {simpleSections.map(section => {
          const sItems = bySection.get(section.id) ?? [];
          const visibleItems = sItems.filter(it => !search || it.label.toLowerCase().includes(search.toLowerCase()));
          if (visibleItems.length === 0 && search) return null; // Hide empty sections during search
          if (sItems.length === 0) return null; // Hide empty sections always

          return (
            <div key={section.id} id={`sec-${section.id}`} className="scroll-mt-32">

              {/* Section Header with Banner */}
              <div className="mb-6">
                {section.imageUrl && (
                  <div className="w-full h-36 sm:h-48 rounded-3xl overflow-hidden mb-4 shadow-sm relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={section.imageUrl} alt={section.label} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                    {/* Text Over Image (Optional, looks cool) */}
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{section.label}</h2>
                    </div>
                  </div>
                )}

                {/* Fallback title if no image */}
                {!section.imageUrl && (
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">{section.label}</h2>
                )}

                {section.description && (
                  <p className="text-sm sm:text-base opacity-70 max-w-2xl leading-relaxed">
                    {section.description}
                  </p>
                )}
              </div>

              {/* Items Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass}`}>
                {visibleItems.map(item => (
                  <ItemCard key={item.id} item={item} formatPrice={formatPrice} borderColor={simpleBorderColor} />
                ))}
              </div>

              {/* Section Divider (if configured) */}
              {simpleSectionOutlinePublic && (
                <div className="w-full h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-10 mt-12" />
              )}
            </div>
          );
        })}
      </div>

      {/* 4. FOOTER / BADGE */}
      {showBadge && (
        <div className="mt-24 pb-10 text-center">
          <a href="https://tierless.com" target="_blank" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111827] text-white text-xs font-bold tracking-wider hover:scale-105 transition shadow-xl hover:shadow-2xl border border-white/10">
            <span className="text-base">⚡</span>
            <span>Powered by Tierless</span>
          </a>
        </div>
      )}

    </div>
  );
}

/* --------------------------------------------------------- */
/* Component: Item Card (The "App" Style)                    */
/* --------------------------------------------------------- */
function ItemCard({ item, formatPrice, borderColor }: { item: ItemRow, formatPrice: (n: number | null) => string, borderColor: string }) {
  return (
    <div
      className="group relative flex gap-4 p-4 rounded-3xl bg-[var(--card,#ffffff)]/80 hover:bg-[var(--card,#ffffff)] transition-all duration-300"
      style={{
        // Suptilan border i senka za karticu
        border: `1px solid ${borderColor}`,
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)"
      }}
    >
      {/* Left Image (Optional) */}
      {item.imageUrl && (
        <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 relative shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        </div>
      )}

      {/* Content Right */}
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

        {/* Add Button (Fake for interaction feel) */}
        <div className="mt-3 flex items-center justify-end">
          <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-[var(--brand-1)] flex items-center justify-center text-[var(--brand-1)] group-hover:text-white transition-all duration-300 transform group-hover:rotate-90 shadow-sm">
            <PlusIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}