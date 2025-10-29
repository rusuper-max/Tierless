"use client";

import { useEffect, useMemo, useRef, useState, CSSProperties, createRef, useLayoutEffect } from "react";
import { t } from "@/i18n";

/**
 * ScenesTrack — P2 → P3 (+ opciono P4) u jednom sticky track-u
 * - Eliminisan geometrijski gap između scena.
 * - nextSectionId: automatski skraćuje track do sledeće sekcije (footer/P4) → nema “praznog hoda”.
 * - Fallback globalRawEnd kad nextSectionId nije setovan ili element ne postoji.
 * - P2 vraća obojeni outline + hover outline na “Select” kao u tvom originalu.
 */

type TierId = "basic" | "standard" | "business" | "premium" | "signature";
type Pkg = { id: TierId; name: string; price: string; features: string[] };

const PKGS: Pkg[] = [
  { id: "basic",     name: "Basic",     price: "€149",  features: [t("Quick setup"), t("1 page link"), t("Email inquiries")] },
  { id: "standard",  name: "Standard",  price: "€299",  features: [t("Branding colors"), t("Up to 6 addons"), t("Analytics lite")] },
  { id: "business",  name: "Business",  price: t("Custom"), features: [t("Fair use traffic"), t("Advanced formulas"), t("White-label")] },
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
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / Math.max(1e-6, e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

const BRAND_GRADIENT = "linear-gradient(90deg, var(--brand-1), var(--brand-2))";

export default function ScenesTrack({
  // dužine po scenama
  p2LVH = 320,
  p3LVH = 380,
  p4LVH = 0,            // 0 = trenutno nema P4
  overlap = 0.06,       // crossfade između suseda
  globalRawEnd = 0.965, // fallback “tail cut” kad nema nextSectionId
  nextSectionId,        // npr. "#site-footer" ili "#phase4"
  headlineP2 = t("Create your tiers on your price page"),
  labelWordsP2 = [t("Customize"), t("them"), t("to"), t("your"), t("liking")],
  phraseP3 = t("Or create your Tierless price page…"),
}: {
  p2LVH?: number;
  p3LVH?: number;
  p4LVH?: number;
  overlap?: number;
  globalRawEnd?: number;
  nextSectionId?: string;
  headlineP2?: string;
  labelWordsP2?: string[];
  phraseP3?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [trackPx, setTrackPx] = useState<number | null>(null); // ako postoji nextSectionId, koristimo px visinu umesto lvh

  useEffect(() => {
    setMounted(true);
    const r = () => setIsMobile(window.innerWidth < 640);
    r();
    window.addEventListener("resize", r, { passive: true });
    return () => window.removeEventListener("resize", r);
  }, []);

  // Ukupna normalizovana dužina (koristi se kad nemamo nextSectionId)
  const totalLVH = (p2LVH || 0) + (p3LVH || 0) + (p4LVH || 0);
  const total = totalLVH || 1;
  const n2 = p2LVH / total;
  const n3 = p3LVH / total;
  const n4 = p4LVH / total;

  // Overlap
  const ov = Math.min(overlap, 0.12);
  type Range = { s: number; e: number };
  const R2: Range = { s: 0, e: n2 };
  const R3: Range = { s: R2.e - ov, e: R2.e + n3 };
  const R4: Range = n4 > 0 ? { s: R3.e - ov, e: R3.e + n4 } : { s: 1, e: 1 };

  // ============ Tail snap na sledeću sekciju ============
  useLayoutEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;

    const measure = () => {
      if (!nextSectionId) { setTrackPx(null); return; }
      const nextEl = document.querySelector(nextSectionId) as HTMLElement | null;
      if (!nextEl) { setTrackPx(null); return; }
      // izmeri tačnu visinu od vrha ove sekcije do vrha sledeće
      const secTop = sec.offsetTop;
      const nextTop = nextEl.offsetTop;
      const px = Math.max(0, nextTop - secTop);
      setTrackPx(px || null);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    if (nextSectionId) {
      const target = document.querySelector(nextSectionId) as HTMLElement | null;
      if (target) ro.observe(target);
    }

    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [nextSectionId]);

  // ----- P2 refs/konstante -----
  const p2TitleRef = useRef<HTMLHeadingElement>(null);
  const p2WordRefs = useMemo(() => labelWordsP2.map(() => createRef<HTMLSpanElement>()), [labelWordsP2]);

  const p2CardRefs = useRef<Record<TierId, HTMLDivElement | null>>({
    basic: null, standard: null, business: null, premium: null, signature: null,
  });
  const p2Starts = useMemo(() => {
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
      basic:     { x: 0, y: -700, rot: 0 },
      standard:  { x: 0, y: -700, rot: 0 },
      business:  { x: 0, y: -700, rot: 0 },
      premium:   { x: 0, y:  700, rot: 0 },
      signature: { x: 0, y:  700, rot: 0 },
    } as const;
  }, [isMobile]);
  const p2Targets = useMemo(() => {
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
  const p2StackOffsets = useMemo(() => ({
    basic: { x: -14, y: 14 },
    standard: { x: -7, y: 10 },
    business: { x: 0, y: 0 },
    premium: { x: 7, y: 18 },
    signature: { x: 14, y: 24 },
  } as const), []);

  const P2_HEAD_INIT = isMobile ? 1.02 : 1.08;
  const P2_SCALE_END = isMobile ? 0.28 : 0.24;
  const P2_HEAD_SHRINK_S = 0.18;
  const P2_HEAD_SHRINK_E = isMobile ? 0.80 : 0.84;
  const P2_FADE_S = isMobile ? 0.80 : 0.84;
  const P2_FADE_E = isMobile ? 0.95 : 0.96;

  const CARD_BASE = P2_HEAD_SHRINK_S + (isMobile ? 0.04 : 0.06);
  const CARD_S: Record<TierId, number> = {
    basic: CARD_BASE + 0.00,
    standard: CARD_BASE + 0.03,
    business: CARD_BASE + 0.05,
    premium: CARD_BASE + 0.07,
    signature: CARD_BASE + 0.09,
  };
  const CARD_D: Record<TierId, number> = isMobile
    ? { basic: 0.22, standard: 0.22, business: 0.24, premium: 0.20, signature: 0.20 }
    : { basic: 0.26, standard: 0.24, business: 0.26, premium: 0.22, signature: 0.20 };

  const DECK_START = isMobile ? 0.88 : 0.92;
  const DECK_STACK = isMobile ? 0.96 : 0.97;
  const DECK_END = 0.999;

  // ----- P3 refs/konstante -----
  const p3FlightRef = useRef<HTMLDivElement>(null);
  const p3LeftPanelRef = useRef<HTMLDivElement | null>(null);
  const p3RightPanelRef = useRef<HTMLDivElement | null>(null);
  const p3LeftRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const p3OptionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const p3OptionCheckRefs = useRef<Array<SVGPathElement | null>>([]);
  const p3SliderRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const p3SliderFillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const p3SliderKnobRefs = useRef<Array<HTMLDivElement | null>>([]);
  const p3PriceRef = useRef<HTMLSpanElement | null>(null);
  const p3PriceState = useRef({ display: 299 });

  const HEAD_TOP_VH = 12;
  const leftRows = useMemo(() => [
    t("Unlimited items"),
    t("Advanced formulas"),
    t("Analytics & events"),
    t("Email support"),
    t("Custom domain ready"),
    t("Team access"),
    t("Export to CSV"),
  ], []);
  const options = useMemo(() => [t("Option 1"), t("Option 2"), t("Option 3")], []);
  const sliders = useMemo(() => [
    { label: t("Usage level"),      baseFill: 0.62 },
    { label: t("Automation depth"), baseFill: 0.48 },
  ], []);

  const chars = useMemo(() => phraseP3.split(""), [phraseP3]);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [totalW, setTotalW] = useState(0);
  useEffect(() => {
    const offs = letterRefs.current.map((el) => (el ? el.offsetLeft : 0));
    const last = letterRefs.current[letterRefs.current.length - 1];
    const tot = last ? last.offsetLeft + last.offsetWidth : 0;
    setOffsets(offs); setTotalW(tot);
  }, [chars.length, mounted]);

  const letterPlan = useMemo(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const MAGX = vw * 0.62, MAGY = vh * 0.48;
    const BASE = 0.02, STEP = 0.010, DUR = 0.18;
    return chars.map((ch, i) => {
      const dir = i % 4;
      const jitter = ((i % 6) - 3) * 4;
      const lp: any = { idx: i, ch, sX: 0, sY: 0, base: BASE + i * STEP, dur: DUR };
      if      (dir === 0) { lp.sX = -MAGX; lp.sY =  jitter; }
      else if (dir === 1) { lp.sX =  MAGX; lp.sY = -jitter; }
      else if (dir === 2) { lp.sX =  jitter; lp.sY = -MAGY; }
      else                { lp.sX = -jitter; lp.sY =  MAGY; }
      return lp;
    });
  }, [chars]);

  const PANEL_L_BASE = 0.08, PANEL_L_DUR = 0.24;
  const PANEL_R_BASE = 0.10, PANEL_R_DUR = 0.24;
  const ROW_DUR = 0.18;
  const SETTLE_HOLD = 0.05;
  const CHECK_DRAW_DUR = 0.22;
  const SLIDER_RUN_DUR = 0.28;

  const rowsPlanLeft = useMemo(
    () => leftRows.map((_, i) => ({ idx: i, base: PANEL_L_BASE + PANEL_L_DUR + 0.05 + i * 0.045, dur: ROW_DUR })),
    [leftRows]
  );
  const rowsPlanRight = useMemo(() => {
    const arr: { idx: number; base: number; dur: number }[] = [];
    const startBase = PANEL_R_BASE + PANEL_R_DUR + 0.06;
    options.forEach((_, i) => arr.push({ idx: i, base: startBase + i * 0.05, dur: ROW_DUR }));
    const after = startBase + options.length * 0.05 + 0.06;
    sliders.forEach((_, i) => arr.push({ idx: options.length + i, base: after + i * 0.055, dur: ROW_DUR }));
    return arr;
  }, [options, sliders]);

  const p4Ref = useRef<HTMLDivElement | null>(null);

  // RAF — jedan loop
  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    let raf = 0;
    const schedule = () => (raf || (raf = requestAnimationFrame(frame)));

    const frame = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // Ako imamo nextSectionId i izmerenu px visinu — koristimo nju (nema LVH merenja)
      const sectionHeight = trackPx ?? rect.height;
      const travel = Math.max(1, sectionHeight - vh);

      const raw0 = clamp((vh - rect.top) / travel, 0, 1);
      const raw = trackPx ? raw0 : clamp(raw0 / Math.max(0.0001, globalRawEnd), 0, 1);

      // Helperi
      const weight = (r: Range) => {
        const wIn  = smoothstep(r.s - ov, r.s, raw);
        const wOut = 1 - smoothstep(r.e, r.e + ov, raw);
        return clamp(wIn * wOut, 0, 1);
      };
      const local = (r: Range) => clamp((raw - r.s) / Math.max(1e-6, (r.e - r.s)), 0, 1);

      /* ===================== P2 ===================== */
      const w2 = weight(R2);
      const t2 = local(R2);

      if (p2TitleRef.current) {
        const scale =
          t2 < P2_HEAD_SHRINK_S
            ? P2_HEAD_INIT
            : lerp(P2_HEAD_INIT, P2_SCALE_END, easeInOut(clamp((t2 - P2_HEAD_SHRINK_S) / (P2_HEAD_SHRINK_E - P2_HEAD_SHRINK_S), 0, 1)));
        const op = 1 - clamp((t2 - P2_FADE_S) / (P2_FADE_E - P2_FADE_S), 0, 1);
        p2TitleRef.current.style.transform = `translateZ(0) scale(${scale})`;
        p2TitleRef.current.style.opacity = String(op * w2);
      }

      (Object.keys(p2CardRefs.current) as TierId[]).forEach((id) => {
        const el = p2CardRefs.current[id]; if (!el) return;
        const s = CARD_S[id], d = CARD_D[id];
        const loc = easeInOut(clamp((t2 - s) / d, 0, 1));
        const from = p2Starts[id], to = p2Targets[id];

        let x = lerp(from.x, to.x, loc);
        let y = lerp(from.y, to.y, loc);
        let sc = lerp(0.84, to.scale, loc);
        let rot = lerp(from.rot, to.rot, loc);
        let op = loc * w2;

        const stackT = clamp((t2 - DECK_START) / (DECK_STACK - DECK_START), 0, 1);
        const exitT  = clamp((t2 - DECK_STACK) / (DECK_END - DECK_STACK), 0, 1);
        if (stackT > 0) {
          const st = p2StackOffsets[id];
          x = lerp(x, st.x, stackT);
          y = lerp(y, st.y, stackT);
          rot = lerp(rot, 0, stackT);
          sc = lerp(sc, 1.0, stackT);
        }
        if (exitT > 0) {
          y = y - exitT * (vh * 0.9);
          op = op * (1 - exitT * (id === "business" ? 0.85 : 1));
        }

        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${sc})`;
        el.style.opacity = String(op);
      });

      // P2 label (desktop)
      if (window.innerWidth >= 640) {
        const CARDS_DONE =
          Math.max(CARD_S.basic + CARD_D.basic, CARD_S.standard + CARD_D.standard, CARD_S.business + CARD_D.business,
                   CARD_S.premium + CARD_D.premium, CARD_S.signature + CARD_D.signature);
        const LABEL_IN_START  = Math.min(CARDS_DONE + 0.02, DECK_START - 0.10);
        const LABEL_IN_END    = LABEL_IN_START + 0.12;
        const LABEL_OUT_START = Math.min(DECK_START - 0.04, 0.96);
        const LABEL_OUT_END   = Math.min(DECK_START, 0.98);

        const outP = clamp((t2 - LABEL_OUT_START) / (LABEL_OUT_END - LABEL_OUT_START), 0, 1);
        const outEase = easeInOut(outP);

        p2WordRefs.forEach((ref, i) => {
          const span = ref.current; if (!span) return;
          const inP = clamp((t2 - (LABEL_IN_START + i * 0.045)) / (LABEL_IN_END - LABEL_IN_START), 0, 1);
          const e = easeOutBack(inP);
          const x = lerp(140, 0, e);
          const sc = lerp(0.96, 1.0, e);
          const op = inP * (1 - outEase) * w2;
          span.style.transform = `translate3d(${x}px,0,0) scale(${sc})`;
          span.style.opacity = String(op);
        });
      }

      /* ===================== P3 ===================== */
      const w3 = weight(R3);
      const t3 = local(R3);

      if (p3LeftPanelRef.current) {
        const tt = easeInOut(clamp((t3 - 0.08) / 0.24, 0, 1));
        const x = lerp(-120, 0, tt), y = lerp(14, 0, tt);
        p3LeftPanelRef.current.style.transform = `translate3d(${x}vw, ${y}vh, 0)`;
        p3LeftPanelRef.current.style.opacity   = String(tt * w3);
      }
      if (p3RightPanelRef.current) {
        const tt = easeInOut(clamp((t3 - 0.10) / 0.24, 0, 1));
        const x = lerp(120, 0, tt), y = lerp(14, 0, tt);
        p3RightPanelRef.current.style.transform = `translate3d(${x}vw, ${y}vh, 0)`;
        p3RightPanelRef.current.style.opacity   = String(tt * w3);
      }

      rowsPlanLeft.forEach((rp) => {
        const el = p3LeftRowRefs.current[rp.idx]; if (!el) return;
        const tt = easeInOut(clamp((t3 - rp.base) / rp.dur, 0, 1));
        const y = lerp(28, 0, tt);
        el.style.transform = `translate3d(0, ${y}vh, 0)`;
        el.style.opacity   = String(tt * w3);
      });

      const checkProgress: number[] = [];
      const sliderLocals: number[] = [];

      options.forEach((_, i) => {
        const row = p3OptionRefs.current[i]; if (!row) return;
        const rp = rowsPlanRight[i];
        const tt = easeInOut(clamp((t3 - rp.base) / ROW_DUR, 0, 1));
        const y = lerp(28, 0, tt);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity   = String(tt * w3);

        const cStart = (rp.base + ROW_DUR) + SETTLE_HOLD + i * 0.02;
        const cLocal = clamp((t3 - cStart) / CHECK_DRAW_DUR, 0, 1);
        checkProgress[i] = cLocal;

        const path = p3OptionCheckRefs.current[i];
        if (path) {
          const L = 26;
          path.style.strokeDasharray  = `${L}`;
          path.style.strokeDashoffset = `${(1 - cLocal) * L}`;
          path.style.opacity = String(w3);
        }
        if (cLocal >= 0.98) row.setAttribute("data-checked", "true");
        else row.removeAttribute("data-checked");
      });

      sliders.forEach((s, i) => {
        const idx = options.length + i;
        const rp  = rowsPlanRight[idx];
        const row = p3SliderRowRefs.current[i]; if (!row) return;

        const tt = easeInOut(clamp((t3 - rp.base) / ROW_DUR, 0, 1));
        const y = lerp(28, 0, tt);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity   = String(tt * w3);

        const sStart = (rp.base + ROW_DUR) + SETTLE_HOLD;
        const sLocal = clamp((t3 - sStart) / SLIDER_RUN_DUR, 0, 1);
        sliderLocals[i] = sLocal;

        const fill = s.baseFill * sLocal;
        const pct  = (fill * 100).toFixed(1);
        const bar  = p3SliderFillRefs.current[i];
        const knob = p3SliderKnobRefs.current[i];
        if (bar)  { bar.style.width = `${pct}%`; bar.style.opacity = String(w3); }
        if (knob) { knob.style.left  = `${pct}%`; knob.style.opacity = String(w3); }
      });

      letterPlan.forEach((lp: any) => {
        const el = letterRefs.current[lp.idx]; if (!el) return;
        const tt = easeInOut(clamp((t3 - lp.base) / lp.dur, 0, 1));
        const x = lerp(lp.sX, 0, tt), y = lerp(lp.sY, 0, tt);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.style.opacity   = String(tt * w3);
      });

      let target = 299;
      checkProgress.forEach((p, i) => { target += p * ([60,45,35][i] || 0); });
      sliderLocals.forEach((f, i)   => { target += f * ([220,160][i] || 0); });
      const cur  = p3PriceState.current.display;
      const next = lerp(cur, target, 0.18);
      p3PriceState.current.display = next;
      if (p3PriceRef.current) p3PriceRef.current.textContent = `€${Math.round(next)}`;

      const fl = p3FlightRef.current;
      if (fl) {
        const exitT = clamp((t3 - 0.90) / 0.08, 0, 1);
        const exitY = -exitT * (vh * 1.0);
        fl.style.transform = `translate3d(0, ${exitY}px, 0)`;
      }

      /* ===================== P4 (stub) ===================== */
      if (n4 > 0 && p4Ref.current) {
        const w4 = (() => {
          const wIn  = smoothstep(R4.s - ov, R4.s, raw);
          const wOut = 1 - smoothstep(R4.e, R4.e + ov, raw);
          return clamp(wIn * wOut, 0, 1);
        })();
        const t4 = clamp((raw - R4.s) / Math.max(1e-6, (R4.e - R4.s)), 0, 1);
        const y = lerp(12, 0, easeInOut(t4));
        p4Ref.current.style.opacity = String(w4);
        p4Ref.current.style.transform = `translate3d(0, ${y}vh, 0)`;
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
  }, [isMobile, labelWordsP2, phraseP3, R2.s, R2.e, R3.s, R3.e, R4.s, R4.e, ov, globalRawEnd, trackPx]);

  const charStyle = (i: number): CSSProperties => ({
    display: "inline-block",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    fontSize: "clamp(34px, 8.2vw, 86px)",
    backgroundImage: BRAND_GRADIENT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    backgroundSize: totalW ? `${totalW}px 100%` : "100% 100%",
    backgroundPosition: totalW ? `-${offsets[i] || 0}px 0` : "0 0",
    transform: "translate3d(0,90vh,0)",
    opacity: 0,
    willChange: "transform, opacity",
  });

  // Stil visine sekcije: ili tačan px do sledeće sekcije, ili lvh fallback
  const sectionStyle: React.CSSProperties = trackPx != null
    ? { height: `${trackPx}px` }
    : { height: `${totalLVH}lvh` };

  return (
    <section
      ref={sectionRef}
      id="scenes-track"
      className="relative isolate"
      style={sectionStyle}
      aria-label={t("P2→P3(+P4) scrollytelling")}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100lvh] overflow-clip">

        {/* ======================= P2 ======================= */}
        <div className="absolute inset-0 z-[10]">
          <div className="absolute inset-0 grid place-items-center pointer-events-none px-3 sm:px-0">
            <h2
              ref={p2TitleRef}
              className={[
                "font-semibold tracking-tight text-center leading-tight select-none",
                "text-transparent bg-clip-text",
                "mx-auto max-w-[20ch] sm:max-w-[24ch] text-balance",
                "text-[clamp(46px,8.6vw,150px)]",
              ].join(" ")}
              style={{ transform: `translateZ(0) scale(${P2_HEAD_INIT})`, opacity: 1, paddingBottom: "0.08em", backgroundImage: BRAND_GRADIENT }}
            >
              {headlineP2}
            </h2>
          </div>

          {/* Desktop label */}
          <div className="absolute inset-0 pointer-events-none hidden sm:block">
            <div
              className="mx-auto w-full max-w-[92vw] text-center font-semibold select-none"
              style={{ position: "absolute", left: "50%", top: "14%", translate: "-50% 0" }}
            >
              <div className="inline-flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2">
                {labelWordsP2.map((w, i) => (
                  <span
                    key={i}
                    ref={p2WordRefs[i]}
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: BRAND_GRADIENT,
                      fontSize: "clamp(22px, 3.8vw, 36px)",
                      lineHeight: 1.1,
                      display: "inline-block",
                      opacity: 0,
                      transform: "translate3d(120px,0,0) scale(0.96)",
                      willChange: "transform, opacity",
                      filter: "drop-shadow(0 1px 10px rgba(0,0,0,0.08))",
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
                ref={(el) => { p2CardRefs.current[pkg.id] = el; }}
                className="absolute left-1/2 top-1/2 w-[min(92vw,380px)] sm:w-[min(86vw,360px)] -translate-x-1/2 -translate-y-1/2 will-change-transform"
                style={{ transform: "translate3d(0,0,0) rotate(0deg) scale(0.84)", opacity: 0, zIndex: pkg.id === "business" ? 50 : 30 }}
              >
                <Card
                  tier={pkg}
                  featured={pkg.id === "business"}
                  color={pkg.id === "business" ? undefined : TIER_COLORS[pkg.id as Exclude<TierId,"business">]}
                />
              </div>
            ))}
          </div>
        </div>
        {/* ======================= /P2 ======================= */}

        {/* ======================= P3 ======================= */}
        <div className="absolute inset-0 z-[20]">
          <div ref={p3FlightRef} className="absolute inset-0 will-change-transform">
            {/* HEADLINE */}
            <div
              className="absolute inset-x-0 z-10 pointer-events-none"
              style={{
                top: `${HEAD_TOP_VH}vh`,
                paddingInlineStart: "calc(env(safe-area-inset-left,0px) + 12px)",
                paddingInlineEnd:   "calc(env(safe-area-inset-right,0px) + 12px)",
              }}
            >
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <h3 className="leading-none font-semibold select-none text-center whitespace-nowrap">
                  {chars.map((ch, i) => {
                    const glyph = ch === " " ? "\u00A0" : ch;
                    return (
                      <span
                        key={i}
                        ref={(el) => { letterRefs.current[i] = el; }}
                        className="inline-block align-baseline"
                        style={charStyle(i)}
                      >
                        {glyph}
                      </span>
                    );
                  })}
                </h3>
              </div>
            </div>

            {/* PANELS */}
            <div className="absolute inset-0 grid place-items-center">
              <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 pt-[28vh] sm:pt-[26vh]">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                  {/* LEFT */}
                  <div
                    ref={p3LeftPanelRef}
                    className="opacity-0 will-change-transform"
                    style={{ transform: "translate3d(-120vw, 14vh, 0)" }}
                  >
                    <div className="rounded-3xl border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,.06)]">
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-lg font-semibold text-neutral-900">{t("What this includes")}</h4>
                        <span
                          className="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-semibold"
                          style={{
                            background: "linear-gradient(#fff,#fff) padding-box, " + BRAND_GRADIENT + " border-box",
                            border: "1px solid transparent",
                            color: "#111827",
                          }}
                        >
                          {t("Estimated total")}: <span ref={p3PriceRef}>€299</span>
                        </span>
                      </div>

                      <div className="mt-4 divide-y" style={{ borderColor: "rgba(229,231,235,.8)" }}>
                        {leftRows.map((content, i) => (
                          <div
                            key={i}
                            ref={(el) => { p3LeftRowRefs.current[i] = el; }}
                            className="flex items-center gap-3 py-3 opacity-0 will-change-transform"
                            style={{ transform: "translate3d(0, 28vh, 0)" }}
                          >
                            <span className="inline-block h-2 w-2 rounded-full translate-y-[2px]" style={{ background: BRAND_GRADIENT }} />
                            <span className="text-sm text-neutral-800">{content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div
                    ref={p3RightPanelRef}
                    className="opacity-0 will-change-transform"
                    style={{ transform: "translate3d(120vw, 14vh, 0)" }}
                  >
                    <div className="rounded-3xl border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,.06)]">
                      <h4 className="text-lg font-semibold text-neutral-900">{t("Options")}</h4>

                      {/* OPTIONS */}
                      <div className="mt-4 space-y-3">
                        {options.map((label, i) => (
                          <div
                            key={i}
                            ref={(el) => { p3OptionRefs.current[i] = el; }}
                            className="flex items-center justify-between rounded-xl border px-3 py-2 opacity-0 will-change-transform"
                            style={{ borderColor: "rgba(229,231,235,.8)", transform: "translate3d(0, 28vh, 0)" }}
                            data-checked="false"
                          >
                            <span className="text-sm text-neutral-800">{label}</span>
                            <span className="inline-flex items-center gap-2" aria-hidden="true">
                              <span
                                className="inline-flex items-center justify-center rounded-md"
                                style={{
                                  width: 22,
                                  height: 22,
                                  border: "1px solid rgba(0,0,0,.2)",
                                  background: "linear-gradient(#fff,#fff)",
                                }}
                              >
                                <CheckSVG refCb={(el) => { p3OptionCheckRefs.current[i] = el; }} />
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* SLIDERS */}
                      <div className="mt-6 space-y-5">
                        {sliders.map((s, i) => (
                          <div
                            key={i}
                            ref={(el) => { p3SliderRowRefs.current[i] = el; }}
                            className="opacity-0 will-change-transform"
                            style={{ transform: "translate3d(0, 28vh, 0)" }}
                          >
                            <label className="text-sm text-neutral-700">{s.label}</label>
                            <div className="mt-2 h-3 rounded-full bg-neutral-200 relative overflow-visible">
                              <div
                                ref={(el) => { p3SliderFillRefs.current[i] = el; }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{ width: "0%", background: BRAND_GRADIENT, transition: "width .08s linear" }}
                              />
                              <div
                                ref={(el) => { p3SliderKnobRefs.current[i] = el; }}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                style={{
                                  left: "0%",
                                  width: 18, height: 18,
                                  borderRadius: 999,
                                  boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                                  background: "#fff",
                                  border: "1px solid rgba(0,0,0,.18)",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* /RIGHT */}
                </div>

                <div className="mt-8 text-center text-sm text-neutral-500">
                  {t("Everything configurable later in the builder.")}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ======================= /P3 ======================= */}

        {/* ======================= P4 (stub) ======================= */}
        {p4LVH > 0 && (
          <div className="absolute inset-0 z-[30] grid place-items-center">
            <div
              ref={p4Ref}
              className="opacity-0 will-change-transform"
              style={{ transform: "translate3d(0, 12vh, 0)" }}
            >
              <div className="rounded-3xl border bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,.06)] max-w-2xl text-center">
                <h4 className="text-2xl font-semibold text-neutral-900">
                  {t("Next up: showcase your live calculator")}
                </h4>
                <p className="mt-3 text-neutral-600">
                  {t("This is a placeholder for Phase 4. Replace with your next scene content.")}
                </p>
                <button className="tier-btn px-6 py-2.5 text-sm font-medium">
                  {t("Continue")}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ======================= /P4 ======================= */}

      </div>

      {/* Global CSS za hover outline dugmadi (bez menjanja marketing.css) */}
      <style jsx global>{`
        .tier-btn{
          display:inline-flex; align-items:center; justify-content:center;
          border:1px solid #e5e7eb; border-radius:12px; background:#fff; color:#111827;
          transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease, outline-color .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .tier-btn:hover, .tier-btn:focus-visible{
          outline:2px solid var(--tier, #94a3b8);
          outline-offset:2px;
          border-color:var(--tier, #94a3b8);
          box-shadow:0 6px 20px rgba(0,0,0,.08);
          transform:translateY(-1px);
        }
      `}</style>
    </section>
  );
}

/* ============== UI blokovi (Card, Check) ============== */

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
            <button className="tier-btn w-full py-2.5 text-sm font-medium">
              {t("Select")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Obični (outline i hover kao u tvom P2)
  return (
    <div
      className="group rounded-3xl border bg-white shadow-[0_8px_40px_rgba(0,0,0,.06)]"
      style={{ borderColor: color || "#e5e7eb", ["--tier" as any]: color || "#0ea5a4" }}
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
        <button className="tier-btn w-full py-2.5 text-sm font-medium">
          {t("Select")}
        </button>
      </div>
    </div>
  );
}

function CheckSVG({ refCb }: { refCb: (el: SVGPathElement | null) => void }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <defs>
        <linearGradient id="gb" x1="0" y1="0" x2="20" y2="20">
          <stop offset="0%"  stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        ref={refCb}
        d="M5 10.5l3.2 3.2L15 7"
        stroke="url(#gb)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="26"
        strokeDashoffset="26"
      />
    </svg>
  );
}