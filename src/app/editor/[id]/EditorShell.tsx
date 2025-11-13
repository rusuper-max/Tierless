// src/app/editor/[id]/EditorShell.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type CalcJson, type Mode } from "@/hooks/useEditorStore";
import EditorNavBar from "./components/EditorNavBar";

// Shared renderer
const PublicRenderer = dynamic(() => import("@/components/PublicRenderer"), { ssr: false });
const BlocksPanel = dynamic(() => import("./panels/BlocksPanel"), { ssr: false });

type Props = { slug: string; initialCalc: CalcJson };

export default function EditorShell({ slug, initialCalc }: Props) {
  const { calc, init, isDirty, isSaving, setEditorMode } = useEditorStore();

  useEffect(() => {
    init(slug, initialCalc);
  }, [slug, initialCalc, init]);

  /* ---------------- UI mode (persist across refresh) ---------------- */
  const [uiMode, setUiMode] = useState<Mode>("setup");

  // Init uiMode from localStorage or initialCalc.meta.editorMode
  useEffect(() => {
    const key = `tl_editor_mode_${slug}`;
    let stored: Mode | null = null;
    try {
      const raw = window.localStorage.getItem(key) as Mode | null;
      if (raw === "setup" || raw === "tiers" || raw === "simple" || raw === "advanced") {
        stored = raw;
      }
    } catch {
      // ignore
    }

    const metaMode = (initialCalc?.meta?.editorMode as Mode) || "setup";
    const start: Mode = stored || metaMode || "setup";

    setUiMode(start);
    if (start !== "setup") {
      // sync store mode za BlocksPanel itd.
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

  /* ---------------- Save (manual) ---------------- */
  const [toast, setToast] = useState<string | null>(null);
  const saveNow = async () => {
    if (!calc) return;
    try {
      (useEditorStore as any).setState({ isSaving: true });
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "content-type": "application/json", Accept: "application/json" },
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
      (useEditorStore as any).setState({ isSaving: false, isDirty: false, lastSaved: Date.now() });
    }
  };

  /* ---------------- Preview toggle + resize ---------------- */
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewW, setPreviewW] = useState(520);
  const draggingRef = useRef(false);

  const onStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const startX = e.clientX;
    const startW = previewW;
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = startX - ev.clientX;
      let next = startW + dx;
      next = Math.max(360, Math.min(840, next));
      setPreviewW(next);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
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
        <div className="fixed bottom-4 right-4 z-[120] card px-3 py-2 text-sm shadow-ambient">{toast}</div>
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
        <div className="tl-body flex items-stretch gap-0 relative">
          {/* EDITOR COLUMN */}
          <section className="flex-1 min-w-0 pr-4">
            {inSetup ? (
              <div className="card p-5">
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  {t("Choose editor mode")}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {t("Pick a starting point. You can switch to Advanced later.")}
                </p>

                <div className="grid gap-4 mt-4 md:grid-cols-3">
                  <ModeTile
                    active={uiMode === ("tiers" as Mode)}
                    title={t("Tier Based Price Page")}
                    text={t("Multiple tiers + feature checklist. Friendly defaults.")}
                    cta={t("Start with tiers")}
                    onClick={() => setModeBoth("tiers")}
                  />
                  <ModeTile
                    active={uiMode === ("simple" as Mode)}
                    title={t("Tierless Price Page")}
                    text={t("Simple list of items and prices. Perfect for menus or clinics.")}
                    cta={t("Start simple")}
                    onClick={() => setModeBoth("simple")}
                  />
                  <ModeTile
                    active={uiMode === ("advanced" as Mode)}
                    title={t("Advanced editor")}
                    text={t("Full control with packages, features, extras and sliders.")}
                    cta={t("Go advanced")}
                    onClick={() => setModeBoth("advanced")}
                  />
                </div>
              </div>
            ) : (
              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
                <BlocksPanel />
              </section>
            )}
          </section>

          {/* RESIZER / SEPARATOR – samo kad nismo u setup modu */}
          {!inSetup && previewOpen && (
            <div
              className="tl-resizer-col relative w-[14px] shrink-0 self-stretch cursor-col-resize group"
              onMouseDown={onStartResize}
              title={t("Drag to resize")}
              aria-hidden
            >
              <div className="tl-resize-line" />
              <div className="tl-resize-glow group-hover:opacity-100" />
            </div>
          )}

          {/* PREVIEW COLUMN – uopšte se ne renderuje u setup modu */}
          {!inSetup && (
            <aside
              className={`preview-col relative will-change-transform transition-transform duration-200 ${
                previewOpen ? "translate-x-0" : "translate-x-[110%] pointer-events-none"
              }`}
              style={{ width: previewW }}
              aria-hidden={!previewOpen}
            >
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3 h-fit lg:sticky lg:top-20">
                <div className="flex items-center justify-between px-1 pb-2">
                  <div className="text-sm font-medium text-[var(--text)]">{t("Preview")}</div>
                  <button
                    className="relative inline-flex items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-sm group cursor-pointer"
                    onClick={() => setPreviewOpen(false)}
                    title={t("Hide preview")}
                  >
                    <span className="relative z-[1] inline-flex items-center gap-1 whitespace-nowrap text-[var(--text)]">
                      <ChevronLeft className="size-4 rotate-180" /> {t("Hide")}
                    </span>
                  </button>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                  {calc ? (
                    <PublicRenderer calc={calc as any} />
                  ) : (
                    <div className="text-sm text-[var(--muted)]">
                      {t("Nothing to preview.")}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Reveal tab – takođe samo kad nismo u setup modu */}
          {!inSetup && !previewOpen && (
            <button
              className="fixed right-2 top-1/2 -translate-y-1/2 z-40 group cursor-pointer"
              onClick={() => setPreviewOpen(true)}
              title={t("Show preview")}
            >
              <span className="relative inline-flex items-center rounded-full bg-[var(--card)] px-2 py-1.5">
                <ChevronLeft className="relative z-[1]" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Scoped theme + resizer visuals */}
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

        /* Da separator ima "skroz do dna" unutar tela editora */
        .tl-editor .tl-body {
          min-height: calc(100vh - 140px);
        }

        /* FULL-HEIGHT brand separator + jači glow */
        .tl-resize-line {
          position:absolute;
          left:6px;
          top:0;
          bottom:0;
          width:2px;
          background:linear-gradient(var(--brand-1),var(--brand-2));
          border-radius:2px;
          box-shadow:0 0 18px rgba(34,211,238,.28);
        }
        .tl-resize-glow {
          position:absolute;
          left:-8px;
          right:-8px;
          top:0;
          bottom:0;
          background:radial-gradient(45% 55% at 50% 50%, rgba(34,211,238,.28), transparent 70%);
          opacity:0;
          transition:opacity .2s ease;
          pointer-events:none;
        }
        html.dark .tl-resize-glow {
          background:radial-gradient(45% 55% at 50% 50%, rgba(45,212,191,.38), transparent 70%);
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
  onClick,
}: {
  active?: boolean;
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={`tl-tile ${active ? "is-active" : ""}`}
        onClick={onClick}
      >
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
      `}</style>
    </>
  );
}