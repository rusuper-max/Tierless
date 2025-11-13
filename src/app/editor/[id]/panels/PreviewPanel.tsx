// src/app/editor/[id]/panels/PreviewPanel.tsx
"use client";

import React from "react";
import { useEditorStore } from "@/hooks/useEditorStore";

/* -------------------------------------------------- */
/* Helpers                                            */
/* -------------------------------------------------- */
type Money = { currency?: string; decimals?: number };

function fmtMoney(n: number | null | undefined, m?: Money) {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  const currency = m?.currency || "EUR";
  const decimals =
    typeof m?.decimals === "number" ? (m!.decimals as number) : 0;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n));
}

function cardClass() {
  return (
    "rounded-2xl border border-[var(--border,#e5e7eb)] bg-[var(--card,white)] p-5 shadow-sm"
  );
}

/* -------------------------------------------------- */
/* Preview                                            */
/* -------------------------------------------------- */
export default function PreviewPanel() {
  const calc = useEditorStore((s) => s.calc);

  if (!calc) {
    return (
      <div className="text-sm text-[var(--muted,#6b7280)]">
        Nothing to preview yet.
      </div>
    );
  }

  const money: Money = {
    currency: calc?.i18n?.currency || "EUR",
    decimals:
      typeof calc?.i18n?.decimals === "number" ? calc.i18n!.decimals : 0,
  };

  // Legacy “items” list support (for Tierless list mode)
  const legacyItems: any[] = Array.isArray((calc as any).items)
    ? (calc as any).items
    : [];

  const packages = Array.isArray(calc.packages) ? calc.packages : [];
  const featureGroups = Array.isArray(calc.fields)
    ? calc.fields.filter((g) => g.type === "features")
    : [];

  // Prefer blocks if user bude imao blocks kasnije — fallback na legacy
  const blocks: any[] = Array.isArray((calc as any).blocks)
    ? (calc as any).blocks
    : [];

  const hasPackages = packages.length > 0;
  const hasItems =
    legacyItems.length > 0 ||
    blocks.some((b) => b?.type === "items" && Array.isArray(b?.data?.rows));

  return (
    <div className="space-y-6">
      {/* Title + short hint */}
      <div className="text-[var(--muted)] text-sm">
        This is a live preview of your page.
      </div>

      {/* Packages (tiers) */}
      {hasPackages && (
        <section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((p) => {
              const feats =
                featureGroups.find((g) => g.pkgId === p.id)?.options || [];
              const featured = !!p.featured;
              return (
                <div key={p.id} className={`${cardClass()} relative`}>
                  {featured && (
                    <div
                      className="absolute -inset-0.5 rounded-[18px] -z-10 opacity-30 blur-lg"
                      style={{
                        background:
                          "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                      }}
                      aria-hidden
                    />
                  )}

                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-xl font-semibold text-[var(--text)]">
                      {p.label || "Package"}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {fmtMoney(
                        typeof p.basePrice === "number" ? p.basePrice : null,
                        money
                      )}
                    </div>
                  </div>

                  {p.description ? (
                    <p className="mt-2 text-sm text-[var(--muted)] whitespace-pre-line">
                      {p.description}
                    </p>
                  ) : null}

                  {/* Features list */}
                  {Array.isArray(feats) && feats.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {feats.map((f: any) => (
                        <li
                          key={f.id}
                          className="flex items-start gap-2 text-sm text-[var(--text)]"
                        >
                          <span
                            className="mt-1 inline-block size-[6px] rounded-full"
                            style={{
                              background:
                                "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                            }}
                            aria-hidden
                          />
                          <span className="opacity-90">{f.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      No features yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Simple list (Tierless) */}
      {hasItems && (
        <section>
          <h3 className="text-base font-medium text-[var(--text)] mb-3">
            Price list
          </h3>
          <div
            className={`divide-y rounded-2xl border border-[var(--border)] bg-[var(--card)]`}
          >
            {/* Blocks first if postoje */}
            {blocks
              .filter((b) => b?.type === "items")
              .flatMap((b) =>
                Array.isArray(b?.data?.rows) ? b.data.rows : []
              )
              .map((r: any, i: number) => (
                <div
                  key={r.id || `b-${i}`}
                  className="flex items-center justify-between gap-4 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text)]">
                      {r.label || r.id || `Item #${i + 1}`}
                    </div>
                    {r.note ? (
                      <div className="text-xs text-[var(--muted)]">
                        {r.note}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {fmtMoney(r.price, money)}
                  </div>
                </div>
              ))}

            {/* Legacy items fallback */}
            {legacyItems.map((r: any, i: number) => (
              <div
                key={r.id || `l-${i}`}
                className="flex items-center justify-between gap-4 p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-[var(--text)]">
                    {r.label || r.id || `Item #${i + 1}`}
                  </div>
                  {r.note ? (
                    <div className="text-xs text-[var(--muted)]">{r.note}</div>
                  ) : null}
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {fmtMoney(r.price, money)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasPackages && !hasItems && (
        <div className={`${cardClass()} text-sm text-[var(--muted)]`}>
          Nothing to show yet. Add packages, features or items in the editor.
        </div>
      )}
    </div>
  );
}