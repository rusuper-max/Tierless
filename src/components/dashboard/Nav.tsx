// src/components/dashboard/Nav.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* ActionButton (consistent with Dashboard buttons)                    */
/* ------------------------------------------------------------------ */
type BtnVariant = "brand" | "neutral" | "danger";
type BtnSize = "xs" | "sm";

function outlineStyle(variant: BtnVariant) {
  const grad =
    variant === "brand"
      ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
      : variant === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)";
  return {
    padding: 1.5,
    background: grad,
    WebkitMask:
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor" as any,
    maskComposite: "exclude",
    borderRadius: "9999px",
    transition: "opacity .15s ease",
  } as React.CSSProperties;
}

function ActionButton({
  label,
  title,
  href,
  onClick,
  disabled,
  variant = "brand",
  size = "xs",
  external = false,
}: {
  label: string;
  title?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: BtnVariant;
  size?: BtnSize;
  external?: boolean;
}) {
  const base =
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--card,white)] text-sm font-medium transition will-change-transform select-none";
  const pad = size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";

  // Inherit text color from parent; danger je jedini koji forsira crveno
  const text =
    variant === "danger"
      ? "text-rose-700 dark:text-rose-300"
      : "text-current";

  const state = disabled
    ? "opacity-50 cursor-not-allowed"
    : "hover:shadow-[0_10px_24px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";

  const inner =
    "relative z-[1] inline-flex items-center gap-1 " +
    (size === "xs" ? "text-xs" : "text-sm");

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
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-full"
      style={outlineStyle(variant)}
    />
  );

  const content = (
    <span className={`${base} ${pad} ${text} ${state}`} title={title}>
      {Outline}
      {Glow}
      <span className={inner}>{label}</span>
    </span>
  );

  if (href && !disabled) {
    return external ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-disabled={disabled}
        className={`inline-flex group ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        {content}
      </a>
    ) : (
      <Link
        href={href}
        aria-disabled={disabled}
        className={`inline-flex group ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
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
      className={`inline-flex group ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

// ⬇️ lako menjaš destinaciju: "/signin" ili "/" (marketing)
const LOGOUT_REDIRECT = "/signin";

export default function Nav() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    try {
      setLoggingOut(true);
      // očisti sesiju na serveru
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
    } finally {
      // hard redirect da 100% pokupimo novi cookie state
      window.location.assign(LOGOUT_REDIRECT);
      // ili, ako više voliš SPA: router.replace(LOGOUT_REDIRECT);
    }
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 overflow-visible tl-nav text-[var(--text)]"
      aria-label="Top navigation"
    >
      <div className="mx-auto max-w-[1536px] px-5 sm:px-7 lg:px-10 min-h-[50px] py-1 flex items-center justify-between">
        {/* Logo → marketing site */}
        <div className="flex items-center gap-2 select-none">
          <Link
            href="/"
            aria-label="Go to marketing site"
            className="cursor-pointer"
          >
            <span
              className="text-lg font-bold tracking-[-0.01em] leading-none"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tierless
            </span>
          </Link>
        </div>

        {/* Right actions */}
        <nav className="flex items-center gap-4 sm:gap-5 md:gap-6 text-[color:var(--text)]">
          <ActionButton
            label="View Site"
            title="Open tierless website"
            href="/"
            external
            variant="brand"
            size="xs"
          />
          <ActionButton
            label="FAQ"
            title="Open docs / FAQ"
            href="/help"
            variant="brand"
            size="xs"
          />
          <ActionButton
            label="View Plans"
            title="Manage your plan"
            href="/start"
            variant="brand"
            size="xs"
          />
          <ActionButton
            label={loggingOut ? "Signing out…" : "Logout"}
            title="Sign out"
            onClick={onLogout}
            disabled={loggingOut}
            variant="danger"
            size="xs"
          />
        </nav>
      </div>

      {/* Brand hairline */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-[var(--brand-1,#4F46E5)] to-[var(--brand-2,#22D3EE)]"
      />
    </header>
  );
}