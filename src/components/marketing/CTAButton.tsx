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
  textGradientUnified?: boolean;
  hairlineOutline?: boolean;
  className?: string;
  label?: string;
  children?: ReactNode;
  ariaLabel?: string;
  glow?: boolean; // NOVO: Dodaje onaj cyan glow ispod
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
  glow = false,
  ...rest
}: Props) {
  
  // --- BOJE (Prilagođeno za Dark Mode) ---
  const TEXT_COLOR = "#ffffff"; // Uvek beo tekst na tamnoj pozadini
  const DARK_BG = "#020617";    // Tvoja glavna pozadina
  const LIGHTER_BG = "#0f172a"; // Malo svetlija za outline varijante

  // Da li koristimo gradient border tehniku?
  const useGradientBorder = variant === "brand" || variant === "outline";

  // --- TEKST LOGIKA (Isto kao pre) ---
  const text = useMemo(() => {
    if (typeof label === "string") return label;
    return typeof children === "string" ? children : "";
  }, [label, children]);

  const chars = useMemo(() => (text ? text.split("") : []), [text]);

  // --- MERENJE ZA GRADIENT TEXT (Isto kao pre) ---
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [totalW, setTotalW] = useState<number>(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [measured, setMeasured] = useState(false);

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
    const id = requestAnimationFrame(doMeasure);
    return () => cancelAnimationFrame(id);
  }, [textGradientUnified, chars.length]);

  // --- RENDER SLOVA (Swap Up) ---
  function renderChars() {
    if (fx !== "swap-up" || !text) {
      return typeof label === "string" ? label : children;
    }

    return chars.map((ch, i) => {
      const content = ch === " " ? "\u00A0" : ch;

      // Ako je textGradientUnified, koristimo gradient na tekstu
      const allowGradient = textGradientUnified && measured;
      
      const gradStyle: CSSProperties | undefined = allowGradient
        ? {
            backgroundImage: "linear-gradient(90deg, #4F46E5, #22D3EE)",
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
          ref={(el: HTMLSpanElement | null) => { charRefs.current[i] = el; }}
          style={{ ["--i" as any]: i } as CSSProperties}
        >
          <span className="mkt-ch mkt-ch--A" style={gradStyle}>{content}</span>
          <span className="mkt-ch mkt-ch--B" style={gradStyle}>{content}</span>
        </span>
      );
    });
  }

  // --- KLASE I STILOVI ---
  
  // Osnovne Tailwind klase za pozicioniranje i tranzicije
  // Dodajemo 'group' da bismo mogli da animiramo glow
  const baseClasses = `
    group relative inline-flex items-center justify-center 
    transition-all duration-200 ease-out 
    active:scale-[0.98] hover:-translate-y-0.5
    ${pill ? "rounded-full" : "rounded-xl"}
    ${size === "sm" ? "px-4 py-2 text-xs" : size === "md" ? "px-6 py-2.5 text-sm" : "px-8 py-3.5 text-base"}
    font-semibold tracking-wide
    ${className}
  `;

  // Stil za gradient border (Dark Mode Version)
  const gradientBorderStyle: CSSProperties = useGradientBorder
    ? {
        // Trik: Dva gradienta. Prvi je boja pozadine (padding-box), drugi je border (border-box).
        background: `
          linear-gradient(${variant === "brand" ? DARK_BG : LIGHTER_BG}, ${variant === "brand" ? DARK_BG : LIGHTER_BG}) padding-box,
          linear-gradient(90deg, #4F46E5, #22D3EE) border-box
        `,
        border: hairlineOutline ? "1px solid transparent" : "2px solid transparent",
        color: TEXT_COLOR,
      }
    : {};

  const content = (
    <>
      {/* GLOW EFEKAT (Samo ako je upaljen) */}
      {glow && (
        <div 
          className="absolute inset-0 -z-10 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl"
          style={{ background: "linear-gradient(90deg, #4F46E5, #22D3EE)" }}
        />
      )}

      <span
        ref={wrapRef}
        className={`mkt-btn-label ${fx === "swap-up" ? "mkt-btn--swapup" : ""}`}
        style={{ display: 'inline-flex' }}
      >
        {renderChars()}
      </span>
    </>
  );

  const computedAria = ariaLabel ?? (text || undefined);

  if (href) {
    return (
      <Link
        href={href}
        aria-label={computedAria}
        className={baseClasses}
        style={gradientBorderStyle}
        {...(rest as any)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={computedAria}
      className={baseClasses}
      style={gradientBorderStyle}
      {...rest}
    >
      {content}
    </button>
  );
}