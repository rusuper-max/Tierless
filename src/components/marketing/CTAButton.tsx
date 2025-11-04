// src/components/marketing/CTAButton.tsx
"use client";

import Link from "next/link";
import {
  CSSProperties,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

type Variant = "brand" | "outline" | "plain";
type Size = "sm" | "md" | "lg";
type Fx = "none" | "swap-up";

type Props = {
  href?: string;
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  fx?: Fx;
  /** Ako je true – tekst ima JEDAN kontinualni gradient preko cele reči (za "Sign up"). */
  textGradientUnified?: boolean;
  /** Ako je true – outline je skoro “hairline” (za “Log in”). */
  hairlineOutline?: boolean;
  className?: string;
  /** Umesto children koristi eksplicitnu labelu (preporučeno za FX). */
  label?: string;
  /** Fallback: ako ne koristiš label, može i children (ali mora biti čist string). */
  children?: ReactNode;
  ariaLabel?: string;
};

export default function CTAButton({
  href,
  variant = "brand",
  size = "lg",
  pill = true,
  fx = "swap-up",
  textGradientUnified = false,
  hairlineOutline = false,
  className = "",
  label,
  children,
  ariaLabel,
  ...rest
}: Props) {
  const WHITE_INK = "#0f172a";
  const isWhiteFill = variant === "brand" || variant === "outline";

  // 1) Izaberi tekst koji renderujemo
  const text = useMemo(() => {
    if (typeof label === "string") return label;
    return typeof children === "string" ? children : "";
  }, [label, children]);

  const chars = useMemo(() => (text ? text.split("") : []), [text]);

  // 2) Merenje širina slova (samo ako radimo unified gradient)
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [totalW, setTotalW] = useState<number>(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [measured, setMeasured] = useState(false); // <- NE prikazujemo unified gradient dok ne izmerimo

  const doMeasure = () => {
    if (!wrapRef.current || chars.length === 0) return;
    const offs = charRefs.current.map((el) => (el ? el.offsetLeft : 0));
    const last = charRefs.current[charRefs.current.length - 1];
    const total = last ? last.offsetLeft + last.offsetWidth : 0;
    if (total > 0) {
      setOffsets(offs);
      setTotalW(total);
      setMeasured(true);
    }
  };

  useLayoutEffect(() => {
    if (!textGradientUnified) return;
    doMeasure();
    // dodatni raf da sačekamo layout
    const id = requestAnimationFrame(doMeasure);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textGradientUnified, chars.length]);

  useEffect(() => {
    if (!textGradientUnified) return;

    // re-measure kad se fontovi učitaju (sprečava 0 širine)
    let fontReady = true;
    // @ts-ignore
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      // @ts-ignore
      document.fonts.ready.then(() => {
        if (fontReady) doMeasure();
      });
    }

    // re-measure na resize wrapa (npr. promene CSS, breakpoint)
    const ro = new ResizeObserver(() => doMeasure());
    if (wrapRef.current) ro.observe(wrapRef.current);

    const onResize = () => doMeasure();
    window.addEventListener("resize", onResize);

    return () => {
      fontReady = false;
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textGradientUnified, chars.length]);

  // 3) Render slova (swap-up FX, uz unified gradient po izboru)
  function renderChars() {
    if (fx !== "swap-up" || !text) {
      return typeof label === "string" ? label : children;
    }

    return chars.map((ch, i) => {
      const content = ch === " " ? "\u00A0" : ch;

      // Unified gradient: pun efekat TEK kad izmerimo širine
      const allowGradient = textGradientUnified && measured && !isWhiteFill;
      const gradStyle: CSSProperties | undefined = allowGradient
        ? {
            backgroundImage:
              "linear-gradient(90deg, var(--brand-1, #4F46E5), var(--brand-2, #22D3EE))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            backgroundSize: `${totalW}px 100%`,
            backgroundPosition: `-${offsets[i] || 0}px 0`,
          }
        : undefined;

      return (
        <span
          key={i}
          className="mkt-chwrap"
          ref={(el: HTMLSpanElement | null) => {
            charRefs.current[i] = el;
          }}
          style={{ ["--i" as any]: i } as CSSProperties}
        >
          <span className="mkt-ch mkt-ch--A" style={gradStyle}>
            {content}
          </span>
          <span className="mkt-ch mkt-ch--B" style={gradStyle}>
            {content}
          </span>
        </span>
      );
    });
  }

  // 4) Klase + label node
  const base =
    "mkt-btn " +
    `mkt-btn--${variant} ` +
    `mkt-btn--${size} ` +
    (pill ? "mkt-btn--pill " : "") +
    (fx === "swap-up" ? "mkt-btn--swapup " : "") +
    (hairlineOutline ? "mkt-btn--hairline " : "") +
    className;

  const labelNode =
    fx === "swap-up" && text ? (
      <span
        ref={wrapRef}
        className="mkt-btn-label"
        style={isWhiteFill ? ({ color: WHITE_INK } as CSSProperties) : undefined}
      >
        {renderChars()}
      </span>
    ) : (
      <span
        className="mkt-btn-label"
        style={isWhiteFill ? ({ color: WHITE_INK } as CSSProperties) : undefined}
      >
        {typeof label === "string" ? label : children}
      </span>
    );

  const computedAria = ariaLabel ?? (text || undefined);

  // Force white fill always + brand gradient outline (hairline optional) for brand & outline.
  const inlineStyle: CSSProperties | undefined = isWhiteFill
    ? {
        background:
          "linear-gradient(#fff, #fff) padding-box, var(--brand-gradient) border-box",
        border: hairlineOutline ? "0.5px solid transparent" : "1px solid transparent",
        color: WHITE_INK,
        WebkitTextFillColor: WHITE_INK as any, // ensure Safari doesn't keep transparent fill from children
      }
    : undefined;

  // 5) Render Link ili button
  if (href) {
    return (
      <Link
        href={href}
        aria-label={computedAria}
        className={base}
        style={inlineStyle}
        {...(rest as any)}
      >
        {labelNode}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={computedAria}
      className={base}
      style={inlineStyle}
      {...rest}
    >
      {labelNode}
    </button>
  );
}