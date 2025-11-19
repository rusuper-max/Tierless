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
  Share2,
} from "lucide-react";
import { t } from "@/i18n";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAccount } from "@/hooks/useAccount";
import type { PlanId } from "@/lib/entitlements";
import type { Mode } from "@/hooks/useEditorStore";

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
        title={t(
          "Switch the editor theme. This only affects your view, not the public page."
        )}
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
        <span className="mr-1 text-[11px] text-[var(--muted)]">
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
  editorMode,
}: {
  stepIndex: number;
  onStepChange: (next: number | null) => void;
  editorMode: Mode;
}) {
  const steps: TourStepDef[] = useMemo(() => {
    const base: TourStepDef[] = [
      {
        id: "plan",
        targetId: "tour-plan",
        title: t("Your plan"),
        body: t("Here you can see which Tierless plan you are on right now."),
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
        id: "share",
        targetId: "tour-share",
        title: t("Share & QR"),
        body: t(
          "Need a quick link or QR code for tables, flyers or stickers? Use Share to copy the link, download the QR image or print it right away."
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
    ];

    if (editorMode === "setup") {
      return base;
    }

    const modeSteps: TourStepDef[] = [];

    if (editorMode === "simple") {
      modeSteps.push(
        {
          id: "title",
          targetId: "tour-title",
          title: t("Page name"),
          body: t(
            "Start by giving your menu or price page a clear name. This title will be visible to visitors."
          ),
        },
        {
          id: "items",
          targetId: "tour-items",
          title: t("Items and prices"),
          body: t(
            "Here you manage your list of items: labels, descriptions and prices. Perfect for restaurants, clinics and salons."
          ),
        },
        {
          id: "quick-preview",
          targetId: "tour-quick-preview",
          title: t("Quick preview"),
          body: t(
            "Use Quick preview to see how your simple price page looks on desktop and mobile without leaving the editor."
          ),
        }
      );
    } else if (editorMode === "tiers") {
      // rezervisano za kasnije kad dodamo tour hookove u BlocksPanel
    } else if (editorMode === "advanced") {
      modeSteps.push(
        {
          id: "title",
          targetId: "tour-title",
          title: t("Page name"),
          body: t(
            "Name your advanced calculator or page so visitors immediately understand what they are configuring."
          ),
        },
        {
          id: "items",
          targetId: "tour-items",
          title: t("Packages, extras and sliders"),
          body: t(
            "In the advanced editor you combine tiers, add-ons and sliders into powerful, flexible pricing logic."
          ),
        },
        {
          id: "quick-preview",
          targetId: "tour-quick-preview",
          title: t("Quick preview"),
          body: t(
            "Use Quick preview to test how your advanced setup feels to a visitor before you share the link."
          ),
        }
      );
    }

    return [...base, ...modeSteps];
  }, [editorMode]);

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

    rafRef.current = window.requestAnimationFrame(update);

    const onResize = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
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
        <div
          aria-hidden
          className="pointer-events-none fixed z-[81]"
          style={{
            left: rect.left - 10,
            top: rect.top - 10,
            width: rect.width + 20,
            height: rect.height + 20,
            borderRadius: 18,
            boxShadow:
              "0 0 0 6000px rgba(6,13,28,0.82), 0 0 0 2px rgba(148,163,184,.85), 0 0 26px 10px rgba(34,211,238,.35)",
          }}
        />
      )}

      <div className="relative z-[82] w-full max-w-md rounded-2xl border border-white/12 bg-[rgba(10,18,32,0.96)] p-4 sm:p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
          <span className="text-[11px] uppercase tracking-wide">
            {t("Quick tour")}
          </span>
          <span>
            {t("Step")} {stepIndex + 1} {t("of")} {total}
          </span>
        </div>
        <h2 className="mb-1.5 text-base sm:text-lg font-semibold text-slate-50">
          {step.title}
        </h2>
        <p className="mb-4 text-sm text-slate-300">{step.body}</p>
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
              className="rounded-full border border-slate-500/60 px-3 py-1.5 text-xs sm:text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Back")}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-[var(--brand-1,#4F46E5)] px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-900 hover:bg-[var(--brand-2,#22D3EE)] transition-colors"
            >
              {isLast ? t("Done") : t("Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Share / QR modal ---------------- */

function ShareQrModal({
  open,
  onClose,
  url,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  const qrUrl = useMemo(() => {
    if (!url) return "";
    const encoded = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encoded}`;
  }, [url]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "tierless-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!qrUrl) return;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR code</title>
  <style>
    body { margin: 0; padding: 24px; display:flex; align-items:center; justify-content:center; }
    img { max-width:100%; height:auto; }
  </style>
</head>
<body>
  <img src="${qrUrl}" alt="QR code" />
</body>
</html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[71] w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm sm:text-base font-semibold text-[var(--text)]">
            {t("Share this page")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] cursor-pointer"
          >
            {t("Close")}
          </button>
        </div>

        <div className="space-y-3">
          {/* Link + copy */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {t("Public link")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-[13px] text-[var(--text)]"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
              >
                {copied ? t("Copied") : t("Copy")}
              </button>
            </div>
          </div>

          {/* QR */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {t("QR code")}
            </label>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={t("QR code for this page")}
                  className="h-40 w-40 sm:h-44 sm:w-44 rounded-lg bg-white"
                />
              ) : (
                <div className="text-xs text-[var(--muted)]">
                  {t("Unable to generate QR code.")}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
                >
                  {t("Download QR")}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
                >
                  {t("Print")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-[var(--muted)]">
          {t(
            "You can put this QR code on tables, windows or cards. When customers scan it, they will open this public page."
          )}
        </p>
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
  editorMode,
}: {
  calcName?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  publicHref: string;
  editorMode: Mode;
}) {
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const fullPublicUrl = useMemo(() => {
    if (!publicHref) return "";
    if (publicHref.startsWith("http://") || publicHref.startsWith("https://")) {
      return publicHref;
    }
    if (typeof window === "undefined") return publicHref;
    const origin = window.location.origin || "";
    return `${origin}${publicHref}`;
  }, [publicHref]);

  return (
    <>
      <nav className="tl-navbar sticky top-0 z-[60] border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="https://tierless.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center bg-clip-text text-sm font-semibold text-transparent sm:inline-flex"
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
                className="group inline-flex cursor-pointer"
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
            <span className="hidden xs:inline text-sm text-[var(--muted)]">
              /
            </span>
            <span
              className="max-w-[16ch] truncate text-sm text-[var(--text)]"
              data-tour-id="tour-scroll-editor"
            >
              {calcName || t("Untitled")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PlanBadge />
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
            <div className="flex items-center gap-1">
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
              <div data-tour-id="tour-share">
                <ActionButton
                  label={t("Share")}
                  icon={<Share2 className="size-4" />}
                  onClick={() => setShareOpen(true)}
                  variant="brand"
                  size="xs"
                  title={t("Show link and QR code for this page")}
                  disabled={!fullPublicUrl}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="h-[3px] bg-[linear-gradient(90deg,var(--brand-1),var(--brand-2))] shadow-[0_6px_18px_rgba(34,211,238,.18)]"
          aria-hidden
        />
      </nav>

      {tourStep !== null && (
        <EditorTourOverlay
          stepIndex={tourStep}
          onStepChange={setTourStep}
          editorMode={editorMode}
        />
      )}

      <ShareQrModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={fullPublicUrl}
      />
    </>
  );
}
