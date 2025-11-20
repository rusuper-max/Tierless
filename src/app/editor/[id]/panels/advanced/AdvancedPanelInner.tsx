// src/app/editor/[id]/panels/advanced/AdvancedPanelInner.tsx
"use client";

import React, { useState } from "react";
import { t } from "@/i18n";
import { useAdvancedState } from "./useAdvancedState";
import {
  BRAND_GRADIENT,
  type AdvancedNodeKind,
  type BillingPeriod,
  type CardOutlineMode,
  type SelectedHighlightMode,
  type SliderColorMode,
  type AdvancedTierCtaKind,
} from "./types";

import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Puzzle,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";

type UiMode = "simple" | "advanced";

function kindLabel(kind: AdvancedNodeKind) {
  if (kind === "tier") return t("Tier");
  if (kind === "addon") return t("Addon");
  if (kind === "item") return t("Item");
  return t("Slider");
}

function kindIcon(kind: AdvancedNodeKind) {
  if (kind === "tier") return <Layers className="h-3.5 w-3.5" />;
  if (kind === "addon") return <Puzzle className="h-3.5 w-3.5" />;
  if (kind === "item") return <ListChecks className="h-3.5 w-3.5" />;
  return <SlidersHorizontal className="h-3.5 w-3.5" />;
}

const BILLING_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "once", label: "One-time" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

const CTA_KIND_OPTIONS: { value: AdvancedTierCtaKind; label: string }[] = [
  { value: "link", label: "Link / URL" },
  { value: "checkout", label: "Checkout (later)" },
  { value: "email", label: "Email" },
  { value: "none", label: "None" },
];

