"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "brand" | "danger" | "neutral" | "success";
type Size = "xs" | "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  icon?: React.ReactNode;
  external?: boolean;
  disabled?: boolean;
  pill?: boolean;
  title?: string;
  className?: string;
}

// --- KONFIGURACIJA ---

const SIZES = {
  xs: "px-3 py-1.5 text-xs",
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-base",
};

export function Button({
  children,
  variant = "brand",
  size = "xs",
  href,
  icon,
  external,
  className,
  disabled,
  pill = true,
  title,
  onClick,
  ...props
}: ButtonProps) {

  // 1. Logika za stilove
  // Razdvajamo logiku: "Brand" i "Neutral" su GRADIENT BORDER.
  // "Success" i "Danger" su SOLID BORDER (providni) jer to izgleda bolje za statuse.

  const isSolidStyle = variant === "success" || variant === "danger";

  /* --- STIL ZA SUCCESS / DANGER (Solid, Transparent BG) --- */
  const solidClasses = cn(
    // Base
    "relative inline-flex items-center justify-center border font-medium transition-all duration-200 active:scale-95",
    // Cursor
    disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:bg-opacity-20",
    // Shape
    pill ? "rounded-full" : "rounded-xl",
    // Size
    SIZES[size],
    // Colors
    variant === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/20",
    variant === "danger" && "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/20",
    className
  );

  /* --- STIL ZA BRAND / NEUTRAL (Gradient Border Trick) --- */
  // Koristimo 2px transparent border i background-clip trik.
  // Trik zahteva da unutrašnja boja (var(--btn-bg)) bude PUNA (ne providna).

  const gradientBorderStyles: React.CSSProperties = {
    border: "2px solid transparent", // Podebljano na 2px da se jasno vidi
    backgroundClip: "padding-box, border-box",
    backgroundOrigin: "padding-box, border-box",
    backgroundImage: variant === "brand"
      // Brand: Crna unutra, Indigo-Cyan okvir
      ? `linear-gradient(to bottom, var(--btn-bg), var(--btn-bg)), linear-gradient(90deg, #4F46E5, #22D3EE)`
      : // Neutral: Crna unutra, Siva okvir
      `linear-gradient(to bottom, var(--btn-bg), var(--btn-bg)), linear-gradient(90deg, #334155, #475569)`
  };

  const gradientClasses = cn(
    "group relative inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-95",
    // Cursor & Hover
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-[1px] hover:shadow-md",
    // Shape
    pill ? "rounded-full" : "rounded-xl",
    // Size
    SIZES[size],
    // Text Color
    variant === "brand" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400",
    className
  );

  // --- RENDER LOGIKA ---

  const content = (
    <>
      {/* Unutrašnja boja za Gradient dugmad (Svetla u Light, Tamna u Dark) */}
      {!isSolidStyle && (
        <style jsx>{`
          .gb-root { --btn-bg: #ffffff; }
          :global(.dark) .gb-root { --btn-bg: #020617; } /* Tvoja glavna pozadina */
          .gb-root:hover { filter: brightness(1.1); }
        `}</style>
      )}

      {icon && <span className={children ? "mr-2 shrink-0 flex items-center" : "flex items-center justify-center"}>{icon}</span>}
      {children}
    </>
  );

  // A. RENDER SUCCESS / DANGER (Solid)
  if (isSolidStyle) {
    if (href && !disabled) {
      return <Link href={href} target={external ? "_blank" : undefined} className={solidClasses} title={title}>{content}</Link>;
    }
    return <button disabled={disabled} onClick={onClick} className={solidClasses} title={title} type="button" {...props}>{content}</button>;
  }

  // B. RENDER BRAND / NEUTRAL (Gradient)
  if (href && !disabled) {
    return (
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={`${gradientClasses} gb-root`}
        style={gradientBorderStyles}
        title={title}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${gradientClasses} gb-root`}
      style={gradientBorderStyles}
      title={title}
      type="button"
      {...props}
    >
      {content}
    </button>
  );
}

export default Button;