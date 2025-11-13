"use client";

import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Shared outline + glow (identično dashboardu)                       */
/* ------------------------------------------------------------------ */

export type BtnVariant = "brand" | "neutral" | "danger";
export type BtnSize = "xs" | "sm" | "md";

export function outlineStyle(variant: BtnVariant) {
  const grad =
    variant === "brand"
      ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
      : variant === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)";
  return {
    padding: 1.5,
    background: grad,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor" as any,
    maskComposite: "exclude",
    borderRadius: "9999px",
    transition: "opacity .15s ease",
  } as React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/* ActionButton (textual pill)                                        */
/* ------------------------------------------------------------------ */

export function BrandActionButton({
  label,
  title,
  href,
  onClick,
  disabled,
  variant = "brand",
  size = "sm",
  className,
}: {
  label: string | React.ReactNode;
  title?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
}) {
  const base =
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--card,white)] text-sm font-medium transition will-change-transform select-none";
  const pad = size === "xs" ? "px-3 py-1.5" : size === "sm" ? "px-3.5 py-2" : "px-4 py-2.5";
  const text =
    variant === "danger" ? "text-rose-700 dark:text-rose-300" : "text-[var(--text,#111827)]";
  const state = disabled
    ? "opacity-50 cursor-not-allowed"
    : "hover:shadow-[0_10px_24px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";
  const inner = "relative z-[1] inline-flex items-center gap-1 " + (size === "xs" ? "text-xs" : "text-sm");

  const Glow = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
      style={{
        boxShadow:
          variant === "danger"
            ? "0 0 10px 3px rgba(244,63,94,.22)"
            : "0 0 12px 3px rgba(34,211,238,.20)",
        transition: "opacity .2s ease",
      }}
    />
  );
  const Outline = (
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outlineStyle(variant)} />
  );

  const content = (
    <span className={`${base} ${pad} ${text} ${state} ${className ?? ""}`} title={title}>
      {Outline}
      {Glow}
      <span className={inner}>{label}</span>
    </span>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        aria-disabled={disabled}
        className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* IconButton (okruglo 32x32/40x40 sa outline-om)                     */
/* ------------------------------------------------------------------ */

export function BrandIconButton({
  title,
  ariaLabel,
  onClick,
  disabled,
  size = "sm",
  children,
}: {
  title?: string;
  ariaLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: Exclude<BtnSize, "md">;
  children: React.ReactNode;
}) {
  const wh = size === "xs" ? "w-8 h-8" : "w-9 h-9";
  const base =
    `relative inline-flex items-center justify-center rounded-xl bg-[var(--card,white)] ${wh} text-[var(--text,#111827)] transition`;
  const pointer = disabled
    ? "cursor-not-allowed opacity-50"
    : "cursor-pointer hover:shadow-[0_8px_18px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`${base} ${pointer}`}
      aria-disabled={disabled}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl" style={outlineStyle("neutral")} />
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}