export default function AdvancedPanelInner() {
  const [uiMode, setUiMode] = useState<UiMode>("simple");

  const {
    // data
    nodes,
    selectedId,
    selectedNode,
    advancedShowInquiry,
    advancedCtaMode,
    advancedLayoutVariant,
    advancedColumnsDesktop,
    advancedShowSummary,
    advancedSummaryPosition,
    advancedPublicTitle,
    advancedPublicSubtitle,
    advancedSupportNote,
    advancedPublicName,
    advancedPublicTheme,
    advancedShowPoweredBy,
    advancedGlobalCtaLabel,
    advancedEnableYearly,
    advancedDefaultBillingPeriod,
    advancedYearlyDiscountPercent,
    advancedCardOutlineMode,
    advancedCardOutlineColor,
    advancedSelectedHighlightMode,
    advancedSelectedHighlightColor,
    advancedSliderColorMode,
    advancedSliderSolidColor,
    // handlers
    setSelectedId,
    handleAddNode,
    handleUpdateNode,
    handleRemoveNode,
    handleMoveNode,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    setAdvancedShowInquiry,
    setAdvancedCtaMode,
    setAdvancedLayoutVariant,
    setAdvancedColumnsDesktop,
    setAdvancedShowSummary,
    setAdvancedSummaryPosition,
    setAdvancedPublicTitle,
    setAdvancedPublicSubtitle,
    setAdvancedSupportNote,
    setAdvancedPublicName,
    setAdvancedPublicTheme,
    setAdvancedShowPoweredBy,
    setAdvancedGlobalCtaLabel,
    setAdvancedEnableYearly,
    setAdvancedDefaultBillingPeriod,
    setAdvancedYearlyDiscountPercent,
    setAdvancedCardOutlineMode,
    setAdvancedCardOutlineColor,
    setAdvancedSelectedHighlightMode,
    setAdvancedSelectedHighlightColor,
    setAdvancedSliderColorMode,
    setAdvancedSliderSolidColor,
    formatPrice,
  } = useAdvancedState();

  /* ---------------------------------------------------------------------- */
  /*  Top bar: Simple / Advanced + kratki hint                              */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex h-full flex-col gap-4 p-3 sm:p-4 text-[13px]">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("Public price page")}
          </div>
          <div className="text-sm text-[var(--muted)]">
            {t("Configure how your public pricing page looks and behaves.")}
          </div>
        </div>

        <div className="inline-flex rounded-full bg-[var(--bg)] p-0.5 text-[11px] gap-1">
          {(["simple", "advanced"] as UiMode[]).map((mode) => {
            const active = uiMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setUiMode(mode)}
                className={`relative inline-flex items-center justify-center rounded-full px-2.5 py-1 font-medium transition ${
                  active ? "text-[var(--text)]" : "text-[var(--muted)]"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      padding: 1.5,
                      background: BRAND_GRADIENT,
                      WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />
                )}
                <span className="relative z-[1]">
                  {mode === "simple" ? t("Simple") : t("Advanced")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN GRID: left = meta, right = blocks editor */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
        {/* LEFT SIDE – PAGE META & GLOBAL SETTINGS */}
        <div className="space-y-4">
          {/* Page identity */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("Page identity")}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Internal name")}
                </label>
                <input
                  type="text"
                  value={advancedPublicName}
                  onChange={(e) => setAdvancedPublicName(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                  placeholder={t("My main pricing page")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Title")}
                </label>
                <input
                  type="text"
                  value={advancedPublicTitle}
                  onChange={(e) => setAdvancedPublicTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                  placeholder={t("Choose the plan that fits your business")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Subtitle")}
                </label>
                <input
                  type="text"
                  value={advancedPublicSubtitle}
                  onChange={(e) => setAdvancedPublicSubtitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                  placeholder={t("Transparent pricing with no surprises.")}
                />
              </div>

              {uiMode === "advanced" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--muted)]">
                    {t("Support / note at the bottom")}
                  </label>
                  <textarea
                    value={advancedSupportNote}
                    onChange={(e) => setAdvancedSupportNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)] resize-none"
                    placeholder={t(
                      "Prices exclude VAT. Custom enterprise options available on request."
                    )}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Theme & layout */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("Theme & layout")}
              </h3>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Page theme")}
                </label>
                <select
                  value={advancedPublicTheme}
                  onChange={(e) =>
                    setAdvancedPublicTheme(
                      e.target.value === "dark"
                        ? "dark"
                        : e.target.value === "tierless"
                          ? "tierless"
                          : "light"
                    )
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                >
                  <option value="light">{t("Light")}</option>
                  <option value="dark">{t("Dark")}</option>
                  <option value="tierless">{t("Tierless Branding")}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Layout")}
                </label>
                <select
                  value={advancedLayoutVariant}
                  onChange={(e) =>
                    setAdvancedLayoutVariant(e.target.value || "pricingGrid")
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                >
                  <option value="pricingGrid">
                    {t("Pricing grid (default)")}
                  </option>
                  <option value="stacked">{t("Stacked tiers")}</option>
                  <option value="comparison">
                    {t("Three-panel comparison")}
                  </option>
                  <option value="wizard" disabled>
                    {t("Wizard (coming later)")}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Columns on desktop")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={advancedColumnsDesktop}
                  onChange={(e) =>
                    setAdvancedColumnsDesktop(
                      Math.max(
                        1,
                        Math.min(4, Number.parseInt(e.target.value || "3", 10))
                      )
                    )
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Show summary box")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="show-summary"
                    type="checkbox"
                    checked={advancedShowSummary}
                    onChange={(e) => setAdvancedShowSummary(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor="show-summary"
                    className="text-[12px] text-[var(--text)]"
                  >
                    {t("Show total on the side / bottom")}
                  </label>
                </div>

                {advancedShowSummary && (
                  <div className="mt-1 flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAdvancedSummaryPosition("right")}
                      className={`flex-1 rounded-full border px-2 py-1 ${
                        advancedSummaryPosition === "right"
                          ? "border-[var(--brand-1,#4F46E5)] text-[var(--text)]"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {t("Right")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdvancedSummaryPosition("bottom")}
                      className={`flex-1 rounded-full border px-2 py-1 ${
                        advancedSummaryPosition === "bottom"
                          ? "border-[var(--brand-1,#4F46E5)] text-[var(--text)]"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {t("Bottom")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Billing & yearly */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("Billing & yearly")}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="enable-yearly"
                  type="checkbox"
                  checked={advancedEnableYearly}
                  onChange={(e) =>
                    setAdvancedEnableYearly(e.target.checked)
                  }
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor="enable-yearly"
                  className="text-[12px] text-[var(--text)]"
                >
                  {t("Offer yearly billing with discount")}
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--muted)]">
                    {t("Default billing period")}
                  </label>
                  <select
                    value={advancedDefaultBillingPeriod}
                    onChange={(e) =>
                      setAdvancedDefaultBillingPeriod(
                        (e.target.value as BillingPeriod) || "month"
                      )
                    }
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                  >
                    {BILLING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {advancedEnableYearly && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted)]">
                      {t("Yearly discount (%)")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={advancedYearlyDiscountPercent ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setAdvancedYearlyDiscountPercent(null);
                          return;
                        }
                        const num = Number(raw);
                        setAdvancedYearlyDiscountPercent(
                          Number.isNaN(num) ? null : Math.min(100, Math.max(0, num))
                        );
                      }}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                    />
                    <p className="text-[11px] text-[var(--muted)]">
                      {t("Example: 20 = 2 months free on yearly.")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CTA & Powered by + brand knobs */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("CTA & branding")}
              </h3>
            </div>

            <div className="space-y-3">
              {/* CTA */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("Global CTA label")}
                </label>
                <input
                  type="text"
                  value={advancedGlobalCtaLabel}
                  onChange={(e) =>
                    setAdvancedGlobalCtaLabel(e.target.value)
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                  placeholder={t("Send inquiry")}
                />
                <p className="text-[11px] text-[var(--muted)]">
                  {t(
                    "Tiers can override this CTA label individually later."
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--muted)]">
                  {t("CTA mode")}
                </label>
                <select
                  value={advancedCtaMode}
                  onChange={(e) =>
                    setAdvancedCtaMode(e.target.value || "inquiry")
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                >
                  <option value="inquiry">
                    {t("Inquiry / contact only")}
                  </option>
                  <option value="checkout" disabled>
                    {t("Checkout (coming later)")}
                  </option>
                  <option value="both" disabled>
                    {t("Both (coming later)")}
                  </option>
                </select>
              </div>

              {/* Powered by */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <div className="space-y-0.5">
                  <div className="text-[12px] font-medium text-[var(--text)]">
                    {t("Show “Powered by Tierless” badge")}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    {t(
                      "Free plan may always show it. Paid plans can turn it off."
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={advancedShowPoweredBy}
                  onChange={(e) =>
                    setAdvancedShowPoweredBy(e.target.checked)
                  }
                  className="h-3.5 w-3.5"
                />
              </div>

              {uiMode === "advanced" && (
                <>
                  {/* Card outline */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted)]">
                      {t("Card outline style")}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-[1.2fr_minmax(0,1fr)]">
                      <select
                        value={advancedCardOutlineMode}
                        onChange={(e) =>
                          setAdvancedCardOutlineMode(
                            (e.target.value as CardOutlineMode) || "brand"
                          )
                        }
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                      >
                        <option value="brand">
                          {t("Brand gradient")}
                        </option>
                        <option value="solid">
                          {t("Solid color")}
                        </option>
                        <option value="none">
                          {t("No outline")}
                        </option>
                        <option value="gradient" disabled>
                          {t("Custom gradient (later)")}
                        </option>
                      </select>

                      {advancedCardOutlineMode === "solid" && (
                        <input
                          type="text"
                          placeholder={t("#4F46E5 or rgb(...)")}
                          value={advancedCardOutlineColor || ""}
                          onChange={(e) =>
                            setAdvancedCardOutlineColor(e.target.value)
                          }
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Selected highlight */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted)]">
                      {t("Selected card highlight")}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-[1.2fr_minmax(0,1fr)]">
                      <select
                        value={advancedSelectedHighlightMode}
                        onChange={(e) =>
                          setAdvancedSelectedHighlightMode(
                            (e.target.value as SelectedHighlightMode) ||
                              "brandGlow"
                          )
                        }
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                      >
                        <option value="brandGlow">
                          {t("Brand glow (default)")}
                        </option>
                        <option value="solidBg">
                          {t("Solid background")}
                        </option>
                        <option value="shadow">
                          {t("Strong shadow")}
                        </option>
                        <option value="outlineGlow">
                          {t("Outline glow")}
                        </option>
                      </select>

                      {(advancedSelectedHighlightMode === "solidBg" ||
                        advancedSelectedHighlightMode === "outlineGlow") && (
                        <input
                          type="text"
                          placeholder={t("#22D3EE")}
                          value={advancedSelectedHighlightColor || ""}
                          onChange={(e) =>
                            setAdvancedSelectedHighlightColor(
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Slider color */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted)]">
                      {t("Slider color")}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-[1.2fr_minmax(0,1fr)]">
                      <select
                        value={advancedSliderColorMode}
                        onChange={(e) =>
                          setAdvancedSliderColorMode(
                            (e.target.value as SliderColorMode) || "brand"
                          )
                        }
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                      >
                        <option value="brand">
                          {t("Brand gradient")}
                        </option>
                        <option value="solid">{t("Solid color")}</option>
                        <option value="gradient" disabled>
                          {t("Custom gradient (later)")}
                        </option>
                      </select>

                      {advancedSliderColorMode === "solid" && (
                        <input
                          type="text"
                          placeholder={t("#4F46E5")}
                          value={advancedSliderSolidColor || ""}
                          onChange={(e) =>
                            setAdvancedSliderSolidColor(
                              e.target.value ? e.target.value : null
                            )
                          }
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Summary / Inquiry toggles – simple ali korisno */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("Summary & inquiry")}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="show-inquiry"
                  type="checkbox"
                  checked={advancedShowInquiry}
                  onChange={(e) =>
                    setAdvancedShowInquiry(e.target.checked)
                  }
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor="show-inquiry"
                  className="text-[12px] text-[var(--text)]"
                >
                  {t("Show inquiry / contact CTA on public page")}
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT SIDE – BLOCKS (TIERS / ADDONS / ITEMS / SLIDERS) */}
        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("Blocks")}
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                {t(
                  "Add tiers, addons, items and sliders. These will appear on your public page."
                )}
              </p>
            </div>

            <div className="flex gap-1.5">
              <BlockAddButton
                label={t("Tier")}
                kind="tier"
                onAdd={handleAddNode}
              />
              <BlockAddButton
                label={t("Addon")}
                kind="addon"
                onAdd={handleAddNode}
              />
              <BlockAddButton
                label={t("Item")}
                kind="item"
                onAdd={handleAddNode}
              />
              <BlockAddButton
                label={t("Slider")}
                kind="slider"
                onAdd={handleAddNode}
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
            {/* List of nodes */}
            <div className="space-y-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] max-h-[320px] overflow-auto">
                {nodes.length === 0 ? (
                  <div className="px-3 py-4 text-[12px] text-[var(--muted)]">
                    {t(
                      "No blocks yet. Start by adding a tier or addon on the right."
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {nodes.map((node, idx) => {
                      const isSelected = node.id === selectedId;
                      return (
                        <li
                          key={node.id}
                         className={`relative flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-2xl ${
                            isSelected
                              ? "shadow-[0_8px_24px_rgba(15,23,42,0.18)]"
                              : "hover:bg-[var(--surface)] rounded-xl"
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundImage:
                                    "linear-gradient(120deg, rgba(79,70,229,0.15), rgba(45,212,191,0.12))",
                                  border: "1px solid rgba(79,70,229,0.25)",
                                }
                              : undefined
                          }
                          onClick={() => setSelectedId(node.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
                              {node.iconEmoji ? (
                                <span className="text-xs leading-none">
                                  {node.iconEmoji}
                                </span>
                              ) : (
                                kindIcon(node.kind)
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="truncate text-[13px] text-[var(--text)]">
                                  {node.label ||
                                    (node.kind === "tier"
                                      ? t("Untitled tier")
                                      : node.kind === "addon"
                                      ? t("Untitled addon")
                                      : node.kind === "item"
                                      ? t("Untitled item")
                                      : t("Untitled slider"))}
                                </span>
                                {node.kind === "tier" &&
                                  node.emphasis === "featured" && (
                                    <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--muted)]">
                                      {t("Featured")}
                                    </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                <span>{kindLabel(node.kind)}</span>
                                {node.kind !== "slider" &&
                                  typeof node.price === "number" && (
                                    <>
                                      <span>·</span>
                                      <span>
                                        {formatPrice(node.price, {
                                          billing:
                                            node.billingPeriod || "once",
                                          unitLabel: node.unitLabel || null,
                                        })}
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>
                          </div>

                          <div className="ml-auto flex items-center gap-1 text-[var(--muted)]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNode(node.id, -1);
                              }}
                              className="rounded-full p-1 hover:bg-[var(--surface)] cursor-pointer"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNode(node.id, +1);
                              }}
                              className="rounded-full p-1 hover:bg-[var(--surface)] cursor-pointer"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveNode(node.id);
                              }}
                              className="rounded-full p-1 hover:bg-red-500/10 text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Inspector */}
            <div className="space-y-2">
              {!selectedNode ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-6 text-center text-[12px] text-[var(--muted)]">
                  {t(
                    "Select a block on the left to edit its details, price and style."
                  )}
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)]">
                        {selectedNode.iconEmoji ? (
                          <span className="text-sm leading-none">
                            {selectedNode.iconEmoji}
                          </span>
                        ) : (
                          kindIcon(selectedNode.kind)
                        )}
                      </span>
                      <div>
                        <div className="text-[12px] font-medium text-[var(--text)]">
                          {kindLabel(selectedNode.kind)}
                        </div>
                        <div className="text-[10px] text-[var(--muted)]">
                          {t("Block settings")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic fields */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[var(--muted)]">
                        {t("Label")}
                      </label>
                      <input
                        type="text"
                        value={selectedNode.label || ""}
                        onChange={(e) =>
                          handleUpdateNode(selectedNode.id, {
                            label: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[var(--muted)]">
                        {t("Description")}
                      </label>
                      <textarea
                        value={selectedNode.description || ""}
                        onChange={(e) =>
                          handleUpdateNode(selectedNode.id, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)] resize-none"
                      />
                    </div>

                    {selectedNode.kind !== "slider" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted)]">
                            {t("Price")}
                          </label>
                          <input
                            type="number"
                            value={
                              typeof selectedNode.price === "number"
                                ? selectedNode.price
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                price: e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted)]">
                            {t("Billing")}
                          </label>
                          <select
                            value={selectedNode.billingPeriod || "once"}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                billingPeriod: e.target
                                  .value as BillingPeriod,
                              })
                            }
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          >
                            {BILLING_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {t(opt.label)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {(selectedNode.kind === "tier" ||
                      selectedNode.kind === "addon" ||
                      selectedNode.kind === "slider") && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[var(--muted)]">
                          {t("Unit label")}
                        </label>
                        <input
                          type="text"
                          value={selectedNode.unitLabel || ""}
                          onChange={(e) =>
                            handleUpdateNode(selectedNode.id, {
                              unitLabel: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          placeholder={t("per project, per hour…")}
                        />
                      </div>
                    )}

                    {/* Slider-specific */}
                    {selectedNode.kind === "slider" && (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <NumberField
                          label={t("Min")}
                          value={
                            typeof selectedNode.min === "number"
                              ? selectedNode.min
                              : ""
                          }
                          onChange={(val) =>
                            handleUpdateNode(selectedNode.id, {
                              min:
                                val === "" || Number.isNaN(Number(val))
                                  ? null
                                  : Number(val),
                            })
                          }
                        />
                        <NumberField
                          label={t("Max")}
                          value={
                            typeof selectedNode.max === "number"
                              ? selectedNode.max
                              : ""
                          }
                          onChange={(val) =>
                            handleUpdateNode(selectedNode.id, {
                              max:
                                val === "" || Number.isNaN(Number(val))
                                  ? null
                                  : Number(val),
                            })
                          }
                        />
                        <NumberField
                          label={t("Step")}
                          value={
                            typeof selectedNode.step === "number"
                              ? selectedNode.step
                              : ""
                          }
                          onChange={(val) =>
                            handleUpdateNode(selectedNode.id, {
                              step:
                                val === "" || Number.isNaN(Number(val))
                                  ? null
                                  : Number(val),
                            })
                          }
                        />
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted)]">
                            {t("Price per step")}
                          </label>
                          <input
                            type="number"
                            value={
                              typeof selectedNode.pricePerStep === "number"
                                ? selectedNode.pricePerStep
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                pricePerStep:
                                  e.target.value === "" ||
                                  Number.isNaN(Number(e.target.value))
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          />
                          {typeof selectedNode.pricePerStep === "number" && (
                            <p className="text-[11px] text-[var(--muted)]">
                              {t("Example preview")}:{" "}
                              {formatPrice(selectedNode.pricePerStep, {
                                billing: selectedNode.billingPeriod || null,
                                unitLabel: selectedNode.unitLabel || null,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Include in total */}
                    <div className="flex items-center gap-2">
                      <input
                        id="include-total"
                        type="checkbox"
                        checked={
                          selectedNode.includeInTotal !== false
                        }
                        onChange={(e) =>
                          handleUpdateNode(selectedNode.id, {
                            includeInTotal: e.target.checked,
                          })
                        }
                        className="h-3.5 w-3.5"
                      />
                      <label
                        htmlFor="include-total"
                        className="text-[12px] text-[var(--text)]"
                      >
                        {t("Include this block in total estimate")}
                      </label>
                    </div>
                  </div>

                  {/* Features for tiers */}
                  {selectedNode.kind === "tier" && (
                    <div className="space-y-2 pt-2 border-t border-dashed border-[var(--border)] mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-medium text-[var(--muted)]">
                          {t("Features")}
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddFeature(selectedNode.id)
                          }
                          className="relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-[var(--text)] cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(2,6,23,.12)]"
                          style={{ border: "1px solid transparent" }}
                        >
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-full"
                            style={{
                              padding: 1,
                              background: BRAND_GRADIENT,
                              WebkitMask:
                                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                              WebkitMaskComposite: "xor",
                              maskComposite: "exclude",
                              opacity: 0.9,
                            }}
                          />
                          <span className="relative z-[1] inline-flex items-center gap-1">
                            <Plus className="h-3 w-3" />
                            {t("Add")}
                          </span>
                        </button>
                      </div>

                      {(!selectedNode.features ||
                        selectedNode.features.length === 0) && (
                        <p className="text-[11px] text-[var(--muted)]">
                          {t(
                            "Add bullet points to describe what this tier includes."
                          )}
                        </p>
                      )}

                      {selectedNode.features &&
                        selectedNode.features.length > 0 && (
                          <div className="space-y-1.5 max-h-[140px] overflow-auto pr-1">
                            {selectedNode.features.map((feat) => (
                              <div
                                key={feat.id}
                                className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
                              >
                                <input
                                  type="text"
                                  value={feat.label || ""}
                                  onChange={(e) =>
                                    handleUpdateFeature(
                                      selectedNode.id,
                                      feat.id,
                                      { label: e.target.value }
                                    )
                                  }
                                  className="flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12px] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                                  placeholder={t("Feature")}
                                />
                                <label className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                  <input
                                    type="checkbox"
                                    checked={feat.highlighted || false}
                                    onChange={(e) =>
                                      handleUpdateFeature(
                                        selectedNode.id,
                                        feat.id,
                                        { highlighted: e.target.checked }
                                      )
                                    }
                                    className="h-3 w-3"
                                  />
                                  {t("Highlight")}
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveFeature(
                                      selectedNode.id,
                                      feat.id
                                    )
                                  }
                                  className="rounded-full p-1 hover:bg-red-500/10 text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Advanced styling per node – samo u advanced modu */}
                  {uiMode === "advanced" && (
                    <div className="space-y-2 pt-2 border-t border-dashed border-[var(--border)] mt-2">
                      <div className="text-[11px] font-medium text-[var(--muted)]">
                        {t("Advanced styling & CTA")}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedNode.kind === "tier" && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-[var(--muted)]">
                              {t("Emphasis")}
                            </label>
                            <select
                              value={selectedNode.emphasis || "normal"}
                              onChange={(e) =>
                                handleUpdateNode(selectedNode.id, {
                                  emphasis: e.target.value as any,
                                })
                              }
                              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                            >
                              <option value="normal">
                                {t("Normal")}
                              </option>
                              <option value="featured">
                                {t("Featured")}
                              </option>
                              <option value="subtle">
                                {t("Subtle")}
                              </option>
                            </select>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted)]">
                            {t("Card variant")}
                          </label>
                          <select
                            value={selectedNode.cardVariant || "solid"}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                cardVariant: e.target.value as any,
                              })
                            }
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          >
                            <option value="solid">
                              {t("Solid")}
                            </option>
                            <option value="outline">
                              {t("Outline")}
                            </option>
                            <option value="ghost">
                              {t("Ghost")}
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted)]">
                            {t("Accent color")}
                          </label>
                          <input
                            type="text"
                            value={selectedNode.accentColor || ""}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                accentColor: e.target.value || null,
                              })
                            }
                            placeholder={t("#4F46E5 or leave empty")}
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted)]">
                            {t("Title text color")}
                          </label>
                          <input
                            type="text"
                            value={selectedNode.textColor || ""}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                textColor: e.target.value || null,
                              })
                            }
                            placeholder={t("Use default if empty")}
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input
                            id="accent-outline"
                            type="checkbox"
                            checked={selectedNode.useAccentOutline !== false}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                useAccentOutline: e.target.checked,
                              })
                            }
                            className="h-3.5 w-3.5"
                          />
                          <label
                            htmlFor="accent-outline"
                            className="text-[12px] text-[var(--text)]"
                          >
                            {t("Use accent color on card outline")}
                          </label>
                        </div>

                        {/* CTA po tieru */}
                        {(selectedNode.kind === "tier" ||
                          selectedNode.kind === "addon") && (
                          <>
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-[var(--muted)]">
                                {t("CTA label override")}
                              </label>
                              <input
                                type="text"
                                value={selectedNode.ctaLabel || ""}
                                onChange={(e) =>
                                  handleUpdateNode(selectedNode.id, {
                                    ctaLabel: e.target.value || null,
                                  })
                                }
                                placeholder={t("Leave empty to use global")}
                                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-[var(--muted)]">
                                {t("CTA kind")}
                              </label>
                              <select
                                value={selectedNode.ctaKind || "link"}
                                onChange={(e) =>
                                  handleUpdateNode(selectedNode.id, {
                                    ctaKind: e.target
                                      .value as AdvancedTierCtaKind,
                                  })
                                }
                                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                              >
                                {CTA_KIND_OPTIONS.map((opt) => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={
                                      opt.value === "checkout"
                                    }
                                  >
                                    {t(opt.label)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[11px] font-medium text-[var(--muted)]">
                                {t("CTA URL / target")}
                              </label>
                              <input
                                type="text"
                                value={selectedNode.ctaUrl || ""}
                                onChange={(e) =>
                                  handleUpdateNode(selectedNode.id, {
                                    ctaUrl: e.target.value || null,
                                  })
                                }
                                placeholder={t("https://... or mailto:...")}
                                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number | string;
  onChange: (val: string) => void;
};

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-[var(--muted)]">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-[var(--brand-1,#4F46E5)]"
      />
    </div>
  );
}

type BlockAddButtonProps = {
  label: string;
  kind: AdvancedNodeKind;
  onAdd: (kind: AdvancedNodeKind) => void;
};

function BlockAddButton({ label, kind, onAdd }: BlockAddButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd(kind)}
      className="relative inline-flex items-center gap-1 rounded-full bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--text)] cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.12)]"
      style={{ border: "1px solid transparent" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          padding: 1,
          background: BRAND_GRADIENT,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.9,
        }}
      />
      <span className="relative z-[1] inline-flex items-center gap-1">
        <Plus className="h-3 w-3" />
        {label}
      </span>
    </button>
  );
}
