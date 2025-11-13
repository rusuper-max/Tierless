// src/app/editor/[id]/components/EditorNavBar.tsx
"use client";

import Link from "next/link";
import { LayoutDashboard, Undo2, ExternalLink, Save as SaveIcon, Sun, Moon } from "lucide-react";
import { t } from "@/i18n";
import { useEffect, useState } from "react";

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
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor" as any,
    maskComposite: "exclude",
    borderRadius: "9999px",
    transition: "opacity .15s ease",
  } as React.CSSProperties;
}

function ActionButton({
  label,
  icon,
  href,
  onClick,
  disabled,
  variant = "neutral",
  size = "sm",
  title,
  target,
}: {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: BtnVariant;
  size?: BtnSize;
  title?: string;
  target?: "_blank" | "_self";
}) {
  const base =
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--card,white)] text-sm font-medium transition will-change-transform select-none";
  const pad = size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";
  const text =
    variant === "danger"
      ? "text-rose-700 dark:text-rose-300"
      : "text-[var(--text,#111827)]";
  const state = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] hover:-translate-y-0.5 active:translate-y-0";
  const inner = "relative z-[1] inline-flex items-center gap-2 whitespace-nowrap " + (size === "xs" ? "text-xs" : "text-sm");

  const content = (
    <span className={`${base} ${pad} ${text} ${state}`} title={title}>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outlineStyle(variant)} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: variant === "danger" ? "0 0 10px 3px rgba(244,63,94,.22)" : "0 0 14px 4px rgba(34,211,238,.22)",
          transition: "opacity .18s ease",
        }}
      />
      <span className={inner}>
        {icon}
        {label}
      </span>
    </span>
  );

  if (href && !disabled) {
    return (
      <Link href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className="inline-flex group">
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex group">
      {content}
    </button>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    // init from DOM/localStorage
    const root = document.documentElement;
    const ls = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const dark = ls ? ls === "dark" : root.classList.contains("dark");
    setIsDark(dark);
  }, []);
  const toggle = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    if (next) {
      root.classList.add("dark");
      try { localStorage.setItem("theme", "dark"); } catch {}
    } else {
      root.classList.remove("dark");
      try { localStorage.setItem("theme", "light"); } catch {}
    }
  };
  return (
    <ActionButton
      label={isDark ? t("Dark") : t("Light")}
      icon={isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      onClick={toggle}
      variant="brand"
      size="xs"
      title={t("Toggle theme")}
    />
  );
}

export default function EditorNavBar({
  calcName,
  showBack,
  onBack,
  onSave,
  isSaving,
  isDirty,
  publicHref,
}: {
  calcName?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  publicHref: string;
}) {
  return (
    <nav className="sticky top-0 z-[60] bg-[var(--bg)] border-b border-[var(--border)] tl-navbar">
      <div className="px-4 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ActionButton
            label={t("Dashboard")}
            icon={<LayoutDashboard className="size-4" />}
            href="/dashboard"
            variant="brand"
            size="xs"
            title={t("Back to dashboard")}
          />
          {showBack && (
            <button className="inline-flex group cursor-pointer" onClick={onBack} title={t("Back")}>
              <span className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 text-[var(--text)]">
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outlineStyle("brand")} />
                <Undo2 className="size-4" />
                {t("Back")}
              </span>
            </button>
          )}
          <span className="text-sm text-[var(--muted)]">/</span>
          <span className="text-sm text-[var(--text)]">{calcName || t("Untitled")}</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ActionButton
            label={isSaving ? t("Saving…") : isDirty ? t("Save") : t("Saved")}
            icon={<SaveIcon className="size-4" />}
            onClick={onSave}
            disabled={!!isSaving}
            variant="brand"
            size="sm"
          />
          {/* Public link — otvara NOVI TAB bez popup blokade */}
          <ActionButton
            label={t("Public")}
            icon={<ExternalLink className="size-4" />}
            href={publicHref}
            target="_blank"
            variant="brand"
            size="sm"
            title={t("Open public page in a new tab")}
          />
        </div>
      </div>
      {/* brand linija ispod dugmadi */}
      <div className="h-[3px] bg-[linear-gradient(90deg,var(--brand-1),var(--brand-2))] shadow-[0_6px_18px_rgba(34,211,238,.18)]" aria-hidden />
    </nav>
  );
}