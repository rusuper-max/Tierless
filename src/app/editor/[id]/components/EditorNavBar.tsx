// src/app/editor/[id]/components/EditorNavBar.tsx
"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Undo2,
  ExternalLink,
  Save as SaveIcon,
  Sun,
  Moon,
} from "lucide-react";
import { t } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import type { PlanId } from "@/lib/entitlements";
import type { CSSProperties } from "react";

type BtnVariant = "brand" | "neutral" | "danger";
type BtnSize = "xs" | "sm";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

function outlineStyle(variant: BtnVariant) {
  const grad =
    variant === "brand"
      ? BRAND_GRADIENT
      : variant === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)";
  return {
    padding: 1.5,
    background: grad,
    WebkitMask:
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor" as any,
    maskComposite: "exclude" as any,
    borderRadius: "9999px",
    transition: "opacity .15s ease",
  } as CSSProperties;
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
  const inner =
    "relative z-[1] inline-flex items-center gap-2 whitespace-nowrap " +
    (size === "xs" ? "text-xs" : "text-sm");

  const content = (
    <span className={`${base} ${pad} ${text} ${state}`} title={title}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={outlineStyle(variant)}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
        style={{
          boxShadow:
            variant === "danger"
              ? "0 0 10px 3px rgba(244,63,94,.22)"
              : "0 0 14px 4px rgba(34,211,238,.22)",
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
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className="inline-flex group"
      >
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
    const ls =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const dark = ls ? ls === "dark" : root.classList.contains("dark");
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    if (next) {
      root.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    } else {
      root.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    }
  };

  return (
    <div data-tour-id="tour-theme-toggle">
      <ActionButton
        label={isDark ? t("Dark") : t("Light")}
        icon={isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        onClick={toggle}
        variant="brand"
        size="xs"
        title={t("Switch the editor theme. This only affects your view, not the public page.")}
      />
    </div>
  );
}

/* ---------------- Plan badge ---------------- */

const PLAN_COLORS: Record<
  PlanId,
  { label: string; border: string; dot: string; gradient?: boolean }
> = {
  free: {
    label: "FREE",
    border: "#6b7280",
    dot: "#6b7280",
  },
  starter: {
    label: "STARTER",
    border: "#14b8a6",
    dot: "#14b8a6",
  },
  growth: {
    label: "GROWTH",
    border: "#3b82f6",
    dot: "#3b82f6",
  },
  pro: {
    label: "PRO",
    border: "#ef4444",
    dot: "#ef4444",
  },
  tierless: {
    label: "TIERLESS",
    border: "",
    dot: "#22d3ee",
    gradient: true,
  },
};

function PlanBadge() {
  const { plan } = useAccount(); // free | starter | growth | pro | tierless
  const key: PlanId = (plan as PlanId) || "free";
  const cfg = PLAN_COLORS[key];

  if (!cfg) return null;

  if (cfg.gradient) {
    // Tierless – gradient outline + gradient text
    return (
      <div className="hidden sm:inline-flex" data-tour-id="tour-plan">
        <div className="relative inline-flex items-center rounded-full bg-[var(--card)] px-3.5 py-1.5 text-xs font-medium">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              padding: 1.5,
              background: BRAND_GRADIENT,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor" as any,
              maskComposite: "exclude" as any,
            }}
          />
          <span className="relative z-[1] inline-flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: cfg.dot }}
            />
            <span className="text-[var(--muted)]">{t("Plan")}:</span>
            <span
              className="font-semibold uppercase bg-clip-text text-transparent"
              style={{ backgroundImage: BRAND_GRADIENT }}
            >
              {t(cfg.label)}
            </span>
          </span>
        </div>
      </div>
    );
  }

  // ostali planovi – običan outline u boji plana
  return (
    <div className="hidden sm:inline-flex" data-tour-id="tour-plan">
      <div
        className="inline-flex items-center rounded-full border bg-[var(--card)] px-3.5 py-1.5 text-xs font-medium"
        style={{ borderColor: cfg.border, color: cfg.border }}
      >
        <span
          className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: cfg.dot }}
        />
        <span className="mr-1 text-[var(--muted)] text-[11px]">
          {t("Plan")}:
        </span>
        <span className="font-semibold uppercase tracking-wide">
          {t(cfg.label)}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Tour overlay ---------------- */

