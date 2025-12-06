// src/app/editor/[id]/components/EditorNavBar.tsx
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Save as SaveIcon,
  Check,
  Globe,
  Share2,
  MoreVertical,
  Copy,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Zap,
  Eye,
  HelpCircle,
  Sparkles,
  Undo2,
  Redo2,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { t } from "@/i18n";
import { useAccount } from "@/hooks/useAccount";
import ThemeToggle from "@/components/nav/ThemeToggle";
import { Button } from "@/components/ui/Button";
import ShareQrModal from "@/components/share/ShareQrModal";
import type { Mode } from "@/hooks/useEditorStore";
import type { PlanId } from "@/lib/entitlements";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

// ============================================================================
// PLAN BADGE (matching Sidebar style)
// ============================================================================
function PlanBadge({ plan }: { plan: PlanId }) {
  const key = (plan || "free").toLowerCase();

  // Pro plan: Gradient style
  if (key === "tierless" || key === "dev" || key === "founder") {
    return (
      <div className="hidden xl:inline-flex group relative items-center justify-center p-[1px] rounded-full overflow-hidden">
        {/* Spinning gradient border */}
        <span
          className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            background: "conic-gradient(from 90deg at 50% 50%, #020617 0%, #4F46E5 50%, #22D3EE 100%)"
          }}
          aria-hidden
        />

        {/* Inner content */}
        <span className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] bg-[var(--card)]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: BRAND_GRADIENT }} aria-hidden />
          <b
            className="uppercase font-medium tracking-wider"
            style={{
              backgroundImage: BRAND_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            Dev
          </b>
        </span>
      </div>
    );
  }

  // Pro plan: Gradient style
  if (key === "pro") {
    return (
      <div className="hidden xl:inline-flex relative items-center gap-2 rounded-full px-2.5 py-1 text-[11px] bg-[var(--card)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            padding: 1.5,
            background: BRAND_GRADIENT,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any,
            maskComposite: "exclude",
          }}
        />
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: BRAND_GRADIENT }}
          aria-hidden
        />
        <b
          className="uppercase font-medium tracking-wider"
          style={{
            backgroundImage: BRAND_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          Pro
        </b>
      </div>
    );
  }

  // Regular plans
  const configs: Record<string, { label: string; classes: string; dot: string }> = {
    growth: {
      label: "Growth",
      classes: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 ring-rose-500/30",
      dot: "bg-rose-500",
    },
    starter: {
      label: "Starter",
      classes: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
      dot: "bg-emerald-500",
    },
    free: {
      label: "Free",
      classes: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-500/20",
      dot: "bg-slate-400",
    },
  };

  const config = configs[key] || configs.free;

  return (
    <div className={`hidden xl:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${config.classes}`}>
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================
function StatusIndicator({ isDirty, isSaving }: { isDirty?: boolean; isSaving?: boolean }) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>{t("Saving...")}</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 text-xs font-medium">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>{t("Unsaved changes")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 text-xs font-medium">
      <CheckCircle2 className="w-3 h-3" />
      <span>{t("All changes saved")}</span>
    </div>
  );
}

// ============================================================================
// CLICK AWAY HOOK
// ============================================================================
function useClickAway<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);
  return ref;
}

