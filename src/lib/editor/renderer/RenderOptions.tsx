// src/lib/editor/renderer/RenderOptions.tsx
"use client";

import { t } from "@/i18n";

/* ------------------------------------------------------------------ */
/* RenderOptions - MVP                                                 */
/* ------------------------------------------------------------------ */

export default function RenderOptions({
  title,
  data,
  mode,
}: {
  title?: string;
  data?: any;
  mode: "editor" | "public";
}) {
  const multiple = !!data?.multiple;

  // Fake demo options dok ne vežemo calc.fields/options
  const opts = [
    { key: "color", label: t("Color accent"), choices: ["Indigo", "Cyan", "Emerald"] },
    { key: "layout", label: t("Layout"), choices: ["Cards", "List"] },
  ];

  return (
    <section>
      <SectionTitle>{title ?? t("Options")}</SectionTitle>
      <div className="space-y-3">
        {opts.map((g) => (
          <div key={g.key} className="rounded-xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-3">
            <div className="text-sm font-medium">{g.label}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.choices.map((c) => (
                <label key={c} className="inline-flex items-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] px-2 py-1 text-sm">
                  <input type={multiple ? "checkbox" : "radio"} name={g.key} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-sm font-medium">{children}</div>;
}