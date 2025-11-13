// src/lib/editor/renderer/RenderItems.tsx
"use client";

import { t } from "@/i18n";

/* ------------------------------------------------------------------ */
/* RenderItems - MVP                                                   */
/* ------------------------------------------------------------------ */

export default function RenderItems({
  title,
  data,
  mode,
}: {
  title?: string;
  data?: any;
  mode: "editor" | "public";
}) {
  const cols = Math.max(1, Math.min(4, Number(data?.columns ?? 2)));
  const grid =
    cols === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
    cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
    cols === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  // Fake demo items dok ne povežemo na calc.items
  const demo = [
    { name: t("Consultation"), price: "€20" },
    { name: t("Custom quote"), price: "€0" },
    { name: t("On-site visit"), price: "€49" },
    { name: t("Priority support"), price: "€15" },
  ];

  return (
    <section>
      <SectionTitle>{title ?? t("Items")}</SectionTitle>
      <div className={`grid gap-3 ${grid}`}>
        {demo.map((it, i) => (
          <div
            key={i}
            className="rounded-xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm">{it.name}</div>
              <div className="text-sm opacity-80">{it.price}</div>
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