type TourStepDef = {
  id: string;
  targetId?: string;
  title: string;
  body: string;
};

function EditorTourOverlay({
  stepIndex,
  onStepChange,
}: {
  stepIndex: number;
  onStepChange: (next: number | null) => void;
}) {
  const steps: TourStepDef[] = useMemo(
    () => [
      {
        id: "plan",
        targetId: "tour-plan",
        title: t("Your plan"),
        body: t(
          "Here you can see which Tierless plan you are on right now."
        ),
      },
      {
        id: "theme",
        targetId: "tour-theme-toggle",
        title: t("Light and dark themes"),
        body: t(
          "Switch the editor between light and dark for your own preference. This does not change the public page."
        ),
      },
      {
        id: "save",
        targetId: "tour-save",
        title: t("Save your changes"),
        body: t(
          "Hit Save to make sure your latest edits are stored. We recommend saving often while you experiment."
        ),
      },
      {
        id: "public",
        targetId: "tour-public",
        title: t("Public page"),
        body: t(
          "Open the public version in a new tab. Below the navbar you will also find a Quick preview that shows almost the same view without leaving this page."
        ),
      },
      {
        id: "scroll-editor",
        targetId: "tour-scroll-editor",
        title: t("Editor lives below"),
        body: t(
          "Scroll down from this header to reach the main editor area where you actually build your price page."
        ),
      },
      {
        id: "title",
        targetId: "tour-title",
        title: t("Page name"),
        body: t(
          "Start by giving your calculator or price page a clear name. This title will be visible to visitors."
        ),
      },
      {
        id: "items",
        targetId: "tour-items",
        title: t("Packages and items"),
        body: t(
          "Here you edit packages or line items: labels, descriptions and prices. This is the core of what your visitors will be choosing from."
        ),
      },
      {
        id: "quick-preview",
        targetId: "tour-quick-preview",
        title: t("Quick preview"),
        body: t(
          "Use Quick preview to see how your changes look without leaving the editor. It mirrors the public page so you can iterate fast."
        ),
      },
    ],
    []
  );

  const step = steps[stepIndex];
  const total = steps.length;

  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (!step?.targetId) {
        setRect(null);
        return;
      }
      const el = document.querySelector<HTMLElement>(
        `[data-tour-id="${step.targetId}"]`
      );
      if (!el) {
        setRect(null);
        return;
      }

      // za editor stepove lagano ga centriramo u viewportu
      if (
        step.targetId === "tour-title" ||
        step.targetId === "tour-items" ||
        step.targetId === "tour-quick-preview"
      ) {
        try {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          // ignore
        }
      }

      const r = el.getBoundingClientRect();
      setRect(r);
    };

    // malo odložimo da se layout smiri
    rafRef.current = window.requestAnimationFrame(update);

    const onResize = () => {
      window.cancelAnimationFrame(rafRef.current ?? 0);
      rafRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [step]);

  if (!step) {
    onStepChange(null);
    return null;
  }

  const isLast = stepIndex === total - 1;

  const handleSkip = () => onStepChange(null);
  const handleNext = () => {
    if (isLast) onStepChange(null);
    else onStepChange(stepIndex + 1);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center px-4 pb-6 sm:pb-8">
      {!rect && (
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" />
      )}

      {rect && (
        (() => {
          const wide = rect.width > 360 || rect.height > 120;
          const padX = wide ? 16 : 6;
          const padY = wide ? 18 : 6;
          const radius = wide ? 24 : rect.height + padY * 2;
          return (
            <div
              aria-hidden
              className="pointer-events-none fixed z-[81]"
              style={{
                left: rect.left - padX,
                top: rect.top - padY,
                width: rect.width + padX * 2,
                height: rect.height + padY * 2,
                borderRadius: radius,
                boxShadow:
                  "0 0 0 2000px rgba(6,13,28,0.82), 0 0 0 2px rgba(148,163,184,.85), 0 0 26px 10px rgba(34,211,238,.38)",
                background: "rgba(255,255,255,0.12)",
              }}
            />
          );
        })()
      )}

      {/* Kartica sa tekstom – dole, centrirana, ne prekriva nav */}
      <div className="relative z-[82] w-full max-w-md rounded-2xl border border-white/12 bg-[rgba(10,18,32,0.96)] p-4 sm:p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
          <span className="uppercase tracking-wide text-[11px]">
            {t("Quick tour")}
          </span>
          <span>
            {t("Step")} {stepIndex + 1} {t("of")} {total}
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-50 mb-1.5">
          {step.title}
        </h2>
        <p className="text-sm text-slate-300 mb-4">{step.body}</p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs sm:text-sm text-slate-300 hover:text-slate-100 underline-offset-4 hover:underline"
          >
            {t("Skip")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onStepChange(stepIndex > 0 ? stepIndex - 1 : stepIndex)
              }
              disabled={stepIndex === 0}
              className={`rounded-full px-3 py-1.5 text-xs sm:text-sm border border-slate-500/60 text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {t("Back")}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-900 bg-[var(--brand-1,#4F46E5)] hover:bg-[var(--brand-2,#22D3EE)] transition-colors"
            >
              {isLast ? t("Done") : t("Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main nav ---------------- */

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
  const [tourStep, setTourStep] = useState<number | null>(null);

  return (
    <>
      <nav className="sticky top-0 z-[60] bg-[var(--bg)] border-b border-[var(--border)] tl-navbar">
        <div className="px-4 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Tierless logo link – marketing / main site */}
            <Link
              href="https://tierless.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center font-semibold text-sm bg-clip-text text-transparent"
              style={{ backgroundImage: BRAND_GRADIENT }}
            >
              Tierless
            </Link>

            <ActionButton
              label={t("Dashboard")}
              icon={<LayoutDashboard className="size-4" />}
              href="/dashboard"
              variant="brand"
              size="xs"
              title={t("Back to dashboard")}
            />
            {showBack && (
              <button
                className="inline-flex group cursor-pointer"
                onClick={onBack}
                title={t("Back")}
              >
                <span className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 text-[var(--text)]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={outlineStyle("brand")}
                  />
                  <Undo2 className="size-4" />
                  {t("Back")}
                </span>
              </button>
            )}
            <span className="text-sm text-[var(--muted)]">/</span>
            <span
              className="text-sm text-[var(--text)]"
              data-tour-id="tour-scroll-editor"
            >
              {calcName || t("Untitled")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PlanBadge />
            {/* Guide dugme */}
            <ActionButton
              label={t("Guide")}
              onClick={() => setTourStep(0)}
              variant="brand"
              size="xs"
              title={t("Show quick tour")}
            />
            <ThemeToggle />
            <div data-tour-id="tour-save">
              <ActionButton
                label={
                  isSaving ? t("Saving…") : isDirty ? t("Save") : t("Saved")
                }
                icon={<SaveIcon className="size-4" />}
                onClick={onSave}
                disabled={!!isSaving}
                variant="brand"
                size="sm"
              />
            </div>
            {/* Public link — otvara novi tab */}
            <div data-tour-id="tour-public">
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
        </div>
        {/* brand linija ispod dugmadi */}
        <div
          className="h-[3px] bg-[linear-gradient(90deg,var(--brand-1),var(--brand-2))] shadow-[0_6px_18px_rgba(34,211,238,.18)]"
          aria-hidden
        />
      </nav>

      {tourStep !== null && (
        <EditorTourOverlay stepIndex={tourStep} onStepChange={setTourStep} />
      )}
    </>
  );
}
