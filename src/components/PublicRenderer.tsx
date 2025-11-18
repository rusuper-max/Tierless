// src/components/PublicRenderer.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { CalcJson, OptionGroup, Pkg } from "@/hooks/useEditorStore";
import AdvancedPublicRenderer from "./AdvancedPublicRenderer";

type ColorMode = "solid" | "gradient";
type CurrencyPosition = "prefix" | "suffix";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

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

  return { cur, decimals, fmt, position, space };
}

type SimpleSection = {
  id: string;
  label: string;
};

export default function PublicRenderer({ calc }: { calc: CalcJson }) {
  const mode = calc?.meta?.editorMode || "advanced";
  const { fmt } = useCurrency(calc);

  // NEW: ako smo u advanced modu i imamo advancedNodes, koristi poseban renderer
  const hasAdvancedNodes =
    mode === "advanced" &&
    Array.isArray((calc as any)?.meta?.advancedNodes) &&
    ((calc as any).meta.advancedNodes as any[]).length > 0;

  if (hasAdvancedNodes) {
    return <AdvancedPublicRenderer calc={calc} />;
  }

  // Selekcija itema za SIMPLE mode
  const [simpleSelectedIds, setSimpleSelectedIds] = useState<Set<string>>(
    () => new Set()
  );

  const toggleSimpleSelection = (id: string) => {
    setSimpleSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const simpleSelectionTotal = useMemo(() => {
    if (!calc || calc.meta?.editorMode !== "simple") return 0;
    const items = (calc.items ?? []) as any[];
    if (!items.length) return 0;
    const priceById = new Map(
      items.map((it: any) => [it.id, Number(it.price ?? 0)])
    );
    let sum = 0;
    simpleSelectedIds.forEach((id) => {
      sum += priceById.get(id) ?? 0;
    });
    return sum;
  }, [calc, simpleSelectedIds]);

  /* ------------ SIMPLE LIST MODE ------------ */
  if (mode === "simple") {
    const items = (calc.items ?? []) as any[];
    const addons = (calc.addons ?? []) as any[];
    const meta = (calc.meta || {}) as any;

    const simpleTitle: string = meta.simpleTitle ?? "";
    const simpleBg: string = meta.simpleBg ?? "";
    const simpleTextColor: string = meta.simpleTextColor ?? "";
    const simpleBorderColor: string = meta.simpleBorderColor ?? "";
    const simpleFont: string = meta.simpleFont ?? "system";
    const simpleFontSize: "sm" | "md" | "lg" = meta.simpleFontSize ?? "md";
    const simpleSpacing: string = meta.simpleSpacing ?? "cozy";
    const showTierlessBadge: boolean = meta.simpleShowBadge ?? true;
    const simpleDots: boolean = meta.simpleDots === true;
    const simpleAllowSelection: boolean = meta.simpleAllowSelection === true;
    const simpleShowInquiry: boolean = meta.simpleShowInquiry === true;
    const simpleSectionOutlinePublic: boolean =
      meta.simpleSectionOutlinePublic === true;

    const simpleSections: SimpleSection[] = meta.simpleSections ?? [];

    // TODO: kasnije povezati sa Account email verification
    const inquiryVerified: boolean =
      (meta.inquiryVerified as boolean | undefined) ?? true;

    // Reset theme varijable za preview da bude uvek "light"
    const lightVars: React.CSSProperties = {
      ["--bg" as any]: "#f3f4f6",
      ["--card" as any]: "#ffffff",
      ["--text" as any]: "#020617",
      ["--muted" as any]: "#6b7280",
      ["--border" as any]: "rgba(148,163,184,0.7)",
    };

    const wrapperStyle: React.CSSProperties = { ...lightVars };
    if (simpleBg) {
      if (simpleBg.startsWith("linear-gradient")) {
        wrapperStyle.backgroundImage = simpleBg;
      } else {
        wrapperStyle.backgroundColor = simpleBg;
      }
    }
    if (simpleTextColor) {
      wrapperStyle.color = simpleTextColor;
    }

    const titleColor = simpleTextColor || "var(--text)";
    const priceColor = simpleTextColor || "var(--text)";

    const spacingClass =
      simpleSpacing === "compact"
        ? "space-y-2"
        : simpleSpacing === "relaxed"
        ? "space-y-4"
        : "space-y-3";

    const fontFamilyClass =
      simpleFont === "serif"
        ? "font-serif"
        : simpleFont === "rounded"
        ? "font-[system-ui,ui-rounded,sans-serif]"
        : simpleFont === "mono"
        ? "font-mono"
        : "font-sans";

    const fontSizeClass =
      simpleFontSize === "sm"
        ? "text-[13px]"
        : simpleFontSize === "lg"
        ? "text-[16px]"
        : "text-[14px]";

    const isGradientBorder =
      typeof simpleBorderColor === "string" &&
      simpleBorderColor.startsWith("linear-gradient");

    const itemBorderBase: React.CSSProperties = {};
    if (!isGradientBorder && simpleBorderColor) {
      itemBorderBase.borderColor = simpleBorderColor;
    }

    const selectedCount = simpleSelectedIds.size;
    const showTotalBar = simpleAllowSelection;

    // grupisanje po sekcijama
    const unsectionedItems = items.filter((it) => !it.simpleSectionId);
    const itemsBySection = new Map<string, any[]>();
    items.forEach((it) => {
      const sid = it.simpleSectionId as string | undefined;
      if (!sid) return;
      if (!itemsBySection.has(sid)) itemsBySection.set(sid, []);
      itemsBySection.get(sid)!.push(it);
    });

    const renderItemRow = (it: any) => {
      const isSelected = simpleSelectedIds.has(it.id);

      if (isGradientBorder) {
        return (
          <div
            key={it.id}
            className="rounded-xl p-[1px]"
            style={{ backgroundImage: simpleBorderColor }}
          >
            <div className="flex items-start gap-3 rounded-[inherit] border border-transparent bg-[var(--card)] px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
              {simpleAllowSelection && (
                <div className="pt-1">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                    checked={isSelected}
                    onChange={() => toggleSimpleSelection(it.id)}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <div
                    className="font-medium truncate"
                    style={{ color: titleColor }}
                  >
                    {it.label}
                  </div>
                  <div
                    className={`flex-1 ${
                      simpleDots
                        ? "border-b-2 border-dotted border-[var(--border)] opacity-80"
                        : ""
                    }`}
                  />
                  <div
                    className="text-sm font-semibold whitespace-nowrap"
                    style={{ color: priceColor }}
                  >
                    {fmt(it.price ?? 0)}
                  </div>
                </div>
                {it.note && (
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {it.note}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Klasičan slučaj (solid outline)
      return (
        <div
          key={it.id}
          className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm"
          style={itemBorderBase}
        >
          {simpleAllowSelection && (
            <div className="pt-1">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                checked={isSelected}
                onChange={() => toggleSimpleSelection(it.id)}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <div
                className="font-medium truncate"
                style={{ color: titleColor }}
              >
                {it.label}
              </div>
              <div
                className={`flex-1 ${
                  simpleDots
                    ? "border-b-2 border-dotted border-[var(--border)] opacity-80"
                    : ""
                }`}
              />
              <div
                className="text-sm font-semibold whitespace-nowrap"
                style={{ color: priceColor }}
              >
                {fmt(it.price ?? 0)}
              </div>
            </div>
            {it.note && (
              <div className="mt-0.5 text-xs text-[var(--muted)]">
                {it.note}
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderSectionBlock = (section: SimpleSection) => {
      const sectionItems = itemsBySection.get(section.id) ?? [];
      if (!sectionItems.length) return null;

      const inner = (
        <div className="rounded-[inherit] border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4">
          <div
            className="mb-2 text-sm sm:text-base font-semibold"
            style={{ color: titleColor }}
          >
            {section.label}
          </div>
          <div className={spacingClass}>
            {sectionItems.map((it) => renderItemRow(it))}
          </div>
        </div>
      );

      if (!simpleSectionOutlinePublic) {
        return (
          <div key={section.id} className="rounded-2xl">
            {inner}
          </div>
        );
      }

      return (
        <div
          key={section.id}
          className="rounded-2xl p-[1px]"
          style={{ backgroundImage: BRAND_GRADIENT }}
        >
          {inner}
        </div>
      );
    };

    return (
      <div
        className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 ${fontFamilyClass} ${fontSizeClass}`}
        style={wrapperStyle}
      >
        {/* Title + Tierless badge gore desno */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-3">
          {simpleTitle ? (
            <h1
              className="text-lg sm:text-xl font-semibold"
              style={{ color: titleColor }}
            >
              {simpleTitle}
            </h1>
          ) : (
            <div />
          )}

          {showTierlessBadge && (
            <a
              href="https://tierless.net"
              target="_blank"
              rel="noreferrer"
              className="relative inline-flex items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[10px] sm:text-xs text-[var(--text)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                  maskComposite: "exclude" as any,
                }}
              />
              <span className="relative z-[1] font-medium">
                Powered by Tierless
              </span>
            </a>
          )}
        </div>

        {/* Items bez sekcije */}
        <div className={spacingClass}>
          {unsectionedItems.map((it) => renderItemRow(it))}

          {unsectionedItems.length === 0 && simpleSections.length === 0 && (
            <div className="text-sm text-[var(--muted)]">
              No items yet. The owner hasn&apos;t added anything.
            </div>
          )}
        </div>

        {/* Sekcije */}
        {simpleSections.length > 0 && (
          <div className={`mt-4 ${spacingClass}`}>
            {simpleSections.map((s) => renderSectionBlock(s))}
          </div>
        )}

        {/* Extras (addons) */}
        {addons.length > 0 && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-3">
            <div
              className="text-sm font-medium mb-2"
              style={{ color: titleColor }}
            >
              Extras
            </div>
            <ul className="space-y-1 text-sm">
              {addons.map((x: any) => (
                <li key={x.id} className="flex items-center justify-between">
                  <span style={{ color: titleColor }}>{x.text}</span>
                  <span
                    className="font-semibold"
                    style={{ color: priceColor }}
                  >
                    {fmt(x.price ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Total bar + inquiry dugme */}
        {showTotalBar && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
            <div className="text-[var(--muted)]">
              {selectedCount === 0
                ? "No items selected."
                : `${selectedCount} item(s) selected.`}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="text-sm font-semibold"
                style={{ color: priceColor }}
              >
                Total: {fmt(simpleSelectionTotal)}
              </div>
              {simpleShowInquiry && (
                <button
                  type="button"
                  disabled={!inquiryVerified}
                  className={`relative inline-flex items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-xs sm:text-sm text-[var(--text)] ${
                    inquiryVerified
                      ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
                      : "cursor-not-allowed opacity-60"
                  }`}
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
                      maskComposite: "exclude" as any,
                    }}
                  />
                  <span className="relative z-[1]">Send inquiry</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------ TIERS / LEGACY ADVANCED MODE ------------ */
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
        const accent = (p as any).color || "#14b8a6";
        const color2 = (p as any).color2 || "var(--brand-2,#22D3EE)";
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

        const content = (
          <div
            className={`${cardRadiusClass} h-full bg-[var(--card)] border border-[var(--border)] p-4 flex flex-col`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: accent }}
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
                            color: accent,
                          }}
                        >
                          {f.label}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center text-[var(--muted)]">
                        <span className="mr-2 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
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

        if (colorMode === "solid") {
          return (
            <div
              key={p.id}
              className={`${cardRadiusClass} h-full border p-0 bg-[var(--card)]`}
              style={
                p.featured
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