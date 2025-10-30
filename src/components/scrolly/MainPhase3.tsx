// src/components/scrolly/MainPhase3.tsx
"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";
import WireGlobe from "@/components/scrolly/WireGlobe";
import CTAButton from "@/components/marketing/CTAButton"; // prilagodi path
import { t } from "@/i18n";

/* ============ DEV STATE ============ */
type DevState = {
  bottomBarH: number;
  curveSizeVmin: number;
  curveRadius: number;
  curveOffsetX: number;
  curveOffsetY: number;
  curveLeftStart: number;
  curveRightStart: number;
  bgTopStart: string;
  bgTopEnd: string;
  bgBottomStart: string;
  bgBottomEnd: string;
  bgStopStart: number;
  bgStopEnd: number;
  topMix: number;
  bottomMix: number;
  sideText: string;
  sideX: number;
  sideY: number;
  sideMaxW: number;
  sideFont: number;
  sideOpacity: number;
  /** NOVO: prozor u kom otkrivamo P3/krivu */
  curveRevealStart: number;   // 0..1 (npr 0.21)
  curveRevealEnd: number;     // 0..1 (npr 1)
};

const DEV_KEY = "mp3Dev";

const DEFAULTS: DevState = {
  "bottomBarH": 202,
  "curveSizeVmin": 86,
  "curveRadius": 400,
  "curveOffsetX": 3,
  "curveOffsetY": -3,
  "curveLeftStart": 18,
  "curveRightStart": 67,
  "bgTopStart": "#002e7a",
  "bgTopEnd": "#0e2f2c",
  "bgBottomStart": "#0042aa",
  "bgBottomEnd": "#00fdff",
  "bgStopStart": 37,
  "bgStopEnd": 1,
  "topMix": 0.33,
  "bottomMix": 0.36,
  "sideText": "Tip: you can spin the globe with your mouse or finger — no reason, it's just awesome.",
  "sideX": -550,
  "sideY": 203,
  "sideMaxW": 364,
  "sideFont": 22,
  "sideOpacity": 0.9,
  "curveRevealStart": 0.21,
  "curveRevealEnd": 1
};

/* ============ MAIN ============ */
export default function MainPhase3() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0); // 0..1
  const [href, setHref] = useState("/signup");

  // DEV panel
  const [devOpen, setDevOpen] = useState(false);
  const [dev, setDev] = useState<DevState>(DEFAULTS);

  // load/save dev
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEV_KEY);
      if (raw) setDev({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DEV_KEY, JSON.stringify(dev));
    } catch {}
  }, [dev]);

  // toggle D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key.toLowerCase() === "d") setDevOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll progresija 0..1
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const y = Math.min(total, Math.max(0, -rect.top));
      const p = total > 0 ? y / total : 0;
      setPhase(Number(p.toFixed(4)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Ako je ulogovan, CTA vodi na dashboard
  useEffect(() => {
    let dead = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!dead && data?.user) setHref("/dashboard");
      })
      .catch(() => void 0);
    return () => { dead = true; };
  }, []);

  // Dinamičan gradijent pozadine
  const bgTop = mixHex(dev.bgTopStart, dev.bgTopEnd, clamp(phase * dev.topMix, 0, 1));
  const bgBottom = mixHex(dev.bgBottomStart, dev.bgBottomEnd, clamp(phase * dev.bottomMix, 0, 1));
  const stop = Math.round(lerp(dev.bgStopStart, dev.bgStopEnd, phase));
  const background = `linear-gradient(180deg, ${bgTop} 0%, ${bgTop} ${stop}%, ${bgBottom} 100%)`;

  // Donja bela traka — gura globus gore
  const ctaBottom = dev.bottomBarH + 16;

  return (
    <section ref={trackRef} className="relative w-full" style={{ height: "250vh" }} aria-label="MainPhase3 track">
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background }}>
        {/* --- LAYER 1: GLOBE + CURVED TEXT + LEFT HINT (ispod overlay-a — prvo nevidljivo) --- */}
        <div className="absolute left-0 right-0 top-0" style={{ bottom: dev.bottomBarH, zIndex: 1 }}>
          <WireGlobe phase={phase} />
          <CurvedBand
            sizeVmin={dev.curveSizeVmin}
            radius={dev.curveRadius}
            offsetX={dev.curveOffsetX}
            offsetY={dev.curveOffsetY}
            leftStart={dev.curveLeftStart}
            rightStart={dev.curveRightStart}
          />
          <SideHint
            text={dev.sideText}
            x={dev.sideX}
            y={dev.sideY}
            maxW={dev.sideMaxW}
            font={dev.sideFont}
            opacity={dev.sideOpacity}
          />
        </div>

        {/* --- LAYER 2: INDIGO OVERLAY koji se skida odozgo (otkrivanje) --- */}
        <div
          className="absolute inset-0 flex items-center justify-center text-center"
          style={{ zIndex: 2, background: "#0b1d4d", clipPath: `inset(${(phase * 100).toFixed(2)}% 0 0 0)` }}
        >
          <div
            className="px-6"
            style={{
              opacity: 1 - phase,
              transform: `translateY(${(-10 * phase).toFixed(2)}px)`,
              transition: "opacity 0.15s linear, transform 0.15s linear",
            }}
          >
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white">
              {t("Create your price page")}.
            </h1>
            <p className="mt-4 text-white/80 text-lg md:text-xl">
              {t("For any business on this planet")}
            </p>
          </div>
        </div>

        {/* --- LAYER 3: CTA (iznad bele trake) --- */}
       <div
  className="absolute inset-x-0 flex items-center justify-center pointer-events-none translate-y-[6px]"
  style={{ bottom: ctaBottom, zIndex: 3 }}
