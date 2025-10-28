"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/i18n";

/**
 * ScrollPricingIntro (v7.2)
 * - Naslov kreće “čitljiv” (HEAD_INIT), miruje do HEAD_SHRINK_START,
 *   zatim se smanjuje do HEAD_SHRINK_END; fade-out tek posle toga.
 * - Kartice lete tek po startu smanjivanja, pa deck → odlazak nagore.
 * - Featured (centar): gradient okvir, gradient bullet i gradient hover-border.
 * - Ostali: obojeni outline + hover outline u boji tier-a.
 */

type TierId = "basic" | "standard" | "business" | "premium" | "signature";

type Pkg = {
  id: TierId;
  name: string;
  price: string;
  features: string[];
};

const PKGS: Pkg[] = [
  { id: "basic",     name: "Basic",     price: "€149",  features: [t("Quick setup"), t("1 page link"), t("Email inquiries")] },
  { id: "standard",  name: "Standard",  price: "€299",  features: [t("Branding colors"), t("Up to 6 addons"), t("Analytics lite")] },
  { id: "business",  name: "Business",  price: t("Custom"), features: [t("Fair use traffic"), t("Advanced formulas"), t("White-label")] }, // FEATURED
  { id: "premium",   name: "Premium",   price: "€599",  features: [t("Custom domain"), t("Unlimited addons"), t("Priority email")] },
  { id: "signature", name: "Signature", price: "€999",  features: [t("Team access"), t("Templates"), t("SLA support")] },
];

// Boje po tier-u (za outline i hover)
const TIER_COLORS: Record<Exclude<TierId, "business">, string> = {
  basic: "#38bdf8",     // sky-400
  standard: "#14b8a6",  // teal-500
  premium: "#8b5cf6",   // violet-500
  signature: "#f59e0b", // amber-500
};

