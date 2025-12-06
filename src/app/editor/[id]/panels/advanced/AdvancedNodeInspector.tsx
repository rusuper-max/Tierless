import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings2, Trash2, X, ChevronRight, Zap, Plus, Link2, ChevronDown,
    ChevronUp
} from "lucide-react";

import { Button } from "./shared";
import { COLORS, t } from "./constants";
import type { AdvancedNode } from "./types";
import AnimatedCheckbox from "@/components/ui/AnimatedCheckbox";

interface AdvancedNodeInspectorProps {
    selectedId: string | null;
    selectedNode: AdvancedNode | null;
    setSelectedId: (id: string | null) => void;
    handleRemoveNode: (id: string) => void;
    handleUpdateNode: (id: string, patch: Partial<AdvancedNode>) => void;
    handleAddFeature: (id: string) => void;
    handleUpdateFeature: (id: string, featId: string, patch: any) => void;
    handleRemoveFeature: (id: string, featId: string) => void;
    handleMoveFeature: (nodeId: string, featureId: string, direction: "up" | "down") => void;
    currency: string;
    nodes: AdvancedNode[];
    readOnly?: boolean;
}

export function AdvancedNodeInspector({
    selectedId,
    selectedNode,
    setSelectedId,
    handleRemoveNode,
    handleUpdateNode,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    handleMoveFeature,
    currency,
    nodes,
    readOnly = false,
}: AdvancedNodeInspectorProps) {
    const [showColors, setShowColors] = useState(false);
    const [configuringFeatureId, setConfiguringFeatureId] = useState<string | null>(null);

    // Filter available tiers for linking
    const availableTiers = nodes.filter(n => n.kind === "tier");

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
                // Let's reset to just this new one for simplicity
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

    return (
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
                            {readOnly ? t("View") : t("Edit")} {selectedNode.kind}
                        </div>
                        <div className="flex gap-1">
                            {!readOnly && (
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveNode(selectedId)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => setSelectedId(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Read-Only Notice */}
                    {readOnly && (
                        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium text-center">
                            {t("View only mode - editing disabled")}
                        </div>
                    )}

                    {/* Inspector Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                        {/* Basic Info */}
                        <section className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Label")}</label>
                                    <span className={`text-[10px] ${(selectedNode.label?.length || 0) > 25 ? "text-amber-500" : "text-[var(--muted)]"}`}>
                                        {selectedNode.label?.length || 0}/30
                                    </span>
                                </div>
                                <input
                                    value={selectedNode.label || ""}
                                    onChange={(e) => handleUpdateNode(selectedId, { label: e.target.value.slice(0, 30) })}
                                    maxLength={30}
                                    disabled={readOnly}
                                    className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none text-[var(--text)] ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                    placeholder={t("e.g. Pro Plan")}
                                />
                            </div>

                            {/* Linked Tier Selection (for Sliders/Addons) */}
                            {(selectedNode.kind === "slider" || selectedNode.kind === "addon") && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-[var(--muted)] flex items-center gap-1">
                                        <Link2 className="w-3 h-3" />
                                        {t("Link to Tier")}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedNode.linkedTierId || ""}
                                            onChange={(e) => handleUpdateNode(selectedId, { linkedTierId: e.target.value || null })}
                                            disabled={readOnly}
                                            className={`w-full appearance-none bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none text-[var(--text)] pr-8 cursor-pointer hover:bg-[var(--surface)] transition-colors ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            <option value="">{t("Global (No Link)")}</option>
                                            {availableTiers.map(tier => (
                                                <option key={tier.id} value={tier.id}>{tier.label} ({tier.price}{currency})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
                                    </div>
                                    <p className="text-[10px] text-[var(--muted)]">
                                        {selectedNode.linkedTierId
                                            ? t("This option will appear inside the selected tier card.")
                                            : t("This option will appear globally outside tier cards.")}
                                    </p>
                                </div>
                            )}

                            {selectedNode.kind !== "slider" && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Price")}</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-[var(--muted)] text-sm pointer-events-none z-10">{currency}</span>
                                        <input
                                            type="number"
                                            value={selectedNode.price ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleUpdateNode(selectedId, { price: val === "" ? null : parseFloat(val) });
                                            }}
                                            disabled={readOnly}
                                            className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] outline-none pl-12 text-[var(--text)] ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedNode.kind !== "slider" && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-[var(--muted)] flex items-center gap-1">
                                        {t("Sale Pricing")}
                                        <span className="text-[8px] font-normal normal-case opacity-70">({t("optional")})</span>
                                    </label>

                                    {/* Sale Type Selector */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateNode(selectedId, { saleType: "fixed" })}
                                            disabled={readOnly}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${(selectedNode.saleType || "fixed") === "fixed"
                                                ? "bg-cyan-500 text-white"
                                                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
                                                } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            {t("Fixed Price")}
                                        </button>
                                        <button
                                            onClick={() => handleUpdateNode(selectedId, { saleType: "percentage" })}
                                            disabled={readOnly}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${selectedNode.saleType === "percentage"
                                                ? "bg-cyan-500 text-white"
                                                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
                                                } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            {t("% Discount")}
                                        </button>
                                    </div>

                                    {(selectedNode.saleType || "fixed") === "fixed" ? (
                                        <div className="space-y-1">
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3 text-[var(--muted)] text-sm pointer-events-none z-10">{currency}</span>
                                                <input
                                                    type="number"
                                                    value={selectedNode.salePrice ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleUpdateNode(selectedId, { salePrice: val === "" ? null : parseFloat(val) });
                                                    }}
                                                    disabled={readOnly}
                                                    placeholder={t("Leave empty for no sale")}
                                                    className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none pl-12 text-[var(--text)] placeholder:text-[var(--muted)]/40 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                                />
                                            </div>
                                            {selectedNode.salePrice != null && selectedNode.price != null && selectedNode.salePrice >= selectedNode.price && (
                                                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                                                    ⚠️ {t("Sale price should be lower than regular price")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={selectedNode.salePercentage ?? ""}
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        // Allow only numbers
                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                            if (val !== "" && parseFloat(val) > 100) val = "100";
                                                            handleUpdateNode(selectedId, { salePercentage: val === "" ? null : parseFloat(val) });
                                                        }
                                                    }}
                                                    disabled={readOnly}
                                                    placeholder={t("Discount %")}
                                                    className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none text-[var(--text)] ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                                />
                                                <span className="absolute right-3 text-[var(--muted)] text-sm pointer-events-none">%</span>
                                            </div>
                                            {/* Preview calculation */}
                                            {selectedNode.price != null && selectedNode.salePercentage != null && (
                                                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                                    {t("New price")}: {currency}{(selectedNode.price * (1 - selectedNode.salePercentage / 100)).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Description")}</label>
                                <textarea
                                    value={selectedNode.description || ""}
                                    rows={3}
                                    onChange={(e) => handleUpdateNode(selectedId, { description: e.target.value })}
                                    disabled={readOnly}
                                    className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] outline-none resize-none text-[var(--text)] ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
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
                                        <div className="pt-2 border-t border-[var(--border)]">
                                            <AnimatedCheckbox
                                                label={t("Always show accent color")}
                                                checked={selectedNode.alwaysColored ?? false}
                                                onChange={(e) => handleUpdateNode(selectedId, { alwaysColored: e.target.checked })}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {selectedNode.kind === "tier" && (
                                <div className="mt-4 space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Badge Text")}</label>
                                            <span className={`text-[10px] ${(selectedNode.badgeText?.length || 0) > 15 ? "text-amber-500" : "text-[var(--muted)]"}`}>
                                                {selectedNode.badgeText?.length || 0}/20
                                            </span>
                                        </div>
                                        <input
                                            value={selectedNode.badgeText || ""}
                                            onChange={(e) => handleUpdateNode(selectedId, { badgeText: e.target.value.slice(0, 20) })}
                                            maxLength={20}
                                            disabled={readOnly}
                                            className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none text-[var(--text)] ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                            placeholder={t("e.g. Popular, Best Value")}
                                        />
                                    </div>
                                    <AnimatedCheckbox
                                        label={t("Highlight as Featured")}
                                        checked={selectedNode.emphasis === "featured"}
                                        onChange={(e) => handleUpdateNode(selectedId, { emphasis: e.target.checked ? "featured" : "normal" })}
                                        disabled={readOnly}
                                    />
                                </div>
                            )}
                        </section>

                        {/* Features (Tier Only) */}
                        {selectedNode.kind === "tier" && (
                            <section className="space-y-3 pt-4 border-t border-[var(--border)]">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("Features")}</div>
                                    {!readOnly && <Button size="xs" variant="ghost" onClick={() => handleAddFeature(selectedId)}>+ {t("Add")}</Button>}
                                </div>
                                <div className="space-y-2">
                                    {selectedNode.features?.map((f, idx) => (
                                        <div key={f.id} className="space-y-2 bg-[var(--surface)]/30 rounded-lg p-2 border border-transparent hover:border-[var(--border)] transition-all">
                                            <div className="flex items-center gap-2 group">
                                                {/* Reorder buttons */}
                                                {!readOnly && (
                                                    <div className="flex flex-col -my-1">
                                                        <button
                                                            onClick={() => handleMoveFeature(selectedId!, f.id, "up")}
                                                            disabled={idx === 0}
                                                            className={`p-0.5 rounded transition-colors ${idx === 0
                                                                ? "text-[var(--muted)]/30 cursor-not-allowed"
                                                                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                                                                }`}
                                                            title={t("Move up")}
                                                        >
                                                            <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveFeature(selectedId!, f.id, "down")}
                                                            disabled={idx === (selectedNode.features?.length || 0) - 1}
                                                            className={`p-0.5 rounded transition-colors ${idx === (selectedNode.features?.length || 0) - 1
                                                                ? "text-[var(--muted)]/30 cursor-not-allowed"
                                                                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                                                                }`}
                                                            title={t("Move down")}
                                                        >
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => !readOnly && handleUpdateFeature(selectedId, f.id, { highlighted: !f.highlighted })}
                                                    disabled={readOnly}
                                                    className={`p-1.5 rounded-md transition-colors ${f.highlighted
                                                        ? "text-amber-500 bg-amber-500/20 ring-1 ring-amber-500/50"
                                                        : "text-[var(--muted)] hover:bg-[var(--surface)]"
                                                        } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                                    title={readOnly ? t("View-only mode") : (f.highlighted ? "Highlighted" : "Click to highlight")}
                                                >
                                                    <Zap className={`w-3.5 h-3.5 ${f.highlighted ? "fill-current" : ""}`} />
                                                </button>
                                                <input
                                                    value={f.label}
                                                    onChange={(e) => handleUpdateFeature(selectedId, f.id, { label: e.target.value })}
                                                    disabled={readOnly}
                                                    className={`flex-1 bg-transparent border-none text-sm outline-none py-1 text-[var(--text)] placeholder:text-[var(--muted)] ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                                    placeholder={t("Feature name...")}
                                                />
                                                {!readOnly && (
                                                    <>
                                                        <button
                                                            onClick={() => setConfiguringFeatureId(configuringFeatureId === f.id ? null : f.id)}
                                                            className={`p-1.5 rounded-md transition-colors ${configuringFeatureId === f.id
                                                                ? "bg-[var(--surface)] text-[var(--text)]"
                                                                : f.inputType === "text"
                                                                    ? "text-cyan-400 hover:bg-[var(--surface)]"
                                                                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                                                                }`}
                                                            title="Configure Input"
                                                        >
                                                            <Settings2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveFeature(selectedId, f.id)}
                                                            className="p-1 text-[var(--muted)] hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {configuringFeatureId === f.id && !readOnly && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="pl-9 pr-2 pb-2 space-y-3 overflow-hidden"
                                                    >
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase font-bold text-[var(--muted)]">{t("Features Input")}</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateFeature(selectedId, f.id, { inputType: "none" })}
                                                                    className={`px-2 py-1.5 rounded text-[10px] font-medium transition ${!f.inputType || f.inputType === "none" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)]"}`}
                                                                >
                                                                    {t("None")}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateFeature(selectedId, f.id, { inputType: "text" })}
                                                                    className={`px-2 py-1.5 rounded text-[10px] font-medium transition ${f.inputType === "text" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)]"}`}
                                                                >
                                                                    {t("Text Input")}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {f.inputType === "text" && (
                                                            <div className="space-y-2 pt-2 border-t border-dashed border-[var(--border)]">
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] text-[var(--muted)]">{t("Input Label")}</label>
                                                                    <input
                                                                        value={f.inputLabel || ""}
                                                                        onChange={(e) => handleUpdateFeature(selectedId, f.id, { inputLabel: e.target.value })}
                                                                        placeholder={t("e.g. Dimensions")}
                                                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-xs outline-none focus:border-cyan-500 text-[var(--text)]"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <AnimatedCheckbox
                                                                        label={t("Required field")}
                                                                        checked={f.inputRequired || false}
                                                                        onChange={(e) => handleUpdateFeature(selectedId, f.id, { inputRequired: e.target.checked })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}


                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
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
                                            disabled={readOnly}
                                            className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none text-[var(--text)] focus:border-cyan-500 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-[var(--muted)]">Max</label>
                                        <input
                                            type="number"
                                            value={selectedNode.max ?? 100}
                                            onChange={(e) => handleUpdateNode(selectedId, { max: Number(e.target.value) })}
                                            disabled={readOnly}
                                            className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none text-[var(--text)] focus:border-cyan-500 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-[var(--muted)]">Step</label>
                                        <input
                                            type="number"
                                            value={selectedNode.step ?? 1}
                                            onChange={(e) => handleUpdateNode(selectedId, { step: Number(e.target.value) })}
                                            disabled={readOnly}
                                            className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none text-[var(--text)] focus:border-cyan-500 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-[var(--muted)]">{t("Price Per Step")}</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-[var(--muted)] text-xs pointer-events-none z-10">{currency}</span>
                                        <input
                                            type="number"
                                            value={selectedNode.pricePerStep ?? 0}
                                            onChange={(e) => handleUpdateNode(selectedId, { pricePerStep: Number(e.target.value) })}
                                            disabled={readOnly}
                                            className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm outline-none pl-12 text-[var(--text)] focus:border-cyan-500 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                                        />
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
