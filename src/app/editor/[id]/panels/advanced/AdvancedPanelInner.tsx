"use client";

import React, { useState, useMemo, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, X, Check, Layout, SlidersHorizontal,
  ToggleRight, Calculator, Palette, Settings2, ChevronDown,
  Mail, Send, Zap, ListChecks, Layers, Monitor,
  MoreHorizontal, Coins, ChevronRight, MessageCircle,
  Image as ImageIcon, Upload, Phone, MapPin,
  Share2, Globe, Clock, Type, Star, Link2, Camera, Sparkles
} from "lucide-react";

import { useAdvancedState } from "./useAdvancedState";
import { useEditorStore } from "../../../../../hooks/useEditorStore";
import { useTheme } from "../../../../../hooks/useTheme";
import AnimatedCheckbox from "../../../../../components/ui/AnimatedCheckbox";
import type { AdvancedNode, BillingPeriod } from "./types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAccount } from "@/hooks/useAccount";
import { ENTITLEMENTS } from "@/lib/entitlements";
import { AdvancedSettingsPanel } from "./AdvancedSettingsPanel";
import { AdvancedNodeInspector } from "./AdvancedNodeInspector";
import { AdvancedNodeCard } from "./AdvancedNodeCard";
import { Button, InlineInput, InlineTextarea } from "./shared";
import { COLORS, CURRENCY_PRESETS, FONT_OPTIONS, BILLING_OPTIONS, t } from "./constants";

/* -----------------------------------------------------------------------------
   Constants & Helpers
----------------------------------------------------------------------------- */
/* -----------------------------------------------------------------------------
   Shared Components (Moved to shared.tsx and constants.ts)
----------------------------------------------------------------------------- */

