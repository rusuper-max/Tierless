"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Eye, Sparkles, X, XCircle, Undo2, Redo2 } from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type CalcJson, type Mode } from "@/hooks/useEditorStore";
import { useUndoRedoShortcuts } from "@/hooks/useUndoRedoShortcuts";
import { HelpModeProvider, useHelpMode } from "@/hooks/useHelpMode";
import EditorNavBar from "./components/EditorNavBar";
import OnboardingIntro from "@/components/editor/OnboardingIntro";
import HelpModeIntro from "@/components/editor/HelpModeIntro";
import HelpTooltip from "@/components/editor/HelpTooltip";
import GuidedTour from "@/components/editor/GuidedTour";
import { editorTourSteps, finalTourMessage } from "@/components/editor/tourSteps";

// Shared renderer
const PublicRenderer = dynamic(() => import("@/components/PublicRenderer"), {
  ssr: false,
});
const SimpleListPanel = dynamic(
  () => import("./panels/SimpleListPanel"),
  { ssr: false }
);
const AdvancedPanel = dynamic(
  () => import("./panels/AdvancedPanel"),
  { ssr: false }
);

type Props = { slug: string; initialCalc: CalcJson };

const BRAND_GRADIENT = "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

function normalizeMode(input?: string | null): Mode {
  if (input === "simple" || input === "advanced" || input === "setup") {
    return input;
  }
  if (input === "tiers") {
    return "advanced";
  }
  return "setup";
}

