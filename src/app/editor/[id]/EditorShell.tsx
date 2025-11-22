"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Eye, X } from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type CalcJson, type Mode } from "@/hooks/useEditorStore";
import EditorNavBar from "./components/EditorNavBar";

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

export default function EditorShell({ slug, initialCalc }: Props) {
  const { calc, init, isDirty, isSaving, setEditorMode } = useEditorStore();

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

  return (
    <main className="tl-editor min-h-screen">
      {toast && (
        <div className="fixed bottom-4 right-4 z-[120] card px-3 py-2 text-sm shadow-ambient">
          {toast}
        </div>
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
      />

      <div className="px-4 lg:px-8 py-5">
        {/* Quick preview toolbar */}
        {!inSetup && (
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3.5 py-2 text-xs sm:text-sm group hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] hover:-translate-y-0.5 transition"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  padding: 1.5,
                  background: BRAND_GRADIENT,
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <span className="relative z-[1] inline-flex items-center gap-2 text-[var(--text)]">
                <Eye className="h-3.5 w-3.5" />
                {t("Quick preview")}
              </span>
            </button>
          </div>
        )}

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

        <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-1)] group-hover:translate-x-1 transition-transform">
          {cta} →
        </span>
      </div>
    </button>
  );
}