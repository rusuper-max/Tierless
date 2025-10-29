// src/components/marketing/ScenePhase3Assemble.tsx
"use client";

import { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { t } from "@/i18n/t";

/**
 * Phase 3 — v3.9.1
 * - Blank start (gate + visibility hidden), offscreen enter.
 * - Headline gore, slovo-po-slovo, JEDAN brand gradijent preko cele fraze.
 * - Desno: 3 opcije + 2 slidera (enter → posle toga auto-check i slider run).
 * - Levo: cena raste tek od početka interakcija.
 * - Exit nagore preko zajedničkog flight wrappera.
 * - NOVO: gateOffsetVh (po difoltu 12) — koliki “prazan hod” pre nego što scena krene.
 */

type LetterPlan = { idx: number; ch: string; sX: number; sY: number; base: number; dur: number };
type RowPlan   = { idx: number; base: number; dur: number };

const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);
const lerp  = (a: number, b: number, p: number) => a + (b - a) * p;
const easeInOut = (x: number) =>
  (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// headline pozicija
const HEAD_TOP_VH    = 16;

// enter wrappera (sa strane)
const PANEL_L_BASE = 0.10, PANEL_L_DUR = 0.24;
const PANEL_R_BASE = 0.12, PANEL_R_DUR = 0.24;

// ulaz redova odozdo
const ROW_DUR = 0.20;

// settle pre interakcija
const SETTLE_HOLD = 0.06;

// interakcije
const CHECK_DRAW_DUR = 0.22;
const SLIDER_RUN_DUR = 0.30;

// minimalni progres pre exita
const MIN_SLIDER_LOCAL     = 0.35;
const MIN_LAST_CHECK_LOCAL = 0.60;

// pricing simulacija
const BASE_PRICE = 299;
const OPTION_INCREMENTS = [60, 45, 35];
const SLIDER_RATES      = [220, 160];

export default function ScenePhase3Assemble({
  phraseFull = t("Or create your Tierless price page…"),
  gateOffsetVh = 12, // <<< raniji start u odnosu na prethodnih ~30
}: { phraseFull?: string; gateOffsetVh?: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef   = useRef<HTMLDivElement | null>(null);
  const flightRef  = useRef<HTMLDivElement | null>(null);

  /* FRAZA — jedinstveni gradijent */
  const chars = useMemo(() => phraseFull.split(""), [phraseFull]);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [totalW, setTotalW]   = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const offs = letterRefs.current.map((el) => (el ? el.offsetLeft : 0));
    const last = letterRefs.current[letterRefs.current.length - 1];
    const total = last ? last.offsetLeft + last.offsetWidth : 0;
    setOffsets(offs); setTotalW(total);
  }, [chars.length, mounted]);

  const letterPlan = useMemo<LetterPlan[]>(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth  : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const MAGX = vw * 0.68, MAGY = vh * 0.54;
    const BASE = 0.22, STEP = 0.012, DUR = 0.22;
    return chars.map((ch, i) => {
      const dir = i % 4;
      const jitter = ((i % 6) - 3) * 4;
      const p: LetterPlan = { idx: i, ch, sX: 0, sY: 0, base: BASE + i * STEP, dur: DUR };
      if      (dir === 0) { p.sX = -MAGX; p.sY =  jitter; }
      else if (dir === 1) { p.sX =  MAGX; p.sY = -jitter; }
      else if (dir === 2) { p.sX =  jitter; p.sY = -MAGY; }
      else                { p.sX = -jitter; p.sY =  MAGY; }
      return p;
    });
  }, [chars]);

  /* LEFT — lista + total */
  const leftRows = useMemo(() => [
    t("Unlimited items"),
    t("Advanced formulas"),
    t("Analytics & events"),
    t("Email support"),
    t("Custom domain ready"),
    t("Team access"),
    t("Export to CSV"),
  ], []);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const leftRowRefs  = useRef<Array<HTMLDivElement | null>>([]);
  const priceRef     = useRef<HTMLSpanElement | null>(null);
  const priceState   = useRef({ display: BASE_PRICE });
  const rowsPlanLeft: RowPlan[] = useMemo(
    () => leftRows.map((_, i) => ({ idx: i, base: PANEL_L_BASE + PANEL_L_DUR + 0.06 + i * 0.05, dur: ROW_DUR })),
    [leftRows]
  );

  /* RIGHT — options + sliders */
  const options = useMemo(() => [t("Option 1"), t("Option 2"), t("Option 3")], []);
  const sliders = useMemo(() => [
    { label: t("Usage level"),      baseFill: 0.62 },
    { label: t("Automation depth"), baseFill: 0.48 },
  ], []);
  const rightPanelRef   = useRef<HTMLDivElement | null>(null);
  const optionRefs      = useRef<Array<HTMLDivElement | null>>([]);
  const optionCheckRefs = useRef<Array<SVGPathElement | null>>([]);
  const sliderRowRefs   = useRef<Array<HTMLDivElement | null>>([]);
  const sliderFillRefs  = useRef<Array<HTMLDivElement | null>>([]);
  const sliderKnobRefs  = useRef<Array<HTMLDivElement | null>>([]);

  const rowsPlanRight: RowPlan[] = useMemo(() => {
    const arr: RowPlan[] = [];
    const startBase = PANEL_R_BASE + PANEL_R_DUR + 0.08;
    options.forEach((_, i) => arr.push({ idx: i, base: startBase + i * 0.055, dur: ROW_DUR }));
    const after = startBase + options.length * 0.055 + 0.08;
    sliders.forEach((_, i) => arr.push({ idx: options.length + i, base: after + i * 0.06, dur: ROW_DUR }));
    return arr;
  }, [options, sliders]);

  const checkStartTimes = useMemo(() => {
    return options.map((_, i) => {
      const enterEnd = rowsPlanRight[i].base + ROW_DUR;
      return enterEnd + SETTLE_HOLD + i * 0.02;
    });
  }, [rowsPlanRight, options.length]);

  const sliderStartTimes = useMemo(() => {
    return sliders.map((_, i) => {
      const idx = options.length + i;
      const enterEnd = rowsPlanRight[idx].base + ROW_DUR;
      return enterEnd + SETTLE_HOLD;
    });
  }, [rowsPlanRight, options.length, sliders.length]);

  const baseExitTiming = useMemo(() => {
    const lastCheckEnd  = checkStartTimes.length ? Math.max(...checkStartTimes.map(s => s + CHECK_DRAW_DUR)) : 0;
    const lastSliderEnd = sliderStartTimes.length ? Math.max(...sliderStartTimes.map(s => s + SLIDER_RUN_DUR)) : 0;
    const alsoPanels = Math.max(
      rowsPlanLeft.reduce((m, r) => Math.max(m, r.base + ROW_DUR), 0),
      rowsPlanRight.reduce((m, r) => Math.max(m, r.base + ROW_DUR), 0),
      letterPlan.reduce((m, l) => Math.max(m, l.base + l.dur), 0)
    );
    const contentReady = Math.max(lastCheckEnd, lastSliderEnd, alsoPanels);
    const HOLD = 0.06;
    const start = Math.min(contentReady + HOLD, 0.95);
    const end   = Math.min(start + 0.10, 0.995);
    return { start, end, dur: (end - start) };
  }, [checkStartTimes, sliderStartTimes, rowsPlanLeft, rowsPlanRight, letterPlan]);

  const exitStartRef = useRef<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage   = stageRef.current;
    const flight  = flightRef.current;
    if (!section || !stage || !flight) return;

    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const frame = () => {
      raf = 0;
      const rect  = section.getBoundingClientRect();
      const vhNow = window.innerHeight || 1;

      const gatePx = (gateOffsetVh / 100) * vhNow; // <<< prop umesto konstante
      const travel = Math.max(1, rect.height - vhNow);
      const raw0   = (vhNow - rect.top - gatePx) / travel;
      const raw    = clamp(raw0, 0, 1);
      stage.style.visibility = raw <= 0 ? "hidden" : "visible";

      // ENTER WRAPPERS
      if (leftPanelRef.current) {
        const t = easeInOut(clamp((raw - PANEL_L_BASE) / PANEL_L_DUR, 0, 1));
        const x = lerp(-140, 0, t), y = lerp(18, 0, t);
        leftPanelRef.current.style.transform = `translate3d(${x}vw, ${y}vh, 0)`;
        leftPanelRef.current.style.opacity   = String(t);
      }
      if (rightPanelRef.current) {
        const t = easeInOut(clamp((raw - PANEL_R_BASE) / PANEL_R_DUR, 0, 1));
        const x = lerp(140, 0, t), y = lerp(18, 0, t);
        rightPanelRef.current.style.transform = `translate3d(${x}vw, ${y}vh, 0)`;
        rightPanelRef.current.style.opacity   = String(t);
      }

      // LEVO — redovi odozdo
      rowsPlanLeft.forEach((rp) => {
        const el = leftRowRefs.current[rp.idx]; if (!el) return;
        const t = easeInOut(clamp((raw - rp.base) / rp.dur, 0, 1));
        const y = lerp(36, 0, t);
        el.style.transform = `translate3d(0, ${y}vh, 0)`;
        el.style.opacity   = String(t);
      });

      // DESNO — options enter → check
      const checkProgress: number[] = [];
      let lastCheckLocal = 0;
      options.forEach((_, i) => {
        const row = optionRefs.current[i]; if (!row) return;
        const rp = rowsPlanRight[i];

        const t = easeInOut(clamp((raw - rp.base) / ROW_DUR, 0, 1));
        const y = lerp(36, 0, t);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity   = String(t);

        const cStart = checkStartTimes[i];
        const cLocal = clamp((raw - cStart) / CHECK_DRAW_DUR, 0, 1);
        checkProgress[i] = cLocal;
        lastCheckLocal   = cLocal;

        const path = optionCheckRefs.current[i];
        if (path) {
          const totalLen = 26;
          path.style.strokeDasharray  = `${totalLen}`;
          path.style.strokeDashoffset = `${(1 - cLocal) * totalLen}`;
        }
        if (cLocal >= 0.98) row.setAttribute("data-checked", "true");
        else row.removeAttribute("data-checked");
      });

      // DESNO — sliders enter → run
      const sliderFills: number[] = [];
      const sliderLocals: number[] = [];
      sliders.forEach((s, i) => {
        const idx = options.length + i;
        const rp  = rowsPlanRight[idx];
        const row = sliderRowRefs.current[i]; if (!row) return;

        const t = easeInOut(clamp((raw - rp.base) / ROW_DUR, 0, 1));
        const y = lerp(36, 0, t);
        row.style.transform = `translate3d(0, ${y}vh, 0)`;
        row.style.opacity   = String(t);

        const sStart = sliderStartTimes[i];
        const sLocal = clamp((raw - sStart) / SLIDER_RUN_DUR, 0, 1);
        sliderLocals[i] = sLocal;

        const fill = s.baseFill * sLocal;
        sliderFills[i] = fill;

        const bar  = sliderFillRefs.current[i];
        const knob = sliderKnobRefs.current[i];
        const pct  = (fill * 100).toFixed(1);
        if (bar)  bar.style.width = `${pct}%`;
        if (knob) knob.style.left  = `${pct}%`;
      });

      // HEADLINE — slova
      letterPlan.forEach((lp) => {
        const el = letterRefs.current[lp.idx]; if (!el) return;
        const t = easeInOut(clamp((raw - lp.base) / lp.dur, 0, 1));
        const x = lerp(lp.sX, 0, t), y = lerp(lp.sY, 0, t);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.style.opacity   = String(t);
      });

      // CENA
      let target = BASE_PRICE;
      checkProgress.forEach((p, i) => { target += p * (OPTION_INCREMENTS[i] || 0); });
      sliderFills.forEach((f, i)   => { target += f * (SLIDER_RATES[i] || 0); });
      const cur  = priceState.current.display;
      const next = lerp(cur, target, 0.18);
      priceState.current.display = next;
      if (priceRef.current) priceRef.current.textContent = `€${Math.round(next)}`;

      /* EXIT ARMING (gate + fallback) */
      const slidersOk = sliderLocals.length ? Math.min(...sliderLocals) >= MIN_SLIDER_LOCAL : false;
      const checksOk  = lastCheckLocal >= MIN_LAST_CHECK_LOCAL;
      if (slidersOk && checksOk && exitStartRef.current === null) {
        exitStartRef.current = Math.max(raw, baseExitTiming.start);
      }
      if (exitStartRef.current === null && raw > 0.98) {
        exitStartRef.current = raw;
      }

      // EXIT na flight wrapperu
      let exitT = 0;
      if (exitStartRef.current !== null) {
        const effStart = exitStartRef.current;
        const effEnd   = Math.min(effStart + baseExitTiming.dur, 0.999);
        exitT = clamp((raw - effStart) / Math.max(0.0001, (effEnd - effStart)), 0, 1);
      }
      const exitY = -exitT * (vhNow * 1.15);
      flight.style.transform = `translate3d(0, ${exitY}px, 0)`;
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize",  schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize",  schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [
    gateOffsetVh,
    rowsPlanLeft, rowsPlanRight, letterPlan,
    options, sliders, checkStartTimes, sliderStartTimes, baseExitTiming
  ]);

  /* styles */
  const charStyle = (i: number): CSSProperties => ({
    display: "inline-block",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    fontSize: "clamp(34px, 8.2vw, 86px)",
    backgroundImage: "var(--brand-gradient)",
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

  const CheckSVG = ({ refCb }: { refCb: (el: SVGPathElement | null) => void }) => (
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

  return (
    <section
      ref={sectionRef}
      className="relative h-[480vh] sm:h-[440vh] bg-white"
      aria-label={t("Letters & panels assemble")}
    >
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden" style={{ visibility: "hidden" }}>
        {/* FLIGHT WRAPPER */}
        <div ref={flightRef} className="absolute inset-0 will-change-transform">
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
                {letterPlan.map((lp) => {
                  const ch = lp.ch === " " ? "\u00A0" : lp.ch;
                  return (
                    <span
                      key={lp.idx}
                      ref={(el) => { letterRefs.current[lp.idx] = el; }}
                      className="inline-block align-baseline"
                      style={charStyle(lp.idx)}
                    >
                      {ch}
                    </span>
                  );
                })}
              </h3>
            </div>
          </div>

          {/* PANELS */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 pt-[42vh] sm:pt-[40vh]">
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                {/* LEFT */}
                <div
                  ref={leftPanelRef}
                  className="opacity-0 will-change-transform"
                  style={{ transform: "translate3d(-140vw, 18vh, 0)" }}
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
                        {t("Estimated total")}: <span ref={priceRef}>€{BASE_PRICE}</span>
                      </span>
                    </div>

                    <div className="mt-4 divide-y" style={{ borderColor: "rgba(229,231,235,.8)" }}>
                      {leftRows.map((content, i) => (
                        <div
                          key={i}
                          ref={(el) => { leftRowRefs.current[i] = el; }}
                          className="flex items-center gap-3 py-3 opacity-0 will-change-transform"
                          style={{ transform: "translate3d(0, 36vh, 0)" }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full translate-y-[2px]"
                            style={{ background: "var(--brand-gradient)" }}
                          />
                          <span className="text-sm text-neutral-800">{content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div
                  ref={rightPanelRef}
                  className="opacity-0 will-change-transform"
                  style={{ transform: "translate3d(140vw, 18vh, 0)" }}
                >
                  <div className="rounded-3xl border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,.06)]">
                    <h4 className="text-lg font-semibold text-neutral-900">{t("Options")}</h4>

                    {/* OPTIONS */}
                    <div className="mt-4 space-y-3">
                      {options.map((label, i) => (
                        <div
                          key={i}
                          ref={(el) => { optionRefs.current[i] = el; }}
                          className="flex items-center justify-between rounded-xl border px-3 py-2 opacity-0 will-change-transform"
                          style={{ borderColor: "rgba(229,231,235,.8)", transform: "translate3d(0, 36vh, 0)" }}
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
                              <CheckSVG refCb={(el) => { optionCheckRefs.current[i] = el; }} />
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
                          ref={(el) => { sliderRowRefs.current[i] = el; }}
                          className="opacity-0 will-change-transform"
                          style={{ transform: "translate3d(0, 36vh, 0)" }}
                        >
                          <label className="text-sm text-neutral-700">{s.label}</label>
                          <div className="mt-2 h-3 rounded-full bg-neutral-200 relative overflow-visible">
                            {/* fill */}
                            <div
                              ref={(el) => { sliderFillRefs.current[i] = el; }}
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ width: "0%", background: "var(--brand-gradient)", transition: "width .08s linear" }}
                            />
                            {/* knob */}
                            <div
                              ref={(el) => { sliderKnobRefs.current[i] = el; }}
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
        {/* /FLIGHT WRAPPER */}
      </div>
    </section>
  );
}