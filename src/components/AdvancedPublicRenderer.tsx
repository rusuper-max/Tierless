// src/components/AdvancedPublicRenderer.tsx
"use client";

import React, { useMemo, useState, useEffect, type CSSProperties } from "react";
import type { CalcJson } from "@/hooks/useEditorStore";
import { t } from "@/i18n";
import {
  Layers,
  Puzzle,
  SlidersHorizontal,
  ListChecks,
  ArrowRight,
} from "lucide-react";

import {
  BRAND_GRADIENT,
  type AdvancedNode,
  type AdvancedNodeKind,
  type AdvancedLayoutVariant,
  type AdvancedSummaryPosition,
  type AdvancedPublicMeta,
  type AdvancedTheme,
  type BillingPeriod,
  type SliderColorMode,
} from "@/app/editor/[id]/panels/advanced/types";

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

function renderKindIcon(kind: AdvancedNodeKind) {
  if (kind === "tier") return <Layers className="h-3.5 w-3.5" />;
  if (kind === "addon") return <Puzzle className="h-3.5 w-3.5" />;
  if (kind === "item") return <ListChecks className="h-3.5 w-3.5" />;
  return <SlidersHorizontal className="h-3.5 w-3.5" />;
}

/* -------------------------------------------------------------------------- */
/* Tier card                                                                  */
/* -------------------------------------------------------------------------- */

type TierCardProps = {
  node: AdvancedNode;
  isActive: boolean;
  onSelect: () => void;
  formatPrice: (v: number | null | undefined, o?: any) => string;
  billingMode: BillingPeriod;
  enableYearly: boolean;
  yearlyDiscountPercent: number | null;
  theme: AdvancedTheme;
};

function getTierEffectivePrice(
  node: AdvancedNode,
  billingMode: BillingPeriod,
  enableYearly: boolean,
  yearlyDiscountPercent: number | null
): { price: number | null; billingForLabel: BillingPeriod | null } {
  if (typeof node.price !== "number") return { price: null, billingForLabel: null };

  const period = node.billingPeriod || "once";

  if (!enableYearly || billingMode === "month" || period !== "month") {
    return { price: node.price, billingForLabel: period };
  }

  // yearly view + node je month -> izračunaj yearly sa popustom
  const discount =
    typeof yearlyDiscountPercent === "number"
      ? Math.min(100, Math.max(0, yearlyDiscountPercent))
      : 0;

  const yearlyBase = node.price * 12;
  const yearlyPrice =
    discount > 0 ? yearlyBase * (1 - discount / 100) : yearlyBase;

  return { price: yearlyPrice, billingForLabel: "year" };
}