const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export default function ScrollPricingIntro({
  headline = t("Create your tiers on your price page"),
}: { headline?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<Record<TierId, HTMLDivElement | null>>({
    basic: null,
    standard: null,
    business: null,
    premium: null,
    signature: null,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Raspored ciljeva (2x2 + centar)
  const targets = useMemo(() => {
    return {
      basic:     { x: -360, y: -160, scale: 0.94, rot: -2 },
      standard:  { x:  360, y: -160, scale: 0.94, rot:  2 },
      business:  { x:    0, y:    0, scale: 1.06, rot:  0 }, // CENTAR (featured)
      premium:   { x: -300, y:  220, scale: 0.98, rot: -1 },
      signature: { x:  300, y:  220, scale: 0.98, rot:  1 },
    } as const;
  }, []);

  // Početne off-screen pozicije (razni pravci/dijagonale)
  const starts = useMemo(() => {
    return {
      basic:     { x: -900, y: -220, rot: -14 },
      standard:  { x:  960, y: -200, rot:  14 },
      business:  { x:  140, y: -640, rot:  -8 },
      premium:   { x: -820, y:  920, rot: -14 },
      signature: { x:  980, y:  860, rot:  14 },
    } as const;
  }, []);

  // "Špil" (stack) offseti oko centra (minimalne razlike da se nazire sloj)
  const stackOffsets = useMemo(() => {
    return {
      basic:     { x: -14, y: 14 },
      standard:  { x: -7,  y: 10 },
      business:  { x:  0,  y:  0 }, // TOP (naš)
      premium:   { x:  7,  y: 18 },
      signature: { x: 14,  y: 24 },
    } as const;
  }, []);

  // Z-index tako da je naš (business) na vrhu u špilu
  const zIndexMap: Record<TierId, number> = {
    basic: 10,
    standard: 20,
    premium: 30,
    signature: 40,
    business: 50,
  };

  // ────────────────────────── Tajming naslov/kartice ──────────────────────────
  const HEAD_INIT        = 1.08; // početna, čitljiva veličina (bez “over-zoom”)
  const SCALE_END        = 0.24; // konačna mala veličina
  const HEAD_SHRINK_START= 0.18; // dokle držimo HEAD_INIT, posle krene shrink
  const HEAD_SHRINK_END  = 0.84; // do ovde završavamo shrink (tik pre fade-a)
  const FADE_START       = 0.84; // tek kad je već mali
  const FADE_END         = 0.96;

  // Kartice kreću nakon što je shrink počeo (bazirano relativno na HEAD_SHRINK_START)
  const CARD_BASE = HEAD_SHRINK_START + 0.06;
  const CARD_S = {
    basic:     CARD_BASE + 0.00,
    standard:  CARD_BASE + 0.03,
    business:  CARD_BASE + 0.05,
    premium:   CARD_BASE + 0.07,
    signature: CARD_BASE + 0.09,
  } as const;
  const CARD_D = { basic: 0.26, standard: 0.24, business: 0.26, premium: 0.22, signature: 0.20 } as const;

  // Faza 2 (špil → odlazak nagore)
  const DECK_START = 0.92;  // počinje slaganje u špil
  const DECK_STACK = 0.97;  // do ovde su složeni
  const DECK_END   = 0.995; // odlazak nagore i nestanak

  useEffect(() => {
    if (!mounted) return;
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const title = titleRef.current;
    if (!section || !viewport || !title) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const kx = Math.max(1, vw / 1280);
    const ky = Math.max(1, vh / 800);

    const STARTS = Object.fromEntries(
      Object.entries(starts).map(([k, v]) => [k, { x: v.x * kx, y: v.y * ky, rot: v.rot }]),
    ) as Record<TierId, { x: number; y: number; rot: number }>;

    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const frame = () => {
      raf = 0;

      const rect = section.getBoundingClientRect();
      const vhNow = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vhNow);
      const raw = clamp((vhNow - rect.top) / travel, 0, 1);

      // ── Naslov: hold → shrink → fade
      let headScale = HEAD_INIT;
      if (raw >= HEAD_SHRINK_START) {
        const p = clamp((raw - HEAD_SHRINK_START) / (HEAD_SHRINK_END - HEAD_SHRINK_START), 0, 1);
        headScale = prefersReduced ? HEAD_INIT : lerp(HEAD_INIT, SCALE_END, easeInOut(p));
      }
      const headOpacity = raw < FADE_START ? 1 : 1 - clamp((raw - FADE_START) / (FADE_END - FADE_START), 0, 1);

      title.style.transform = `translateZ(0) scale(${headScale})`;
      title.style.opacity = String(headOpacity);

      // ── Kartice: Faza 1 (fly-in to targets)
      (PKGS as Pkg[]).forEach((pkg) => {
        const el = cardRefs.current[pkg.id];
        if (!el) return;

        const s = (CARD_S as any)[pkg.id] as number;
        const d = (CARD_D as any)[pkg.id] as number;
        const local = clamp((raw - s) / d, 0, 1);
        const t = prefersReduced ? 1 : easeInOut(local);

        const off = STARTS[pkg.id];
        const to = targets[pkg.id];

        let x = lerp(off.x, to.x, t);
        let y = lerp(off.y, to.y, t);
        let sc = lerp(0.84, to.scale, t);
        let rot = lerp(off.rot, to.rot, t);
        let op = t;

        // ── Faza 2: Stack (špil) + odlazak nagore
        const stackT = clamp((raw - DECK_START) / (DECK_STACK - DECK_START), 0, 1);
        const exitT  = clamp((raw - DECK_STACK) / (DECK_END - DECK_STACK), 0, 1);

        if (stackT > 0 || exitT > 0) {
          const stack = stackOffsets[pkg.id];
          x = lerp(x, stack.x, stackT);
          y = lerp(y, stack.y, stackT);
          rot = lerp(rot, 0, stackT);
          sc = lerp(sc, 1.0, stackT);

          if (exitT > 0) {
            y = y - exitT * (vhNow * 0.8);
            const fadeFactor = pkg.id === "business" ? 0.85 : 1.0;
            op = op * (1 - exitT * fadeFactor);
          }
        }

        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${sc})`;
        el.style.opacity = String(op);
      });
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted, starts, targets, stackOffsets]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[460vh]"
      aria-label={t("Scroll storytelling pricing intro")}
    >
      {/* Sticky viewport (ne diramo bg; parent stranica je bela) */}
      <div ref={viewportRef} className="sticky top-0 h-screen overflow-hidden [contain:layout_style_paint]">
        {/* NASLOV sa brend gradijentom */}
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <h2
            ref={titleRef}
            suppressHydrationWarning
            className={[
              "font-semibold tracking-tight text-center leading-none select-none",
              "text-transparent bg-clip-text",
              "bg-gradient-to-r from-indigo-500 via-sky-400 to-teal-400",
              "text-[clamp(46px,9vw,160px)]",
            ].join(" ")}
            // početno stanje = HEAD_INIT (da izbegnemo hydration mismatch)
            style={{ transform: `translateZ(0) scale(${1.08})`, opacity: 1 }}
          >
            {headline}
          </h2>
        </div>

        {/* KARTICE */}
        <div className="absolute inset-0">
          {PKGS.map((pkg) => (
            <div
              key={pkg.id}
              ref={(el) => { cardRefs.current[pkg.id] = el; }}
              suppressHydrationWarning
              className="absolute left-1/2 top-1/2 w-[min(86vw,360px)] -translate-x-1/2 -translate-y-1/2 will-change-transform"
              style={{
                transform: "translate3d(0,0,0) rotate(0deg) scale(0.84)",
                opacity: 0,
                zIndex: zIndexMap[pkg.id],
              }}
            >
              <Card
                tier={pkg}
                featured={pkg.id === "business"}
                color={pkg.id === "business" ? undefined : TIER_COLORS[pkg.id]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Tier kartice */
function Card({ tier, featured, color }: { tier: Pkg; featured: boolean; color?: string }) {
  if (featured) {
    return (
      <div className="rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500 via-sky-400 to-teal-400 shadow-[0_8px_40px_rgba(0,0,0,.12)]">
        <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white">
          <div className="p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">{t(tier.name)}</h3>
              <span className="text-lg font-semibold text-neutral-900">{tier.price}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full translate-y-[1px]"
                    style={{ background: "linear-gradient(90deg, #6366f1, #38bdf8, #14b8a6)" }}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={[
                "mt-5 w-full rounded-xl py-2.5 text-sm font-medium transition",
                "border border-neutral-200 text-neutral-900 hover:shadow hover:-translate-y-[1px]",
                "hover:border-transparent",
                "hover:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,_#6366f1,_#38bdf8,_#14b8a6)_border-box]",
              ].join(" ")}
              aria-label={t("Select {name}", { name: tier.name })}
            >
              {t("Select")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group rounded-3xl border bg-white shadow-[0_8px_40px_rgba(0,0,0,.06)]"
      style={{
        borderColor: color || "#e5e7eb",
        ["--tier" as any]: color || "#0ea5a4",
      }}
    >
      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">{t(tier.name)}</h3>
          <span className="text-lg font-semibold text-neutral-900">{tier.price}</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-neutral-700">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full translate-y-[1px]" style={{ backgroundColor: color || "#737373" }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <button
          className={[
            "mt-5 w-full rounded-xl py-2.5 text-sm font-medium transition",
            "border border-neutral-200 text-neutral-900 hover:shadow hover:-translate-y-[1px]",
            "hover:outline hover:outline-2 hover:outline-offset-2",
            "hover:[outline-color:var(--tier)] hover:[border-color:var(--tier)]",
          ].join(" ")}
          aria-label={t("Select {name}", { name: tier.name })}
        >
          {t("Select")}
        </button>
      </div>
    </div>
  );
}