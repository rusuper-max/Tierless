// src/components/PublicRenderer.tsx
"use client";

import React from "react";
import type { CalcJson, OptionGroup, Pkg } from "@/hooks/useEditorStore";

function useCurrency(calc?: CalcJson) {
  const cur = calc?.i18n?.currency ?? "€";
  const decimals = Number.isFinite(calc?.i18n?.decimals) ? (calc!.i18n!.decimals as number) : 0;
  const fmt = (n: number | null | undefined) =>
    `${cur}${Number(n ?? 0).toFixed(decimals)}`;
  return { cur, decimals, fmt };
}

export default function PublicRenderer({ calc }: { calc: CalcJson }) {
  const mode = calc?.meta?.editorMode || "advanced";
  const { fmt } = useCurrency(calc);

  if (mode === "simple") {
    // List-based price page
    const items = calc.items ?? [];
    const addons = calc.addons ?? [];
    return (
      <div className="space-y-6">
        {/* Items */}
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-b-0 border-[var(--border)]">
                  <td className="p-3">
                    <div className="font-medium text-[var(--text)]">{it.label}</div>
                    {it.note ? (
                      <div className="text-[var(--muted)] text-xs mt-0.5">{it.note}</div>
                    ) : null}
                  </td>
                  <td className="p-3 text-right font-semibold text-[var(--text)]">
                    {fmt(it.price ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras */}
        {addons.length > 0 && (
          <div className="rounded-2xl border border-[var(--border)] p-3">
            <div className="text-sm font-medium text-[var(--text)] mb-2">Extras</div>
            <ul className="space-y-1 text-sm">
              {addons.map((x) => (
                <li key={x.id} className="flex items-center justify-between">
                  <span className="text-[var(--text)]">{x.text}</span>
                  <span className="text-[var(--text)] font-semibold">{fmt(x.price ?? 0)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Tiers / Advanced
  const pkgs: Pkg[] = calc.packages ?? [];
  const featByPkg = new Map<string, OptionGroup>();
  (calc.fields ?? []).forEach((g) => {
    if (g.type === "features" && g.pkgId) featByPkg.set(g.pkgId, g);
  });

  if (!pkgs.length) {
    return <div className="text-sm text-[var(--muted)]">Nothing to show yet.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {pkgs.map((p) => {
        const g = featByPkg.get(p.id);
        const feats = (g?.options ?? []).filter(Boolean);
        return (
          <div
            key={p.id}
            className={`rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] ${
              p.featured ? "ring-1 ring-[var(--brand-2)]" : ""
            }`}
          >
            <div className="text-sm text-[var(--muted)]">{p.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--text)]">
              {fmt(p.basePrice ?? 0)}
            </div>
            {p.description ? (
              <div className="mt-1 text-[var(--muted)] text-sm">{p.description}</div>
            ) : null}

            {feats.length > 0 && (
              <ul className="mt-3 space-y-1">
                {feats.map((f) => (
                  <li
                    key={f.id}
                    className={`text-sm ${
                      f.highlighted ? "font-medium text-[var(--text)]" : "text-[var(--muted)]"
                    }`}
                  >
                    • {f.label}
                  </li>
                ))}
              </ul>
            )}

            <button
              className="mt-4 w-full relative inline-flex items-center justify-center rounded-full bg-[var(--card)] px-3 py-2 text-sm group"
              title="Select"
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={{
                padding: 1.5,
                background:
                  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor" as any,
                maskComposite: "exclude",
                borderRadius: "9999px",
              }} />
              <span className="relative z-[1] text-[var(--text)]">Choose {p.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}