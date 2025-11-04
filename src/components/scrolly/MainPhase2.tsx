// src/components/scrolly/MainPhase2.tsx
"use client";

import { useEffect, useMemo, useRef, useState, createRef } from "react";
import { t } from "@/i18n";

/* =========================================
   Utils
========================================= */
const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* =========================================
   MASTER KNOBS (tweak ovde)
========================================= */
export const SYNC_GAP = 0.0;
export const P3_DELAY = 0.10;
export const SQUEEZE_MAX_VH = 110;
export const OFF_VH = 100;
export const CONVERGE_SCALE_LATE = 0.65;

// LABEL
export const LABEL_TOP_VH_DEFAULT = 16;
export const LABEL_LIFT_DELAY = 0.12;
export const LABEL_LIFT_VH = 100;


// P3 brzina
export const DEFAULT_P3_SPEED = 0.70;

// Pozadinski “ghost” tiers
export const BG_ENABLED = true;
export const BG_FADE_IN_START = 0.06;
export const BG_FADE_IN_DUR   = 0.20;
export const BG_FADE_OUT_PAD  = 0.08;

// P3 headline (nije kritično za ovu izmenu)
export const P3_TITLE_START = 0.92;
export const P3_TITLE_DUR   = 0.10;
export const P3_TITLE_Y_VH  = 24;

/* Nova podešavanja */
export const BACKDROP_IN_START = 0.00;
export const BACKDROP_IN_DUR   = 0.22;
export const TITLE_AFTER_LAST_CARD = 0.15;
export const TITLE_IN_DUR = 0.14;
export const TITLE_Y_IN_VH = 10;

/* =========================================
   P2 data
========================================= */
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

/* =========================================
   Ghost pozicije
========================================= */
type GhostSpec = { x: number; y: number; scale: number; rot: number; color: string; z: number; w: number };
const BG_SPECS_DESKTOP_BASE: GhostSpec[] = [
  { x: -520, y: -220, scale: 0.80, rot: -6, color: "#22d3ee", z: 1, w: 300 },
  { x:  560, y: -210, scale: 0.86, rot:  6, color: "#a78bfa", z: 1, w: 320 },
  { x: -600, y:  160, scale: 0.78, rot: -8, color: "#34d399", z: 1, w: 280 },
  { x:  620, y:  180, scale: 0.84, rot:  8, color: "#f59e0b", z: 1, w: 300 },
  { x: -360, y:  360, scale: 0.72, rot: -4, color: "#60a5fa", z: 1, w: 260 },
  { x:  360, y:  380, scale: 0.76, rot:  4, color: "#10b981", z: 1, w: 260 },
  { x: -140, y: -360, scale: 0.74, rot: -3, color: "#f472b6", z: 1, w: 260 },
  { x:  140, y: -370, scale: 0.74, rot:  3, color: "#f43f5e", z: 1, w: 260 },
];
const BG_SPECS_MOBILE_BASE: GhostSpec[] = [
  { x: 0,   y: -320, scale: 0.78, rot: 0, color: "#22d3ee", z: 1, w: 280 },
  { x: 0,   y:  300, scale: 0.76, rot: 0, color: "#a78bfa", z: 1, w: 260 },
  { x: -160,y: -80,  scale: 0.72, rot: -2,color: "#34d399", z: 1, w: 240 },
  { x:  160,y:  80,  scale: 0.72, rot:  2,color: "#f59e0b", z: 1, w: 240 },
];

/* =========================================
   P3 config
========================================= */
const BASE_PRICE = 299;
const OPTION_INCREMENTS = [60, 45, 35];
const SLIDER_RATES = [220, 160];

type BackdropStyle = "brand" | "indigo" | "blue";

