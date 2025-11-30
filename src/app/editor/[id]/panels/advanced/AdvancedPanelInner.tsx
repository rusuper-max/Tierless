"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, X, Check, Layout, SlidersHorizontal,
  ToggleRight, Calculator, Palette, Settings2, ChevronDown,
  User, Mail, Send, Zap, ListChecks, Layers, Monitor,
  Eye, MoreHorizontal, Coins, ChevronRight
} from "lucide-react";

import { useAdvancedState } from "./useAdvancedState";
import { useEditorStore } from "../../../../../hooks/useEditorStore";
import AnimatedCheckbox from "../../../../../components/ui/AnimatedCheckbox";
import type { AdvancedNode, BillingPeriod } from "./types";

/* -----------------------------------------------------------------------------
   Constants & Helpers
----------------------------------------------------------------------------- */
const t = (s: string) => s;

const CURRENCY_PRESETS = ["€", "$", "£", "CHF", "CAD", "AUD", "RSD", "BAM", "PLN"];

const COLORS = [
  { name: "Slate", hex: "#64748b" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
];

const BILLING_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "once", label: t("One-time") },
  { value: "month", label: t("Monthly") },
  { value: "year", label: t("Yearly") },
];

/* -----------------------------------------------------------------------------
   Shared Components
----------------------------------------------------------------------------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost" | "secondary";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
};

function Button({ variant = "outline", size = "md", className = "", ...props }: BtnProps) {
  const sizeCls = {
    xs: "h-7 px-2 text-xs",
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-5 text-base",
    icon: "h-9 w-9 p-0",
  }[size];

  const variants = {
    solid: "bg-[var(--accent)] text-white hover:brightness-110 shadow-sm",
    outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--surface)] text-[var(--text)]",
    ghost: "bg-transparent hover:bg-[var(--surface)] text-[var(--text)]",
    secondary: "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)]",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none ${sizeCls} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

const InlineInput = ({ value, onChange, className, placeholder, ...props }: any) => (
  <input
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    className={`bg-transparent outline-none border-b border-transparent hover:border-dashed hover:border-[var(--border)] focus:border-[var(--accent)] transition-all text-center w-full ${className}`}
    {...props}
  />
);

const InlineTextarea = ({ value, onChange, className, placeholder }: any) => (
  <textarea
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    rows={1}
    className={`bg-transparent outline-none border-b border-transparent hover:border-dashed hover:border-[var(--border)] focus:border-[var(--accent)] transition-all text-center w-full resize-none ${className}`}
    style={{ minHeight: "1.5em" }}
    onInput={(e: any) => {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }}
  />
);

/* -----------------------------------------------------------------------------
   Main Component
----------------------------------------------------------------------------- */
export default function AdvancedPanelInner() {
  const {
    // Data
    nodes,
    selectedId,
    selectedNode,
    advancedPublicTitle,
    advancedPublicSubtitle,
    advancedPublicTheme,
    advancedColumnsDesktop,

    // Actions
    setSelectedId,
    handleAddNode,
    handleUpdateNode,
    handleRemoveNode,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    setAdvancedPublicTitle,
    setAdvancedPublicSubtitle,
    setAdvancedPublicTheme,
    setAdvancedColumnsDesktop,
  } = useAdvancedState();

  const { calc, updateCalc } = useEditorStore();

  const currency = calc?.i18n?.currency || "€";
  const setCurrency = (c: string) => {
    updateCalc((draft) => {
      if (!draft.i18n) draft.i18n = {};
      draft.i18n.currency = c;
    });
  };

  // Local UI State
  const [showSettings, setShowSettings] = useState(false);
  const [previewInquiry, setPreviewInquiry] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showColors, setShowColors] = useState(false);

  // Interactive Slider State (Preview only)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Derived State
  const isDark = advancedPublicTheme === "dark" || advancedPublicTheme === "tierless";
  const columns = advancedColumnsDesktop || 3;

  const estimatedTotal = useMemo(() => {
    let total = 0;
    nodes.forEach((n) => {
      if (n.kind === "tier" && n.emphasis === "featured") total += n.price || 0;
      if (n.kind === "slider") {
        const val = sliderValues[n.id] ?? n.min ?? 0;
        const steps = Math.floor((val - (n.min ?? 0)) / (n.step || 1));
        total += steps * (n.pricePerStep || 0);
      }
    });
    return total;
  }, [nodes, sliderValues]);

  // Styles
  const themeStyles = {
    "--accent": "var(--brand-1, #4F46E5)",
    "--bg": isDark ? "#0B0F19" : "#F8FAFC",
    "--card": isDark ? "#111827" : "#FFFFFF",
    "--surface": isDark ? "#1F2937" : "#F1F5F9",
    "--border": isDark ? "#374151" : "#E2E8F0",
    "--text": isDark ? "#F3F4F6" : "#0F172A",
    "--muted": isDark ? "#9CA3AF" : "#64748B",
  } as React.CSSProperties;

  // Helper to parse accent color (hex or gradient)
  const getSelectedColors = (colorStr?: string | null) => {
    if (!colorStr) return [];
    if (colorStr.startsWith("linear-gradient")) {
      // Extract hex codes from gradient string
      const matches = colorStr.match(/#[a-fA-F0-9]{6}/g);
      return matches || [];
    }
    return [colorStr];
  };

  const handleColorSelect = (hex: string) => {
    if (!selectedId || !selectedNode) return;

    const currentColors = getSelectedColors(selectedNode.accentColor);
    let newColors = [...currentColors];

    if (newColors.includes(hex)) {
      // Deselect logic
      newColors = newColors.filter(c => c !== hex);
    } else {
      // Select new color
      if (newColors.length < 2) {
        newColors.push(hex);
      } else {
        // If 2 already selected, replace the first one (FIFO) or just reset?
        // Let's reset to just this new one for simplicity, or maybe replace the second?
        // User said "Picking only 1 color should also be possible".
        // Let's make it so if you pick a 3rd, it starts a new selection.
        newColors = [hex];
      }
    }

    // Construct the color string
    let colorValue: string | null = null;
    if (newColors.length === 1) {
      colorValue = newColors[0];
    } else if (newColors.length === 2) {
      colorValue = `linear-gradient(135deg, ${newColors[0]}, ${newColors[1]})`;
    }

    handleUpdateNode(selectedId, { accentColor: colorValue });
  };

  /* ---------------------------------------------------------------------------
     Render Node Card
  --------------------------------------------------------------------------- */
  const renderNodeCard = (node: AdvancedNode) => {
    const isSelected = node.id === selectedId;
    const accent = node.accentColor || COLORS[0].hex;
    const isGradient = accent.includes("gradient");

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
        className={`
          relative flex flex-col h-full p-5 rounded-2xl border-2 transition-all cursor-pointer group
          ${isSelected
            ? "shadow-lg ring-1 ring-[var(--local-accent)]"
            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)] hover:shadow-md"
          }
        `}
        style={{
          "--local-accent": isGradient ? COLORS[0].hex : accent,
          background: isSelected && isGradient ? `linear-gradient(${isDark ? '#111827' : '#ffffff'}, ${isDark ? '#111827' : '#ffffff'}) padding-box, ${accent} border-box` : undefined,
          borderColor: isSelected ? (isGradient ? "transparent" : accent) : undefined,
        } as React.CSSProperties}
      >
        {/* Header: Icon + Label */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${isDark ? "bg-white/10" : "bg-slate-100"}`}
              style={{ background: accent, color: "white" }}
            >
              {node.kind === "tier" && <Layers className="w-4 h-4" />}
              {node.kind === "addon" && <ToggleRight className="w-4 h-4" />}
              {node.kind === "item" && <Calculator className="w-4 h-4" />}
              {node.kind === "slider" && <SlidersHorizontal className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate text-[var(--text)]">
                {node.label || t("Untitled")}
              </div>
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">
                {node.kind}
              </div>
            </div>
          </div>

          {/* Price Tag */}
          {node.kind !== "slider" && (
            <div className="text-right shrink-0">
              <div className="font-mono font-bold text-[var(--text)]">
                {typeof node.price === "number" ? `${node.price}${currency}` : "-"}
              </div>
              {node.billingPeriod && node.billingPeriod !== "once" && (
                <div className="text-[10px] text-[var(--muted)]">/{node.billingPeriod}</div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3 min-h-[2.5em]">
          {node.description || t("No description")}
        </p>

        {/* Features Preview (Tier only) */}
        {node.kind === "tier" && (
          <div className="mt-auto space-y-1 pt-3 border-t border-dashed border-[var(--border)]">
            {(node.features || []).slice(0, 3).map(f => {
              const textStyle = f.highlighted
                ? (isGradient
                  ? { background: accent, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                  : { color: accent })
                : {};

              return (
                <div key={f.id} className="flex items-center gap-1.5 text-[11px] text-[var(--text)]">
                  <Check
                    className={`w-3 h-3 ${!f.highlighted ? "text-[var(--muted)]" : ""}`}
                    style={{ color: f.highlighted && !isGradient ? accent : undefined }}
                  />
                  {/* If gradient, we can't easily gradient the icon stroke without SVG defs. 
                      Let's leave icon as solid color (first color of gradient) or just accent if solid.
                      Actually, for gradient text, the icon might look better just solid.
                  */}
                  <span
                    className={`truncate ${f.highlighted ? "font-bold" : ""}`}
                    style={textStyle}
                  >
                    {f.label}
                  </span>
                </div>
              );
            })}
            {(node.features?.length || 0) > 3 && (
              <div className="text-[10px] text-[var(--muted)] pl-4.5">
                + {(node.features?.length || 0) - 3} more
              </div>
            )}
          </div>
        )}

        {/* Slider Interactive Preview */}
        {node.kind === "slider" && (
          <div className="mt-auto pt-2" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between text-[10px] font-mono text-[var(--muted)] mb-1">
              <span>{node.min ?? 0}</span>
              <span className="text-[var(--accent)] font-bold">
                {sliderValues[node.id] ?? node.min ?? 0}
              </span>
              <span>{node.max ?? 100}</span>
            </div>
            <input
              type="range"
              min={node.min ?? 0}
              max={node.max ?? 100}
              step={node.step ?? 1}
              value={sliderValues[node.id] ?? node.min ?? 0}
              onChange={(e) => setSliderValues(prev => ({ ...prev, [node.id]: Number(e.target.value) }))}
              className="w-full h-1.5 bg-[var(--surface)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
          </div>
        )}

        {/* Featured Badge */}
        {node.emphasis === "featured" && (
          <div
            className="absolute -top-2 -right-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm"
            style={{ background: accent }}
          >
            FEATURED
          </div>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------------------------
     Main Render
  --------------------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] transition-colors duration-300" style={themeStyles}>

      {/* 1. TOP TOOLBAR */}
      <header className="shrink-0 h-14 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-4 z-20 shadow-sm">
        {/* Left: Branding / Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Layout className="w-4 h-4" />
          </div>
          <div className="h-6 w-px bg-[var(--border)]" />
          <div className="text-sm font-semibold text-[var(--text)] hidden sm:block">
            {t("Advanced Editor")}
          </div>
        </div>

        {/* Center: Add Blocks */}
        <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
          <Button variant="ghost" size="sm" onClick={() => handleAddNode("tier")} className="gap-2">
            <Layers className="w-3.5 h-3.5" /> {t("Tier")}
          </Button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <Button variant="ghost" size="sm" onClick={() => handleAddNode("addon")} className="gap-2">
            <ToggleRight className="w-3.5 h-3.5" /> {t("Addon")}
          </Button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <Button variant="ghost" size="sm" onClick={() => handleAddNode("item")} className="gap-2">
            <Calculator className="w-3.5 h-3.5" /> {t("Item")}
          </Button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <Button variant="ghost" size="sm" onClick={() => handleAddNode("slider")} className="gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" /> {t("Slider")}
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={showSettings ? "solid" : "ghost"}
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            title={t("Page Settings")}
          >
            <Settings2 className="w-4.5 h-4.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewInquiry(true)} className="gap-2">
            <Eye className="w-4 h-4" /> {t("Preview")}
          </Button>
        </div>
      </header>

      {/* Settings Popover */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-30 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold uppercase text-[var(--muted)]">{t("Page Settings")}</h4>
              <Button size="xs" variant="ghost" onClick={() => setShowSettings(false)}><X className="w-3 h-3" /></Button>
            </div>

            <div className="space-y-4">
              {/* Theme */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> {t("Theme")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["light", "dark", "tierless"].map(theme => (
                    <button
                      key={theme}
                      onClick={() => setAdvancedPublicTheme(theme as any)}
                      className={`px-2 py-1.5 text-xs rounded border transition-all ${advancedPublicTheme === theme
                          ? "bg-[var(--accent)] text-white border-transparent"
                          : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--muted)]"
                        }`}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5" /> {t("Currency")}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {CURRENCY_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`h-7 text-xs rounded border transition-all ${currency === c
                          ? "bg-[var(--accent)] text-white border-transparent"
                          : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--muted)]"
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columns */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" /> {t("Columns")}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setAdvancedColumnsDesktop(n)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-all ${columns === n
                          ? "bg-[var(--accent)] text-white border-transparent"
                          : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--muted)]"
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* CANVAS */}
        <div
          className="flex-1 overflow-y-auto p-6 sm:p-10"
          onClick={() => setSelectedId(null)}
        >
          <div className="max-w-5xl mx-auto space-y-10 pb-24">

            {/* Document Header */}
            <div className="text-center space-y-4">
              <InlineInput
                value={advancedPublicTitle}
                onChange={(e: any) => setAdvancedPublicTitle(e.target.value)}
                className="font-black tracking-tight text-[clamp(24px,4vw,40px)] text-[var(--text)] placeholder:text-[var(--muted)]/50"
                placeholder={t("Page Title")}
              />
              <div className="max-w-2xl mx-auto">
                <InlineTextarea
                  value={advancedPublicSubtitle}
                  onChange={(e: any) => setAdvancedPublicSubtitle(e.target.value)}
                  className="text-lg text-[var(--muted)] font-medium placeholder:text-[var(--muted)]/50"
                  placeholder={t("Add a subtitle description here...")}
                />
              </div>
            </div>

            {/* Grid */}
            {nodes.length > 0 ? (
              <div
                className="grid gap-6 items-start"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {nodes.map(node => (
                  <motion.div
                    layoutId={node.id}
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {renderNodeCard(node)}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-3xl bg-[var(--surface)]/30">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
                  <Layout className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)]">{t("Start Building")}</h3>
                <p className="text-sm text-[var(--muted)] mt-1">{t("Add a tier, addon, or item from the toolbar above.")}</p>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT INSPECTOR */}
        <AnimatePresence>
          {selectedId && selectedNode && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-80 border-l border-[var(--border)] bg-[var(--card)] shadow-xl z-10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Inspector Header */}
              <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--muted)]">
                  <Settings2 className="w-4 h-4" />
                  {t("Edit")} {selectedNode.kind}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleRemoveNode(selectedId)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setSelectedId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* Basic Info */}
                <section className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Label")}</label>
                    <input
                      value={selectedNode.label || ""}
                      onChange={(e) => handleUpdateNode(selectedId, { label: e.target.value })}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] outline-none text-[var(--text)]"
                      placeholder={t("e.g. Pro Plan")}
                    />
                  </div>

                  {selectedNode.kind !== "slider" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Price")}</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-[var(--muted)] text-sm pointer-events-none z-10">{currency}</span>
                        <input
                          type="number"
                          value={selectedNode.price ?? ""}
                          onChange={(e) => handleUpdateNode(selectedId, { price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] outline-none pl-8 text-[var(--text)]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Description")}</label>
                    <textarea
                      value={selectedNode.description || ""}
                      rows={3}
                      onChange={(e) => handleUpdateNode(selectedId, { description: e.target.value })}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] outline-none resize-none text-[var(--text)]"
                      placeholder={t("Brief description...")}
                    />
                  </div>
                </section>

                {/* Styling */}
                <section className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <button
                    onClick={() => setShowColors(!showColors)}
                    className="flex items-center justify-between w-full text-[10px] font-bold uppercase text-[var(--muted)] mb-2 hover:text-[var(--text)]"
                  >
                    <span>{t("Accent Color")}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${showColors ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showColors && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 pb-2">
                          {COLORS.map(c => {
                            const selectedColors = getSelectedColors(selectedNode.accentColor);
                            const isSelected = selectedColors.includes(c.hex);
                            const index = selectedColors.indexOf(c.hex);

                            return (
                              <button
                                key={c.name}
                                onClick={() => handleColorSelect(c.hex)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all relative ${isSelected
                                    ? "border-[var(--text)] scale-110 shadow-sm"
                                    : "border-transparent opacity-50 hover:opacity-100"
                                  }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              >
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-white drop-shadow-md">
                                    {index + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {selectedNode.kind === "tier" && (
                    <div className="mt-4">
                      <AnimatedCheckbox
                        label={t("Highlight as Featured")}
                        checked={selectedNode.emphasis === "featured"}
                        onChange={(e) => handleUpdateNode(selectedId, { emphasis: e.target.checked ? "featured" : "normal" })}
                      />
                    </div>
                  )}
                </section>

                {/* Features (Tier Only) */}
                {selectedNode.kind === "tier" && (
                  <section className="space-y-3 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Features")}</div>
                      <Button size="xs" variant="ghost" onClick={() => handleAddFeature(selectedId)}>+ {t("Add")}</Button>
                    </div>
                    <div className="space-y-2">
                      {selectedNode.features?.map(f => (
                        <div key={f.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => handleUpdateFeature(selectedId, f.id, { highlighted: !f.highlighted })}
                            className={`p-1.5 rounded-md transition-colors ${f.highlighted
                                ? "text-amber-500 bg-amber-500/20 ring-1 ring-amber-500/50"
                                : "text-[var(--muted)] hover:bg-[var(--surface)]"
                              }`}
                            title={f.highlighted ? "Highlighted" : "Click to highlight"}
                          >
                            <Zap className={`w-3.5 h-3.5 ${f.highlighted ? "fill-current" : ""}`} />
                          </button>
                          <input
                            value={f.label}
                            onChange={(e) => handleUpdateFeature(selectedId, f.id, { label: e.target.value })}
                            className="flex-1 bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] text-sm outline-none py-1 text-[var(--text)]"
                            placeholder={t("Feature name...")}
                          />
                          <button
                            onClick={() => handleRemoveFeature(selectedId, f.id)}
                            className="p-1 text-[var(--muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {(!selectedNode.features || selectedNode.features.length === 0) && (
                        <div className="text-xs text-[var(--muted)] italic text-center py-2">
                          {t("No features added yet.")}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Slider Logic */}
                {selectedNode.kind === "slider" && (
                  <section className="space-y-3 pt-4 border-t border-[var(--border)]">
                    <div className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Logic")}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[var(--muted)]">Min</label>
                        <input
                          type="number"
                          value={selectedNode.min ?? 0}
                          onChange={(e) => handleUpdateNode(selectedId, { min: Number(e.target.value) })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[var(--muted)]">Max</label>
                        <input
                          type="number"
                          value={selectedNode.max ?? 100}
                          onChange={(e) => handleUpdateNode(selectedId, { max: Number(e.target.value) })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[var(--muted)]">Step</label>
                        <input
                          type="number"
                          value={selectedNode.step ?? 1}
                          onChange={(e) => handleUpdateNode(selectedId, { step: Number(e.target.value) })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--muted)]">{t("Price Per Step")}</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-[var(--muted)] text-sm pointer-events-none z-10">{currency}</span>
                        <input
                          type="number"
                          value={selectedNode.pricePerStep ?? 0}
                          onChange={(e) => handleUpdateNode(selectedId, { pricePerStep: Number(e.target.value) })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none pl-8"
                        />
                      </div>
                    </div>
                  </section>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 3. BOTTOM FOOTER */}
      <footer className="shrink-0 h-16 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{t("Estimated Total")}</div>
            <div className="text-xl font-mono font-bold text-[var(--text)]">
              {estimatedTotal}{currency}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowBreakdown(!showBreakdown)} className="text-[var(--muted)]">
            {showBreakdown ? <ChevronDown className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </Button>
        </div>

        <Button variant="solid" onClick={() => setPreviewInquiry(true)} className="gap-2 shadow-lg shadow-[var(--accent)]/20">
          {t("Preview Inquiry")} <Send className="w-4 h-4" />
        </Button>
      </footer>

      {/* Breakdown Popover */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-6 z-30 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-4"
          >
            <h4 className="text-xs font-bold uppercase text-[var(--muted)] mb-2">{t("Breakdown")}</h4>
            <ul className="space-y-2 text-sm">
              {nodes.filter(n => n.kind === "tier" && n.emphasis === "featured").map(n => (
                <li key={n.id} className="flex justify-between text-[var(--text)]">
                  <span className="truncate pr-2">{n.label}</span>
                  <span className="font-mono">{n.price}{currency}</span>
                </li>
              ))}
              {nodes.filter(n => n.kind === "slider").map(n => {
                const val = sliderValues[n.id] ?? n.min ?? 0;
                const steps = Math.floor((val - (n.min ?? 0)) / (n.step || 1));
                const price = steps * (n.pricePerStep || 0);
                if (price === 0) return null;
                return (
                  <li key={n.id} className="flex justify-between text-[var(--text)]">
                    <span className="truncate pr-2">{n.label} ({val})</span>
                    <span className="font-mono">{price}{currency}</span>
                  </li>
                );
              })}
              {estimatedTotal === 0 && <li className="text-[var(--muted)] italic text-xs">{t("No active items selected")}</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreviewInquiry(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="font-bold text-[var(--text)]">{t("Inquiry Preview")}</h3>
                <Button size="icon" variant="ghost" onClick={() => setPreviewInquiry(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-[var(--muted)]">{t("Total Estimate")}</span>
                  <span className="text-2xl font-mono font-bold text-[var(--text)]">{estimatedTotal}{currency}</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--muted)]">{t("Name")}</label>
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <User className="w-4 h-4 text-[var(--muted)]" />
                      <input className="bg-transparent outline-none flex-1 text-sm text-[var(--text)]" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--muted)]">{t("Email")}</label>
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <Mail className="w-4 h-4 text-[var(--muted)]" />
                      <input className="bg-transparent outline-none flex-1 text-sm text-[var(--text)]" placeholder="john@example.com" />
                    </div>
                  </div>
                </div>
                <Button variant="solid" className="w-full mt-2">{t("Send Inquiry")}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}