// ============================================================================
// MAIN NAVBAR
// ============================================================================
export default function EditorNavBar({
  calcName = "",
  showBack,
  onBack,
  onSave,
  isSaving = false,
  isDirty = false,
  publicHref,
  isPublished = false,
  isPublishing = false,
  editorMode,
  onGuideClick,
  onTogglePublish,
  onPreview,
  onStartWalkthrough,
  hasDismissedIntro = false,
  // Undo/Redo props
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: {
  calcName?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  publicHref: string;
  isPublished?: boolean;
  isPublishing?: boolean;
  editorMode: Mode;
  onGuideClick?: () => void;
  onTogglePublish?: () => void;
  onPreview?: () => void;
  onStartWalkthrough?: () => void;
  hasDismissedIntro?: boolean;
  // Undo/Redo props
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasClickedGuide, setHasClickedGuide] = useState(true); // default true to avoid flash
  const [guideMenuOpen, setGuideMenuOpen] = useState(false);
  const { plan } = useAccount();
  const guideMenuRef = useClickAway<HTMLDivElement>(guideMenuOpen, () => setGuideMenuOpen(false));

  // Check if user has clicked Guide before
  useEffect(() => {
    try {
      const clicked = localStorage.getItem('guide_clicked');
      setHasClickedGuide(clicked === 'true');
    } catch {
      setHasClickedGuide(true);
    }
  }, []);

  useEffect(() => {
    if (!guideMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGuideMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideMenuOpen]);

  useEffect(() => {
    if (!hasDismissedIntro) {
      setGuideMenuOpen(false);
    }
  }, [hasDismissedIntro]);

  const canShowGuideMenu = hasDismissedIntro && Boolean(onStartWalkthrough);

  const markGuideClicked = () => {
    if (!hasClickedGuide) {
      localStorage.setItem('guide_clicked', 'true');
      setHasClickedGuide(true);
    }
  };

  const handleGuideButtonPress = () => {
    markGuideClicked();
    if (canShowGuideMenu) {
      setGuideMenuOpen((prev) => !prev);
      return;
    }
    onGuideClick?.();
  };

  const handleGuideMode = () => {
    markGuideClicked();
    setGuideMenuOpen(false);
    onGuideClick?.();
  };

  const handleWalkthroughStart = () => {
    setGuideMenuOpen(false);
    onStartWalkthrough?.();
  };

  const fullPublicUrl = useMemo(() => {
    if (!publicHref) return "";
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}${publicHref}`;
  }, [publicHref]);

  const canPublic = !!fullPublicUrl && isPublished;

  return (
    <>
      <nav className="sticky top-0 z-[60] h-14 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-3 sm:px-4 lg:px-8">

          {/* LEFT: Navigation & Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-none">
            {showBack && (
              <Button
                onClick={onBack}
                variant="neutral"
                size="icon"
                icon={<ArrowLeft className="size-4" />}
                title={t("Back")}
              />
            )}

            <nav className="flex items-center text-sm text-[var(--muted)] overflow-hidden whitespace-nowrap">
              <Link
                href="/"
                className="hidden sm:inline font-semibold bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                style={{ backgroundImage: BRAND_GRADIENT }}
                title="Tierless"
              >
                Tierless
              </Link>
              <ChevronRight className="hidden sm:inline w-4 h-4 mx-1 opacity-40" />
              <Link
                href="/dashboard"
                className="hidden sm:inline hover:text-[var(--brand-2,#22D3EE)] transition-colors"
              >
                {t("Dashboard")}
              </Link>
              <ChevronRight className="hidden sm:inline w-4 h-4 mx-1 opacity-40" />

              {editorMode !== "setup" && (
                <>
                  <button
                    onClick={onBack}
                    className="hidden sm:inline hover:text-[var(--text)] transition-colors"
                    title={t("Change editor mode")}
                  >
                    {editorMode === "simple" ? t("Tierless Editor") : t("Tier Based Editor")}
                  </button>
                  <ChevronRight className="hidden sm:inline w-4 h-4 mx-1 opacity-40" />
                </>
              )}

              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="font-medium text-[var(--text)] truncate max-w-[120px] sm:max-w-[200px]"
                  title={calcName}
                >
                  {calcName || t("Untitled")}
                </span>
                {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 lg:hidden" />}
              </div>
            </nav>
          </div>

          {/* CENTER: Status (Desktop only) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <StatusIndicator isDirty={isDirty} isSaving={isSaving} />
          </div>

          {/* RIGHT: Actions (compact brand style) */}
          <div className="flex items-center gap-2 justify-end flex-1 lg:flex-none">

            {/* Desktop Tools: Plan + Theme + Guide */}
            <div className="hidden md:flex items-center gap-2 border-r border-[var(--border)] pr-3 mr-1">
              <PlanBadge plan={(plan as PlanId) || "free"} />

              {/* Theme Toggle (scaled down) */}
              <div className="scale-90" data-tour="theme-toggle" data-help="Switch between light and dark mode to preview how your calculator looks in different themes.">
                <ThemeToggle />
              </div>

              {/* Guide Button (compact with pulsing animation) */}
              <div className="relative" ref={guideMenuRef}>
                <button
                  onClick={handleGuideButtonPress}
                  data-tour="guide-button"
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer relative
                    ${!hasClickedGuide
                      ? 'text-white bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] shadow-lg animate-pulse-glow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 dark:hover:bg-white/5'
                    }
                  `}
                  title={t("Quick tour")}
                  data-help="Activate Help Mode to learn what each element does. Click on any button or field to see an explanation."
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t("Guide")}</span>
                  {canShowGuideMenu && <ChevronDown className="w-3 h-3 opacity-70" />}
                </button>

                {canShowGuideMenu && guideMenuOpen && (
                  <div className="absolute right-0 top-full z-[80] mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl py-1 overflow-hidden">
                    <button
                      onClick={handleGuideMode}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {t("Guide mode")}
                    </button>
                    <button
                      onClick={handleWalkthroughStart}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t("Start walkthrough")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Undo/Redo Buttons */}
            {(onUndo || onRedo) && (
              <div className="hidden sm:flex items-center gap-0.5 border-r border-[var(--border)] pr-2 mr-1">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`
                    flex items-center justify-center w-7 h-7 rounded-md transition-all
                    ${canUndo
                      ? "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer"
                      : "text-[var(--muted)]/30 cursor-not-allowed"
                    }
                  `}
                  title={`${t("Undo")} (Ctrl+Z)`}
                  data-help="Undo the last change. Keyboard shortcut: Ctrl+Z (Cmd+Z on Mac)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`
                    flex items-center justify-center w-7 h-7 rounded-md transition-all
                    ${canRedo
                      ? "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer"
                      : "text-[var(--muted)]/30 cursor-not-allowed"
                    }
                  `}
                  title={`${t("Redo")} (Ctrl+Shift+Z)`}
                  data-help="Redo a previously undone change. Keyboard shortcut: Ctrl+Shift+Z (Cmd+Shift+Z on Mac)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Save Button (enhanced when dirty) */}
            <button
              onClick={onSave}
              disabled={isSaving}
              data-tour="save-button"
              className={`
                relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer
                ${isDirty
                  ? "text-white bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 focus:ring-cyan-500 animate-pulse-glow"
                  : "text-[var(--muted)] bg-transparent hover:bg-white/5 dark:hover:bg-white/5 active:scale-95 focus:ring-[var(--brand-2)]"
                }
              `}
              data-help="Save your changes to make them permanent. Your calculator auto-saves periodically, but you can manually save anytime."
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isDirty ? (
                <SaveIcon className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className={isDirty ? "inline" : "hidden xl:inline"}>
                {isSaving ? t("Saving") : isDirty ? t("Save") : t("Saved")}
              </span>
            </button>

            {/* Preview Button */}
            {onPreview && (
              <button
                onClick={onPreview}
                data-tour="preview-button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                title={t("Preview")}
                data-help="Preview how your page looks to visitors. See it exactly as they will!"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("Preview")}</span>
              </button>
            )}

            {/* Public/Share Split (compact pill style) */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {/* Main Publish/Draft button */}
              <button
                onClick={onTogglePublish}
                disabled={isPublishing}
                data-tour="publish-button"
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
                  ${isPublished
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }
                  ${isPublishing ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={isPublished ? t("Page is Online") : t("Page is Offline (Draft)")}
                data-help={isPublished ? "Your page is live! Click to unpublish." : "Click to publish your page and make it publicly accessible."}
              >
                {isPublishing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${isPublished ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                )}
                <span>{isPublishing ? t("Publishing...") : isPublished ? t("Online") : t("Draft")}</span>
              </button>

              {/* Separator + External Link (only if published) */}
              {isPublished && (
                <>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                  <a
                    href={fullPublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
                    title={t("Open Public Page")}
                    data-help="Open your live page in a new tab."
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}

              {/* Separator */}
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

              {/* Share trigger */}
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  disabled={!isPublished}
                  className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={t("Share")}
                  data-help="Share your calculator via link or QR code. Click to open sharing options."
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {mobileMenuOpen && isPublished && (
                  <div
                    className="absolute right-0 top-full z-[70] mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] bg-white/5">
                      <p className="text-[10px] uppercase text-[var(--muted)] font-bold tracking-wider">
                        {t("Share Project")}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(fullPublicUrl);
                          setMobileMenuOpen(false);
                        } catch { }
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5"
                      data-help="Copy the public link to your clipboard to share with others."
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {t("Copy link")}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setQrOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {t("QR code")}
                    </button>
                    <a
                      href={fullPublicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("Open in new tab")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Overflow Menu */}
            <div className="relative md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-white/5"
              >
                <MoreVertical className="size-5" />
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-full z-[70] mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-2xl py-2">
                  <div className="px-4 py-2 border-b border-[var(--border)] mb-1">
                    <p className="text-xs font-semibold text-[var(--muted)]">{t("Status")}</p>
                    <div className="mt-1">
                      <StatusIndicator isDirty={isDirty} isSaving={isSaving} />
                    </div>
                  </div>

                  <a
                    href={canPublic ? fullPublicUrl : "#"}
                    onClick={(e) => !canPublic && e.preventDefault()}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${!canPublic ? "text-[var(--muted)]" : "text-[var(--text)] hover:bg-white/5"}`}
                  >
                    <Globe className="w-4 h-4" />
                    {canPublic ? t("View Public Page") : t("Not Published")}
                  </a>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-white/5 text-left"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setQrOpen(true);
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    {t("Share Link")}
                  </button>

                  <div className="h-px bg-[var(--border)] my-1" />

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-white/5 text-left"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleGuideMode();
                    }}
                  >
                    <HelpCircle className="w-4 h-4" />
                    {t("Guide mode")}
                  </button>

                  {canShowGuideMenu && (
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-white/5 text-left"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onStartWalkthrough?.();
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {t("Start walkthrough")}
                    </button>
                  )}

                  <div className="px-4 py-2">
                    <ThemeToggle />
                  </div>

                  <div className="h-px bg-[var(--border)] my-1" />

                  {editorMode !== "setup" && onBack && (
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 text-left"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onBack();
                      }}
                    >
                      <Undo2 className="w-4 h-4" />
                      {t("Switch Editor Mode")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ShareQrModal open={qrOpen} onClose={() => setQrOpen(false)} url={fullPublicUrl} />
    </>
  );
}
