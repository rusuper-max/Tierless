// src/app/editor/[id]/panels/AdvancedPanel.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Layers,
  Puzzle,
  SlidersHorizontal,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ListChecks,
} from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore } from "@/hooks/useEditorStore";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

type AdvancedNodeKind = "tier" | "addon" | "slider" | "item";

type AdvancedFeature = {
  id: string;
  label: string;
  highlighted?: boolean;
};

type AdvancedNode = {
  id: string;
  kind: AdvancedNodeKind;
  label: string;
  description?: string;
  // tier / addon / item:
  price?: number | null;
  // slider:
  min?: number | null;
  max?: number | null;
  step?: number | null;
  pricePerStep?: number | null;

  // visuals
  accentColor?: string | null;
  textColor?: string | null;
  useAccentOutline?: boolean;

  // features (tier only u praksi)
  features?: AdvancedFeature[];

  // badge na kartici
  badgeText?: string | null;
  badgeColor?: string | null;
};

const createId = () => `adv_${Math.random().toString(36).slice(2, 10)}`;
const createFeatureId = () =>
  `feat_${Math.random().toString(36).slice(2, 10)}`;

export default function AdvancedPanel() {
  const { calc, updateCalc } = useEditorStore();

  const meta = (calc?.meta || {}) as any;
  const i18n = (calc?.i18n || {}) as any;

  const currency: string = i18n.currency ?? "€";
  const decimals: number =
    typeof i18n.decimals === "number" && Number.isFinite(i18n.decimals)
      ? i18n.decimals
      : 0;

  const nodes: AdvancedNode[] = useMemo(() => {
    const raw = meta.advancedNodes;
    if (!Array.isArray(raw)) return [];
    return raw as AdvancedNode[];
  }, [meta.advancedNodes]);

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    nodes.length > 0 ? nodes[0].id : null
  );

  const selectedNode: AdvancedNode | undefined = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId]
  );

  const setNodes = (next: AdvancedNode[]) => {
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {} as any;
      (draft.meta as any).advancedNodes = next;
    });
  };

  const handleAddNode = (kind: AdvancedNodeKind) => {
    const baseLabel =
      kind === "tier"
        ? t("New tier")
        : kind === "addon"
        ? t("New addon")
        : kind === "item"
        ? t("New item")
        : t("New slider");

    const isSlider = kind === "slider";

    const newNode: AdvancedNode = {
      id: createId(),
      kind,
      label: baseLabel,
      description: "",
      price: isSlider ? null : 0,
      min: isSlider ? 0 : null,
      max: isSlider ? 100 : null,
      step: isSlider ? 1 : null,
      pricePerStep: isSlider ? 0 : null,
      accentColor: null,
      textColor: null,
      useAccentOutline: true,
      features: kind === "tier" ? [] : undefined,
      badgeText: null,
      badgeColor: null,
    };

    const next = [...nodes, newNode];
    setNodes(next);
    setSelectedId(newNode.id);
  };

  const handleUpdateNode = (id: string, patch: Partial<AdvancedNode>) => {
    const next = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    setNodes(next);
  };

  const handleRemoveNode = (id: string) => {
    const next = nodes.filter((n) => n.id !== id);
    setNodes(next);

    if (selectedId === id) {
      if (next.length === 0) setSelectedId(null);
      else setSelectedId(next[next.length - 1].id);
    }
  };

  const handleMoveNode = (id: string, dir: -1 | 1) => {
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= nodes.length) return;

    const next = [...nodes];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setNodes(next);
  };

  // Features helpers (tier only)
  const handleAddFeature = (tierId: string) => {
    const node = nodes.find((n) => n.id === tierId && n.kind === "tier");
    if (!node) return;
    const features = node.features ?? [];
    const nextFeatures: AdvancedFeature[] = [
      ...features,
      { id: createFeatureId(), label: "" },
    ];
    handleUpdateNode(tierId, { features: nextFeatures });
  };

  const handleUpdateFeature = (
    tierId: string,
    featId: string,
    patch: Partial<AdvancedFeature>
  ) => {
    const node = nodes.find((n) => n.id === tierId && n.kind === "tier");
    if (!node) return;
    const features = node.features ?? [];
    const nextFeatures = features.map((f) =>
      f.id === featId ? { ...f, ...patch } : f
    );
    handleUpdateNode(tierId, { features: nextFeatures });
  };

  const handleRemoveFeature = (tierId: string, featId: string) => {
    const node = nodes.find((n) => n.id === tierId && n.kind === "tier");
    if (!node) return;
    const features = node.features ?? [];
    const nextFeatures = features.filter((f) => f.id !== featId);
    handleUpdateNode(tierId, { features: nextFeatures });
  };

  // global inquiry toggle for advanced renderer
  const advancedShowInquiry: boolean =
    (meta.advancedShowInquiry as boolean | undefined) ?? true;

  const setAdvancedShowInquiry = (nextValue: boolean) => {
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {} as any;
      (draft.meta as any).advancedShowInquiry = nextValue;
    });
  };

  // da ne pravi od 9.99 → 10
  const formatPrice = (val: number | null | undefined) => {
    if (val === null || typeof val !== "number" || Number.isNaN(val)) return "";
    const abs = Math.abs(val);
    const hasFraction = Math.round(abs) !== abs;

    const usedDecimals =
      decimals && decimals > 0 ? decimals : hasFraction ? 2 : 0;

    const factor = Math.pow(10, usedDecimals);
    const norm = Math.round(val * factor) / factor;
    return `${norm.toFixed(usedDecimals)} ${currency}`.trim();
  };

  const renderKindLabel = (kind: AdvancedNodeKind) => {
    if (kind === "tier") return t("Tier");
    if (kind === "addon") return t("Addon");
    if (kind === "item") return t("Item");
    return t("Slider");
  };

  const renderKindIcon = (kind: AdvancedNodeKind) => {
    if (kind === "tier") return <Layers className="h-3.5 w-3.5" />;
    if (kind === "addon") return <Puzzle className="h-3.5 w-3.5" />;
    if (kind === "item") return <ListChecks className="h-3.5 w-3.5" />;
    return <SlidersHorizontal className="h-3.5 w-3.5" />;
  };

  return (
    <div className="p-4 sm:p-5">
      {/* Header */}
      <div className="space-y-1 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
          {t("Advanced editor")}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)]">
          {t(
            "Combine tiers, addons and sliders to build complex calculators and price pages."
          )}
        </p>
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* LEFT: node list + add buttons */}
        <section className="space-y-3">
          {/* Add buttons */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-3">
            <p className="mb-2 text-[11px] sm:text-xs text-[var(--muted)]">
              {t("Add building blocks to your advanced page.")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddNode("tier")}
                className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                <span className="relative z-[1] inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {t("Add tier")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNode("addon")}
                className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                <span className="relative z-[1] inline-flex items-center gap-1.5">
                  <Puzzle className="h-3.5 w-3.5" />
                  {t("Add addon")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNode("item")}
                className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                <span className="relative z-[1] inline-flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  {t("Add item")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNode("slider")}
                className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                <span className="relative z-[1] inline-flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {t("Add slider")}
                </span>
              </button>
            </div>
          </div>

          {/* Node list */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-medium text-[var(--text)]">
                {t("Blocks in this calculator")}
              </h3>
            <span className="text-[11px] text-[var(--muted)]">
                {nodes.length} {t("blocks")}
              </span>
            </div>

            {nodes.length === 0 ? (
              <p className="text-[11px] sm:text-xs text-[var(--muted)]">
                {t(
                  "No blocks yet. Start by adding a tier, addon, item or slider on the top."
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {nodes.map((node, index) => {
                  const isActive = node.id === selectedId;
                  const isFirst = index === 0;
                  const isLast = index === nodes.length - 1;

                  return (
                    <div
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(node.id)}
                      className={`group w-full cursor-pointer text-left rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-start justify-between gap-2 transition ${
                        isActive
                          ? "border-transparent shadow-[0_14px_32px_rgba(15,23,42,.40)]"
                          : "border-[var(--border)] hover:shadow-[0_10px_24px_rgba(15,23,42,.25)] hover:-translate-y-0.5"
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                "radial-gradient(circle at 0 0, rgba(79,70,229,.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.18), transparent 55%), var(--card)",
                              boxShadow:
                                "0 18px 40px rgba(15,23,42,.55), 0 0 0 1px rgba(148,163,184,.5)",
                            }
                          : { background: "var(--card)" }
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
                            {renderKindIcon(node.kind)}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-[var(--text)] truncate">
                            {node.label || t("Untitled block")}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5">
                            {renderKindIcon(node.kind)}
                            {renderKindLabel(node.kind)}
                          </span>

                          {node.kind !== "slider" &&
                            typeof node.price === "number" && (
                              <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2 py-0.5">
                                {formatPrice(node.price)}
                              </span>
                            )}

                          {node.kind === "slider" && (
                            <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2 py-0.5">
                              {t("Range")}{" "}
                              {typeof node.min === "number" ? node.min : 0}{" "}
                              –{" "}
                              {typeof node.max === "number" ? node.max : 100}
                            </span>
                          )}
                        </div>
                        {node.description && (
                          <p className="mt-1 text-[11px] sm:text-xs text-[var(--muted)] line-clamp-2">
                            {node.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 ml-1">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveNode(node.id, -1);
                            }}
                            disabled={isFirst}
                            className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
                            aria-label={t("Move up")}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveNode(node.id, 1);
                            }}
                            disabled={isLast}
                            className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
                            aria-label={t("Move down")}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNode(node.id);
                          }}
                          className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-300/70 bg-red-100/30 text-red-600 hover:bg-red-100 hover:border-red-400 hover:shadow-[0_10px_24px_rgba(220,38,38,.35)] transition"
                          aria-label={t("Delete block")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: page settings + inspector + mini preview */}
        <section className="space-y-3">
          {/* Global page settings for advanced */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-[var(--text)]">
                  {t("Page settings")}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">
                  {t("These options apply to the whole advanced price page.")}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-[var(--muted)] cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[var(--brand-1,#4F46E5)]"
                  checked={advancedShowInquiry}
                  onChange={(e) => setAdvancedShowInquiry(e.target.checked)}
                />
                <span>{t("Show inquiry button on public page")}</span>
              </label>
            </div>
          </div>

          {/* Inspector */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-medium text-[var(--text)]">
                {t("Block settings")}
              </h3>
              {selectedNode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] sm:text-[11px] text-[var(--muted)]">
                  {renderKindIcon(selectedNode.kind)}
                  {renderKindLabel(selectedNode.kind)}
                </span>
              )}
            </div>

            {!selectedNode ? (
              <p className="text-[11px] sm:text-xs text-[var(--muted)]">
                {nodes.length === 0
                  ? t("Add a block on the left to start editing its settings.")
                  : t("Select a block on the left to edit its settings here.")}
              </p>
            ) : (
              <div className="space-y-3">
                {/* Label */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    {t("Title")}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={selectedNode.label}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, {
                        label: e.target.value,
                      })
                    }
                    placeholder={t("Block title, e.g. Premium plan")}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    {t("Description")}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--muted)] outline-none focus:border-[var(--brand-1,#4F46E5)] resize-none"
                    rows={3}
                    value={selectedNode.description ?? ""}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder={t(
                      "Optional explanation, who this is for, key benefits…"
                    )}
                  />
                </div>

                {/* Badge */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    {t("Badge")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                      value={selectedNode.badgeText ?? ""}
                      onChange={(e) =>
                        handleUpdateNode(selectedNode.id, {
                          badgeText: e.target.value,
                        })
                      }
                      placeholder={t('Badge text, e.g. "Most popular"')}
                    />
                    <input
                      type="color"
                      className="h-8 w-10 rounded-md border border-[var(--border)] bg-[var(--bg)] p-1 cursor-pointer"
                      value={selectedNode.badgeColor || "#4F46E5"}
                      onChange={(e) =>
                        handleUpdateNode(selectedNode.id, {
                          badgeColor: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNode(selectedNode.id, {
                          badgeText: null,
                          badgeColor: null,
                        })
                      }
                      className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--muted)] hover:bg-[var(--surface)]"
                    >
                      {t("Clear")}
                    </button>
                  </div>
                </div>

                {/* Price or slider config */}
                {selectedNode.kind !== "slider" ? (
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      {t("Price")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="w-32 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-right text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                        value={
                          typeof selectedNode.price === "number"
                            ? selectedNode.price
                            : ""
                        }
                        onChange={(e) =>
                          handleUpdateNode(selectedNode.id, {
                            price:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        step="0.01"
                        placeholder={t("Base price")}
                      />
                      <input
                        type="text"
                        disabled
                        className="flex-1 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--muted)] outline-none"
                        value={formatPrice(
                          typeof selectedNode.price === "number"
                            ? selectedNode.price
                            : null
                        )}
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      {t("Slider configuration")}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--muted)]">
                          {t("Min")}
                        </div>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                          value={
                            typeof selectedNode.min === "number"
                              ? selectedNode.min
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateNode(selectedNode.id, {
                              min:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--muted)]">
                          {t("Max")}
                        </div>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                          value={
                            typeof selectedNode.max === "number"
                              ? selectedNode.max
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateNode(selectedNode.id, {
                              max:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          placeholder="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--muted)]">
                          {t("Step")}
                        </div>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                          value={
                            typeof selectedNode.step === "number"
                              ? selectedNode.step
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateNode(selectedNode.id, {
                              step:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-[var(--muted)]">
                        {t("Price per step")}
                      </div>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                        value={
                          typeof selectedNode.pricePerStep === "number"
                            ? selectedNode.pricePerStep
                            : ""
                        }
                        onChange={(e) =>
                          handleUpdateNode(selectedNode.id, {
                            pricePerStep:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}

                {/* Tier-only: visual style + features */}
                {selectedNode.kind === "tier" && (
                  <>
                    {/* Accent + text color + outline */}
                    <div className="space-y-2 pt-1 border-t border-dashed border-[var(--border)]">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          {t("Accent color")}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-8 w-10 rounded-md border border-[var(--border)] bg-[var(--bg)] p-1 cursor-pointer"
                            value={selectedNode.accentColor || "#14b8a6"}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                accentColor: e.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateNode(selectedNode.id, {
                                accentColor: null,
                              })
                            }
                            className="inline-flex items-center rounded-full border border-red-300/70 bg-red-50 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-100 hover:border-red-400 transition"
                          >
                            {t("Reset")}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          {t("Text color")}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-8 w-10 rounded-md border border-[var(--border)] bg-[var(--bg)] p-1 cursor-pointer"
                            value={selectedNode.textColor || "#020617"}
                            onChange={(e) =>
                              handleUpdateNode(selectedNode.id, {
                                textColor: e.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateNode(selectedNode.id, {
                                textColor: null,
                              })
                            }
                            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-[11px] text-[var(--muted)] hover:bg-[var(--surface)]"
                          >
                            {t("Reset")}
                          </button>
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2 text-[11px] text-[var(--muted)] cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-[var(--brand-1,#4F46E5)]"
                          checked={selectedNode.useAccentOutline !== false}
                          onChange={(e) =>
                            handleUpdateNode(selectedNode.id, {
                              useAccentOutline: e.target.checked,
                            })
                          }
                        />
                        <span>
                          {t("Use accent color on card outline")}
                        </span>
                      </label>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 pt-2 border-t border-dashed border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                          {t("Features")}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddFeature(selectedNode.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--text)] hover:bg-[var(--surface)]"
                        >
                          <Plus className="h-3 w-3" />
                          {t("Add feature")}
                        </button>
                      </div>

                      {(!selectedNode.features ||
                        selectedNode.features.length === 0) && (
                        <p className="text-[11px] text-[var(--muted)]">
                          {t(
                            "List what this tier includes. You can highlight key benefits."
                          )}
                        </p>
                      )}

                      {selectedNode.features &&
                        selectedNode.features.length > 0 && (
                          <div className="space-y-1.5">
                            {selectedNode.features.map((feat) => (
                              <div
                                key={feat.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                                  value={feat.label}
                                  onChange={(e) =>
                                    handleUpdateFeature(
                                      selectedNode.id,
                                      feat.id,
                                      { label: e.target.value }
                                    )
                                  }
                                  placeholder={t("Feature text")}
                                />
                                <label className="inline-flex items-center gap-1.5 text-[10px] text-[var(--muted)] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 accent-[var(--brand-1,#4F46E5)]"
                                    checked={!!feat.highlighted}
                                    onChange={(e) =>
                                      handleUpdateFeature(
                                        selectedNode.id,
                                        feat.id,
                                        { highlighted: e.target.checked }
                                      )
                                    }
                                  />
                                  <span>{t("Highlight")}</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveFeature(
                                      selectedNode.id,
                                      feat.id
                                    )
                                  }
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-300/70 bg-red-100/30 text-red-600 hover:bg-red-100 hover:border-red-400 transition"
                                  aria-label={t("Delete feature")}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mini preview */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-medium text-[var(--text)]">
                {t("Mini preview")}
              </h3>
            </div>

            {!selectedNode ? (
              <p className="text-[11px] sm:text-xs text-[var(--muted)]">
                {t("Select a block to see how it will roughly look on the page.")}
              </p>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 shadow-[0_14px_30px_rgba(15,23,42,.35)]">
                {(() => {
                  const previewAccent =
                    selectedNode.accentColor || "var(--brand-1,#4F46E5)";
                  const previewTitleColor =
                    selectedNode.textColor || "var(--text)";

                  return (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)]">
                            {renderKindIcon(selectedNode.kind)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="text-sm font-semibold truncate"
                                style={{ color: previewTitleColor }}
                              >
                                {selectedNode.label || t("Untitled block")}
                              </div>
                              {selectedNode.badgeText && (
                                <span
                                  className="inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                                  style={{
                                    borderColor:
                                      selectedNode.badgeColor ||
                                      previewAccent,
                                    color:
                                      selectedNode.badgeColor ||
                                      previewAccent,
                                  }}
                                >
                                  {selectedNode.badgeText}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              {renderKindLabel(selectedNode.kind)}
                            </div>
                          </div>
                        </div>

                        {selectedNode.description && (
                          <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-1">
                            {selectedNode.description}
                          </p>
                        )}

                        {selectedNode.kind === "tier" &&
                          selectedNode.features &&
                          selectedNode.features.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-[11px]">
                              {selectedNode.features.slice(0, 3).map((feat) => (
                                <li key={feat.id}>
                                  {feat.highlighted ? (
                                    <span
                                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                                      style={{
                                        borderColor: previewAccent,
                                        color: previewAccent,
                                        backgroundColor:
                                          "rgba(15,23,42,0.02)",
                                      }}
                                    >
                                      {feat.label || t("Feature")}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[var(--muted)]">
                                      <span className="mr-2 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
                                      <span>{feat.label || t("Feature")}</span>
                                    </span>
                                  )}
                                </li>
                              ))}
                              {selectedNode.features.length > 3 && (
                                <li className="text-[10px] text-[var(--muted)]">
                                  {t("More features…")}
                                </li>
                              )}
                            </ul>
                          )}
                      </div>

                      {selectedNode.kind !== "slider" &&
                        typeof selectedNode.price === "number" && (
                          <div className="ml-2 text-right">
                            <div className="text-sm font-semibold text-[var(--text)]">
                              {formatPrice(selectedNode.price)}
                            </div>
                          </div>
                        )}

                      {selectedNode.kind === "slider" && (
                        <div className="ml-2 w-40 space-y-1">
                          <div className="text-[11px] text-[var(--muted)] text-right">
                            {t("Range")}
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
                          <div className="flex justify-between text-[10px] text-[var(--muted)]">
                            <span>
                              {typeof selectedNode.min === "number"
                                ? selectedNode.min
                                : 0}
                            </span>
                            <span>
                              {typeof selectedNode.max === "number"
                                ? selectedNode.max
                                : 100}
                            </span>
                          </div>
                          {typeof selectedNode.pricePerStep === "number" && (
                            <div className="mt-1 text-[10px] text-right text-[var(--muted)]">
                              {t("Price per step")}:{" "}
                              {formatPrice(selectedNode.pricePerStep)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}