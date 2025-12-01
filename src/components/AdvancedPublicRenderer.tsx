// src/components/AdvancedPublicRenderer.tsx
"use client";

import React, { useMemo, useState, useEffect, type CSSProperties } from "react";
import type { CalcJson } from "@/hooks/useEditorStore";
import { t } from "@/i18n";

import {
  BRAND_GRADIENT,
  type AdvancedNode,
  type AdvancedLayoutVariant,
  type AdvancedSummaryPosition,
  type AdvancedPublicMeta,
  type AdvancedTheme,
  type BillingPeriod,
  type SliderColorMode,
} from "@/app/editor/[id]/panels/advanced/types";

import { TierCard, getTierEffectivePrice } from "./scrolly/blocks/TierCard";
import { AddonCard, getAddonEffectivePrice } from "./scrolly/blocks/AddonCard";
import { SliderBlock } from "./scrolly/blocks/SliderBlock";
import { Summary } from "./scrolly/blocks/Summary";

type CurrencyPosition = "prefix" | "suffix";

function useCurrencyFormat(calc?: CalcJson) {
  const cur = calc?.i18n?.currency ?? "€";
  const decimalsConf =
    typeof calc?.i18n?.decimals === "number" &&
      Number.isFinite(calc.i18n.decimals)
      ? (calc!.i18n!.decimals as number)
      : 0;

  const position: CurrencyPosition =
    (calc?.i18n as any)?.currencyPosition === "suffix" ? "suffix" : "prefix";

  const space = (calc?.i18n as any)?.currencySpace === false ? "" : " ";

  const formatPrice = (
    val: number | null | undefined,
    opts?: {
      billing?: BillingPeriod | null;
      unitLabel?: string | null;
    }
  ) => {
    if (val === null || typeof val !== "number" || Number.isNaN(val)) {
      return "";
    }

    const abs = Math.abs(val);
    const hasFraction = Math.round(abs) !== abs;

    const usedDecimals =
      decimalsConf && decimalsConf > 0 ? decimalsConf : hasFraction ? 2 : 0;

    const factor = Math.pow(10, usedDecimals);
    const norm = Math.round(val * factor) / factor;
    const numberStr = norm.toFixed(usedDecimals);

    let base =
      position === "prefix"
        ? `${cur}${space}${numberStr}`
        : `${numberStr}${space}${cur}`;

    let suffix = "";
    if (opts?.billing === "month") suffix = "/month";
    else if (opts?.billing === "year") suffix = "/year";

    if (opts?.unitLabel) {
      suffix = suffix ? `${suffix} · ${opts.unitLabel}` : opts.unitLabel;
    }

    return suffix ? `${base} ${suffix}` : base;
  };

  return { formatPrice };
}

/* -------------------------------------------------------------------------- */
/* Main renderer                                                              */
/* -------------------------------------------------------------------------- */

