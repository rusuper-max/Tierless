// src/components/scrolly/MainPhase3.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import WireGlobe from "@/components/scrolly/WireGlobe";
import CTAButton from "@/components/marketing/CTAButton";
import { t } from "@/i18n";

/* ============ ZAPEČENI DEFAULTS (ono što si podesio) ============ */
const BOTTOM_BAR_H = 202;           // px (desktop)
const MOBILE_BOTTOM_BAR_H = 236;    // px (mobile — par px "niže" od 240 da ne dira gornji deo)

const CURVE_SIZE_VMIN = 86;         // desktop
const MOBILE_CURVE_SIZE_VMIN = 62;  // mobilni — manja kugla

const CURVE_RADIUS = 400;
const CURVE_OFFSET_X = 3;
const CURVE_OFFSET_Y = -3;
const CURVE_LEFT_START = 18;        // %
const CURVE_RIGHT_START = 67;       // %

const BG_TOP_START = "#002e7a";
const BG_TOP_END   = "#0e2f2c";
const BG_BOTTOM_START = "#0042aa";
const BG_BOTTOM_END   = "#00fdff";
const BG_STOP_START = 37; // % na phase 0
const BG_STOP_END   = 1;  // % na phase 1
const TOP_MIX    = 0.33;  // brzina blend-a gore
const BOTTOM_MIX = 0.36;  // brzina blend-a dole

// Kriva/bend tekst: opaciti “od + do” (da bude sigurno nevidljivo pre otkrivanja)
const CURVE_REVEAL_START = 0.21; // 0..1
const CURVE_REVEAL_END   = 1;    // 0..1

// Side hint
const SIDE_TEXT   = "Tip: you can spin the globe with your mouse or finger — no reason, it's just awesome.";
const SIDE_X      = -550;
const SIDE_Y      = 203;
const SIDE_MAX_W  = 364;
const SIDE_FONT   = 22;
const SIDE_OPA    = 0.9;

/* ============ MAIN ============ */
export default function MainPhase3() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0); // 0..1
  const [href, setHref] = useState("/signup");

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
      .then((data) => { if (!dead && data?.user) setHref("/dashboard"); })
      .catch(() => void 0);
    return () => { dead = true; };
  }, []);

  // Dinamičan gradijent pozadine
  const bgTop = mixHex(BG_TOP_START, BG_TOP_END, clamp(phase * TOP_MIX, 0, 1));
  const bgBottom = mixHex(BG_BOTTOM_START, BG_BOTTOM_END, clamp(phase * BOTTOM_MIX, 0, 1));
  const stop = Math.round(lerp(BG_STOP_START, BG_STOP_END, phase));
  const background = `linear-gradient(180deg, ${bgTop} 0%, ${bgTop} ${stop}%, ${bgBottom} 100%)`;

  // Donja bela traka — gura globus gore (koristimo CSS varijantu zbog mob/desk)
  const ctaBottom = 16; // mali razmak iznad trake

  // Opacity za krivu (da ne bude vidljiva pre otkrivanja)
  const curveOpacity = smoothstep(CURVE_REVEAL_START, CURVE_REVEAL_END, phase);

  return (
    <section
      ref={trackRef}
      className="p3 relative w-full"
      style={{ height: "250vh" }}
      aria-label="MainPhase3 track"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background }}>
        {/* --- LAYER 1: GLOBE + CURVED TEXT + LEFT HINT (ispod overlay-a) --- */}
        <div
          className="absolute left-0 right-0 top-0"
          style={{ bottom: "var(--p3-bottom)", zIndex: 1 }}
        >
          {/* WireGlobe internim pravilom isključuje land-fill na mobilnom */}
          <WireGlobe phase={phase} />

          {/* Krug/tekst oko planete (otkriva se zajedno sa globe) */}
          <CurvedBand
            sizeVminVar="--p3-globe-size"
            radius={CURVE_RADIUS}
            offsetX={CURVE_OFFSET_X}
            offsetY={CURVE_OFFSET_Y}
            leftStart={CURVE_LEFT_START}
            rightStart={CURVE_RIGHT_START}
            opacity={curveOpacity}
          />

          {/* Left hint (funny tekst) */}
          <SideHint
            text={SIDE_TEXT}
            x={SIDE_X}
            y={SIDE_Y}
            maxW={SIDE_MAX_W}
            font={SIDE_FONT}
            opacity={SIDE_OPA}
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
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
          style={{
            bottom: `calc(var(--p3-bottom) + ${ctaBottom}px - 6px)`,
            zIndex: 3,
            transition: "bottom .2s ease, transform .2s ease",
          }}
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
        <BottomBar />
      </div>

      {/* Lokalne CSS varijable za mob/desk prilagodljivu veličinu/visinu */}
      <style jsx>{`
        .p3 {
          --p3-bottom: ${BOTTOM_BAR_H}px;
          --p3-globe-size: ${CURVE_SIZE_VMIN}vmin;
        }
        @media (max-width: 640px) {
          .p3 {
            --p3-bottom: ${MOBILE_BOTTOM_BAR_H}px;
            --p3-globe-size: ${MOBILE_CURVE_SIZE_VMIN}vmin;
          }
        }
      `}</style>
    </section>
  );
}

/* ================= subcomponents ================= */

function CurvedBand({
  sizeVminVar,
  radius,
  offsetX,
  offsetY,
  leftStart,
  rightStart,
  opacity,
}: {
  sizeVminVar: string;  // CSS var, npr "--p3-globe-size"
  radius: number;
  offsetX: number;
  offsetY: number;
  leftStart: number;   // %
  rightStart: number;  // %
  opacity: number;
}) {
  // razmak da ne “pojede” krajeve
  const pad = "\u00A0\u2009"; // NBSP + thin space
  const L = pad + t("For any business on planet Earth") + pad;
  const R = pad + t("Share your link in minutes") + pad;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ opacity }}>
      <svg
        viewBox="0 0 1000 1000"
        className="absolute left-1/2 top-1/2"
        style={{
          width: `var(${sizeVminVar})`,
          height: `var(${sizeVminVar})`,
          transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
          overflow: "visible",
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

        <text fill="url(#curvedGrad)" fontSize="28" fontWeight={600} letterSpacing="2" style={{ textTransform: "uppercase" }}>
          <textPath href="#orbitOuter" startOffset={`${leftStart}%`} textAnchor="middle">
            {L}
          </textPath>
        </text>

        <text fill="url(#curvedGrad)" fontSize="28" fontWeight={600} letterSpacing="2" style={{ textTransform: "uppercase" }}>
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

function BottomBar() {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[2]"
      style={{ height: "var(--p3-bottom)", background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.06)" }}
      aria-label="Footer links"
    >
      <div
        className="mx-auto w-full h-full max-w-6xl flex items-center"
        style={{ paddingLeft: "16px", paddingRight: "calc(16px + env(safe-area-inset-right))" }}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4 w-full">
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
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}