function TierCard({
  node,
  isActive,
  onSelect,
  formatPrice,
  billingMode,
  enableYearly,
  yearlyDiscountPercent,
  theme,
}: TierCardProps) {
  const accent = node.accentColor || "var(--brand-1,#4F46E5)";
  const textColor = node.textColor || "var(--text)";
  const variant = node.cardVariant || "solid";
  const emphasis = node.emphasis || "normal";
  const useAccentOutline = node.useAccentOutline !== false;

  const baseBg =
    theme === "tierless"
      ? "linear-gradient(135deg, rgba(13,16,48,0.95), rgba(5,8,25,0.9))"
      : theme === "dark"
        ? "rgba(10,13,24,0.96)"
        : "var(--card)";

  let borderColor =
    theme === "light"
      ? "var(--border)"
      : theme === "tierless"
        ? "rgba(125,136,255,0.45)"
        : "rgba(148,163,184,.35)";
  let bg: string | undefined = baseBg;
  let boxShadow =
    theme === "light"
      ? "0 12px 28px rgba(15,23,42,.18)"
      : theme === "tierless"
        ? "0 22px 55px rgba(5,8,30,.75)"
        : "0 20px 35px rgba(2,6,23,.55)";
  const restingShadow =
    theme === "light"
      ? "0 6px 16px rgba(15,23,42,.18)"
      : theme === "tierless"
        ? "0 14px 30px rgba(2,6,32,.7)"
        : "0 10px 24px rgba(4,6,20,.65)";

  if (variant === "outline") {
    borderColor = useAccentOutline ? accent : borderColor;
    bg =
      theme === "light"
        ? "var(--bg)"
        : theme === "tierless"
          ? "rgba(8,11,35,0.8)"
          : "rgba(6,9,18,0.6)";
  } else if (variant === "ghost") {
    borderColor = "transparent";
    bg =
      theme === "light"
        ? "transparent"
        : theme === "tierless"
          ? "rgba(5,9,26,0.35)"
          : "transparent";
    boxShadow =
      theme === "light"
        ? "0 8px 20px rgba(15,23,42,.20)"
        : theme === "tierless"
          ? "0 20px 40px rgba(3,7,30,.75)"
          : "0 12px 32px rgba(0,0,0,.65)";
  }

  if (emphasis === "featured") {
    boxShadow =
      theme === "light"
        ? "0 18px 40px rgba(15,23,42,.35)"
        : theme === "tierless"
          ? "0 35px 85px rgba(4,9,42,.85)"
          : "0 25px 60px rgba(2,6,23,.75)";
  } else if (emphasis === "subtle") {
    boxShadow =
      theme === "light"
        ? "0 8px 18px rgba(15,23,42,.18)"
        : theme === "tierless"
          ? "0 12px 24px rgba(4,6,24,.6)"
          : "0 15px 30px rgba(2,6,23,.58)";
  }

  const { price, billingForLabel } = getTierEffectivePrice(
    node,
    billingMode,
    enableYearly,
    yearlyDiscountPercent
  );

  const priceStr =
    typeof price === "number"
      ? formatPrice(price, {
          billing: billingForLabel,
          unitLabel: node.unitLabel,
        })
      : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full text-left rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 transition transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-1,#4F46E5)]"
      style={{
        borderColor: isActive
          ? "transparent"
          : useAccentOutline && variant !== "ghost"
          ? borderColor
          : "var(--border)",
        background: isActive
          ? `radial-gradient(circle at 0 0, rgba(79,70,229,.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.18), transparent 55%), ${bg}`
          : bg,
        boxShadow: isActive ? boxShadow : restingShadow,
      }}
    >
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-xs">
                {node.iconEmoji ? (
                  <span className="leading-none">{node.iconEmoji}</span>
                ) : (
                  renderKindIcon("tier")
                )}
              </span>
              <div className="min-w-0">
                <div
                  className="text-sm sm:text-base font-semibold truncate"
                  style={{ color: textColor }}
                >
                  {node.label || t("Untitled tier")}
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  {t("Tier")}
                  {billingForLabel && billingForLabel !== "once"
                    ? ` · ${
                        billingForLabel === "month"
                          ? t("Billed monthly")
                          : t("Billed yearly")
                      }`
                    : ""}
                </div>
              </div>
              {node.badgeText && (
                <span
                  className="inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    borderColor: node.badgeColor || accent,
                    color: node.badgeColor || accent,
                    backgroundColor: "rgba(15,23,42,0.02)",
                  }}
                >
                  {node.badgeText}
                </span>
              )}
            </div>

            {node.description && (
              <p className="text-xs sm:text-[13px] text-[var(--muted)]">
                {node.description}
              </p>
            )}
          </div>

          {priceStr && (
            <div className="ml-2 text-right shrink-0">
              <div className="text-sm sm:text-lg font-semibold text-[var(--text)]">
                {priceStr}
              </div>
            </div>
          )}
        </div>

        {node.features && node.features.length > 0 && (
          <ul className="mt-1 space-y-1 text-[11px] sm:text-xs">
            {node.features.map((feat) => {
              if (!feat.label && !feat.highlighted) return null;
              if (feat.highlighted) {
                return (
                  <li key={feat.id}>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        borderColor: accent,
                        color: accent,
                        backgroundColor: "rgba(15,23,42,0.02)",
                      }}
                    >
                      {feat.label || t("Feature")}
                    </span>
                  </li>
                );
              }

              return (
                <li key={feat.id}>
                  <span className="inline-flex items-center text-[var(--muted)]">
                    <span className="mr-2 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
                    <span>{feat.label || t("Feature")}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Addon card                                                                 */
/* -------------------------------------------------------------------------- */

type AddonCardProps = {
  node: AdvancedNode;
  checked: boolean;
  onToggle: () => void;
  formatPrice: (v: number | null | undefined, o?: any) => string;
  billingMode: BillingPeriod;
  enableYearly: boolean;
  yearlyDiscountPercent: number | null;
};

function getAddonEffectivePrice(
  node: AdvancedNode,
  billingMode: BillingPeriod,
  enableYearly: boolean,
  yearlyDiscountPercent: number | null
): { price: number | null; billingForLabel: BillingPeriod | null } {
  if (typeof node.price !== "number") return { price: null, billingForLabel: null };
  const period = node.billingPeriod || "once";

  if (!enableYearly || billingMode === "month" || period !== "month") {
    return { price: node.price, billingForLabel: period };
  }

  const discount =
    typeof yearlyDiscountPercent === "number"
      ? Math.min(100, Math.max(0, yearlyDiscountPercent))
      : 0;

  const yearlyBase = node.price * 12;
  const yearlyPrice =
    discount > 0 ? yearlyBase * (1 - discount / 100) : yearlyBase;

  return { price: yearlyPrice, billingForLabel: "year" };
}

function AddonCard({
  node,
  checked,
  onToggle,
  formatPrice,
  billingMode,
  enableYearly,
  yearlyDiscountPercent,
}: AddonCardProps) {
  const { price, billingForLabel } = getAddonEffectivePrice(
    node,
    billingMode,
    enableYearly,
    yearlyDiscountPercent
  );

  const priceStr =
    typeof price === "number"
      ? formatPrice(price, {
          billing: billingForLabel,
          unitLabel: node.unitLabel,
        })
      : "";

  return (
    <label
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
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
              {node.iconEmoji ? (
                <span className="text-xs leading-none">{node.iconEmoji}</span>
              ) : (
                renderKindIcon("addon")
              )}
            </span>
            <span className="font-medium text-[var(--text)] truncate">
              {node.label || t("Untitled addon")}
            </span>
          </div>
          {node.description && (
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {node.description}
            </p>
          )}
        </div>
      </div>

      {priceStr && (
        <div className="ml-2 text-right text-xs sm:text-sm font-semibold text-[var(--text)] whitespace-nowrap">
          +{priceStr}
        </div>
      )}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Slider block                                                               */
/* -------------------------------------------------------------------------- */

type SliderBlockProps = {
  node: AdvancedNode;
  value: number;
  onChange: (v: number) => void;
  formatPrice: (v: number | null | undefined, o?: any) => string;
  sliderColorMode: SliderColorMode;
  sliderSolidColor: string | null;
};

function SliderBlock({
  node,
  value,
  onChange,
  formatPrice,
  sliderColorMode,
  sliderSolidColor,
}: SliderBlockProps) {
  const min = typeof node.min === "number" ? node.min : 0;
  const max = typeof node.max === "number" ? node.max : 100;
  const step = typeof node.step === "number" && node.step > 0 ? node.step : 1;

  const pricePerStepStr =
    typeof node.pricePerStep === "number"
      ? formatPrice(node.pricePerStep, {
          billing: node.billingPeriod || "once",
          unitLabel: node.unitLabel,
        })
      : "";

  const added =
    typeof node.pricePerStep === "number" ? value * node.pricePerStep : 0;

  const addedStr =
    added > 0
      ? formatPrice(added, {
          billing: node.billingPeriod || "once",
          unitLabel: node.unitLabel,
        })
      : "";

  const fillGradient =
    sliderColorMode === "brand"
      ? `linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))`
      : sliderColorMode === "solid" && sliderSolidColor
        ? `linear-gradient(90deg,${sliderSolidColor},${sliderSolidColor})`
        : `linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-1,#4F46E5))`;

  const percent =
    max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
            {node.iconEmoji ? (
              <span className="text-xs leading-none">{node.iconEmoji}</span>
            ) : (
              renderKindIcon("slider")
            )}
          </span>
          <div>
            <div className="text-sm font-medium text-[var(--text)]">
              {node.label || t("Untitled slider")}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {t("Range")} {min} – {max}
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] text-[var(--muted)] space-y-0.5">
          <div>
            {t("Current")}: {value}
          </div>
          {pricePerStepStr && (
            <div>
              {t("Price per step")}: {pricePerStepStr}
            </div>
          )}
          {addedStr && (
            <div>
              {t("Adds")}: {addedStr}
            </div>
          )}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-[var(--track)]"
        style={{
          backgroundImage: `${fillGradient}, linear-gradient(var(--track), var(--track))`,
          backgroundSize: `${percent}% 100%, 100% 100%`,
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

type SummaryProps = {
  total: number;
  hasAnyBlocks: boolean;
  formatPrice: (v: number | null | undefined, o?: any) => string;
  showInquiry: boolean;
  theme: AdvancedTheme;
};

function Summary({
  total,
  hasAnyBlocks,
  formatPrice,
  showInquiry,
  theme,
}: SummaryProps) {
  if (!hasAnyBlocks) return null;

  const summaryShadow =
    theme === "tierless"
      ? "0 28px 65px rgba(5,8,30,.75)"
      : theme === "dark"
        ? "0 18px 40px rgba(2,6,23,.5)"
        : "0 12px 30px rgba(15,23,42,.12)";

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3"
      style={{ boxShadow: summaryShadow }}
    >
      <div className="space-y-0.5">
        <div className="text-xs sm:text-sm text-[var(--muted)]">
          {t("Estimated total")}
        </div>
        <div className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
          {formatPrice(total)}
        </div>
        <p className="text-[11px] sm:text-xs text-[var(--muted)]">
          {t(
            "This is a rough estimate based on selected packages and extras."
          )}
        </p>
      </div>

      {showInquiry && (
        <button
          type="button"
          className="relative inline-flex items-center justify-center rounded-full bg-[var(--card)] px-4 py-2 text-sm sm:text-base text-[var(--text)] mt-1"
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
          <span className="relative z-[1] font-medium inline-flex items-center gap-1.5">
            {t("Send inquiry")}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>
      )}
    </section>
  );
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
              // ... unutar {tierNodes.map((tier) => { ...
              <TierCard
                key={tier.id}
                node={tier}
                isActive={isActive}
                onSelect={() => setSelectedTierId(tier.id)}
                formatPrice={formatPrice}
                billingMode={billingMode}
                enableYearly={enableYearly}
                yearlyDiscountPercent={yearlyDiscountPercent}
                theme={publicTheme} // <--- OVO SI ZABORAVIO, DODAJ OVO
              />
// ...
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
          ["--bg" as any]: "#020617",
          ["--card" as any]: "rgba(8,11,34,0.92)",
          ["--border" as any]: "rgba(99,102,241,0.45)",
          ["--text" as any]: "#e0e7ff",
          ["--muted" as any]: "rgba(203,213,255,0.8)",
          ["--surface" as any]: "rgba(79,70,229,0.25)",
          ["--track" as any]: "rgba(79,70,229,0.4)",
          ["--brand-1" as any]: "#4F46E5",
          ["--brand-2" as any]: "#22D3EE",
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
            "radial-gradient(circle at 5% 0%, rgba(79,70,229,0.25), transparent 45%), radial-gradient(circle at 95% 0%, rgba(34,211,238,0.22), transparent 55%)",
          backgroundColor: "#020617",
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
