// src/components/scrolly/MainPhase2.tsx
"use client";

import { useEffect, useMemo, useRef, useState, createRef } from "react";
import { t } from "@/i18n";

/**
 * MainPhase2 (v7.9 — adjustable INTRO HOLD)
 * - Sve kao kod tebe (v7.8), ali INTRO_HOLD je parametrizovan:
 *   props: holdDesktop (default 0.20), holdMobile (default 0.12).
 * - Držimo naslov sam na ekranu do isteka HOLD-a, kartice su off-screen,
 *   label sakriven, pa posle re-map [HOLD..1] → [0..1] i ostatak ide identično.
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

const TIER_COLORS: Record<Exclude<TierId, "business">, string> = {
  basic: "#38bdf8",
  standard: "#14b8a6",
  premium: "#8b5cf6",
  signature: "#f59e0b",
};

const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

export default function MainPhase2({
  headline = t("Create your tiers on your price page"),
  labelWords = [t("Customize"), t("them"), t("to"), t("your"), t("liking")],
  holdDesktop = 0.20,
  holdMobile = 0.12,
}: {
  headline?: string;
  labelWords?: string[];
  holdDesktop?: number;
  holdMobile?: number;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // REFS: stabilan niz createRef-ova (nema crvenila)
  const wordRefs = useMemo(() => labelWords.map(() => createRef<HTMLSpanElement>()), [labelWords]);

  const cardRefs = useRef<Record<TierId, HTMLDivElement | null>>({
    basic: null,
    standard: null,
    business: null,
    premium: null,
    signature: null,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // Target pozicije (isto kao kod tebe)
  const targets = useMemo(() => {
    if (!isMobile) {
      return {
        basic:     { x: -360, y: -160, scale: 0.94, rot: -2 },
        standard:  { x:  360, y: -160, scale: 0.94, rot:  2 },
        business:  { x:    0, y:    0, scale: 1.06, rot:  0 },
        premium:   { x: -300, y:  220, scale: 0.98, rot: -1 },
        signature: { x:  300, y:  220, scale: 0.98, rot:  1 },
      } as const;
    }
    return {
      basic:     { x: 0, y: -280, scale: 0.95, rot: 0 },
      standard:  { x: 0, y: -120, scale: 0.96, rot: 0 },
      business:  { x: 0, y:   40, scale: 1.02, rot: 0 },
      premium:   { x: 0, y:  200, scale: 0.96, rot: 0 },
      signature: { x: 0, y:  360, scale: 0.96, rot: 0 },
    } as const;
  }, [isMobile]);

  // Početni off-screen vektori
  const starts = useMemo(() => {
    if (!isMobile) {
      return {
        basic:     { x: -900, y: -220, rot: -14 },
        standard:  { x:  960, y: -200, rot:  14 },
        business:  { x:  140, y: -640, rot:  -8 },
        premium:   { x: -820, y:  920, rot: -14 },
        signature: { x:  980, y:  860, rot:  14 },
      } as const;
    }
    return {
      basic:     { x:  0,  y: -700, rot:  0 },
      standard:  { x:  0,  y: -700, rot:  0 },
      business:  { x:  0,  y: -700, rot:  0 },
      premium:   { x:  0,  y:  700, rot:  0 },
      signature: { x:  0,  y:  700, rot:  0 },
    } as const;
  }, [isMobile]);

  // Špil offseti
  const stackOffsets = useMemo(() => {
    return {
      basic:     { x: -14, y: 14 },
      standard:  { x: -7,  y: 10 },
      business:  { x:  0,  y:  0 },
      premium:   { x:  7,  y: 18 },
      signature: { x: 14,  y: 24 },
    } as const;
  }, []);

  const zIndexMap: Record<TierId, number> = {
    basic: 10,
    standard: 20,
    premium: 30,
    signature: 40,
    business: 50,
  };

  // Tajming (isti kao ranije; kašnjenje pravimo kroz INTRO HOLD re-map)
  const HEAD_INIT         = isMobile ? 1.02 : 1.08;
  const SCALE_END         = isMobile ? 0.28 : 0.24;
  const HEAD_SHRINK_START = 0.18;
  const HEAD_SHRINK_END   = isMobile ? 0.80 : 0.84;
  const FADE_START        = isMobile ? 0.80 : 0.84;
  const FADE_END          = isMobile ? 0.95 : 0.96;

  const CARD_BASE = HEAD_SHRINK_START + (isMobile ? 0.04 : 0.06);
  const CARD_S = {
    basic:     CARD_BASE + 0.00,
    standard:  CARD_BASE + 0.03,
    business:  CARD_BASE + 0.05,
    premium:   CARD_BASE + 0.07,
    signature: CARD_BASE + 0.09,
  } as const;
  const CARD_D = isMobile
    ? ({ basic: 0.22, standard: 0.22, business: 0.24, premium: 0.20, signature: 0.20 } as const)
    : ({ basic: 0.26, standard: 0.24, business: 0.26, premium: 0.22, signature: 0.20 } as const);

  // Deck pragovi
  const DECK_START = isMobile ? 0.88 : 0.92;
  const DECK_STACK = isMobile ? 0.96 : 0.97;
  const DECK_END   = isMobile ? 0.995 : 0.995;

  // RAW trim
  const RAW_END_DESKTOP = 0.92;
  const RAW_END_MOBILE  = 0.94;

  // Kada su sve kartice “slegnute”
  const CARDS_DONE =
    Math.max(
      CARD_S.basic + CARD_D.basic,
      CARD_S.standard + CARD_D.standard,
      CARD_S.business + CARD_D.business,
      CARD_S.premium + CARD_D.premium,
      CARD_S.signature + CARD_D.signature
    );

  // Label prozori (re-map kroz p)
  const LABEL_IN_START  = Math.min(CARDS_DONE + 0.02, (DECK_START ?? 0.92) - 0.10);
  const LABEL_IN_END    = LABEL_IN_START + 0.12;
  const LABEL_OUT_START = Math.min((DECK_START ?? 0.92) - 0.04, 0.96);
  const LABEL_OUT_END   = Math.min((DECK_START ?? 0.92), 0.98);

  // >>> INTRO HOLD podesiv preko props-a
  const INTRO_HOLD = useMemo(() => (isMobile ? holdMobile : holdDesktop), [isMobile, holdDesktop, holdMobile]);

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
      Object.entries(starts).map(([k, v]) => [k, { x: v.x * (isMobile ? 1 : kx), y: v.y * (isMobile ? 1 : ky), rot: v.rot }]),
    ) as Record<TierId, { x: number; y: number; rot: number }>;

    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const frame = () => {
      raf = 0;

      const rect = section.getBoundingClientRect();
      const vhNow = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vhNow);
      const raw0 = clamp((vhNow - rect.top) / travel, 0, 1);

      // RAW kompresija kao i ranije
      const RAW_END = isMobile ? RAW_END_MOBILE : RAW_END_DESKTOP;
      const raw = clamp(raw0 / RAW_END, 0, 1);

      // INTRO HOLD — mirujemo do isteka
      if (raw < INTRO_HOLD) {
        // Naslov
        title.style.transform = `translateZ(0) scale(${HEAD_INIT})`;
        title.style.opacity = "1";

        // Kartice off-screen
        (PKGS as Pkg[]).forEach((pkg) => {
          const el = cardRefs.current[pkg.id];
          if (!el) return;
          const off = STARTS[pkg.id];
          el.style.transform = `translate3d(${off.x}px, ${off.y}px, 0) rotate(${off.rot}deg) scale(0.84)`;
          el.style.opacity = "0";
        });

        // Label sakriven
        wordRefs.forEach((ref) => {
          const span = ref.current;
          if (!span) return;
          const parent = span.parentElement?.parentElement as HTMLDivElement | null;
          if (parent) {
            parent.style.opacity = "0";
            parent.style.transform = "translateY(-6px) translateZ(0)";
          }
          span.style.opacity = "0";
          span.style.transform = "translate3d(120px,0,0) scale(0.96)";
        });

        return;
      }

      // Re-map [INTRO_HOLD..1] → [0..1]
      const p = clamp((raw - INTRO_HOLD) / (1 - INTRO_HOLD), 0, 1);

      // Naslov
      let headScale = HEAD_INIT;
      if (p >= HEAD_SHRINK_START) {
        const s = clamp((p - HEAD_SHRINK_START) / (HEAD_SHRINK_END - HEAD_SHRINK_START), 0, 1);
        headScale = prefersReduced ? HEAD_INIT : lerp(HEAD_INIT, SCALE_END, easeInOut(s));
      }
      const headOpacity = p < FADE_START ? 1 : 1 - clamp((p - FADE_START) / (FADE_END - FADE_START), 0, 1);

      title.style.transform = `translateZ(0) scale(${headScale})`;
      title.style.opacity = String(headOpacity);

      // Kartice
      (PKGS as Pkg[]).forEach((pkg) => {
        const el = cardRefs.current[pkg.id];
        if (!el) return;

        const s = (CARD_S as any)[pkg.id] as number;
        const d = (CARD_D as any)[pkg.id] as number;
        const local = clamp((p - s) / d, 0, 1);
        const tt = prefersReduced ? 1 : easeInOut(local);

        const off = STARTS[pkg.id];
        const to = targets[pkg.id];

        let x = lerp(off.x, to.x, tt);
        let y = lerp(off.y, to.y, tt);
        let sc = lerp(0.84, to.scale, tt);
        let rot = lerp(off.rot, to.rot, tt);
        let op = tt;

        // Stack + exit
        const stackT = clamp((p - DECK_START) / (DECK_STACK - DECK_START), 0, 1);
        const exitT  = clamp((p - DECK_STACK) / (DECK_END - DECK_STACK), 0, 1);

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

      // WORD-BY-WORD label (desktop)
      if (!isMobile) {
        const outP = clamp((p - LABEL_OUT_START) / (LABEL_OUT_END - LABEL_OUT_START), 0, 1);
        const outEase = easeInOut(outP);
        const wrapTy = lerp(0, -6, outEase);

        wordRefs.forEach((ref, i) => {
          const span = ref.current;
          if (!span) return;

          const parent = span.parentElement?.parentElement as HTMLDivElement | null;
          if (parent) {
            parent.style.opacity = String(1 - outEase);
            parent.style.transform = `translateY(${wrapTy}px) translateZ(0)`;
          }

          const inP = clamp(
            (p - (LABEL_IN_START + i * 0.045)) / (LABEL_IN_END - LABEL_IN_START),
            0, 1
          );
          const e = easeOutBack(inP);
          const x = lerp(140, 0, e);
          const sc = lerp(0.96, 1.0, e);
          const op = inP;

          span.style.transform = `translate3d(${x}px,0,0) scale(${sc})`;
          span.style.opacity = String(op * (1 - outEase));
        });
      } else {
        // Mobile: sakrij
        wordRefs.forEach((ref) => {
          const span = ref.current;
          if (span) {
            const parent = span.parentElement?.parentElement as HTMLDivElement | null;
            if (parent) {
              parent.style.opacity = "0";
              parent.style.transform = "translateY(-6px) translateZ(0)";
            }
            span.style.opacity = "0";
            span.style.transform = "translate3d(120px,0,0) scale(0.96)";
          }
        });
      }
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [
    mounted,
    isMobile,
    starts,
    targets,
    stackOffsets,
    // tajming
    HEAD_INIT, SCALE_END, HEAD_SHRINK_START, HEAD_SHRINK_END, FADE_START, FADE_END,
    DECK_START, DECK_STACK, DECK_END,
    CARD_S, CARD_D,
    // label
    LABEL_IN_START, LABEL_IN_END, LABEL_OUT_START, LABEL_OUT_END,
    wordRefs,
    INTRO_HOLD, // reaktivacija na resize/promenu
  ]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[380vh] sm:h-[320vh]"
      aria-label={t("Scroll storytelling pricing intro")}
    >
      <div ref={viewportRef} className="sticky top-0 h-screen overflow-hidden [contain:layout_style_paint]">
        {/* Naslov */}
        <div className="absolute inset-0 grid place-items-center pointer-events-none px-3 sm:px-0 overflow-visible">
          <h2
            ref={titleRef}
            suppressHydrationWarning
            className={[
              "font-semibold tracking-tight text-center leading-tight select-none",
              "text-transparent bg-clip-text",
              "bg-gradient-to-r from-indigo-500 via-sky-400 to-teal-400",
              "mx-auto max-w-[20ch] sm:max-w-[24ch] text-balance",
              "text-[clamp(46px,8.6vw,150px)]",
            ].join(" ")}
            style={{ transform: `translateZ(0) scale(${HEAD_INIT})`, opacity: 1, paddingBottom: "0.08em" }}
          >
            {headline}
          </h2>
        </div>

        {/* Desktop label – var(--brand-gradient), reč po reč */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div
            className="mx-auto w-full max-w-[92vw] text-center font-semibold select-none"
            style={{
              position: "absolute",
              left: "50%",
              top: "14%",
              translate: "-50% 0",
              opacity: 0,
              transform: "translateY(-6px) translateZ(0)",
            }}
          >
            <div className="inline-flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2">
              {labelWords.map((w, i) => (
                <span
                  key={i}
                  ref={wordRefs[i]}
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "var(--brand-gradient)",
                    fontSize: "clamp(22px, 3.8vw, 36px)",
                    lineHeight: 1.1,
                    display: "inline-block",
                    opacity: 0,
                    transform: "translate3d(120px,0,0) scale(0.96)",
                    willChange: "transform, opacity",
                    filter: "drop-shadow(0 1px 10px rgba(var(--brand-1-rgb),0.08))",
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Kartice */}
        <div className="absolute inset-0">
          {PKGS.map((pkg) => (
            <div
              key={pkg.id}
              ref={(el) => { cardRefs.current[pkg.id] = el; }}
              suppressHydrationWarning
              className="absolute left-1/2 top-1/2 w-[min(92vw,380px)] sm:w-[min(86vw,360px)] -translate-x-1/2 -translate-y-1/2 will-change-transform"
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
          <span className="text-lg font-semibold text-neutral-900">{t(tier.price)}</span>
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