/* =========================================
   Component
========================================= */
export default function MainPhase2({
  headline = t("Create your tiers on your price page"),
  labelWords = [
  t("Demo preview — not actual tiers"),
  t("You’ll create your own tiers"),
],
  holdDesktop = 0.20,
  holdMobile = 0.12,
  segP2VhDesktop = 300,
  segP2VhMobile = 280,
  segP3VhDesktop = 260,   // ⬅️ blago skraćeno
  segP3VhMobile = 240,    // ⬅️ blago skraćeno
  p3Speed = DEFAULT_P3_SPEED,
  p3BackdropStyle = "indigo",
  p3BackdropOpacity = 0.22,
  devControls = false,
}: {
  headline?: string;
  labelWords?: string[];
  holdDesktop?: number;
  holdMobile?: number;
  segP2VhDesktop?: number;
  segP2VhMobile?: number;
  segP3VhDesktop?: number;
  segP3VhMobile?: number;
  p3Speed?: number;
  p3BackdropStyle?: BackdropStyle;
  p3BackdropOpacity?: number;
  devControls?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Layer refs
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const p2LayerRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const p3LayerRef = useRef<HTMLDivElement>(null);
  const p3BackdropRef = useRef<HTMLDivElement>(null);

  // Mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const on = () => setIsMobile(window.innerWidth < 640);
    on();
    window.addEventListener("resize", on, { passive: true });
    return () => window.removeEventListener("resize", on);
  }, []);

  const SEG_P2 = isMobile ? segP2VhMobile : segP2VhDesktop;
  const SEG_P3_BASE = isMobile ? segP3VhMobile : segP3VhDesktop;
  const SEG_P3 = Math.max(160, Math.round(SEG_P3_BASE * clamp(p3Speed, 0.3, 2)));
  const TRACK_TOTAL_VH = SEG_P2 + SEG_P3;

  /* ---------- P2 refs ---------- */
  const titleRef = useRef<HTMLHeadingElement>(null);
  const wordRefs = useMemo(() => labelWords.map(() => createRef<HTMLSpanElement>()), [labelWords]);
  const cardRefs = useRef<Record<TierId, HTMLDivElement | null>>({
    basic: null, standard: null, business: null, premium: null, signature: null,
  });
  const zIndexMap: Record<TierId, number> = {
    basic: 10, standard: 20, premium: 30, signature: 40, business: 50,
  };

  // Pozicije kartica
  const targets = useMemo(() => {
    if (!isMobile) {
      return {
        basic:     { x: -360, y: -160, scale: 0.94, rot: -2 },
        standard:  { x:  360, y: -160, scale: 0.94, rot:  2 },
        business:  { x:    0, y:    0,  scale: 1.06, rot:  0 },
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
      basic:  { x: 0, y: -700, rot: 0 },
      standard:{ x: 0, y: -700, rot: 0 },
      business:{ x: 0, y: -700, rot: 0 },
      premium: { x: 0, y:  700, rot: 0 },
      signature:{x: 0, y:  700, rot: 0 },
    } as const;
  }, [isMobile]);

  // BG specs u state-u (za dev slidere)
  const BG_BASE = isMobile ? BG_SPECS_MOBILE_BASE : BG_SPECS_DESKTOP_BASE;
  const [bgAdj, setBgAdj] = useState(() =>
    BG_BASE.map(s => ({ x: s.x, y: s.y, scale: s.scale, rot: s.rot, w: s.w }))
  );
  const bgRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Label top i backdrop opacity
  const [labelTopVh, setLabelTopVh] = useState(LABEL_TOP_VH_DEFAULT);
  const [bgOpacity, setBgOpacity] = useState(clamp(p3BackdropOpacity, 0, 1));
  const [showDev, setShowDev] = useState(devControls);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "d") setShowDev(s => !s); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Timing
  const INTRO_HOLD = isMobile ? holdMobile : holdDesktop;
  const HEAD_INIT         = isMobile ? 1.02 : 1.08;
  const SCALE_END         = isMobile ? 0.28 : 0.24;
  const HEAD_SHRINK_START = 0.18;
  const HEAD_SHRINK_END   = isMobile ? 0.80 : 0.84;

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

  const LAST_CARD_ARRIVE =
    Math.max(
      CARD_S.basic + CARD_D.basic,
      CARD_S.standard + CARD_D.standard,
      CARD_S.business + CARD_D.business,
      CARD_S.premium + CARD_D.premium,
      CARD_S.signature + CARD_D.signature,
    );
  const SYNC_START = Math.min(0.99, LAST_CARD_ARRIVE + SYNC_GAP);
  const P3_START_IN_P2 = clamp(SYNC_START + P3_DELAY, 0, 0.995);

  /* ---------- P3 refs/data ---------- */
  const options = useMemo(() => [t("Option 1"), t("Option 2"), t("Option 3")], []);
  const sliders = useMemo(
    () => [
      { label: t("Usage level"), baseFill: 0.62 },
      { label: t("Automation depth"), baseFill: 0.48 },
    ],
    []
  );

  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const leftRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const optionCheckRefs = useRef<Array<SVGPathElement | null>>([]);
  const sliderRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sliderFillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sliderKnobRefs = useRef<Array<HTMLDivElement | null>>([]);

  // 🔧 dve odvojene cene (levo i desno) – ranije je bila jedna ref pa je “gutala” drugu
  const priceLeftRef = useRef<HTMLSpanElement | null>(null);
  const priceRightRef = useRef<HTMLSpanElement | null>(null);
  const priceState = useRef({ display: BASE_PRICE });

  const p3TitleRef = useRef<HTMLHeadingElement | null>(null);
  const p3NoticeRef = useRef<HTMLParagraphElement | null>(null);

  /* ---------- RAF ---------- */
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const bgLayer = bgLayerRef.current;
    const p2Layer = p2LayerRef.current;
    const labelLayer = labelLayerRef.current;
    const p3Layer = p3LayerRef.current;
    const p3Backdrop = p3BackdropRef.current;
    if (!section || !stage || !p2Layer || !labelLayer || !p3Layer) return;

    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const kx = Math.max(1, vw / 1280);
    const ky = Math.max(1, vh / 800);

    const STARTS = Object.fromEntries(
      Object.entries(starts).map(([k, v]) => [
        k,
        { x: v.x * (isMobile ? 1 : kx), y: v.y * (isMobile ? 1 : ky), rot: v.rot },
      ])
    ) as Record<TierId, { x: number; y: number; rot: number }>;

    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const frame = () => {
      raf = 0;

      const rect = section.getBoundingClientRect();
      const vhNow = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vhNow);
      const rawAll = clamp((vhNow - rect.top) / travel, 0, 1);

      // P2 progres
      const segA = SEG_P2 / TRACK_TOTAL_VH;
      const p2Raw = clamp(rawAll / Math.max(0.0001, segA), 0, 1);

      // P3 progres
      const p3StartAll = segA * P3_START_IN_P2;
      const p3Raw = clamp((rawAll - p3StartAll) / Math.max(0.0001, 1 - p3StartAll), 0, 1);

      /* ===== P2 ===== */
      if (p2Raw < INTRO_HOLD) {
        // reseti i početna stanja
        (PKGS as Pkg[]).forEach((pkg) => {
          const el = cardRefs.current[pkg.id]; if (!el) return;
          const off = STARTS[pkg.id];
          el.style.transform = `translate3d(${off.x}px,${off.y}px,0) rotate(${off.rot}deg) scale(0.84)`;
          el.style.opacity = "0";
        });
        p2Layer.style.transform = `translate3d(0,0,0)`;

        if (BG_ENABLED && bgLayer) {
          bgRefs.current.forEach((node) => { if (node) node.style.opacity = "0"; });
        }
        if (p3Backdrop) {
          p3Backdrop.style.opacity = "0";
          p3Backdrop.style.transform = `translate3d(0, 40vh, 0)`;
        }
        if (p3TitleRef.current) {
          p3TitleRef.current.style.opacity = "0";
          p3TitleRef.current.style.transform = `translate3d(0, ${TITLE_Y_IN_VH}vh, 0)`;
        }
        if (p3NoticeRef.current) {
          p3NoticeRef.current.style.opacity = "0";
          p3NoticeRef.current.style.transform = `translate3d(0, ${TITLE_Y_IN_VH}vh, 0)`;
        }

        // cena – inicijalno držimo BASE_PRICE na oba mesta
        const baseTxt = `€${Math.round(priceState.current.display)}`;
        if (priceLeftRef.current)  priceLeftRef.current.textContent = baseTxt;
        if (priceRightRef.current) priceRightRef.current.textContent = baseTxt;
      } else {
        // P2 0..1
        const p = clamp((p2Raw - INTRO_HOLD) / (1 - INTRO_HOLD), 0, 1);

        // Headline shrink
        if (titleRef.current) {
          let headScale = HEAD_INIT;
          if (p >= HEAD_SHRINK_START) {
            const s = clamp((p - HEAD_SHRINK_START) / (HEAD_SHRINK_END - HEAD_SHRINK_START), 0, 1);
            headScale = lerp(HEAD_INIT, SCALE_END, easeInOut(s));
          }
          titleRef.current.style.transform = `translateZ(0) scale(${headScale})`;
          titleRef.current.style.opacity = "1";
        }

        // LABEL IN
        const LABEL_IN_START = Math.max(0.06, CARD_S.business + CARD_D.business - 0.10);
        const LABEL_IN_END = LABEL_IN_START + 0.14;
        if (labelLayer) {
          const tIn = easeInOut(clamp((p - LABEL_IN_START) / (LABEL_IN_END - LABEL_IN_START), 0, 1));
          const y = lerp(-6, 0, tIn);
          labelLayer.style.opacity = String(tIn);
          labelLayer.style.transform = `translate3d(-50%, ${y}vh, 0)`;
        }

        // BG tiers
        if (BG_ENABLED && bgLayer) {
          const inT  = easeInOut(clamp((p - BG_FADE_IN_START) / BG_FADE_IN_DUR, 0, 1));
          const outS = Math.max(0, SYNC_START - BG_FADE_OUT_PAD);
          const outT = clamp((p - outS) / Math.max(0.0001, (SYNC_START - outS)), 0, 1);
          const op = inT * (1 - outT);

          bgAdj.forEach((spec, i) => {
            const node = bgRefs.current[i]; if (!node) return;
            const j = i + 1;
            const fx = Math.sin(p * Math.PI * (0.6 + j * 0.07)) * 14;
            const fy = Math.cos(p * Math.PI * (0.4 + j * 0.05)) * 8;
            node.style.opacity = String(op);
            node.style.transform = `translate3d(${spec.x + fx}px, ${spec.y + fy}px, 0) rotate(${spec.rot}deg) scale(${spec.scale})`;
            (node.firstElementChild as HTMLElement)?.style.setProperty("width", `${Math.min(spec.w, 340)}px`);
          });
        }

        // Kartice
        (PKGS as Pkg[]).forEach((pkg) => {
          const el = cardRefs.current[pkg.id]; if (!el) return;

          const s = (CARD_S as any)[pkg.id] as number;
          const d = (CARD_D as any)[pkg.id] as number;
          const local = clamp((p - s) / d, 0, 1);
          const tt = easeInOut(local);

          const off = STARTS[pkg.id];
          const to = targets[pkg.id];

          const baseX = lerp(off.x, to.x, tt);
          const baseY = lerp(off.y, to.y, tt);
          const baseRot = lerp(off.rot, to.rot, tt);
          const baseSc = lerp(0.84, to.scale, tt);

          const op = local > 0.02 ? 1 : local / 0.02;

          el.style.transform = `translate3d(${baseX}px,${baseY}px,0) rotate(${baseRot}deg) scale(${baseSc})`;
          el.style.opacity = String(op);
        });

        // P3 Title + napomena
        if (p3TitleRef.current) {
          const tTitle = easeInOut(
            clamp((p - (LAST_CARD_ARRIVE + TITLE_AFTER_LAST_CARD)) / Math.max(0.0001, TITLE_IN_DUR), 0, 1)
          );
          const ty = lerp(TITLE_Y_IN_VH, 0, tTitle);
          p3TitleRef.current.style.opacity = String(tTitle);
          p3TitleRef.current.style.transform = `translate3d(0, ${ty}vh, 0)`;
        }
        if (p3NoticeRef.current) {
          const tTitle2 = easeInOut(
            clamp((p - (LAST_CARD_ARRIVE + TITLE_AFTER_LAST_CARD)) / Math.max(0.0001, TITLE_IN_DUR), 0, 1)
          );
          const ty2 = lerp(TITLE_Y_IN_VH, 0, tTitle2);
          p3NoticeRef.current.style.opacity = String(tTitle2);
          p3NoticeRef.current.style.transform = `translate3d(0, ${ty2}vh, 0)`;
        }

        // SYNC lift
        const sfT = clamp((p - SYNC_START) / Math.max(0.0001, 1 - SYNC_START), 0, 1);
        if (sfT > 0) {
          const liftVhRaw = sfT * SQUEEZE_MAX_VH;
          const liftVh = Math.min(liftVhRaw, OFF_VH);
          p2Layer.style.transform = `translate3d(0, ${-liftVh}vh, 0)`;

          const endAt = Math.max(0.0001, OFF_VH / SQUEEZE_MAX_VH);
          const k = clamp(sfT / endAt, 0, 1);
          const converge = easeInOut(k);

          (PKGS as Pkg[]).forEach((pkg) => {
            const el = cardRefs.current[pkg.id]; if (!el) return;
            const to = targets[pkg.id];

            const x = lerp(to.x, 0, converge);
            const y = lerp(to.y, 0, converge);
            const rot = lerp(to.rot, 0, converge);
            const sc = to.scale;

            if (liftVhRaw >= OFF_VH - 0.0001) {
              el.style.transform = `translate3d(0px,0px,0) rotate(0deg) scale(0)`;
              el.style.opacity = "0";
            } else {
              el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${sc})`;
              el.style.opacity = "1";
            }
          });

          // label lift
          if (labelLayer) {
            const ll = clamp((p - (SYNC_START + LABEL_LIFT_DELAY)) / Math.max(0.0001, 1 - (SYNC_START + LABEL_LIFT_DELAY)), 0, 1);
            const llFast = Math.min(1, ll / 0.22);
            const ly = -llFast * LABEL_LIFT_VH;
            labelLayer.style.transform = `translate3d(-50%, ${ly}vh, 0)`;
            const lop = 1 - clamp(ll / 0.28, 0, 1);
            labelLayer.style.opacity = String(lop);
          }
        }
      }

      /* ===== P3 ===== */
      if (p3Backdrop) {
        const t = easeInOut(clamp((p3Raw - BACKDROP_IN_START) / Math.max(0.0001, BACKDROP_IN_DUR), 0, 1));
        p3Backdrop.style.opacity = String(t * bgOpacity);
        const y = lerp(40, 0, t);
        p3Backdrop.style.transform = `translate3d(0, ${y}vh, 0)`;
      }

      // Panely fade-in
      if (leftPanelRef.current) {
        const t = easeInOut(clamp((p3Raw - 0.00) / 0.22, 0, 1));
        const y = lerp(36, 0, t);
        leftPanelRef.current.style.transform = `translate3d(0, ${y}vh, 0)`;
        leftPanelRef.current.style.opacity = String(t);
      }
      if (rightPanelRef.current) {
        const t = easeInOut(clamp((p3Raw - 0.03) / 0.22, 0, 1));
        const y = lerp(36, 0, t);
        rightPanelRef.current.style.transform = `translate3d(0, ${y}vh, 0)`;
        rightPanelRef.current.style.opacity = String(t);
      }

      // ✅ LEVI panel – animacija SVAKOG reda (ranije je falila, zato je izgledalo “prazno”)
      leftRowRefs.current.forEach((row, i) => {
        if (!row) return;
        const base = 0.12 + i * 0.05; // blagi kaskadni ulaz
        const t = easeInOut(clamp((p3Raw - base) / 0.16, 0, 1));
        const y = lerp(28, 0, t);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity = String(t);
      });

      // OPTIONS (desni panel)
      const checkProgress: number[] = [];
      options.forEach((_, i) => {
        const row = optionRefs.current[i]; if (!row) return;
        const base = 0.24 + i * 0.05;
        const t = easeInOut(clamp((p3Raw - base) / 0.16, 0, 1));
        const y = lerp(28, 0, t);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity = String(t);

        const checkStart = base + 0.16 + 0.05;
        const cLocal = clamp((p3Raw - checkStart) / 0.20, 0, 1);
        checkProgress[i] = cLocal;

        const path = optionCheckRefs.current[i];
        if (path) {
          const totalLen = 26;
          path.style.strokeDasharray = `${totalLen}`;
          path.style.strokeDashoffset = `${(1 - cLocal) * totalLen}`;
        }
      });

      // SLIDERS (desni panel)
      const sliderLocals: number[] = [];
      sliders.forEach((s, i) => {
        const row = sliderRowRefs.current[i]; if (!row) return;

        const base = 0.24 + options.length * 0.05 + 0.07 + i * 0.055;
        const t = easeInOut(clamp((p3Raw - base) / 0.16, 0, 1));
        const y = lerp(28, 0, t);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity = String(t);

        const sLocal = clamp((p3Raw - (base + 0.16)) / 0.26, 0, 1);
        sliderLocals[i] = sLocal;

        const fill = s.baseFill * sLocal;
        const pct = (fill * 100).toFixed(1);
        const bar = sliderFillRefs.current[i];
        const knob = sliderKnobRefs.current[i];
        if (bar) bar.style.width = `${pct}%`;
        if (knob) knob.style.left = `${pct}%`;
      });

      // CENA – računaj i ažuriraj oba mesta
      let target = BASE_PRICE;
      checkProgress.forEach((p, i) => (target += p * (OPTION_INCREMENTS[i] || 0)));
      sliderLocals.forEach((s, i) => (target += s * (SLIDER_RATES[i] || 0)));
      const cur = priceState.current.display;
      const next = (p3Raw > 0.98) ? target : lerp(cur, target, 0.20);
      priceState.current.display = next;

      const txt = `€${Math.round(next)}`;
      if (priceLeftRef.current)  priceLeftRef.current.textContent = txt;
      if (priceRightRef.current) priceRightRef.current.textContent = txt;
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
    isMobile,
    starts,
    targets,
    holdMobile, holdDesktop,
    // headline knobs
    // (ostalo izračunavamo iz konstanti)
    BG_ENABLED, bgAdj, bgOpacity,
    options, sliders,
    SEG_P2, SEG_P3, TRACK_TOTAL_VH,
  ]);

  const backdropCSS =
    p3BackdropStyle === "brand"
      ? "linear-gradient(180deg, rgba(99,102,241,1), rgba(56,189,248,1), rgba(20,184,166,1))"
      : p3BackdropStyle === "blue"
        ? "linear-gradient(180deg, rgba(37,99,235,1), rgba(59,130,246,1))"
        : "linear-gradient(180deg, rgba(79,70,229,1), rgba(56,189,248,1))";

  /* ---------- render ---------- */
  // >>> Na mobilnom prikazuj samo FEATURED tier (Business)
  const VISIBLE_PKGS = isMobile ? PKGS.filter(p => p.id === "business") : PKGS;

  return (
    <section
      ref={sectionRef}
      aria-label={t("Unified P2+P3 sticky track")}
      className="relative"
      style={{
        height: `${TRACK_TOTAL_VH}vh`,
        background: "var(--bg, #0b0b0c)",
        color: "var(--ink, #f5f5f6)"
      }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden [contain:layout_style_paint]">
        {/* Sticky demo badge — visible while section is in view */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[95] select-none pointer-events-none">
          <span
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-[0_8px_24px_rgba(15,23,42,.08)]"
            style={{
              background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(6px)",
            }}
            aria-live="polite"
          >
            {t("Demo preview — you’ll create your own tiers")}
          </span>
        </div>
        {/* ===== BG LAYER ===== */}
        {BG_ENABLED && (
          <div ref={bgLayerRef} className="absolute inset-0 pointer-events-none">
            {(isMobile ? BG_SPECS_MOBILE_BASE : BG_SPECS_DESKTOP_BASE).map((base, i) => (
              <div
                key={i}
                ref={(el) => { bgRefs.current[i] = el; }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
                style={{ zIndex: base.z }}
              >
                <div style={{ width: Math.min(bgAdj[i]?.w ?? base.w, 340) }}>
                  <GhostCard color={base.color} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== P2 LAYER ===== */}
        <div ref={p2LayerRef} className="absolute inset-0 will-change-transform">
          {/* Headline */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none px-3 sm:px-0">
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

          {/* Cards */}
          <div className="absolute inset-0">
            {VISIBLE_PKGS.map((pkg) => (
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

        {/* ===== LABEL LAYER (napomena umesto “Customize…”) ===== */}
        <div
          ref={labelLayerRef}
          className="absolute left-1/2 pointer-events-none z-[80]"
          style={{
            top: `${labelTopVh}vh`,
            transform: "translate3d(-50%, -6vh, 0)",
            opacity: 0,
          }}
        >
          <div className="inline-flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2 font-semibold">
            {labelWords.map((w, i) => (
              <span
                key={i}
                ref={wordRefs[i]}
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "var(--brand-gradient)",
                  fontSize: "clamp(20px, 3.8vw, 34px)",
                  lineHeight: 1.1,
                  display: "inline-block",
                  willChange: "transform, opacity",
                  filter: "drop-shadow(0 1px 10px rgba(59,130,246,.10))",
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* ===== P3 BACKDROP ===== */}
        <div
          ref={p3BackdropRef}
          className="absolute inset-x-0 bottom-0 h-[130vh] will-change-transform"
          style={{
            backgroundImage: backdropCSS,
            opacity: 0,
            transform: "translate3d(0,40vh,0)",
            filter: "saturate(1.05)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[4px]" style={{ background: "var(--brand-gradient)" }} />
        </div>

        {/* ===== P3 LAYER ===== */}
        <div ref={p3LayerRef} className="absolute inset-0">
          <div className="absolute inset-0 grid place-items-center">
            <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 pt-[34vh] sm:pt-[30vh]">
              {/* Napomena + Title */}
              <div className="mb-6 sm:mb-8 text-center relative z-50 pointer-events-none">
                <p
                  ref={p3NoticeRef}
                  className="mb-2 sm:mb-3 text-center font-semibold select-none text-transparent bg-clip-text
                             text-[clamp(18px,3.8vw,28px)] leading-tight"
                  style={{ backgroundImage: "var(--brand-gradient)", opacity: 0, transform: `translate3d(0, ${TITLE_Y_IN_VH}vh, 0)` }}
                >
                  {t("This is an example preview. It does not reflect your real tiers.")}
                </p>
                <h3
                  ref={p3TitleRef}
                  className="tl-hero-copy text-[clamp(26px,4.8vw,56px)] font-semibold leading-tight text-neutral-900 dark:text-white"
                  aria-label={t("Or make a Tierless price page")}
                  style={{ opacity: 0, transform: `translate3d(0, ${TITLE_Y_IN_VH}vh, 0)` }}
                >
                  {t("Or make a")}{" "}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--brand-gradient)" }}>
                    {t("Tierless")}
                  </span>{" "}
                  {t("price page")}
                </h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                {/* LEFT panel – SAKRIVEN na mobilnom */}
                <div
                  ref={leftPanelRef}
                  className="opacity-0 will-change-transform hidden sm:block"
                  style={{ transform: "translate3d(0, 36vh, 0)" }}
                >
                  <div className="rounded-3xl border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,.06)]">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-lg font-semibold text-neutral-900">{t("What this includes")}</h4>
                      <span
                        className="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-semibold"
                        style={{
                          background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                          border: "1px solid transparent",
                          color: "#111827",
                        }}
                      >
                        {t("Estimated total")}: <span ref={priceLeftRef}>€{BASE_PRICE}</span>
                      </span>
                    </div>

                    <div className="mt-4 divide-y" style={{ borderColor: "rgba(229,231,235,.8)" }}>
                      {[t("Unlimited items"), t("Advanced formulas"), t("Analytics & events"), t("Email support"), t("Custom domain ready"), t("Team access"), t("Export to CSV")].map((content, i) => (
                        <div
                          key={i}
                          ref={(el) => { leftRowRefs.current[i] = el; }}
                          className="flex items-center gap-3 py-3 opacity-0 will-change-transform"
                          style={{ transform: "translate3d(0, 28vh, 0)" }}
                        >
                          <span className="inline-block h-2 w-2 rounded-full translate-y-[2px]" style={{ background: "var(--brand-gradient)" }} />
                          <span className="text-sm text-neutral-800">{content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT panel – NA MOBILNOM jedini panel */}
                <div
                  ref={rightPanelRef}
                  className="opacity-0 will-change-transform w-full max-w-[520px] mx-auto"
                  style={{ transform: "translate3d(0, 36vh, 0)" }}
                >
                  <div className="rounded-3xl border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,.06)]">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-lg font-semibold text-neutral-900">{t("Options")}</h4>

                    </div>

                    {/* OPTIONS */}
                    <div className="mt-4 space-y-3">
                      {["Option 1", "Option 2", "Option 3"].map((label, i) => (
                        <div
                          key={i}
                          ref={(el) => { optionRefs.current[i] = el; }}
                          className="flex items-center justify-between rounded-xl border px-3 py-2 opacity-0 will-change-transform"
                          style={{ borderColor: "rgba(229,231,235,.8)", transform: "translate3d(0, 28vh, 0)" }}
                        >
                          <span className="text-sm text-neutral-800">{t(label)}</span>
                          <span className="inline-flex items-center justify-center rounded-md" style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,.2)", background: "linear-gradient(#fff,#fff)" }}>
                            <CheckSVG refCb={(el) => { optionCheckRefs.current[i] = el; }} />
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* SLIDERS */}
                    <div className="mt-6 space-y-5">
                      {sliders.map((s, i) => (
                        <div
                          key={i}
                          ref={(el) => { sliderRowRefs.current[i] = el; }}
                          className="opacity-0 will-change-transform"
                          style={{ transform: "translate3d(0, 28vh, 0)" }}
                        >
                          <label className="text-sm text-neutral-700">{s.label}</label>
                          <div className="mt-2 h-3 rounded-full bg-neutral-200 relative overflow-visible">
                            <div
                              ref={(el) => { sliderFillRefs.current[i] = el; }}
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ width: "0%", background: "var(--brand-gradient)", transition: "width .08s linear" }}
                            />
                            <div
                              ref={(el) => { sliderKnobRefs.current[i] = el; }}
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                              style={{ left: "0%", width: 18, height: 18, borderRadius: 999, boxShadow: "0 2px 8px rgba(0,0,0,.18)", background: "#fff", border: "1px solid rgba(0,0,0,.18)" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* /RIGHT */}
              </div>
            </div>
          </div>
        </div>
        {/* /P3 */}
      </div>

      {/* ===== DEV CONTROLS ===== */}
      {showDev && (
        <DevPanel
          labelTopVh={labelTopVh}
          setLabelTopVh={setLabelTopVh}
          bgOpacity={bgOpacity}
          setBgOpacity={(v) => setBgOpacity(clamp(v, 0, 1))}
          specs={bgAdj}
          setSpecs={setBgAdj}
        />
      )}
    </section>
  );
}

/* =========================================
   SVG check util
========================================= */
function CheckSVG({ refCb }: { refCb: (el: SVGPathElement | null) => void }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <defs>
        <linearGradient id="gb" x1="0" y1="0" x2="20" y2="20">
          <stop offset="0%" stopColor="#4F46E5" />
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

/* =========================================
   Ghost Card
========================================= */
function GhostCard({ color }: { color: string }) {
  return (
    <div className="rounded-3xl border bg-white/90 backdrop-blur-[1px] shadow-[0_10px_40px_rgba(0,0,0,.08)]">
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded-md" style={{ backgroundColor: color, opacity: 0.85 }} />
          <div className="h-3 w-12 rounded-md" style={{ backgroundColor: color, opacity: 0.35 }} />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-40 rounded" style={{ backgroundColor: color, opacity: 0.18 }} />
          <div className="h-2 w-36 rounded" style={{ backgroundColor: color, opacity: 0.14 }} />
          <div className="h-2 w-28 rounded" style={{ backgroundColor: color, opacity: 0.10 }} />
        </div>
      </div>
    </div>
  );
}

/* =========================================
   Card
========================================= */
type CardProps = { tier: Pkg; featured: boolean; color?: string };

function Card({ tier, featured, color }: CardProps) {
  if (featured) {
    const included = [t("Addon 1"), t("Addon 2"), t("Addon 3")];
    return (
      <div className="rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500 via-sky-400 to-teal-400 shadow-[0_8px_40px_rgba(0,0,0,.12)]">
        <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white">
          <div className="p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold !text-neutral-900">{t(tier.name)}</h3>
              <span className="text-lg font-semibold !text-neutral-900">{tier.price}</span>
            </div>

            <ul className="mt-4 space-y-2 text-sm !text-neutral-700">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full translate-y-[1px]"
                        style={{ background: "linear-gradient(90deg, #6366f1, #38bdf8, #14b8a6)" }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {included.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                    border: "1px solid transparent",
                    color: "#0f172a",
                  }}
                >
                  {label}
                  <span
                    className="rounded-xl px-2 py-[2px] text-[11px] font-semibold"
                    style={{
                      background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                      border: "1px solid transparent",
                    }}
                  >
                    {t("Included")}
                  </span>
                </span>
              ))}
            </div>

            <button
              disabled
              aria-disabled="true"
              className={[
                "mt-5 w-full rounded-xl py-2.5 text-sm font-medium transition",
                "border border-neutral-200 text-neutral-900 hover:shadow hover:-translate-y-[1px]",
                "hover:border-transparent",
                "hover:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,_#6366f1,_#38bdf8,_#14b8a6)_border-box]",
              ].join(" ")}
              aria-label={t("Demo preview — you’ll create your own tiers")}
            >
              {t("Demo preview — you’ll create your own tiers")}
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
          <h3 className="text-lg font-semibold !text-neutral-900">{t(tier.name)}</h3>
          <span className="text-lg font-semibold !text-neutral-900">{t(tier.price)}</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm !text-neutral-700">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full translate-y-[1px]"
                    style={{ backgroundColor: color || "#737373" }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <button
          disabled
          aria-disabled="true"
          className={[
            "mt-5 w-full rounded-xl py-2.5 text-sm font-medium transition",
            "border border-neutral-200 !text-neutral-900 hover:shadow hover:-translate-y-[1px]",
            "hover:outline hover:outline-2 hover:outline-offset-2",
            "hover:[outline-color:var(--tier)] hover:[border-color:var(--tier)]",
          ].join(" ")}
          aria-label={t("Demo preview — you’ll create your own tiers")}
        >
          {t("Demo preview — you’ll create your own tiers")}
        </button>
      </div>
    </div>
  );
}

/* =========================================
   Dev panel
========================================= */
function DevPanel({
  labelTopVh, setLabelTopVh,
  bgOpacity, setBgOpacity,
  specs, setSpecs,
}: {
  labelTopVh: number;
  setLabelTopVh: (v: number) => void;
  bgOpacity: number;
  setBgOpacity: (v: number) => void;
  specs: Array<{ x: number; y: number; scale: number; rot: number; w: number }>;
  setSpecs: (fn: (prev: Array<{ x: number; y: number; scale: number; rot: number; w: number }>) => any) => void;
}) {
  return (
    <div
      className="fixed right-3 bottom-3 z-[99999] max-h-[90vh] w-[340px] overflow-y-auto overscroll-contain rounded-2xl border bg-white/90 backdrop-blur p-3 shadow-lg"
      data-lenis-prevent
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="text-xs font-semibold text-neutral-700 mb-2">Dev controls (D za toggle)</div>

      <div className="mb-3">
        <label className="text-xs text-neutral-600">Label top (vh): {labelTopVh}</label>
        <input type="range" min={8} max={30} step={1} value={labelTopVh}
          onChange={(e) => setLabelTopVh(parseInt(e.target.value))} className="w-full" />
      </div>

      <div className="mb-3">
        <label className="text-xs text-neutral-600">P3 backdrop opacity: {bgOpacity.toFixed(2)}</label>
        <input type="range" min={0} max={1} step={0.01} value={bgOpacity}
          onChange={(e) => setBgOpacity(parseFloat(e.target.value))} className="w-full" />
      </div>

      {specs.map((s, i) => (
        <div key={i} className="mb-3 rounded-lg border p-2">
          <div className="text-xs font-semibold mb-2">Ghost #{i + 1}</div>
          <label className="text-[11px] text-neutral-600">x: {s.x}</label>
          <input type="range" min={-800} max={800} step={2} value={s.x}
            onChange={(e) => setSpecs(prev => prev.map((p, idx) => idx === i ? { ...p, x: parseInt(e.target.value) } : p))} className="w-full" />
          <label className="text-[11px] text-neutral-600">y: {s.y}</label>
          <input type="range" min={-700} max={700} step={2} value={s.y}
            onChange={(e) => setSpecs(prev => prev.map((p, idx) => idx === i ? { ...p, y: parseInt(e.target.value) } : p))} className="w-full" />
          <label className="text-[11px] text-neutral-600">scale: {s.scale.toFixed(2)}</label>
          <input type="range" min={0.50} max={1.10} step={0.01} value={s.scale}
            onChange={(e) => setSpecs(prev => prev.map((p, idx) => idx === i ? { ...p, scale: parseFloat(e.target.value) } : p))} className="w-full" />
          <label className="text-[11px] text-neutral-600">rot: {s.rot}°</label>
          <input type="range" min={-15} max={15} step={1} value={s.rot}
            onChange={(e) => setSpecs(prev => prev.map((p, idx) => idx === i ? { ...p, rot: parseInt(e.target.value) } : p))} className="w-full" />
          <label className="text-[11px] text-neutral-600">width: {s.w}px</label>
          <input type="range" min={220} max={360} step={2} value={s.w}
            onChange={(e) => setSpecs(prev => prev.map((p, idx) => idx === i ? { ...p, w: parseInt(e.target.value) } : p))} className="w-full" />
        </div>
      ))}
    </div>
  );
}