>
  <CTAButton
    fx="swap-up"
    variant="brand"
    size="lg"
    pill
    href={href}
    label={t("Start Right Now")}
    className="pointer-events-auto"
  />
          
        </div>

        {/* --- LAYER 4: Donja bela traka (gura globus) --- */}
        <BottomBar height={dev.bottomBarH} />
      </div>

      {/* DEV PANEL (toggle: D) */}
      <DevPanel open={devOpen} dev={dev} onChange={setDev} />

      {/* Lokalni stilovi za CTA gradient text + swapup (Safari fix) */}
    </section>
  );
}

/* ================= subcomponents ================= */

function CurvedBand({
  sizeVmin,
  radius,
  offsetX,
  offsetY,
  leftStart,
  rightStart,
}: {
  sizeVmin: number;
  radius: number;
  offsetX: number;
  offsetY: number;
  leftStart: number;   // %
  rightStart: number;  // %
}) {
  // “pufnasti” spaceri da ništa ne bude pojedeno na krajevima
  const pad = "\u00A0\u2009"; // NBSP + thin space
  const L = pad + t("For any business on planet Earth") + pad;
  const R = pad + t("Share your link in minutes") + pad;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 1000 1000"
        className="absolute left-1/2 top-1/2"
        style={{
          width: `${sizeVmin}vmin`,
          height: `${sizeVmin}vmin`,
          transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
          overflow: "visible", // da ništa ne iseče
        }}
      >
        <defs>
          <path
            id="orbitOuter"
            d={`M500,${500 - radius} a${radius},${radius} 0 1,1 0,${radius * 2} a${radius},${radius} 0 1,1 0,-${radius * 2}`}
          />
          <radialGradient id="curvedGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.70)" />
          </radialGradient>
        </defs>

        <text
          fill="url(#curvedGrad)"
          fontSize="28"
          fontWeight={600}
          letterSpacing="2"     // malo manje da ne “ždere” krajeve
          style={{ textTransform: "uppercase" }}
        >
          <textPath href="#orbitOuter" startOffset={`${leftStart}%`} textAnchor="middle">
            {L}
          </textPath>
        </text>

        <text
          fill="url(#curvedGrad)"
          fontSize="28"
          fontWeight={600}
          letterSpacing="2"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href="#orbitOuter" startOffset={`${rightStart}%`} textAnchor="middle">
            {R}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

function SideHint({
  text, x, y, maxW, font, opacity,
}: { text: string; x: number; y: number; maxW: number; font: number; opacity: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        width: maxW,
        color: `rgba(255,255,255,${opacity})`,
        fontSize: font,
        lineHeight: 1.4,
        textAlign: "left",
      }}
    >
      {text}
    </div>
  );
}

