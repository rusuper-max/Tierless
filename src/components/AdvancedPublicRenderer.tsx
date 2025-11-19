// src/components/AdvancedPublicRenderer.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { CalcJson } from "@/hooks/useEditorStore";
import { t } from "@/i18n";
import { Layers, Puzzle, SlidersHorizontal } from "lucide-react";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

type AdvancedNodeKind = "tier" | "addon" | "slider";

type AdvancedNode = {
  id: string;
  kind: AdvancedNodeKind;
  label: string;
  description?: string;
  price?: number | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
};

type CurrencyPosition = "prefix" | "suffix";

function useCurrency(calc?: CalcJson) {
  const cur = calc?.i18n?.currency ?? "€";
  const decimals = Number.isFinite(calc?.i18n?.decimals)
    ? (calc!.i18n!.decimals as number)
    : 0;

  const position: CurrencyPosition =
    (calc?.i18n as any)?.currencyPosition === "suffix" ? "suffix" : "prefix";

  const space = (calc?.i18n as any)?.currencySpace === false ? "" : " ";

  const fmt = (n: number | null | undefined) => {
    const amount = Number(n ?? 0).toFixed(decimals);
    return position === "prefix"
      ? `${cur}${space}${amount}`
      : `${amount}${space}${cur}`;
  };

  return { fmt };
}

function renderKindIcon(kind: AdvancedNodeKind) {
  if (kind === "tier") return <Layers className="h-3.5 w-3.5" />;
  if (kind === "addon") return <Puzzle className="h-3.5 w-3.5" />;
  return <SlidersHorizontal className="h-3.5 w-3.5" />;
}

export default function AdvancedPublicRenderer({ calc }: { calc: CalcJson }) {
  const meta = (calc.meta || {}) as any;
  const rawNodes = meta.advancedNodes;
  const nodes: AdvancedNode[] = Array.isArray(rawNodes)
    ? (rawNodes as AdvancedNode[])
    : [];

  const { fmt } = useCurrency(calc);

  const tierNodes = useMemo(
    () => nodes.filter((n) => n.kind === "tier"),
    [nodes]
  );
  const addonNodes = useMemo(
    () => nodes.filter((n) => n.kind === "addon"),
    [nodes]
  );
  const sliderNodes = useMemo(
    () => nodes.filter((n) => n.kind === "slider"),
    [nodes]
  );

  const [selectedTierId, setSelectedTierId] = useState<string | null>(() =>
    tierNodes.length > 0 ? tierNodes[0].id : null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    () => new Set()
  );

  const selectedTier = tierNodes.find((t) => t.id === selectedTierId) ?? null;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = useMemo(() => {
    let sum = 0;

    if (selectedTier && typeof selectedTier.price === "number") {
      sum += selectedTier.price;
    }

    selectedAddonIds.forEach((id) => {
      const addon = addonNodes.find((a) => a.id === id);
      if (addon && typeof addon.price === "number") {
        sum += addon.price;
      }
    });

    // Za sada slideri ne utiču na total – kasnije možemo dodati price-per-unit
    return sum;
  }, [selectedTier, selectedAddonIds, addonNodes]);

  if (!nodes.length) {
    return (
      <div className="text-sm text-[var(--muted)]">
        {t("This advanced page does not have any blocks yet.")}
      </div>
    );
  }

  const title =
    typeof meta.publicTitle === "string" ? meta.publicTitle.trim() : "";

  const description =
    typeof meta.publicDescription === "string"
      ? meta.publicDescription.trim()
      : "";

  return (
    <div className="space-y-6">
      {(title || description) && (
        <header className="space-y-1">
          {title && (
            <h1 className="text-xl font-semibold text-[var(--text)]">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm text-[var(--muted)]">{description}</p>
          )}
        </header>
      )}

      {/* Paketi (tiers) */}
      {tierNodes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
              {t("Choose a package")}
            </h2>
          </div>

          <div className="space-y-3">
            {tierNodes.map((tier) => {
              const isActive = tier.id === selectedTierId;

              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 transition flex items-start justify-between gap-3 ${
                    isActive
                      ? "border-transparent shadow-[0_18px_40px_rgba(15,23,42,.55)]"
                      : "border-[var(--border)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,.35)]"
                  }`}
                  style={
                    isActive
                      ? {
                          background:
                            "radial-gradient(circle at 0 0, rgba(79,70,229,.20), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.18), transparent 55%), var(--card)",
                          boxShadow:
                            "0 18px 40px rgba(15,23,42,.55), 0 0 0 1px rgba(148,163,184,.5)",
                        }
                      : { background: "var(--card)" }
                  }
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)]">
                        {renderKindIcon("tier")}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-[var(--text)] truncate">
                          {tier.label || t("Untitled tier")}
                        </div>
                      </div>
                    </div>

                    {tier.description && (
                      <p className="text-xs sm:text-sm text-[var(--muted)]">
                        {tier.description}
                      </p>
                    )}
                  </div>

                  {typeof tier.price === "number" && (
                    <div className="ml-2 text-right">
                      <div className="text-sm sm:text-base font-semibold text-[var(--text)]">
                        {fmt(tier.price)}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {t("Starting from")}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Addons / extra opcije */}
      {addonNodes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text)]">
            {t("Extras")}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {addonNodes.map((addon) => {
              const checked = selectedAddonIds.has(addon.id);

              return (
                <label
                  key={addon.id}
                  className={`flex items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 text-sm cursor-pointer transition ${
                    checked
                      ? "border-transparent shadow-[0_16px_32px_rgba(15,23,42,.45)]"
                      : "border-[var(--border)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,.30)]"
                  }`}
                  style={
                    checked
                      ? {
                          background:
                            "radial-gradient(circle at 0 0, rgba(79,70,229,.22), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.20), transparent 55%), var(--card)",
                          boxShadow:
                            "0 18px 40px rgba(15,23,42,.55), 0 0 0 1px rgba(148,163,184,.5)",
                        }
                      : { background: "var(--card)" }
                  }
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddon(addon.id)}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
                          {renderKindIcon("addon")}
                        </span>
                        <span className="font-medium text-[var(--text)] truncate">
                          {addon.label || t("Untitled addon")}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {addon.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {typeof addon.price === "number" && (
                    <div className="ml-2 text-right text-xs sm:text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                      +{fmt(addon.price)}
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Slider blokovi – za sada samo vizuelno */}
      {sliderNodes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text)]">
            {t("Sliders")}
          </h3>
          <div className="space-y-3">
            {sliderNodes.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
                      {renderKindIcon("slider")}
                    </span>
                    <span className="text-sm font-medium text-[var(--text)]">
                      {s.label || t("Untitled slider")}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    {t("Range")}{" "}
                    {typeof s.min === "number" ? s.min : 0} –{" "}
                    {typeof s.max === "number" ? s.max : 100}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "50%",
                      backgroundImage: BRAND_GRADIENT,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Total + CTA */}
      {(tierNodes.length > 0 || addonNodes.length > 0) && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm text-[var(--muted)]">
              {t("Estimated total")}
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
              {fmt(total)}
            </div>
          </div>

          <button
            type="button"
            className="relative inline-flex items-center justify-center rounded-full bg-[var(--card)] px-4 py-2 text-sm sm:text-base text-[var(--text)] mt-1 sm:mt-0"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: 1.5,
                background: BRAND_GRADIENT,
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor" as any,
                maskComposite: "exclude",
              }}
            />
            <span className="relative z-[1] font-medium">
              {t("Send inquiry")}
            </span>
          </button>
        </section>
      )}
    </div>
  );
}
