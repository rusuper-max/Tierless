// src/lib/editor/renderer/RenderRoot.tsx
"use client";

import { t } from "@/i18n";
import type { CalcJson } from "@/hooks/useEditorStore";
import RenderPackages from "./RenderPackages";
import RenderItems from "./RenderItems";
import RenderOptions from "./RenderOptions";
import RenderExtras from "./RenderExtras";

/* ------------------------------------------------------------------ */
/* RenderRoot - MVP                                                    */
/* ------------------------------------------------------------------ */

export default function RenderRoot({
  calc,
  mode = "editor",
}: {
  calc: CalcJson;
  mode?: "editor" | "public";
}) {
  const blocks: any[] = Array.isArray(calc?.blocks) ? (calc.blocks as any[]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{calc?.meta?.name ?? t("Untitled")}</h1>
        {calc?.meta?.description ? (
          <p className="text-[var(--muted,#9aa0a6)]">{calc.meta.description}</p>
        ) : null}
      </header>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-6 text-sm text-[var(--muted,#9aa0a6)]">
          {t("No blocks yet. Add blocks in the sidebar.")}
        </div>
      ) : (
        blocks.map((b) => {
          switch (b.type) {
            case "packages":
              return <RenderPackages key={b.id} title={b.title} data={b.data} mode={mode} />;
            case "items":
              return <RenderItems key={b.id} title={b.title} data={b.data} mode={mode} />;
            case "options":
              return <RenderOptions key={b.id} title={b.title} data={b.data} mode={mode} />;
            case "extras":
              return <RenderExtras key={b.id} title={b.title} data={b.data} mode={mode} />;
            default:
              return (
                <section
                  key={b.id}
                  className="rounded-xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-4"
                >
                  <div className="text-sm font-medium">{b.title ?? t("Block")}</div>
                  <div className="mt-1 text-2xs text-[var(--muted,#9aa0a6)]">{b.type ?? "custom"}</div>
                </section>
              );
          }
        })
      )}
    </div>
  );
}