function EditorContent({ slug, initialCalc }: Props) {
  const { calc, init, isDirty, isSaving, setEditorMode, undo, redo, canUndo, canRedo } = useEditorStore();
  const { isActive: isHelpMode, hasSeenIntro, markIntroAsSeen, enableHelpMode, disableHelpMode, toggleHelpMode } = useHelpMode();
  
  // Enable keyboard shortcuts for Undo/Redo
  useUndoRedoShortcuts();

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [pendingHelpIntro, setPendingHelpIntro] = useState(false);

  // Help Mode state
  const [showIntro, setShowIntro] = useState(false);
  const [helpTooltip, setHelpTooltip] = useState<{ content: string; element: HTMLElement } | null>(null);

  // Check if user has been onboarded
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('editor_onboarded');
    if (!hasOnboarded) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startGuidedTour = () => {
    try {
      localStorage.setItem('editor_onboarded', 'true');
    } catch {
      // ignore
    }
    if (tourStartTimerRef.current) {
      clearTimeout(tourStartTimerRef.current);
      tourStartTimerRef.current = null;
    }
    disableHelpMode();
    setHelpTooltip(null);
    setShowIntro(false);
    setShowTour(false);
    setShowFinalMessage(false);
    setPendingHelpIntro(false);
    setShowOnboarding(false);
    tourStartTimerRef.current = setTimeout(() => {
      setShowTour(true);
    }, 200);
  };

  const handleTourComplete = () => {
    if (tourStartTimerRef.current) {
      clearTimeout(tourStartTimerRef.current);
      tourStartTimerRef.current = null;
    }
    setShowTour(false);
    setShowFinalMessage(true);
    setPendingHelpIntro(!hasSeenIntro);
  };

  const handleTourSkip = () => {
    if (tourStartTimerRef.current) {
      clearTimeout(tourStartTimerRef.current);
      tourStartTimerRef.current = null;
    }
    setShowTour(false);
    setPendingHelpIntro(false);
    setShowFinalMessage(true);
  };

  const handleFinalMessageClose = () => {
    setShowFinalMessage(false);
    if (pendingHelpIntro && !hasSeenIntro) {
      setShowIntro(true);
    }
    setPendingHelpIntro(false);
  };

  /* ---------------- Init calc ---------------- */
  useEffect(() => {
    init(slug, initialCalc);
  }, [slug, initialCalc, init]);

  /* ---------------- UI mode (persist across refresh) ---------------- */
  const [uiMode, setUiMode] = useState<Mode>("setup");

  useEffect(() => {
    const key = `tl_editor_mode_${slug}`;
    let stored: Mode | null = null;
    try {
      const raw = window.localStorage.getItem(key) as Mode | null;
      if (raw) {
        stored = normalizeMode(raw);
      }
    } catch {
      // ignore
    }

    const metaMode = normalizeMode(
      initialCalc?.meta?.editorMode as string | null
    );
    const start: Mode = stored || metaMode || "setup";

    setUiMode(start);
    if (start !== "setup") {
      setEditorMode(start);
    }
  }, [slug, initialCalc, setEditorMode]);

  const setModeBoth = (next: Mode) => {
    setUiMode(next);
    try {
      window.localStorage.setItem(`tl_editor_mode_${slug}`, next);
    } catch {
      // ignore
    }
    setEditorMode(next);
  };

  const inSetup = uiMode === "setup";

  /* ---------------- Preview overlay ---------------- */
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  /* ---------------- Save (manual) ---------------- */
  const [toast, setToast] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutosavedStateRef = useRef<string | null>(null);
  const tourStartTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveNow = async () => {
    if (!calc) return;
    try {
      (useEditorStore as any).setState({ isSaving: true });
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(calc),
      });
      const txt = await r.text();
      let json: any = null;
      try {
        json = JSON.parse(txt);
      } catch { }
      if (!r.ok) {
        console.error("SAVE /api/calculators ->", txt);
        setToast(t("Save failed"));
        setTimeout(() => setToast(null), 1300);
        return;
      }
      if (json) (useEditorStore as any).setState({ calc: json as CalcJson });

      // Update last autosaved state after manual save
      if (json) {
        lastAutosavedStateRef.current = JSON.stringify(json);
      }

      // Reset autosave timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }

      setToast(t("Saved"));
      setTimeout(() => setToast(null), 1000);
    } finally {
      (useEditorStore as any).setState({
        isSaving: false,
        isDirty: false,
        lastSaved: Date.now(),
      });
    }
  };

  /* ---------------- Autosave Logic ---------------- */
  useEffect(() => {
    const autosaveEnabled = calc?.meta?.autosaveEnabled ?? false;
    const autosaveInterval = (calc?.meta?.autosaveInterval ?? 60) * 1000;

    if (!autosaveEnabled || !calc) {
      return;
    }

    // Debounce: Reset timer on every change
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer
    autosaveTimerRef.current = setTimeout(async () => {
      // Don't save if already saving
      if (isSaving) return;

      try {
        const currentState = JSON.stringify(calc);

        // Skip if no changes since last autosave
        if (currentState === lastAutosavedStateRef.current) {
          return;
        }

        // Perform the save
        (useEditorStore as any).setState({ isSaving: true });
        const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
          body: currentState,
        });

        if (r.ok) {
          const json = await r.json();
          (useEditorStore as any).setState({ calc: json as CalcJson });
          lastAutosavedStateRef.current = JSON.stringify(json);

          (useEditorStore as any).setState({
            isDirty: false,
            lastSaved: Date.now(),
          });
        }
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        (useEditorStore as any).setState({ isSaving: false });
      }
    }, autosaveInterval);

    // Cleanup on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [calc, slug, isSaving]);

  /* ---------------- Save on page leave (beforeunload) ---------------- */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only save if autosave is enabled and there are unsaved changes
      if (!calc?.meta?.autosaveEnabled || !isDirty || isSaving) {
        return;
      }

      try {
        const currentState = JSON.stringify(calc);

        // Use fetch with keepalive for reliable save on page unload
        fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: currentState,
          keepalive: true, // Ensures request completes even if page unloads
        }).catch(err => {
          console.error("Save on unload failed:", err);
        });
      } catch (error) {
        console.error("Save on unload failed:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [calc, slug, isDirty, isSaving]);

  /* ---------------- Toggle Publish/Unpublish ---------------- */
  const handleTogglePublish = async () => {
    if (!calc) return;
    const nextState = !isPublished;

    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publish: nextState }),
      });

      if (!r.ok) {
        const json = await r.json().catch(() => ({}));
        if (r.status === 409 && json.error === "PLAN_LIMIT") {
          // PLAN LIMIT - Show user notification
          setToast(
            t("You've reached your plan limit for published pages. Please unpublish another page first.")
          );
          setTimeout(() => setToast(null), 3000);
        } else {
          setToast(t("Failed to update status"));
          setTimeout(() => setToast(null), 2000);
        }
        return;
      }

      // Success - update local state
      (useEditorStore as any).setState((state: any) => {
        const updated = { ...state.calc };
        if (!updated.meta) updated.meta = {};
        updated.meta.published = nextState;
        // legacy fallback
        (updated.meta as any).online = nextState;
        return { calc: updated };
      });

      setToast(nextState ? t("Page is now Online") : t("Page is now Offline"));
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error("Publish error:", e);
      setToast(t("Network error"));
      setTimeout(() => setToast(null), 2000);
    }
  };

  /* ---------------- Public URL (no popup) ---------------- */
  const publicHref = (() => {
    const id = (calc as any)?.meta?.id;
    const sl = (calc as any)?.meta?.slug || slug;
    return id
      ? `/p/${encodeURIComponent(String(id))}-${encodeURIComponent(String(sl))}`
      : `/p/${encodeURIComponent(String(sl))}`;
  })();
  const isPublished = !!(
    (calc as any)?.meta?.published ?? (calc as any)?.meta?.online
  );

  /* ---------------- Help Mode Click Handler ---------------- */
  useEffect(() => {
    if (!isHelpMode) {
      setHelpTooltip(null);
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let helpElement = target.closest("[data-help]") as HTMLElement;

      if (helpElement) {
        e.preventDefault();
        e.stopPropagation();

        // Ensure we have the element with actual dimensions
        // Sometimes closest() returns an element without layout
        const rect = helpElement.getBoundingClientRect();
        console.log('Help Mode - Clicked element:', helpElement);
        console.log('Help Mode - Element rect:', rect);

        // If this element has no dimensions, it might be an SVG or inline element
        // Try to find a parent with dimensions
        if (rect.width === 0 || rect.height === 0) {
          const parentButton = helpElement.closest('button') as HTMLElement;
          if (parentButton && parentButton.hasAttribute('data-help')) {
            helpElement = parentButton;
            console.log('Help Mode - Using parent button instead');
          }
        }

        const helpText = helpElement.getAttribute("data-help");
        if (helpText) {
          setHelpTooltip({ content: helpText, element: helpElement });
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isHelpMode]);

  /* ---------------- ESC to exit Help Mode ---------------- */
  useEffect(() => {
    if (!isHelpMode) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        disableHelpMode();
        setHelpTooltip(null);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isHelpMode, disableHelpMode]);

  useEffect(() => {
    return () => {
      if (tourStartTimerRef.current) {
        clearTimeout(tourStartTimerRef.current);
      }
    };
  }, []);

  return (
    <main className={`tl-editor min-h-screen ${isHelpMode ? "help-mode-active" : ""}`}>
      {toast && (
        <div className="fixed bottom-4 right-4 z-[120] card px-3 py-2 text-sm shadow-ambient">
          {toast}
        </div>
      )}

      {showTour && (
        <GuidedTour
          steps={editorTourSteps}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingIntro
          onStartTour={startGuidedTour}
          onSkip={() => {
            localStorage.setItem('editor_onboarded', 'true');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Help Mode Intro Modal */}
      {showIntro && !hasSeenIntro && (
        <HelpModeIntro
          onClose={() => {
            // X button - just close without activating
            setShowIntro(false);
          }}
          onDontShowAgain={() => {
            // Don't show again - mark as seen and close without activating
            markIntroAsSeen();
            setShowIntro(false);
          }}
          onActivate={() => {
            // Got it button - activate help mode
            enableHelpMode();
          }}
          onStartTour={startGuidedTour}
        />
      )}

      {showFinalMessage && (
        <div className="fixed inset-0 z-[205] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={handleFinalMessageClose}
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center gap-4 pt-4 pb-6 px-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--text)]">{finalTourMessage.title}</h3>
                <p className="text-sm text-[var(--muted)]">{finalTourMessage.content}</p>
                <p className="text-xs text-[var(--muted)]/80">
                  {t("Activate the Guide button anytime to enter Help Mode and click on elements for instant explanations.")}
                </p>
              </div>
              <button
                onClick={handleFinalMessageClose}
                type="button"
                className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                style={{ background: BRAND_GRADIENT }}
              >
                {pendingHelpIntro && !hasSeenIntro ? t("Show Guide Mode") : t("Got it")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Mode Tooltip */}
      {isHelpMode && helpTooltip && (
        <HelpTooltip
          content={helpTooltip.content}
          onClose={() => setHelpTooltip(null)}
        />
      )}

      <EditorNavBar
        calcName={calc?.meta?.name}
        showBack={!inSetup}
        onBack={() => setModeBoth("setup")}
        onSave={saveNow}
        isSaving={isSaving}
        isDirty={isDirty}
        publicHref={publicHref}
        isPublished={isPublished}
        editorMode={uiMode}
        onGuideClick={() => {
          // If seen intro before, toggle Help Mode directly
          // Otherwise show intro first
          if (hasSeenIntro) {
            toggleHelpMode();
          } else {
            setShowIntro(true);
          }
        }}
        onTogglePublish={handleTogglePublish}
        onPreview={() => setPreviewOpen(true)}
        onStartWalkthrough={startGuidedTour}
        hasDismissedIntro={hasSeenIntro}
        // Undo/Redo
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo()}
        canRedo={canRedo()}
      />

      <div className="px-4 lg:px-8 py-5">

        <div className="tl-body relative">
          <section className="flex-1 min-w-0">
            {inSetup ? (
              <div className="card p-6 sm:p-8 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
                  {t("Choose editor mode")}
                </h2>
                <p className="text-base text-[var(--muted)] mb-8">
                  {t("Pick a starting point. You can switch to Advanced later.")}
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  <ModeTile
                    active={uiMode === ("simple" as Mode)}
                    title={t("Tierless price page")}
                    text={t("Single list of items and prices. Perfect for restaurants, cafés, barber shops, dentists and clinics.")}
                    subText={t("Scan your menu, get a QR code and share the link in just a few minutes.")}
                    cta={t("Start simple")}
                    badge={t("Most used option")}
                    onClick={() => setModeBoth("simple")}
                  />

                  <ModeTile
                    active={uiMode === ("advanced" as Mode)}
                    title={t("Calculator price page")}
                    text={t("Full control with packages, extras and sliders for demanding setups.")}
                    subText={t("Great for photographers, agencies and anyone who needs a configurable calculator.")}
                    cta={t("Build calculator")}
                    onClick={() => setModeBoth("advanced")}
                  />
                </div>
              </div>
            ) : (
              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
                {uiMode === "simple" ? (
                  <SimpleListPanel />
                ) : (
                  <AdvancedPanel />
                )}
              </section>
            )}
          </section>
        </div>
      </div>

      {/* QUICK PREVIEW OVERLAY */}
      {previewOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-[var(--bg)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card)] z-50 relative shrink-0">
              <div className="text-sm font-bold text-[var(--text)]">{t("Preview")}</div>
              <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text)] transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div
              ref={previewScrollRef}
              className="flex-1 overflow-y-auto relative"
            >
              {calc ? (
                <PublicRenderer calc={calc as any} scrollContainer={previewScrollRef} />
              ) : (
                <div className="text-sm text-[var(--muted)] p-8 text-center">
                  {t("Nothing to preview.")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Button for Guide Mode */}
      {isHelpMode && (
        <button
          onClick={disableHelpMode}
          className="fixed bottom-6 right-6 z-[150] flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold text-white shadow-2xl hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-bottom-4 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
          style={{ background: BRAND_GRADIENT }}
        >
          <XCircle className="w-4 h-4" />
          {t("Exit Guide Mode")}
        </button>
      )}

      <style jsx global>{`
        .tl-editor {
          --bg:#ffffff; --card:#ffffff; --border:#e5e7eb; --text:#111827; --muted:#6b7280;
          --surface:rgba(0,0,0,.04); --track:#f3f4f6; --brand-1:#4F46E5; --brand-2:#22D3EE; --radius:16px;
        }
        html.dark .tl-editor {
          --bg:#0b0b0c; --card:#111214; --border:rgba(255,255,255,.12); --text:#e5e7eb; --muted:#9ca3af;
          --surface:rgba(255,255,255,.06); --track:rgba(255,255,255,.08); --brand-1:#7c7bff; --brand-2:#2dd4bf;
        }
        .card {
          background:var(--card);
          border:1px solid var(--border);
          border-radius:var(--radius);
        }
        .tl-body {
          min-height: calc(100vh - 140px);
        }
      `}</style>
    </main>
  );
}

function ModeTile({
  active,
  title,
  text,
  subText,
  cta,
  badge,
  onClick,
}: {
  active?: boolean;
  title: string;
  text: string;
  subText?: string;
  cta: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`group relative flex flex-col text-left p-6 sm:p-8 rounded-2xl transition-all duration-300 outline-none
        ${active ? "bg-slate-900" : "bg-[var(--bg)] hover:bg-[var(--surface)]"}
      `}
      onClick={onClick}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          padding: 2,
          background: BRAND_GRADIENT,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        {badge && (
          <span className="self-start mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
            {badge}
          </span>
        )}

        <h3 className={`text-xl sm:text-2xl font-bold mb-3 transition-all ${active
          ? "text-white"
          : "text-[var(--text)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-cyan-400"
          }`}>
          {title}
        </h3>

        <p className={`text-sm sm:text-base mb-2 leading-relaxed ${active ? "text-slate-300" : "text-[var(--muted)]"}`}>
          {text}
        </p>

        {subText && (
          <p className={`text-xs sm:text-sm opacity-80 mb-6 flex-1 ${active ? "text-slate-400" : "text-[var(--muted)]"}`}>
            {subText}
          </p>
        )}

        <span
          className="mt-auto inline-flex items-center gap-2 text-sm font-bold group-hover:translate-x-1 transition-transform"
          style={{
            background: BRAND_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {cta} →
        </span>
      </div>
    </button>
  );
}

// Wrap EditorContent with HelpModeProvider
export default function EditorShell(props: Props) {
  return (
    <HelpModeProvider>
      <EditorContent {...props} />
    </HelpModeProvider>
  );
}
