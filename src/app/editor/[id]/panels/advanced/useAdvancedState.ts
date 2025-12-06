// src/app/editor/[id]/panels/advanced/useAdvancedState.ts

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditorStore } from "@/hooks/useEditorStore";
import type { CalcJson } from "@/hooks/useEditorStore";
import {
  type AdvancedNode,
  type AdvancedNodeKind,
  type AdvancedPublicMeta,
  type AdvancedTheme,
  type BillingPeriod,
  type CardOutlineMode,
  type SelectedHighlightMode,
  type SliderColorMode,
} from "./types";

type CurrencyPosition = "prefix" | "suffix";

function useCurrencyFormat(calc?: CalcJson | null) {
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
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function makeDefaultNode(kind: AdvancedNodeKind): AdvancedNode {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `node_${Math.random().toString(36).slice(2)}`;

  const base: AdvancedNode = {
    id,
    kind,
    label:
      kind === "tier"
        ? "New tier"
        : kind === "addon"
          ? "New addon"
          : kind === "item"
            ? "New item"
            : "New slider",
    description: null,
    badgeText: null,
    badgeColor: null,
    iconEmoji: null,
    cardVariant: "solid",
    emphasis: kind === "tier" ? "normal" : null,
    accentColor: null,
    textColor: null,
    useAccentOutline: true,
    price: kind === "slider" ? null : 0,
    billingPeriod: "once",
    unitLabel: null,
    includeInTotal: true,
    min: kind === "slider" ? 0 : null,
    max: kind === "slider" ? 100 : null,
    step: kind === "slider" ? 1 : null,
    pricePerStep: kind === "slider" ? 0 : null,
    features: kind === "tier" ? [] : undefined,
    ctaLabel: null,
    ctaUrl: null,
    ctaKind: null,
    experimentalFlags: [],
  };

  return base;
}

function cloneNodes(nodes: AdvancedNode[]): AdvancedNode[] {
  return nodes.map((n) => ({
    ...n,
    features: n.features?.map((f) => ({ ...f })),
  }));
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useAdvancedState() {
  const calc = useEditorStore((s) => s.calc as CalcJson | null);
  const updateCalcState = useEditorStore((s: any) => s.updateCalc);
  const setCalc = useEditorStore((s: any) => s.setCalc);

  // Bezbedni wrapper oko meta update-a
  const updateMeta = useCallback(
    (patch: Partial<CalcJson["meta"]>) => {
      if (typeof updateCalcState === "function") {
        updateCalcState((draft: CalcJson) => {
          draft.meta = {
            ...(draft.meta || {}),
            ...patch,
          };
        });
        return;
      }

      // fallback ako nema updateCalcState u store-u
      if (typeof setCalc === "function") {
        const current = useEditorStore.getState().calc;
        if (!current) return;
        const next: CalcJson = {
          ...current,
          meta: {
            ...(current.meta || {}),
            ...patch,
          },
        };
        setCalc(next);
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        // barem da znamo da nešto ne štima
        // eslint-disable-next-line no-console
        console.warn(
          "[AdvancedEditor] updateMeta is not available on editor store"
        );
      }
    },
    [updateCalcState, setCalc]
  );

  const rawMeta = (calc?.meta || {}) as AdvancedPublicMeta & {
    advancedNodes?: AdvancedNode[];
    // legacy keys:
    advancedShowInquiry?: boolean;
    advancedCtaMode?: any;
    advancedLayoutVariant?: any;
    advancedColumnsDesktop?: number;
    advancedShowSummary?: boolean;
    advancedSummaryPosition?: any;
    advancedPublicTitle?: string;
    advancedPublicSubtitle?: string;
    advancedSupportNote?: string;
    // dodatni meta ključevi (novi)
    publicTheme?: string;
    showPoweredBy?: boolean;
    enableYearly?: boolean;
    defaultBillingPeriod?: BillingPeriod;
    yearlyDiscountPercent?: number | null;
  };

  const nodes: AdvancedNode[] = useMemo(
    () =>
      Array.isArray(rawMeta.advancedNodes)
        ? cloneNodes(rawMeta.advancedNodes)
        : [],
    [rawMeta.advancedNodes]
  );

  const { formatPrice } = useCurrencyFormat(calc || undefined);

  // selection
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!nodes.length) return null;
    const featured = nodes.find(
      (n) => n.kind === "tier" && n.emphasis === "featured"
    );
    return (featured || nodes[0]).id;
  });

  useEffect(() => {
    if (!nodes.length) {
      setSelectedId(null);
      return;
    }
    const exists = nodes.some((n) => n.id === selectedId);
    if (!exists) {
      const featured = nodes.find(
        (n) => n.kind === "tier" && n.emphasis === "featured"
      );
      setSelectedId((featured || nodes[0]).id);
    }
  }, [nodes, selectedId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  /* ---------------------- Meta getters (with legacy) ---------------------- */

  const advancedShowInquiry: boolean =
    rawMeta.showInquiry ?? rawMeta.advancedShowInquiry ?? true;

  const advancedCtaMode =
    rawMeta.ctaMode ?? rawMeta.advancedCtaMode ?? "inquiry";

  const advancedLayoutVariant =
    rawMeta.layoutVariant ?? rawMeta.advancedLayoutVariant ?? "pricingGrid";

  const advancedColumnsDesktop: number =
    rawMeta.columnsDesktop ?? rawMeta.advancedColumnsDesktop ?? 3;

  const advancedShowSummary: boolean =
    rawMeta.showSummary ?? rawMeta.advancedShowSummary ?? true;

  const advancedSummaryPosition =
    rawMeta.summaryPosition ?? rawMeta.advancedSummaryPosition ?? "right";

  const advancedPublicName: string =
    rawMeta.publicName ?? "";

  const advancedPublicTitle: string =
    rawMeta.publicTitle ?? rawMeta.advancedPublicTitle ?? "";

  const advancedPublicSubtitle: string =
    rawMeta.publicSubtitle ?? rawMeta.advancedPublicSubtitle ?? "";

  const advancedSupportNote: string =
    rawMeta.supportNote ?? rawMeta.advancedSupportNote ?? "";

  const advancedPublicTheme: AdvancedTheme =
    rawMeta.publicTheme === "tierless"
      ? "tierless"
      : rawMeta.publicTheme === "dark" || rawMeta.theme === "dark"
        ? "dark"
        : "light";

  const advancedShowPoweredBy: boolean =
    rawMeta.showPoweredBy ?? true;

  const advancedGlobalCtaLabel: string =
    rawMeta.globalCtaLabel ?? "";

  const advancedEnableYearly: boolean = rawMeta.enableYearly ?? false;

  const advancedDefaultBillingPeriod: BillingPeriod =
    rawMeta.defaultBillingPeriod ?? "month";

  const advancedYearlyDiscountPercent: number | null =
    typeof rawMeta.yearlyDiscountPercent === "number"
      ? rawMeta.yearlyDiscountPercent
      : null;

  const advancedCardOutlineMode: CardOutlineMode =
    rawMeta.cardOutlineMode ?? "brand";

  const advancedCardOutlineColor: string | null =
    rawMeta.cardOutlineColor ?? null;

  const advancedSelectedHighlightMode: SelectedHighlightMode =
    rawMeta.selectedHighlightMode ?? "brandGlow";

  const advancedSelectedHighlightColor: string | null =
    rawMeta.selectedHighlightColor ?? null;

  const advancedSliderColorMode: SliderColorMode =
    rawMeta.sliderColorMode ?? "brand";

  const advancedSliderSolidColor: string | null =
    rawMeta.sliderSolidColor ?? null;

  const advancedAutosaveInterval: number =
    typeof rawMeta.autosaveInterval === "number" ? rawMeta.autosaveInterval : 60;

  const advancedAutosaveEnabled: boolean = rawMeta.autosaveEnabled ?? false;

  const advancedAllowRating: boolean = rawMeta.allowRating ?? false;
  const advancedListInExamples: boolean = rawMeta.listInExamples ?? false;

  /* ---------------------- Meta setters (write both keys) ------------------ */

  const setAdvancedShowInquiry = useCallback(
    (val: boolean) => {
      updateMeta({
        showInquiry: val,
        advancedShowInquiry: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedCtaMode = useCallback(
    (mode: any) => {
      updateMeta({
        ctaMode: mode,
        advancedCtaMode: mode,
      });
    },
    [updateMeta]
  );

  const setAdvancedLayoutVariant = useCallback(
    (val: any) => {
      updateMeta({
        layoutVariant: val,
        advancedLayoutVariant: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedColumnsDesktop = useCallback(
    (val: number) => {
      const safe =
        typeof val === "number" && val >= 1 && val <= 4 ? val : 3;
      updateMeta({
        columnsDesktop: safe as any,
        advancedColumnsDesktop: safe,
      });
    },
    [updateMeta]
  );

  const setAdvancedShowSummary = useCallback(
    (val: boolean) => {
      updateMeta({
        showSummary: val,
        advancedShowSummary: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedSummaryPosition = useCallback(
    (pos: any) => {
      updateMeta({
        summaryPosition: pos,
        advancedSummaryPosition: pos,
      });
    },
    [updateMeta]
  );

  const setAdvancedPublicName = useCallback(
    (val: string) => {
      updateMeta({
        publicName: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedPublicTitle = useCallback(
    (val: string) => {
      updateMeta({
        publicTitle: val,
        advancedPublicTitle: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedPublicSubtitle = useCallback(
    (val: string) => {
      updateMeta({
        publicSubtitle: val,
        advancedPublicSubtitle: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedSupportNote = useCallback(
    (val: string) => {
      updateMeta({
        supportNote: val,
        advancedSupportNote: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedPublicTheme = useCallback(
    (val: AdvancedTheme) => {
      updateMeta({
        publicTheme: val,
        theme: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedShowPoweredBy = useCallback(
    (val: boolean) => {
      updateMeta({
        showPoweredBy: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedGlobalCtaLabel = useCallback(
    (val: string) => {
      updateMeta({
        globalCtaLabel: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedEnableYearly = useCallback(
    (val: boolean) => {
      updateMeta({
        enableYearly: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedDefaultBillingPeriod = useCallback(
    (val: BillingPeriod) => {
      updateMeta({
        defaultBillingPeriod: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedYearlyDiscountPercent = useCallback(
    (val: number | null) => {
      updateMeta({
        yearlyDiscountPercent: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedCardOutlineMode = useCallback(
    (val: CardOutlineMode) => {
      updateMeta({
        cardOutlineMode: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedCardOutlineColor = useCallback(
    (val: string | null) => {
      updateMeta({
        cardOutlineColor: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedSelectedHighlightMode = useCallback(
    (val: SelectedHighlightMode) => {
      updateMeta({
        selectedHighlightMode: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedSelectedHighlightColor = useCallback(
    (val: string | null) => {
      updateMeta({
        selectedHighlightColor: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedSliderColorMode = useCallback(
    (val: SliderColorMode) => {
      updateMeta({
        sliderColorMode: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedSliderSolidColor = useCallback(
    (val: string | null) => {
      updateMeta({
        sliderSolidColor: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedAutosaveInterval = useCallback(
    (val: number) => {
      updateMeta({
        autosaveInterval: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedAutosaveEnabled = useCallback(
    (val: boolean) => {
      updateMeta({
        autosaveEnabled: val,
      });
    },
    [updateMeta]
  );

  const setAdvancedAllowRating = useCallback(
    (val: boolean) => {
      updateMeta({ allowRating: val });
    },
    [updateMeta]
  );

  const setAdvancedListInExamples = useCallback(
    (val: boolean) => {
      updateMeta({ listInExamples: val });
    },
    [updateMeta]
  );

  /* -------------------------- Node updaters ------------------------------- */

  const commitNodes = useCallback(
    (next: AdvancedNode[]) => {
      updateMeta({ advancedNodes: next });
    },
    [updateMeta]
  );

  const handleAddNode = useCallback(
    (kind: AdvancedNodeKind) => {
      const next = [...nodes, makeDefaultNode(kind)];
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const handleUpdateNode = useCallback(
    (id: string, patch: Partial<AdvancedNode>) => {
      const next = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const handleRemoveNode = useCallback(
    (id: string) => {
      const next = nodes.filter((n) => n.id !== id);
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const handleMoveNode = useCallback(
    (id: string, delta: number) => {
      const idx = nodes.findIndex((n) => n.id === id);
      if (idx < 0) return;
      const newIndex = idx + delta;
      if (newIndex < 0 || newIndex >= nodes.length) return;

      const next = [...nodes];
      const [item] = next.splice(idx, 1);
      next.splice(newIndex, 0, item);
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const reorderNodes = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;
      const next = [...nodes];
      const [item] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, item);
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  /* ------------------------- Features on tier ----------------------------- */

  const handleAddFeature = useCallback(
    (nodeId: string) => {
      const featureId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `feat_${Math.random().toString(36).slice(2)}`;

      const next = nodes.map((n) => {
        if (n.id !== nodeId || n.kind !== "tier") return n;
        const features = n.features ? [...n.features] : [];
        features.push({ id: featureId, label: "", highlighted: false });
        return { ...n, features };
      });
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const handleUpdateFeature = useCallback(
    (nodeId: string, featureId: string, patch: any) => {
      const next = nodes.map((n) => {
        if (n.id !== nodeId || n.kind !== "tier" || !n.features) return n;
        const features = n.features.map((f) =>
          f.id === featureId ? { ...f, ...patch } : f
        );
        return { ...n, features };
      });
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const handleRemoveFeature = useCallback(
    (nodeId: string, featureId: string) => {
      const next = nodes.map((n) => {
        if (n.id !== nodeId || n.kind !== "tier" || !n.features) return n;
        const features = n.features.filter((f) => f.id !== featureId);
        return { ...n, features };
      });
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const handleMoveFeature = useCallback(
    (nodeId: string, featureId: string, direction: "up" | "down") => {
      const next = nodes.map((n) => {
        if (n.id !== nodeId || n.kind !== "tier" || !n.features) return n;
        const features = [...n.features];
        const idx = features.findIndex((f) => f.id === featureId);
        if (idx < 0) return n;

        const newIdx = direction === "up" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= features.length) return n;

        // Swap
        [features[idx], features[newIdx]] = [features[newIdx], features[idx]];
        return { ...n, features };
      });
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  return {
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
    advancedPublicName,
    advancedPublicTitle,
    advancedPublicSubtitle,
    advancedSupportNote,
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
    reorderNodes,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    handleMoveFeature,
    setAdvancedShowInquiry,
    setAdvancedCtaMode,
    setAdvancedLayoutVariant,
    setAdvancedColumnsDesktop,
    setAdvancedShowSummary,
    setAdvancedSummaryPosition,
    setAdvancedPublicName,
    setAdvancedPublicTitle,
    setAdvancedPublicSubtitle,
    setAdvancedSupportNote,
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
    advancedAutosaveInterval,
    setAdvancedAutosaveInterval,
    advancedAutosaveEnabled,
    setAdvancedAutosaveEnabled,
    advancedAllowRating,
    setAdvancedAllowRating,
    advancedListInExamples,
    setAdvancedListInExamples,
  };
}
