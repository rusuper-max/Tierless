// src/app/editor/[id]/EditorShell.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ChevronLeft, Monitor, Smartphone, X } from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type CalcJson, type Mode } from "@/hooks/useEditorStore";
import EditorNavBar from "./components/EditorNavBar";

// Shared renderer
const PublicRenderer = dynamic(() => import("@/components/PublicRenderer"), {
  ssr: false,
});
const BlocksPanel = dynamic(() => import("./panels/BlocksPanel"), {
  ssr: false,
});
const SimpleListPanel = dynamic(
  () => import("./panels/SimpleListPanel"),
  { ssr: false }
);

type Props = { slug: string; initialCalc: CalcJson };
type PreviewMode = "off" | "desktop" | "mobile";

export default function EditorShell({ slug, initialCalc }: Props) {
  const { calc, init, isDirty, isSaving, setEditorMode } = useEditorStore();

  /* ---------------- Init calc ---------------- */
  useEffect(() => {
    init(slug, initialCalc);
  }, [slug, initialCalc, init]);

  /* ---------------- UI mode (persist across refresh) ---------------- */
  const [uiMode, setUiMode] = useState<Mode>("setup");

  // učitavanje iz localStorage + meta.editorMode
  useEffect(() => {
    const key = `tl_editor_mode_${slug}`;
    let stored: Mode | null = null;
    try {
      const raw = window.localStorage.getItem(key) as Mode | null;
      if (
        raw === "setup" ||
        raw === "tiers" ||
        raw === "simple" ||
        raw === "advanced"
      ) {
        stored = raw;
      }
    } catch {
      // ignore
    }

    const metaMode = (initialCalc?.meta?.editorMode as Mode) || "setup";
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

  /* ---------------- Quick preview overlay ---------------- */
  const [previewMode, setPreviewMode] = useState<PreviewMode>("off");

  const openPreview = (variant: PreviewMode = "desktop") => {
    if (!calc) return;
    if (variant === "off") variant = "desktop";
    setPreviewMode(variant);
  };

  const closePreview = () => setPreviewMode("off");

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
      } catch {}
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
      />

      <div className="px-4 lg:px-8 py-5">
        {/* Quick preview toolbar – samo kad smo u editor modu */}
        {!inSetup && (
          <div className="mb-3 flex items-center justify-end">
            <button
              data-tour-id="tour-quick-preview"
              type="button"
              onClick={() => openPreview("desktop")}
              className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3.5 py-2 text-xs sm:text-sm group hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] hover:-translate-y-0.5 transition"
            >
              {/* Brand outline */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  padding: 1.5,
                  background:
                    "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor" as any,
                  maskComposite: "exclude",
                }}
              />

              {/* Sadržaj dugmeta */}
              <span className="relative z-[1] inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface)] mr-1">
                  <Monitor className="h-3.5 w-3.5" />
                </span>
                {t("Quick preview")}
              </span>
            </button>
          </div>
        )}

        <div className="tl-body relative">
          {/* EDITOR COLUMN – sada full width */}
          <section className="flex-1 min-w-0">
            {inSetup ? (
              <div className="card p-5">
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  {t("Choose editor mode")}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {t(
                    "Pick a starting point. You can switch to Advanced later."
                  )}
                </p>

                <div className="grid gap-4 mt-4 md:grid-cols-3">
                  <ModeTile
                    active={uiMode === ("tiers" as Mode)}
                    title={t("Tier-based price page")}
                    text={t(
                      "Stacked plans with feature checklist. Great for SaaS, agencies and subscriptions."
                    )}
                    cta={t("Start with tiers")}
                    onClick={() => setModeBoth("tiers")}
                  />
                  <ModeTile
                    active={uiMode === ("simple" as Mode)}
                    title={t("Tierless price page")}
                    text={t(
                      "Single list of items and prices. Ideal for restaurants, clinics, salons and local businesses."
                    )}
                    cta={t("Start simple")}
                    badge={t("Most used option")}
                    onClick={() => setModeBoth("simple")}
                  />
                  <ModeTile
                    active={uiMode === ("advanced" as Mode)}
                    title={t("Advanced editor")}
                    text={t(
                      "Full control with tiers, packages, extras and sliders for demanding setups."
                    )}
                    cta={t("Go advanced")}
                    onClick={() => setModeBoth("advanced")}
                  />
                </div>
              </div>
            ) : (
              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
                {uiMode === "simple" ? <SimpleListPanel /> : <BlocksPanel />}
              </section>
            )}
          </section>
        </div>
      </div>

      {/* QUICK PREVIEW OVERLAY */}
      {previewMode !== "off" && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl mx-4">
            {/* Top bar */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${
                    previewMode === "desktop"
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  {t("Desktop")}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${
                    previewMode === "mobile"
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  {t("Mobile")}
                </button>
              </div>

              <button
                type="button"
                onClick={closePreview}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 text-xs sm:text-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("Back to editor")}
                <X className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>

            {/* Preview body */}
            <div
              className={`mx-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)] max-h-[90vh] overflow-auto ${
                previewMode === "mobile" ? "max-w-xs" : "max-w-5xl"
              }`}
            >
              <div className="p-4 sm:p-6">
                {calc ? (
                  <PublicRenderer calc={calc as any} />
                ) : (
                  <div className="text-sm text-[var(--muted)]">
                    {t("Nothing to preview.")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoped theme */}
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
        .tl-editor .tl-body {
          min-height: calc(100vh - 140px);
        }
      `}</style>
    </main>
  );
}

/* ---------------- Mode tile (brand gradient hover) ---------------- */
function ModeTile({
  active,
  title,
  text,
  cta,
  badge,
  onClick,
}: {
  active?: boolean;
  title: string;
  text: string;
  cta: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={`tl-tile ${active ? "is-active" : ""}`}
        onClick={onClick}
      >
        {badge && <span className="tl-badge">{badge}</span>}
        <div className="tl-head">{title}</div>
        <p className="tl-desc">{text}</p>
        <span className="tl-cta">{cta}</span>
      </button>

      <style jsx>{`
        .tl-tile {
          position:relative;
          text-align:left;
          background:var(--card,#fff);
          color:var(--text,#111827);
          border:1px solid var(--border,#e5e7eb);
          border-radius:16px;
          padding:22px 24px;
          cursor:pointer;
          transition:transform .18s ease, box-shadow .18s ease;
          outline:none;
        }
        .tl-tile::before {
          content:"";
          position:absolute;
          inset:0;
          border-radius:inherit;
          padding:2.1px;
          background:linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE));
          -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite:xor;
          mask-composite:exclude;
          opacity:0;
          transition:opacity .18s ease;
          pointer-events:none;
        }
        .tl-tile::after {
          content:"";
          position:absolute;
          inset:-10px;
          border-radius:22px;
          background:radial-gradient(
            70% 60% at 50% 0%,
            rgba(79,70,229,.26),
            rgba(34,211,238,.20) 45%,
            transparent 75%
          );
          filter:blur(18px);
          opacity:0;
          transition:opacity .18s ease;
          pointer-events:none;
        }
        .tl-tile:hover,
        .tl-tile:focus-visible {
          transform:translateY(-3px);
          box-shadow:0 16px 36px rgba(2,6,23,.18);
        }
        .tl-tile:hover::before,
        .tl-tile:focus-visible::before,
        .tl-tile.is-active::before {
          opacity:1;
        }
        .tl-tile:hover::after,
        .tl-tile:focus-visible::after,
        .tl-tile.is-active::after {
          opacity:.95;
        }

        .tl-badge {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:2px 9px;
          margin-bottom:6px;
          border-radius:999px;
          font-size:10px;
          font-weight:500;
          background:rgba(79,70,229,0.08);
          border:1px solid rgba(129,140,248,0.6);
          background-image:linear-gradient(
            90deg,
            rgba(79,70,229,0.12),
            rgba(34,211,238,0.10)
          );
          color:#4f46e5;
        }

        .tl-head {
          font-size:1.25rem;
          line-height:1.75rem;
          font-weight:700;
          margin-bottom:.5rem;
        }
        .tl-desc {
          color:var(--muted,#6b7280);
          margin:0 0 1.25rem;
        }
        .tl-cta {
          display:inline-block;
          font-weight:500;
          background:linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE));
          -webkit-background-clip:text;
          background-clip:text;
          color:transparent;
        }

        :global(html.dark) .tl-tile {
          background:var(--card,#111214);
          border-color:rgba(255,255,255,.12);
          box-shadow:0 10px 24px rgba(0,0,0,.30);
        }
        :global(html.dark) .tl-badge {
          background-image:linear-gradient(
            90deg,
            rgba(129,140,248,0.20),
            rgba(45,212,191,0.16)
          );
          border-color:rgba(165,180,252,0.9);
          color:#e5e7eb;
        }
      `}</style>
    </>
  );
}