function SortableItem({ id, children, disabled }: { id: string, children: React.ReactNode, disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? "relative" as const : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full relative">
      {/* Drag handle - ALWAYS visible at top center */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
        title="Drag to reorder"
      >
        <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:bg-[var(--card)] hover:shadow-md hover:border-cyan-400 transition-all">
          <div className="flex gap-px">
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
          </div>
          <div className="flex gap-px">
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
          </div>
          <div className="flex gap-px">
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]" />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

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
    reorderNodes,
  } = useAdvancedState();

  const { calc, updateCalc } = useEditorStore();

  // Use site-wide theme for editor UI (navbar theme), not page theme
  const { theme: siteTheme, mounted: themeMounted } = useTheme();

  // Also check html class directly as fallback (ThemeToggle manipulates this)
  const [htmlIsDark, setHtmlIsDark] = useState(false);
  useEffect(() => {
    // Initial check
    setHtmlIsDark(document.documentElement.classList.contains("dark"));

    // Watch for class changes (MutationObserver)
    const observer = new MutationObserver(() => {
      setHtmlIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Use html class as primary source since ThemeToggle manipulates it directly
  const editorIsDark = themeMounted ? siteTheme === "dark" : htmlIsDark;

  const contactOverride = (calc?.meta?.contactOverride || {}) as {
    type?: "email" | "whatsapp" | "telegram";
    whatsapp?: string;
    telegram?: string;
    email?: string;
  };
  const selectedContactType = contactOverride.type ?? "inherit";
  const overrideWhatsapp = contactOverride.whatsapp ?? "";
  const overrideTelegram = contactOverride.telegram ?? "";
  const overrideEmail = contactOverride.email ?? "";

  const updateContactOverride = (patch: {
    type?: "email" | "whatsapp" | "telegram" | null;
    whatsapp?: string | null;
    telegram?: string | null;
    email?: string | null;
  }) => {
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {};
      const next = { ...(draft.meta.contactOverride || {}) } as Record<string, string>;
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          delete next[key];
        } else {
          next[key] = value;
        }
      });
      if (Object.keys(next).length === 0) {
        delete (draft.meta as any).contactOverride;
      } else {
        draft.meta.contactOverride = next as any;
      }
    });
  };

  const currency = calc?.i18n?.currency || "€";
  const setCurrency = (c: string) => {
    updateCalc((draft) => {
      if (!draft.i18n) draft.i18n = {};
      draft.i18n.currency = c;
    });
  };

  const { plan } = useAccount();

  // Local UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadNodeId = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = nodes.findIndex((n) => n.id === active.id);
      const newIndex = nodes.findIndex((n) => n.id === over?.id);
      reorderNodes(oldIndex, newIndex);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, targetId: string) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }

    const maxBytes = (ENTITLEMENTS[plan]?.limits as any)?.uploadSize || 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`Image is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).`);
      return;
    }

    try {
      setUploadingId(targetId);

      const signRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "sign" })
      });

      if (!signRes.ok) throw new Error("Failed to get upload signature");
      const signData = await signRes.json();
      if (signData.error) throw new Error(signData.error);

      const { signature, timestamp, folder, apiKey, cloudName } = signData;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("signature", signature);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadRes = await fetch(cloudinaryUrl, { method: "POST", body: formData });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();
      const imageUrl = data.secure_url || data.url;

      // Handle special upload targets (meta fields)
      if (targetId === "__logo__") {
        updateCalc((draft) => {
          if (!draft.meta) draft.meta = {};
          (draft.meta as any).logoUrl = imageUrl;
        });
      } else if (targetId === "__hero__") {
        updateCalc((draft) => {
          if (!draft.meta) draft.meta = {};
          (draft.meta as any).heroImageUrl = imageUrl;
        });
      } else if (targetId === "__background__") {
        updateCalc((draft) => {
          if (!draft.meta) draft.meta = {};
          (draft.meta as any).backgroundImageUrl = imageUrl;
        });
      } else {
        // Regular node image (no longer used, but kept for compatibility)
        handleUpdateNode(targetId, {
          imageUrl: imageUrl,
          imagePublicId: data.public_id
        });
      }

    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingId(null);
    }
  };

  // Interactive Slider State (Preview only)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Derived State - use site-wide theme for editor UI, not page theme
  const isDark = editorIsDark;
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

  /* ---------------------------------------------------------------------------
     Render Node Card
  --------------------------------------------------------------------------- */


  /* ---------------------------------------------------------------------------
     Main Render
  --------------------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] transition-colors duration-300" style={themeStyles}>

      {/* 1. TOP TOOLBAR */}
      <header className="shrink-0 h-14 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-4 z-20 shadow-sm">
        {/* Left: Branding / Title */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Layout className="w-4 h-4" />
          </div>
          <div className="h-6 w-px bg-[var(--border)]" />
          <div className="text-sm font-semibold text-[var(--text)] hidden sm:block">
            {t("Tier Based Editor")}
          </div>
        </div>

        {/* Center: Add Blocks + Settings */}
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
          <div className="w-px h-4 bg-[var(--border)]" />
          <Button
            variant={showSettings ? "solid" : "ghost"}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings2 className="w-3.5 h-3.5" /> {t("Settings")}
          </Button>
        </div>

        {/* Right: Empty spacer for balance */}
        <div className="flex-1" />
      </header>

      {/* Full-Screen Settings Panel */}
      <AdvancedSettingsPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        advancedPublicTheme={advancedPublicTheme}
        setAdvancedPublicTheme={setAdvancedPublicTheme}
        advancedColumnsDesktop={advancedColumnsDesktop}
        setAdvancedColumnsDesktop={setAdvancedColumnsDesktop}
        advancedPublicTitle={advancedPublicTitle}
        setAdvancedPublicTitle={setAdvancedPublicTitle}
        advancedPublicSubtitle={advancedPublicSubtitle}
        setAdvancedPublicSubtitle={setAdvancedPublicSubtitle}
        calc={calc}
        updateCalc={updateCalc}
        currency={currency}
        setCurrency={setCurrency}
        selectedContactType={selectedContactType}
        contactOverride={contactOverride}
        overrideWhatsapp={overrideWhatsapp}
        overrideEmail={overrideEmail}
        updateContactOverride={updateContactOverride}
        pendingUploadNodeId={pendingUploadNodeId}
        fileInputRef={fileInputRef}
      />

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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={nodes.map(n => n.id)} strategy={rectSortingStrategy}>
                  <div
                    className="grid gap-6 items-start pt-4"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {nodes.map(node => (
                      <SortableItem key={node.id} id={node.id}>
                        <motion.div
                          layoutId={node.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="h-full"
                        >
                          {/* Node Card */}
                          <AdvancedNodeCard
                            node={node}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            currency={currency}
                            sliderValues={sliderValues}
                            setSliderValues={setSliderValues}
                            isDark={isDark}
                          />
                        </motion.div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
        <AdvancedNodeInspector
          selectedId={selectedId}
          selectedNode={selectedNode}
          setSelectedId={setSelectedId}
          handleRemoveNode={handleRemoveNode}
          handleUpdateNode={handleUpdateNode}
          handleAddFeature={handleAddFeature}
          handleUpdateFeature={handleUpdateFeature}
          handleRemoveFeature={handleRemoveFeature}
          currency={currency}
          nodes={nodes}
        />

      </div>

      {/* 3. BOTTOM FOOTER */}
      <footer className="shrink-0 h-16 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-center px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{t("Estimated Total")}</div>
            <div className="text-xl font-mono font-bold text-[var(--text)]">
              {estimatedTotal}{currency}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowBreakdown(!showBreakdown)} className="text-[var(--muted)]">
            {showBreakdown ? <ChevronDown className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </Button>
        </div>
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


      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const targetId = pendingUploadNodeId.current;
          if (targetId) {
            handleImageUpload(e, targetId);
            pendingUploadNodeId.current = null;
          }
        }}
      />

    </div>
  );
}
