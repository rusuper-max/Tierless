// src/components/PublicRenderer.tsx
"use client";

import React from "react";
import type { CalcJson, OptionGroup, Pkg } from "@/hooks/useEditorStore";

type ColorMode = "solid" | "gradient";

function useCurrency(calc?: CalcJson) {
  const cur = calc?.i18n?.currency ?? "€";
  const decimals = Number.isFinite(calc?.i18n?.decimals)
    ? (calc!.i18n!.decimals as number)
    : 0;
  const fmt = (n: number | null | undefined) =>
    `${cur}${Number(n ?? 0).toFixed(decimals)}`;
  return { cur, decimals, fmt };
}

export default function PublicRenderer({ calc }: { calc: CalcJson }) {
  const mode = calc?.meta?.editorMode || "advanced";
  const { fmt } = useCurrency(calc);

  /* ------------ SIMPLE LIST MODE ------------ */
  if (mode === "simple") {
    const items = calc.items ?? [];
    const addons = calc.addons ?? [];
    return (
      <div className="space-y-6">
        {/* Items */}
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--card)]">
          <table className="w-full text-sm">
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="border-b last:border-b-0 border-[var(--border)]"
                >
                  <td className="p-3">
                    <div className="font-medium text-[var(--text)]">
                      {it.label}
                    </div>
                    {it.note ? (
                      <div className="text-[var(--muted)] text-xs mt-0.5">
                        {it.note}
                      </div>
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
          <div className="rounded-2xl border border-[var(--border)] p-3 bg-[var(--card)]">
            <div className="text-sm font-medium text-[var(--text)] mb-2">
              Extras
            </div>
            <ul className="space-y-1 text-sm">
              {addons.map((x) => (
                <li
                  key={x.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-[var(--text)]">{x.text}</span>
                  <span className="text-[var(--text)] font-semibold">
                    {fmt(x.price ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  /* ------------ TIERS / ADVANCED MODE ------------ */
  const pkgs: Pkg[] = calc.packages ?? [];
  const featByPkg = new Map<string, OptionGroup>();
  (calc.fields ?? []).forEach((g) => {
    if (g.type === "features" && g.pkgId) featByPkg.set(g.pkgId, g);
  });

  if (!pkgs.length) {
    return (
      <div className="text-sm text-[var(--muted)]">
        Nothing to show yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {pkgs.map((p) => {
        const group = featByPkg.get(p.id);
        const feats = (group?.options ?? []).filter(Boolean);

        // raw accent iz editora
        const rawAccent = (p as any).color || "#14b8a6";
        const rawColor2 = (p as any).color2 || "var(--brand-2,#22D3EE)";
        const accentEnabled = !!p.featured; // "Use accent color on card outline"

        // efektivna accent boja – samo ako je uključeno
        const accent = accentEnabled ? rawAccent : "var(--border)";
        const color2 = accentEnabled ? rawColor2 : "var(--border)";

        const rawMode = (p as any).colorMode as
          | ColorMode
          | "animated"
          | undefined;
        const colorMode: ColorMode =
          rawMode === "gradient" ? "gradient" : "solid";

        const rounded = (p as any).rounded;
        const priceText: string | undefined = (p as any).priceText;
        const cardRadiusClass =
          rounded === false ? "rounded-2xl" : "rounded-[30px]";

        // Common header/body part
        const content = (
          <div
            className={`${cardRadiusClass} h-full bg-[var(--card)] border border-[var(--border)] p-4 flex flex-col`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: accentEnabled ? accent : "var(--muted)" }}
                />
                <div className="text-sm font-semibold text-[var(--text)]">
                  {p.label}
                </div>
              </div>
              {priceText ? (
                <div className="text-base font-semibold text-[var(--text)]">
                  {priceText}
                </div>
              ) : null}
            </div>

            {p.description ? (
              <div className="mt-1 text-xs text-[var(--muted)]">
                {p.description}
              </div>
            ) : null}

            {feats.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {feats.map((f: any) => (
                  <li key={f.id}>
                    {f.highlighted ? (
                      colorMode === "gradient" ? (
                        <span
                          className="inline-flex rounded-full p-[1px]"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${accent}, ${color2})`,
                          }}
                        >
                          <span className="rounded-full bg-[var(--card)] px-2 py-0.5 text-xs font-semibold text-[var(--text)]">
                            {f.label}
                          </span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                          style={{
                            borderColor: accent,
                            color: accentEnabled ? accent : "var(--text)",
                          }}
                        >
                          {f.label}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center text-[var(--muted)]">
                        <span
                          className="mr-2 inline-flex h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: accentEnabled
                              ? accent
                              : "var(--border)",
                          }}
                        />
                        <span>{f.label}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button
              className="mt-4 w-full relative inline-flex items-center justify-center rounded-full bg-[var(--card)] px-3 py-2 text-sm group"
              title="Select"
              type="button"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  padding: 1.5,
                  background:
                    colorMode === "solid"
                      ? `linear-gradient(90deg,${accent},${accent})`
                      : `linear-gradient(135deg,${accent},${color2})`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor" as any,
                  maskComposite: "exclude",
                  borderRadius: "9999px",
                }}
              />
              <span className="relative z-[1] text-[var(--text)]">
                {`Choose ${p.label ?? ""}`}
              </span>
            </button>
          </div>
        );

        // SOLID: običan border + opcioni accent za featured
        if (colorMode === "solid") {
          return (
            <div
              key={p.id}
              className={`${cardRadiusClass} h-full border p-0 bg-[var(--card)]`}
              style={
                accentEnabled
                  ? {
                      borderColor: accent,
                      boxShadow: `0 0 0 1px ${accent}10`,
                    }
                  : undefined
              }
            >
              {content}
            </div>
          );
        }

        // GRADIENT: wrapper sa gradient outline (neutralan ako accent nije uključen)
        return (
          <div
            key={p.id}
            className={`${cardRadiusClass} h-full p-[1.5px]`}
            style={{
              backgroundImage: `linear-gradient(135deg, ${accent}, ${color2})`,
            }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}