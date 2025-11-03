// src/components/ui/Button2.tsx
"use client";

import React from "react";
import Link from "next/link";

export type Btn2Variant = "brand" | "neutral" | "danger";
export type Btn2Size = "xs" | "sm";

type CommonProps = {
  title?: string;
  disabled?: boolean;
  variant?: Btn2Variant;
  size?: Btn2Size;
  className?: string;
  children?: React.ReactNode; // za IconButton2
};

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function sizePad(size: Btn2Size) {
  return size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";
}

function textColor(variant: Btn2Variant) {
  if (variant === "danger") return "text-rose-700";
  if (variant === "brand") return "text-neutral-900";
  return "text-neutral-800";
}

/** Primarno dugme sa finim gradient outline-om i SUPTILNIM radijalnim glow-om (2–3px) */
export default function Button2({
  label,
  title,
  href,
  onClick,
  disabled,
  variant = "neutral",
  size = "xs",
  className,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
} & CommonProps) {
  const content = (
    <span
      className={cls(
        "btn2 group relative inline-flex items-center justify-center whitespace-nowrap rounded-full",
        "bg-[var(--card,white)] font-medium select-none",
        sizePad(size),
        textColor(variant),
        disabled ? "opacity-50 is-disabled" : "hover:scale-[1.03] active:scale-100",
        className,
      )}
      title={title}
      data-variant={variant}
      data-size={size}
    >
      <span className={cls("relative z-[1]", size === "xs" ? "text-xs" : "text-sm")}>{label}</span>

      {/* styles */}
      <style jsx>{`
        .btn2 {
          transition: transform 0.16s ease, box-shadow 0.22s ease;
          overflow: visible; /* da glow ne bude sečen */
        }
        .btn2:not(.is-disabled) {
          cursor: pointer;
        }
        /* Gradient outline kroz masku */
        .btn2::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 1.5px;
          background: var(--btn2-grad, linear-gradient(90deg, #e5e7eb, #cbd5e1));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
        }
        /* Radijalni glow: ravnomeran u svim smerovima (≈2–3px van ivice) */
        .btn2::after {
          content: "";
          position: absolute;
          inset: -3px;                 /* 2–3px van dugmeta */
          border-radius: 9999px;
          background: var(--btn2-glow, radial-gradient(closest-side, rgba(0,0,0,0.12), transparent 70%));
          filter: blur(6px);           /* mekano, ne “ventilator” */
          opacity: 0;
          transition: opacity 0.22s ease;
          pointer-events: none;
        }
        .btn2:hover::after {
          opacity: 0.22;               /* diskretno */
        }

        /* Varijante: definišemo gradijent i glow boje */
        .btn2[data-variant="brand"] {
          --btn2-grad: linear-gradient(90deg, var(--brand-1, #4f46e5), var(--brand-2, #22d3ee));
          --btn2-glow: radial-gradient(
            closest-side,
            rgba(79, 70, 229, 0.24) 0%,
            rgba(34, 211, 238, 0.18) 45%,
            rgba(0, 0, 0, 0) 70%
          );
        }
        .btn2[data-variant="danger"] {
          --btn2-grad: linear-gradient(90deg, #f97316, #ef4444);
          --btn2-glow: radial-gradient(
            closest-side,
            rgba(249, 115, 22, 0.24) 0%,
            rgba(239, 68, 68, 0.20) 45%,
            rgba(0, 0, 0, 0) 70%
          );
        }
        .btn2[data-variant="neutral"] {
          --btn2-grad: linear-gradient(90deg, #e5e7eb, #cbd5e1);
          --btn2-glow: radial-gradient(
            closest-side,
            rgba(17, 24, 39, 0.12) 0%,
            rgba(17, 24, 39, 0.06) 45%,
            rgba(0, 0, 0, 0) 70%
          );
        }

        /* Diskretan “sweep” preko površine (ostaje ali je blag) */
        .btn2 :global(.sweep) {
          position: absolute;
          inset: -45% auto auto -45%;
          width: 190%;
          height: 190%;
          transform: rotate(-45deg) translateY(-60%);
          opacity: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.12), rgba(255,255,255,0));
          transition: opacity 0.45s ease, transform 0.45s ease;
          pointer-events: none;
          border-radius: 30px;
        }
        .btn2:hover :global(.sweep) {
          transform: rotate(-45deg) translateY(100%);
          opacity: 1;
        }
      `}</style>

      <span className="sweep" aria-hidden />
    </span>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="inline-flex" aria-disabled={disabled}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} aria-disabled={disabled} className="inline-flex">
      {content}
    </button>
  );
}

/** Kvadratno ikonično dugme sa istim principom glow-a (neutral) */
export function IconButton2({
  title,
  ariaLabel,
  onClick,
  disabled,
  children,
  className,
}: {
  title?: string;
  ariaLabel?: string;
  onClick?: () => void;
  children: React.ReactNode;
} & Omit<CommonProps, "variant" | "size">) {
  return (
    <button
      title={title}
      aria-label={ariaLabel || title}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={cls(
        "icon2 group relative inline-flex items-center justify-center rounded-xl bg-[var(--card,white)] w-8 h-8",
        disabled ? "opacity-50 is-disabled" : "hover:scale-[1.03] active:scale-100",
        className,
      )}
      data-variant="neutral"
    >
      <span className="relative z-[1] text-neutral-700">{children}</span>

      <style jsx>{`
        .icon2 {
          transition: transform 0.16s ease;
          overflow: visible;
        }
        .icon2:not(.is-disabled) {
          cursor: pointer;
        }
        .icon2::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 0.75rem;
          padding: 1.5px;
          background: linear-gradient(90deg, #e5e7eb, #cbd5e1);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
        }
        .icon2::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 0.9rem;
          background: radial-gradient(
            closest-side,
            rgba(17, 24, 39, 0.12) 0%,
            rgba(17, 24, 39, 0.06) 45%,
            rgba(0, 0, 0, 0) 70%
          );
          filter: blur(6px);
          opacity: 0;
          transition: opacity 0.22s ease;
          pointer-events: none;
        }
        .icon2:hover::after {
          opacity: 0.20;
        }
        .icon2 :global(.sweep) {
          position: absolute;
          inset: -45% auto auto -45%;
          width: 190%;
          height: 190%;
          transform: rotate(-45deg) translateY(-60%);
          opacity: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.10), rgba(255,255,255,0));
          transition: opacity 0.45s ease, transform 0.45s ease;
          border-radius: 18px;
          pointer-events: none;
        }
        .icon2:hover :global(.sweep) {
          transform: rotate(-45deg) translateY(100%);
          opacity: 1;
        }
      `}</style>

      <span className="sweep" aria-hidden />
    </button>
  );
}