export default function AdvancedPublicRenderer({ calc }: { calc: CalcJson }) {
  const metaRaw = (calc.meta || {}) as AdvancedPublicMeta & {
    advancedNodes?: AdvancedNode[];
    // legacy keys:
    advancedLayoutVariant?: any;
    advancedColumnsDesktop?: number;
    advancedShowSummary?: boolean;
    advancedSummaryPosition?: any;
    advancedShowInquiry?: boolean;
    advancedPublicTitle?: string;
    advancedPublicSubtitle?: string;
    advancedSupportNote?: string;
    publicTheme?: string;
  };

  const { formatPrice } = useCurrencyFormat(calc);

  const nodes: AdvancedNode[] = Array.isArray(metaRaw.advancedNodes)
    ? (metaRaw.advancedNodes as AdvancedNode[])
    : [];

  const tierNodes = useMemo(
    () => nodes.filter((n) => n.kind === "tier"),
    [nodes]
  );
  const addonNodes = useMemo(
    () => nodes.filter((n) => n.kind === "addon"),
    [nodes]
  );
  const itemNodes = useMemo(
    () => nodes.filter((n) => n.kind === "item"),
    [nodes]
  );
  const sliderNodes = useMemo(
    () => nodes.filter((n) => n.kind === "slider"),
    [nodes]
  );

  const advancedLayoutVariant: AdvancedLayoutVariant =
    metaRaw.layoutVariant === "stacked" ||
      metaRaw.layoutVariant === "comparison" ||
      metaRaw.layoutVariant === "wizard" ||
      metaRaw.advancedLayoutVariant === "stacked" ||
      metaRaw.advancedLayoutVariant === "comparison" ||
      metaRaw.advancedLayoutVariant === "wizard"
      ? (metaRaw.layoutVariant ?? metaRaw.advancedLayoutVariant)
      : "pricingGrid";

  const advancedColumnsDesktop: number =
    typeof metaRaw.columnsDesktop === "number"
      ? metaRaw.columnsDesktop
      : typeof metaRaw.advancedColumnsDesktop === "number"
        ? metaRaw.advancedColumnsDesktop
        : 3;

  const advancedShowSummary: boolean =
    (metaRaw.showSummary as boolean | undefined) ??
    (metaRaw.advancedShowSummary as boolean | undefined) ??
    true;

  const advancedSummaryPosition: AdvancedSummaryPosition =
    metaRaw.summaryPosition === "bottom" ||
      metaRaw.advancedSummaryPosition === "bottom"
      ? "bottom"
      : "right";

  const advancedShowInquiry: boolean =
    (metaRaw.showInquiry as boolean | undefined) ??
    (metaRaw.advancedShowInquiry as boolean | undefined) ??
    true;

  const title =
    typeof metaRaw.publicTitle === "string"
      ? metaRaw.publicTitle.trim()
      : typeof metaRaw.advancedPublicTitle === "string"
        ? metaRaw.advancedPublicTitle.trim()
        : "";

  const description =
    typeof metaRaw.publicDescription === "string"
      ? metaRaw.publicDescription.trim()
      : typeof metaRaw.publicSubtitle === "string"
        ? metaRaw.publicSubtitle.trim()
        : typeof metaRaw.advancedPublicSubtitle === "string"
          ? metaRaw.advancedPublicSubtitle.trim()
          : "";

  const supportNote =
    typeof metaRaw.supportNote === "string"
      ? metaRaw.supportNote.trim()
      : typeof metaRaw.advancedSupportNote === "string"
        ? metaRaw.advancedSupportNote.trim()
        : "";

  const publicTheme: AdvancedTheme =
    metaRaw.publicTheme === "tierless"
      ? "tierless"
      : metaRaw.theme === "dark" || metaRaw.publicTheme === "dark"
        ? "dark"
        : "light";

  const showPoweredBy: boolean =
    metaRaw.showPoweredBy ?? true;

  const enableYearly: boolean = metaRaw.enableYearly ?? false;

  const defaultBillingPeriod: BillingPeriod =
    metaRaw.defaultBillingPeriod ?? "month";

  const yearlyDiscountPercent: number | null =
    typeof metaRaw.yearlyDiscountPercent === "number"
      ? metaRaw.yearlyDiscountPercent
      : null;

  const sliderColorMode: SliderColorMode =
    (metaRaw.sliderColorMode as SliderColorMode) ?? "brand";

  const sliderSolidColor: string | null =
    metaRaw.sliderSolidColor ?? null;

  const hasAnyBlocks =
    tierNodes.length > 0 ||
    addonNodes.length > 0 ||
    itemNodes.length > 0 ||
    sliderNodes.length > 0;

  const [selectedTierId, setSelectedTierId] = useState<string | null>(() => {
    if (tierNodes.length === 0) return null;
    const featured = tierNodes.find((t) => t.emphasis === "featured");
    return (featured || tierNodes[0]).id;
  });

  useEffect(() => {
    if (!tierNodes.length) {
      setSelectedTierId(null);
      return;
    }
    if (!selectedTierId || !tierNodes.some((t) => t.id === selectedTierId)) {
      const featured = tierNodes.find((t) => t.emphasis === "featured");
      setSelectedTierId((featured || tierNodes[0]).id);
    }
  }, [tierNodes, selectedTierId]);

  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    () => new Set()
  );

  const [billingMode, setBillingMode] = useState<BillingPeriod>(
    enableYearly ? defaultBillingPeriod : "month"
  );

  useEffect(() => {
    if (!enableYearly && billingMode !== "month") {
      setBillingMode("month");
    }
  }, [enableYearly, billingMode]);

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      sliderNodes.forEach((s) => {
        const min = typeof s.min === "number" ? s.min : 0;
        initial[s.id] = min;
      });
      return initial;
    }
  );

  useEffect(() => {
    setSliderValues((prev) => {
      const next: Record<string, number> = { ...prev };
      sliderNodes.forEach((s) => {
        if (!(s.id in next)) {
          const min = typeof s.min === "number" ? s.min : 0;
          next[s.id] = min;
        }
      });
      return next;
    });
  }, [sliderNodes]);

  const selectedTier =
    tierNodes.find((t) => t.id === selectedTierId) ?? null;

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
      const { price } = getTierEffectivePrice(
        selectedTier,
        billingMode,
        enableYearly,
        yearlyDiscountPercent
      );
      if (typeof price === "number" && selectedTier.includeInTotal !== false) {
        sum += price;
      }
    }

    selectedAddonIds.forEach((id) => {
      const addon = addonNodes.find((a) => a.id === id);
      if (!addon || typeof addon.price !== "number") return;
      if (addon.includeInTotal === false) return;

      const { price } = getAddonEffectivePrice(
        addon,
        billingMode,
        enableYearly,
        yearlyDiscountPercent
      );
      if (typeof price === "number") {
        sum += price;
      }
    });

    sliderNodes.forEach((s) => {
      if (typeof s.pricePerStep !== "number") return;
      if (s.includeInTotal === false) return;
      const val = sliderValues[s.id] ?? (typeof s.min === "number" ? s.min : 0);
      sum += val * s.pricePerStep;
    });

    return sum;
  }, [
    selectedTier,
    addonNodes,
    selectedAddonIds,
    sliderNodes,
    sliderValues,
    billingMode,
    enableYearly,
    yearlyDiscountPercent,
  ]);

  if (!nodes.length) {
    return (
      <div className="text-sm text-[var(--muted)]">
        {t("This advanced page does not have any blocks yet.")}
      </div>
    );
  }

  const poweredBy = showPoweredBy ? (
    <div className="flex justify-start">
      <a
        href="https://tierless.net"
        target="_blank"
        rel="noreferrer"
        className="relative inline-flex items-center gap-1.5 rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--muted)] hover:text-[var(--text)] transition"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            padding: 1,
            background: BRAND_GRADIENT,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any,
            maskComposite: "exclude",
          }}
        />
        <span className="relative z-[1] font-medium">
          {t("Powered by Tierless")}
        </span>
      </a>
    </div>
  ) : null;

  const tierGridCols =
    advancedColumnsDesktop === 1
      ? "lg:grid-cols-1"
      : advancedColumnsDesktop === 2
        ? "lg:grid-cols-2"
        : advancedColumnsDesktop === 4
          ? "lg:grid-cols-4"
          : "lg:grid-cols-3";

  const tiersSection =
    tierNodes.length > 0 ? (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
            {t("Choose a package")}
          </h2>

          {enableYearly && (
            <div className="inline-flex rounded-full bg-[var(--bg)] border border-[var(--border)] p-0.5 text-[11px] sm:text-xs">
              {(["month", "year"] as BillingPeriod[]).map((mode) => {
                const active = billingMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBillingMode(mode)}
                    className="relative cursor-pointer inline-flex items-center justify-center px-3 py-1 rounded-full transition text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                          padding: 1,
                          background: BRAND_GRADIENT,
                          WebkitMask:
                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                          WebkitMaskComposite: "xor" as any,
                          maskComposite: "exclude",
                        }}
                      />
                    )}
                    <span className="relative z-[1] font-medium">
                      {mode === "month" ? t("Monthly") : t("Yearly")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`grid gap-4 sm:grid-cols-2 ${tierGridCols} items-stretch`}
        >
          {tierNodes.map((tier) => {
            const isActive = tier.id === selectedTierId;
            return (
              <TierCard
                key={tier.id}
                node={tier}
                isActive={isActive}
                onSelect={() => setSelectedTierId(tier.id)}
                formatPrice={formatPrice}
                billingMode={billingMode}
                enableYearly={enableYearly}
                yearlyDiscountPercent={yearlyDiscountPercent}
                theme={publicTheme}
              />
            );
          })}
        </div>
      </section>
    ) : null;

  const addonsSection =
    addonNodes.length > 0 ? (
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text)]">
          {t("Extras")}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {addonNodes.map((addon) => {
            const checked = selectedAddonIds.has(addon.id);
            return (
              <AddonCard
                key={addon.id}
                node={addon}
                checked={checked}
                onToggle={() => toggleAddon(addon.id)}
                formatPrice={formatPrice}
                billingMode={billingMode}
                enableYearly={enableYearly}
                yearlyDiscountPercent={yearlyDiscountPercent}
              />
            );
          })}
        </div>
      </section>
    ) : null;

  const itemsSection =
    itemNodes.length > 0 ? (
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text)]">
          {t("Included items")}
        </h3>
        <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--text)]">
          {itemNodes.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
            >
              <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface)]">
                {item.iconEmoji ? (
                  <span className="text-[11px] leading-none">
                    {item.iconEmoji}
                  </span>
                ) : (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[11px] sm:text-xs text-[var(--text)]">
                  {item.label || t("Untitled item")}
                </div>
                {item.description && (
                  <p className="text-[11px] text-[var(--muted)]">
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  const slidersSection =
    sliderNodes.length > 0 ? (
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text)]">
          {t("Sliders")}
        </h3>
        <div className="space-y-3">
          {sliderNodes.map((s) => (
            <SliderBlock
              key={s.id}
              node={s}
              value={
                sliderValues[s.id] ??
                (typeof s.min === "number" ? s.min : 0)
              }
              onChange={(v) =>
                setSliderValues((prev) => ({ ...prev, [s.id]: v }))
              }
              formatPrice={formatPrice}
              sliderColorMode={sliderColorMode}
              sliderSolidColor={sliderSolidColor}
            />
          ))}
        </div>
      </section>
    ) : null;

  const summarySection =
    advancedShowSummary && hasAnyBlocks ? (
      <Summary
        total={total}
        hasAnyBlocks={hasAnyBlocks}
        formatPrice={formatPrice}
        showInquiry={advancedShowInquiry}
        theme={publicTheme}
      />
    ) : null;

  const mainContent =
    advancedLayoutVariant === "pricingGrid" &&
      advancedSummaryPosition === "right" ? (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
        <div className="space-y-5">
          {tiersSection}
          {addonsSection}
          {itemsSection}
          {slidersSection}
        </div>
        {summarySection}
      </div>
    ) : (
      <div className="space-y-5">
        {tiersSection}
        {addonsSection}
        {itemsSection}
        {slidersSection}
        {summarySection}
      </div>
    );

  const themeVars: CSSProperties =
    publicTheme === "tierless"
      ? {
        ["--bg" as any]: "#020410", // Deeper, richer black/blue
        ["--card" as any]: "rgba(13, 16, 35, 0.7)", // More transparent for glass effect
        ["--border" as any]: "rgba(99, 102, 241, 0.2)", // Subtler border
        ["--text" as any]: "#e0e7ff",
        ["--muted" as any]: "#94a3b8",
        ["--surface" as any]: "rgba(255, 255, 255, 0.03)",
        ["--track" as any]: "rgba(30, 41, 59, 0.5)",
        ["--brand-1" as any]: "#6366f1", // Indigo 500
        ["--brand-2" as any]: "#06b6d4", // Cyan 500
        ["--glass" as any]: "rgba(13, 16, 35, 0.6)",
        ["--glass-hover" as any]: "rgba(13, 16, 35, 0.8)",
      }
      : publicTheme === "dark"
        ? {
          ["--bg" as any]: "#05060f",
          ["--card" as any]: "rgba(10,14,28,0.96)",
          ["--border" as any]: "rgba(148,163,184,0.28)",
          ["--text" as any]: "#f8fafc",
          ["--muted" as any]: "#a5b4fc",
          ["--surface" as any]: "rgba(148,163,184,0.15)",
          ["--track" as any]: "rgba(148,163,184,0.3)",
          ["--brand-1" as any]: "#818cf8",
          ["--brand-2" as any]: "#22D3EE",
        }
        : {
          ["--bg" as any]: "#f8fafc",
          ["--card" as any]: "#ffffff",
          ["--border" as any]: "#e2e8f0",
          ["--text" as any]: "#0f172a",
          ["--muted" as any]: "#64748b",
          ["--surface" as any]: "rgba(15,23,42,0.05)",
          ["--track" as any]: "rgba(15,23,42,0.12)",
          ["--brand-1" as any]: "#4F46E5",
          ["--brand-2" as any]: "#22D3EE",
        };

  const wrapperStyle: CSSProperties =
    publicTheme === "tierless"
      ? {
        ...themeVars,
        backgroundImage:
          "radial-gradient(circle at 15% 0%, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at 85% 0%, rgba(6, 182, 212, 0.15), transparent 40%)",
        backgroundColor: "var(--bg)",
      }
      : themeVars;

  return (
    <div
      className="space-y-5 sm:space-y-6"
      data-public-theme={publicTheme}
      style={wrapperStyle}
    >
      {poweredBy}

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
          {supportNote && (
            <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-1">
              {supportNote}
            </p>
          )}
        </header>
      )}

      {mainContent}
    </div>
  );
}
