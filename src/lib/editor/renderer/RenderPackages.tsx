// src/lib/editor/renderer/RenderPackages.tsx
"use client";

import { t } from "@/i18n";

/* ------------------------------------------------------------------ */
/* RenderPackages - MVP                                                */
/* ------------------------------------------------------------------ */

export default function RenderPackages({
  title,
  data,
  mode,
}: {
  title?: string;
  data?: any;
  mode: "editor" | "public";
}) {
  const layout = data?.layout ?? "cards-3";

  const grid =
    layout === "cards-4"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : layout === "list"
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  // Fake demo cards dok ne vežemo prave packages iz calc.packages
  const demo = [
    { name: "Basic", price: "€149", features: [t("Email inquiries"), t("1 page link")] },
    { name: "Standard", price: "€299", features: [t("Brand colors"), t("Analytics lite")] },
    { name: "Business", price: t("Custom"), features: [t("Fair use traffic"), t("Advanced formulas")] },
  ];

  return (
    <section>
      <SectionTitle>{title ?? t("Packages")}</SectionTitle>
      <div className={`grid gap-4 ${grid}`}>
        {demo.map((p, i) => (
          <article
            key={i}
            className="rounded-2xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-4"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold">{p.name}</h3>
              <div className="text-sm opacity-80">{p.price}</div>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-[var(--muted,#9aa0a6)]">
              {p.features.map((f, ix) => (
                <li key={ix}>• {f}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-sm font-medium">
      {children}
    </div>
  );
}