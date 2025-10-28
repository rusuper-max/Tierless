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
  const GRAD_HOLD_PCT = 40;
  const grad = `linear-gradient(90deg,
    var(--brand-1, #4F46E5) 0%,
    var(--brand-1, #4F46E5) ${GRAD_HOLD_PCT}%,
    var(--brand-2, #22D3EE) 100%)`;

  // Fluid font-size da bude pravilno i na mobilu
  const fontSize = "clamp(36px, 10vw, 60px)";
  const wrapWidth = "18.5ch";
  const DURATION = 800;
  const STAGGER = 260;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  const letters = useMemo(() => "ierless".split(""), []);

  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [totalW, setTotalW] = useState<number>(0);
  const [offsets, setOffsets] = useState<number[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const offs = letterRefs.current.map((el) => (el ? el.offsetLeft : 0));
    const last = letterRefs.current[letterRefs.current.length - 1];
    const total = last ? last.offsetLeft + last.offsetWidth : 0;
    if (total > 0) {
      setOffsets(offs);
      setTotalW(total);
    }
  }, [letters.length]);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      {/* Safe-area padding levo/desno na celom headeru (sprečava sečenje) */}
      <div
        className="mx-auto w-full max-w-7xl px-4 py-5 flex items-center justify-between"
        style={{
          paddingInlineStart: "calc(env(safe-area-inset-left, 0px) + 8px)",
          paddingInlineEnd: "calc(env(safe-area-inset-right, 0px) + 8px)",
        }}
      >
        <Link
          href="/"
          aria-label={`${t("brand.name")} — home`}
          className={
            [
              "inline-flex select-none",
              // Uklonjeni negativni margini na mobilu – da ništa ne izađe iz viewporta
              "ml-0",
              // Ako želiš da i dalje blago vučemo ulevo na većim ekranima, aktiviraj sledeće:
              // "sm:-ml-6 lg:-ml-10",
            ].join(" ")
          }
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
              fontSize, // fluid
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
              paddingLeft: "0.15ch", // mrvu manji razmak T↔i
              whiteSpace: "nowrap",
            }}
          >
            {letters.map((ch, i) => {
              const style: CSSProperties = {
                display: "inline-block",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                fontSize, // fluid
                backgroundImage: grad,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                backgroundSize: totalW ? `${totalW}px 100%` : "100% 100%",
                backgroundPosition: totalW ? `-${offsets[i] || 0}px 0` : "0 0",
                transform: hovered
                  ? "translateX(0) translateY(0)"
                  : "translateX(-0.6ch) translateY(0.15em)",
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
                  ref={(el: HTMLSpanElement | null) => {
                    letterRefs.current[i] = el;
                  }}
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
          <CTAButton
            fx="swap-up"
            variant="outline"
            size="md"
            pill
            hairlineOutline
            href="/signin"
            label={t("nav.signin")}
          />
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