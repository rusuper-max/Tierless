// src/lib/editor/renderer/RenderExtras.tsx
"use client";

import { t } from "@/i18n";

/* ------------------------------------------------------------------ */
/* RenderExtras - MVP                                                  */
/* ------------------------------------------------------------------ */

export default function RenderExtras({
  title,
  data,
  mode,
}: {
  title?: string;
  data?: any;
  mode: "editor" | "public";
}) {
  return (
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-4">
      <div className="text-sm font-medium">{title ?? t("Extras")}</div>
      {data?.note ? (
        <p className="mt-2 text-sm text-[var(--muted,#9aa0a6)]">{data.note}</p>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted,#9aa0a6)]">{t("Add a note or extra info here.")}</p>
      )}
    </section>
  );
}