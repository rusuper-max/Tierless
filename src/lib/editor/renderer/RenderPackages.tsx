// src/lib/editor/renderer/RenderPackages.tsx
"use client";

import { useMemo } from "react";
import { t } from "@/i18n";
import type { CalcJson, FeatureOption, OptionGroup } from "@/hooks/useEditorStore";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeAccent(value?: string | null): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return undefined;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-sm font-medium">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* RenderPackages                                                     */
/* ------------------------------------------------------------------ */

export default function RenderPackages({
  title,
  data,
  mode,
  calc,
}: {
  title?: string;
  data?: any;
  mode: "editor" | "public";
  calc: CalcJson;
}) {
  const layout = data?.layout ?? "cards-3";

  const grid =
    layout === "cards-4"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : layout === "list"
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  const packages = Array.isArray(calc?.packages) ? calc.packages : [];

  const fields = Array.isArray(calc?.fields) ? calc.fields : [];

  const featuresByPkg = useMemo(() => {
    const map = new Map<string, OptionGroup>();
    fields.forEach((g: any) => {
      if (g && g.type === "features" && g.pkgId) {
        map.set(g.pkgId as string, g as OptionGroup);
      }
    });
    return map;
  }, [fields]);

  const hasRealPackages = packages.length > 0;

  // Fallback demo ako još nema pravih paketa
  const demo = [
    { name: "Basic", price: "€149", features: [t("Email inquiries"), t("1 page link")] },
    {
      name: "Standard",
      price: "€299",
      features: [t("Brand colors"), t("Analytics lite")],
    },
    {
      name: "Business",
      price: t("Custom"),
      features: [t("Fair use traffic"), t("Advanced formulas")],
    },
  ];

  return (
    <section>
      <SectionTitle>{title ?? t("Packages")}</SectionTitle>

      <div className={`grid gap-4 ${grid}`}>
        {hasRealPackages
          ? packages.map((p: any, idx: number) => {
              const accent = normalizeAccent(p.color);
              const isFeatured = !!p.featured;

              const group = featuresByPkg.get(p.id);
              const featureList: FeatureOption[] =
                group && Array.isArray(group.options)
                  ? (group.options as FeatureOption[])
                  : [];

              const price =
                typeof p.basePrice === "number"
                  ? `${p.basePrice}`
                  : t("Custom");

              return (
                <article
                  key={p.id ?? idx}
                  className={`relative rounded-2xl border p-4 bg-[color-mix(in_oklab,var(--bg,#020617)_85%,#000000_15%)] ${
                    isFeatured ? "scale-[1.01]" : ""
                  }`}
                  style={{
                    borderColor: accent
                      ? accent
                      : "color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)",
                    boxShadow: accent
                      ? `0 0 0 1px ${accent}33, 0 18px 45px ${accent}26`
                      : "0 10px 30px rgba(15,23,42,.35)",
                  }}
                >
                  {/* Mali top pill za featured / accent */}
                  {(isFeatured || accent) && (
                    <div
                      className="pointer-events-none absolute -top-3 left-4 h-1.5 w-16 rounded-full"
                      style={{
                        background: accent
                          ? accent
                          : "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                        boxShadow: accent
                          ? `0 0 12px ${accent}80`
                          : "0 0 12px rgba(56,189,248,.8)",
                      }}
                    />
                  )}

                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        {p.label || t("Tier")}
                      </h3>
                      {p.description && (
                        <p className="mt-1 text-xs text-[var(--muted,#9aa0a6)]">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium opacity-85">
                      {price}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-[var(--muted,#9aa0a6)]">
                    {featureList.length > 0 ? (
                      featureList.map((f) => (
                        <li key={f.id}>• {f.label || t("Feature")}</li>
                      ))
                    ) : (
                      <li className="opacity-70">
                        • {t("Add features in the editor")}
                      </li>
                    )}
                  </ul>
                </article>
              );
            })
          : demo.map((p, i) => (
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