function SwapText({ label }: { label: string }) {
  const chars = Array.from(label);
  return (
    <span className="mkt-ch--wrap">
      <span className="mkt-ch--A">
        {chars.map((ch, i) => (
          <span key={`A${i}`} className="mkt-line mkt-stripe" style={{ ["--i" as any]: i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
      <span className="mkt-ch--B">
        {chars.map((ch, i) => (
          <span key={`B${i}`} className="mkt-line mkt-stripe" style={{ ["--i" as any]: i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}

function BottomBar({ height }: { height: number }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[2]"
      style={{ height, background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.06)" }}
      aria-label="Footer links"
    >
      <div
        className="mx-auto w-full h-full max-w-6xl flex items-center"
        style={{ paddingLeft: "24px", paddingRight: "calc(32px + env(safe-area-inset-right))" }}
      >
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 w-full">
          <div className="space-y-1.5">
            <div className="text-sm/6 text-black/60">{t("Get Started")}</div>
            <FooterLink href="/signup">{t("Sign up")}</FooterLink>
            <FooterLink href="/login">{t("Login")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm/6 text-black/60">{t("Discover")}</div>
            <FooterLink href="/templates">{t("Templates")}</FooterLink>
            <FooterLink href="/pricing">{t("Pricing")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm/6 text-black/60">{t("Company")}</div>
            <FooterLink href="/about">{t("About")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm/6 text-black/60">{t("Legal & Help")}</div>
            <FooterLink href="/legal/cookies">{t("Cookie Policy")}</FooterLink>
            <FooterLink href="/legal/privacy">{t("Privacy Policy")}</FooterLink>
            <FooterLink href="/legal/terms">{t("Terms and Conditions")}</FooterLink>
            <FooterLink href="/faq">{t("FAQ")}</FooterLink>
            <FooterLink href="/support">{t("Support")}</FooterLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterLink(props: React.ComponentProps<"a">) {
  return <a {...props} className="block text-base/6 text-black hover:text-black/70 transition-colors" />;
}

/* ============ DEV PANEL UI ============ */

function DevPanel({ open, dev, onChange }: { open: boolean; dev: DevState; onChange: (d: DevState) => void }) {
  const set = (k: keyof DevState, v: any) => onChange({ ...dev, [k]: v });
  const copySnippet = () => {
    const snippet = `const DEFAULTS: DevState = ${JSON.stringify(dev, null, 2)};`;
    navigator.clipboard?.writeText(snippet).catch(() => {});
  };
  const reset = () => onChange({ ...DEFAULTS });

  return (
    <div
      className="fixed right-3 top-3 z-[50]"
      style={{ pointerEvents: open ? "auto" : "none", opacity: open ? 1 : 0, transition: "opacity .2s ease" }}
    >
      <div
        className="rounded-2xl p-3 shadow-2xl min-w-[340px] max-w-[420px] text-sm"
        style={{ background: "rgba(15,23,42,.86)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(148,163,184,.25)" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <strong>Phase3 Dev</strong>
          <div className="flex gap-2">
            <button className="btn px-2 py-1 rounded-lg" onClick={reset}>Reset</button>
            <button className="btn px-2 py-1 rounded-lg" onClick={copySnippet}>Copy</button>
          </div>
        </div>

        {/* Bottom bar */}
        <Group title="Bottom bar (px)">
          <Slider label="Height" min={72} max={300} value={dev.bottomBarH} onChange={(v)=>set("bottomBarH", v)} />
        </Group>

        {/* Curved text */}
        <Group title="Curved text">
          <Slider label="Size (vmin)" min={80} max={110} step={1} value={dev.curveSizeVmin} onChange={(v)=>set("curveSizeVmin", v)} />
          <Slider label="Radius" min={400} max={500} step={1} value={dev.curveRadius} onChange={(v)=>set("curveRadius", v)} />
          <Slider label="Offset X" min={-160} max={160} value={dev.curveOffsetX} onChange={(v)=>set("curveOffsetX", v)} />
          <Slider label="Offset Y" min={-160} max={160} value={dev.curveOffsetY} onChange={(v)=>set("curveOffsetY", v)} />
          <Slider label="Left start (%)" min={0} max={100} value={dev.curveLeftStart} onChange={(v)=>set("curveLeftStart", v)} />
          <Slider label="Right start (%)" min={0} max={100} value={dev.curveRightStart} onChange={(v)=>set("curveRightStart", v)} />
        </Group>

        {/* Background palette */}
        <Group title="Background colors">
          <Color label="Top start" value={dev.bgTopStart} onChange={(v)=>set("bgTopStart", v)} />
          <Color label="Top end" value={dev.bgTopEnd} onChange={(v)=>set("bgTopEnd", v)} />
          <Color label="Bottom start" value={dev.bgBottomStart} onChange={(v)=>set("bgBottomStart", v)} />
          <Color label="Bottom end" value={dev.bgBottomEnd} onChange={(v)=>set("bgBottomEnd", v)} />
          <Slider label="Top mix" min={0} max={1} step={0.01} value={dev.topMix} onChange={(v)=>set("topMix", v)} />
          <Slider label="Bottom mix" min={0} max={1} step={0.01} value={dev.bottomMix} onChange={(v)=>set("bottomMix", v)} />
          <Slider label="Stop @phase0 (%)" min={0} max={100} value={dev.bgStopStart} onChange={(v)=>set("bgStopStart", v)} />
          <Slider label="Stop @phase1 (%)" min={0} max={100} value={dev.bgStopEnd} onChange={(v)=>set("bgStopEnd", v)} />
        </Group>

        {/* Side hint controls */}
        <Group title="Side hint (left)">
          <Text label="Text" value={dev.sideText} onChange={(v)=>set("sideText", v)} />
          <Slider label="Offset X" min={-700} max={0} value={dev.sideX} onChange={(v)=>set("sideX", v)} />
          <Slider label="Offset Y" min={-300} max={300} value={dev.sideY} onChange={(v)=>set("sideY", v)} />
          <Slider label="Max width" min={240} max={520} value={dev.sideMaxW} onChange={(v)=>set("sideMaxW", v)} />
          <Slider label="Font size" min={12} max={22} value={dev.sideFont} onChange={(v)=>set("sideFont", v)} />
          <Slider label="Opacity" min={0.2} max={1} step={0.01} value={dev.sideOpacity} onChange={(v)=>set("sideOpacity", v)} />
        </Group>

        <div className="mt-2 text-[11px] text-slate-300/80">
          Tip: pritisni <kbd>D</kbd> da sakriješ/prikažeš panel. Sve izmene se čuvaju u localStorage i primenjuju odmah.
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs uppercase tracking-wide text-slate-300/80 mb-1">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Slider({ label, min, max, value, step = 1, onChange }:{
  label: string; min: number; max: number; value: number; step?: number; onChange: (v: number)=>void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-36">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e)=>onChange(Number(e.target.value))} className="flex-1" />
      <span className="w-12 text-right tabular-nums">{value}</span>
    </label>
  );
}

function Color({ label, value, onChange }:{ label: string; value: string; onChange: (v: string)=>void; }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-36">{label}</span>
      <input type="color" value={value} onChange={(e)=>onChange(e.target.value)} />
      <span className="w-24 font-mono text-xs">{value}</span>
    </label>
  );
}
function Text({ label, value, onChange }:{ label: string; value: string; onChange: (v: string)=>void; }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="flex-1 rounded-md px-2 py-1 text-black"
        placeholder="Type hint…"
      />
    </label>
  );
}

/* ---------- helpers ---------- */
function clamp(v: number, a: number, b: number) { return Math.min(b, Math.max(a, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(ca.r,cb.r)}, ${m(ca.g,cb.g)}, ${m(ca.b,cb.b)})`;
}
function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
  return { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) };
}