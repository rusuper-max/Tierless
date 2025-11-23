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
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import type { PlanId } from "@/lib/entitlements";
import type { Mode } from "@/hooks/useEditorStore";
import ShareQrModal from "@/components/share/ShareQrModal";
import { Button } from "@/components/ui/Button";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

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
      } catch { }
    } else {
      root.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch { }
    }
  };

  return (
    <div data-tour-id="tour-theme-toggle">
      <Button
        onClick={toggle}
        variant="brand"
        size="xs"
        icon={isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        title={t(
          "Switch the editor theme. This only affects your view, not the public page."
        )}
      >
        {isDark ? t("Dark") : t("Light")}
      </Button>
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

/* ---------------- Main nav ---------------- */

export default function EditorNavBar({
  calcName,
  showBack,
  onBack,
  onSave,
  isSaving,
  isDirty,
  publicHref,
  isPublished = false,
  editorMode,
}: {
  calcName?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  publicHref: string;
  isPublished?: boolean;
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

  const canOpenPublic = !!fullPublicUrl && isPublished;
  const canShare = !!fullPublicUrl && isPublished;

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

            <Button
              icon={<LayoutDashboard className="size-4" />}
              href="/dashboard"
              variant="brand"
              size="xs"
              title={t("Back to dashboard")}
            >
              {t("Dashboard")}
            </Button>
            {showBack && (
              <Button
                onClick={onBack}
                variant="brand"
                size="xs"
                icon={<Undo2 className="size-4" />}
                title={t("Back")}
              >
                {t("Back")}
              </Button>
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
            <Button
              onClick={() => setTourStep(0)}
              variant="brand"
              size="xs"
              title={t("Show quick tour")}
            >
              {t("Guide")}
            </Button>
            <ThemeToggle />
            <div data-tour-id="tour-save">
              <Button
                icon={<SaveIcon className="size-4" />}
                onClick={onSave}
                disabled={!!isSaving}
                variant="brand"
                size="sm"
              >
                {isSaving ? t("Saving…") : isDirty ? t("Save") : t("Saved")}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <div data-tour-id="tour-public">
                <Button
                  icon={<ExternalLink className="size-4" />}
                  href={publicHref}
                  external
                  variant="brand"
                  size="sm"
                  title={
                    canOpenPublic
                      ? t("Open public page in a new tab")
                      : t('Publish this page from the dashboard ("Offline" button) to enable public link')
                  }
                  disabled={!canOpenPublic}
                >
                  {t("Public")}
                </Button>
              </div>
              <div data-tour-id="tour-share">
                <Button
                  icon={<Share2 className="size-4" />}
                  onClick={() => setShareOpen(true)}
                  variant="brand"
                  size="xs"
                  title={
                    canShare
                      ? t("Show link and QR code for this page")
                      : t('Publish this page from the dashboard ("Offline" button) to enable sharing')
                  }
                  disabled={!canShare}
                >
                  {t("Share")}
                </Button>
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
