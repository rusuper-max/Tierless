"use client";

import { useEffect, useRef, useState } from "react";
import WireGlobe from "@/components/scrolly/WireGlobe";
import CTAButton from "@/components/marketing/CTAButton";
import { t } from "@/i18n";

/* ============ ZAPEČENI DEFAULTS (ono što si podesio) ============ */
const BOTTOM_BAR_H = 202;           // px (desktop)
const MOBILE_BOTTOM_BAR_H = 260;    // px (mobile — par px "niže" od 240 da ne dira gornji deo)

const CURVE_SIZE_VMIN = 86;         // desktop
const MOBILE_CURVE_SIZE_VMIN = 52;  // mobilni — manja kugla

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
          <WireGlobe phase={phase} />

          <CurvedBand
            sizeVminVar="--p3-globe-size"
            radius={CURVE_RADIUS}
            offsetX={CURVE_OFFSET_X}
            offsetY={CURVE_OFFSET_Y}
            leftStart={CURVE_LEFT_START}
            rightStart={CURVE_RIGHT_START}
            opacity={curveOpacity}
          />

          <SideHint
            text={SIDE_TEXT}
            x={SIDE_X}
            y={SIDE_Y}
            maxW={SIDE_MAX_W}
            font={SIDE_FONT}
            opacity={SIDE_OPA}
          />
        </div>

        {/* --- LAYER 2: OVERLAY (indigo on light; deep black + starfield on dark) --- */}
        <div
          className="absolute inset-0 flex items-center justify-center text-center overlay"
          style={{ zIndex: 2, clipPath: `inset(${(phase * 100).toFixed(2)}% 0 0 0)` }}
        >
          <div className="starfield pointer-events-none" aria-hidden="true">
            <Starfield />
          </div>

          <div
            className="px-6 relative"
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
      <style jsx>{`
        .overlay{ background: #0b1d4d; }
        :global(html.dark) .overlay{ background: #000; }

        .starfield{ position: absolute; inset: 0; display: none; z-index: 0; }
        :global(html.dark) .starfield{ display: block; }

        .overlay > .relative{ z-index: 1; }
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
  sizeVminVar: string;
  radius: number;
  offsetX: number;
  offsetY: number;
  leftStart: number;
  rightStart: number;
  opacity: number;
}) {
  const pad = "\u00A0\u2009";
  const L = pad + t("For any business on planet Earth") + pad;
  const R = pad + t("Share your link in minutes") + pad;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ opacity }}>
      <div
        className="curved-wrap absolute left-1/2 top-1/2"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <svg
          viewBox="0 0 1000 1000"
          style={{
            width: `var(${sizeVminVar})`,
            height: `var(${sizeVminVar})`,
            transform: `translate(${offsetX}px, ${offsetY}px)`,
            overflow: "visible",
            display: "block",
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

      <style jsx>{`
        /* Mobile-only: gurni krivi tekst još malo VAN globusa */
        @media (max-width: 640px) {
          .curved-wrap{
            transform: translate(-50%, -54%) scale(1.30);
            transform-origin: center;
          }
        }
      `}</style>
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
      className="absolute inset-x-0 bottom-0 z-[2] footer-bar"
      style={{ height: "var(--p3-bottom)" }}
      aria-label="Footer links"
    >
      {/* brand hairline separator */}
      <div className="brand-hairline" aria-hidden="true" />

      <div
        className="mx-auto w-full h-full max-w-6xl flex items-start fb-grid"
        style={{ paddingLeft: "16px", paddingRight: "calc(16px + env(safe-area-inset-right))" }}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4 w-full">
          <div className="space-y-1.5">
            <div className="text-sm/6 footer-muted">{t("Get Started")}</div>
            <FooterLink href="/signup">{t("Sign up")}</FooterLink>
            <FooterLink href="/login">{t("Login")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm/6 footer-muted">{t("Discover")}</div>
            <FooterLink href="/templates">{t("Templates")}</FooterLink>
            <FooterLink href="/pricing">{t("Pricing")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm/6 footer-muted">{t("Company")}</div>
            <FooterLink href="/about">{t("About")}</FooterLink>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm/6 footer-muted">{t("Legal & Help")}</div>
            <FooterLink href="/legal/cookies">{t("Cookie Policy")}</FooterLink>
            <FooterLink href="/legal/privacy">{t("Privacy Policy")}</FooterLink>
            <FooterLink href="/legal/terms">{t("Terms and Conditions")}</FooterLink>
            <FooterLink href="/faq">{t("FAQ")}</FooterLink>
            <FooterLink href="/support">{t("Support")}</FooterLink>
          </div>
        </div>
      </div>

      {/* Legal row at absolute bottom of footer */}
      <div className="legal-row">
        <div className="legal-inner">
          <span className="legal-left">Tierless — All rights reserved.</span>
          <span className="legal-right">Made with ❤️</span>
        </div>
      </div>

      <style jsx>{`
        /* Theme-aware footer container */
        .footer-bar{
          height: var(--p3-bottom);
          background: #ffffff;
          color: #0b1020;
          border-top: 1px solid rgba(0,0,0,0.08);
          overflow: hidden; /* NIŠTA da ne pređe granicu futera */
        }
        :global(html.dark) .footer-bar{
          background: #0b0b0c;
          color: #ffffff;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .brand-hairline{
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: var(--brand-gradient);
          opacity: .9;
          pointer-events: none;
        }
        :global(html.dark) .brand-hairline{ opacity: .85; }

        .footer-muted{ opacity: .7; }

        /* rezerva za legal red + malo gornjeg vazduha */
        .fb-grid{ padding-top: 12px; padding-bottom: 56px; }

        .footer-bar :global(a.footer-link){
          position: relative;
          text-decoration: none;
          color: inherit;
          display: block;
          padding: 2px 0 6px;
          line-height: 1.2;
        }
        .footer-bar :global(a.footer-link .footer-ink){
          position: relative;
          display: inline-block;
        }
        .footer-bar :global(a.footer-link .footer-ink::after){
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background: var(--brand-gradient);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .70s cubic-bezier(.22,1,.36,1), opacity .3s ease;
          opacity: .95;
          pointer-events: none;
        }
        .footer-bar :global(a.footer-link:hover .footer-ink::after),
        .footer-bar :global(a.footer-link:focus-visible .footer-ink::after){
          transform: scaleX(1);
          opacity: 1;
        }

        .legal-row{
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 40px;
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; align-items: center;
          background: inherit;
        }
        :global(html.dark) .legal-row{
          border-top-color: rgba(255,255,255,0.08);
        }
        .legal-inner{
          width: 100%;
          max-width: 72rem;
          margin-inline: auto;
          padding-inline: 16px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px; line-height: 1; opacity: .85;
        }

        @media (max-width: 640px){
          .legal-inner{
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            text-align: center;
            padding-top: 4px;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .footer-bar :global(a.footer-link .footer-ink::after){
            transition: none;
            transform: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function FooterLink(props: React.ComponentProps<"a">) {
  const { children, className, ...rest } = props;
  return (
    <a {...rest} className={`footer-link block text-base/6 transition-colors ${className ?? ""}`}>
      <span className="footer-ink">{children}</span>
    </a>
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
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function Starfield() {
  const seed = 1337;
  const area = 2000;
  const small = generateBoxShadows(420, area, area, seed + 1);
  const medium = generateBoxShadows(160, area, area, seed + 2);
  const big = generateBoxShadows(80, area, area, seed + 3);

  return (
    <>
      <div className="stars" style={{ ["--shadow" as any]: small } as React.CSSProperties} />
      <div className="stars2" style={{ ["--shadow" as any]: medium } as React.CSSProperties} />
      <div className="stars3" style={{ ["--shadow" as any]: big } as React.CSSProperties} />
      <style jsx>{`
        .stars, .stars2, .stars3 {
          position: absolute;
          top: 0; left: 0;
          width: 1px; height: 1px;
          background: transparent;
          box-shadow: var(--shadow);
          animation: animStar 60s linear infinite;
          will-change: transform;
        }
        .stars::after, .stars2::after, .stars3::after{
          content: "";
          position: absolute;
          top: 2000px; left: 0;
          width: inherit; height: inherit;
          background: transparent;
          box-shadow: var(--shadow);
        }
        .stars2{ width: 2px; height: 2px; animation-duration: 110s; opacity: .9; }
        .stars3{ width: 3px; height: 3px; animation-duration: 160s; opacity: .75; }

        @keyframes animStar {
          from { transform: translateY(0); }
          to   { transform: translateY(-2000px); }
        }
      `}</style>
    </>
  );
}

function generateBoxShadows(n: number, w: number, h: number, seed: number) {
  const rng = lcg(seed);
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rng() * w);
    const y = Math.floor(rng() * h);
    pts.push(`${x}px ${y}px #FFF`);
  }
  return pts.join(", ");
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return function() {
    s = (1664525 * s + 1013904223) % 0xffffffff;
    return s / 0xffffffff;
  };
}