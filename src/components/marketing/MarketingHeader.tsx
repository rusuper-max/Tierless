// src/components/marketing/MarketingHeader.tsx
"use client";

import Link from "next/link";
import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
  CSSProperties,
} from "react";
import CTAButton from "@/components/marketing/CTAButton";
import { t } from "@/i18n/t";

export default function MarketingHeader() {
  const [hovered, setHovered] = useState(false);
  const onEnter = useCallback(() => setHovered(true), []);
  const onLeave = useCallback(() => setHovered(false), []);

  // Brand
  const brandSolid = "var(--brand-1, #4F46E5)"; // T (uvek solid)
  // Mekši početak gradijenta: zadrži brand-1 prvih X%
  const GRAD_HOLD_PCT = 40; // po tvom poslednjem štimovanju
  const grad = `linear-gradient(90deg,
    var(--brand-1, #4F46E5) 0%,
    var(--brand-1, #4F46E5) ${GRAD_HOLD_PCT}%,
    var(--brand-2, #22D3EE) 100%)`;

  // Podesivo
  const fontSize = "60px";
  const wrapWidth = "18.5ch"; // dovoljno za “ierless”
  const DURATION = 800;       // ms po slovu
  const STAGGER  = 260;       // ms razmak i→e→r→l→e→s→s
  const EASE     = "cubic-bezier(0.22, 1, 0.36, 1)";

  const letters = useMemo(() => "ierless".split(""), []);

  // Izmeri širine/pomak slova za jedinstveni gradijent
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [totalW, setTotalW] = useState<number>(0);
  const [offsets, setOffsets] = useState<number[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const offs = letterRefs.current.map(el => (el ? el.offsetLeft : 0));
    const last = letterRefs.current[letterRefs.current.length - 1];
    const total = last ? last.offsetLeft + last.offsetWidth : 0;
    if (total > 0) {
      setOffsets(offs);
      setTotalW(total);
    }
  }, [letters.length]);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 flex items-center justify-between">
        <Link
          href="/"
          aria-label={`${t("brand.name")} — home`}
          className="inline-flex select-none -ml-12 sm:-ml-16 lg:-ml-20"
          style={{ lineHeight: 1, alignItems: "baseline" }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onEnter}
          onBlur={onLeave}
        >
          {/* T — stalno solid plavo */}
          <span
            style={{
              display: "inline-block",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              fontSize,
              color: brandSolid,
            }}
          >
            T
          </span>

          {/* “ierless” — slovo-po-slovo, jedinstveni gradijent */}
          <span
            ref={wrapRef}
            aria-hidden
            style={{
              display: "inline-block",
              verticalAlign: "baseline",
              width: wrapWidth,
              overflow: "hidden",
              paddingLeft: "0.15ch",   // mrvu manji razmak T↔i
              whiteSpace: "nowrap",
            }}
          >
            {letters.map((ch, i) => {
              const style: CSSProperties = {
                display: "inline-block",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                fontSize,
                // jedinstveni gradijent: ista background-size, različit background-position
                backgroundImage: grad,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                backgroundSize: totalW ? `${totalW}px 100%` : "100% 100%",
                backgroundPosition: totalW ? `-${offsets[i] || 0}px 0` : "0 0",
                // stagger ulaz
                transform: hovered ? "translateX(0) translateY(0)" : "translateX(-0.6ch) translateY(0.15em)",
                opacity: hovered ? 1 : 0,
                transitionProperty: "transform, opacity",
                transitionDuration: `${DURATION}ms`,
                transitionTimingFunction: EASE,
                transitionDelay: hovered ? `${i * STAGGER}ms` : "0ms",
                willChange: "transform, opacity",
              };
              return (
                <span
                  key={i}
                  ref={(el: HTMLSpanElement | null) => { letterRefs.current[i] = el; }}
                  style={style}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        </Link>

        {/* Desno: auth dugmad */}
        <nav className="flex items-center gap-3">
          {/* Log in — hairline outline */}
          <CTAButton
            fx="swap-up"
            variant="outline"
            size="md"
            pill
            hairlineOutline
            href="/signin"
            label={t("nav.signin")}
          />
          {/* Sign up — unified gradient tekst */}
          <CTAButton
            fx="swap-up"
            variant="brand"
            size="md"
            pill
            textGradientUnified
            href="/signup"
            label={t("nav.signup")}
          />
        </nav>
      </div>
    </header>
  );
}