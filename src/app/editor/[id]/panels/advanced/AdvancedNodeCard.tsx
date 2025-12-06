import React from "react";
import { Layers, ToggleRight, Calculator, SlidersHorizontal, Check, Link2 } from "lucide-react";
import { COLORS, t } from "./constants";
import type { AdvancedNode } from "./types";

interface AdvancedNodeCardProps {
    node: AdvancedNode;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    currency: string;
    sliderValues: Record<string, number>;
    setSliderValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    isDark: boolean;
}

export function AdvancedNodeCard({
    node,
    selectedId,
    setSelectedId,
    currency,
    sliderValues,
    setSliderValues,
    isDark,
}: AdvancedNodeCardProps) {
    const isSelected = node.id === selectedId;
    const accent = node.accentColor || COLORS[0].hex;
    const isGradient = accent.includes("gradient");
    const shouldShowColor = isSelected || node.alwaysColored;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
            className={`
        relative flex flex-col h-full p-5 rounded-2xl border-2 transition-all cursor-pointer group
        ${shouldShowColor
                    ? "shadow-lg ring-1 ring-[var(--local-accent)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)] hover:shadow-md"
                }
      `}
            style={{
                "--local-accent": isGradient ? COLORS[0].hex : accent,
                background: shouldShowColor && isGradient ? `linear-gradient(${isDark ? '#111827' : '#ffffff'}, ${isDark ? '#111827' : '#ffffff'}) padding-box, ${accent} border-box` : undefined,
                borderColor: shouldShowColor ? (isGradient ? "transparent" : accent) : undefined,
            } as React.CSSProperties}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm"
                        style={{ background: isGradient ? accent : accent }}
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
                        {(node.salePrice != null || (node.saleType === "percentage" && node.salePercentage)) && node.price != null ? (
                            <>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <span className="font-mono text-xs text-[var(--muted)] line-through opacity-60">
                                        {node.price}{currency}
                                    </span>
                                    <span
                                        className="font-mono font-bold text-sm"
                                        style={{ color: shouldShowColor ? accent : undefined }}
                                    >
                                        {node.saleType === "percentage"
                                            ? (node.price * (1 - (node.salePercentage || 0) / 100)).toFixed(2).replace(/\.00$/, "")
                                            : node.salePrice}{currency}
                                    </span>
                                </div>
                                {node.billingPeriod && node.billingPeriod !== "once" && (
                                    <div className="text-[10px] text-[var(--muted)]">/{node.billingPeriod}</div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="font-mono font-bold text-[var(--text)]">
                                    {typeof node.price === "number" ? `${node.price}${currency}` : "-"}
                                </div>
                                {node.billingPeriod && node.billingPeriod !== "once" && (
                                    <div className="text-[10px] text-[var(--muted)]">/{node.billingPeriod}</div>
                                )}
                            </>
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

            {/* Linked Badge */}
            {node.linkedTierId && (node.kind === "slider" || node.kind === "addon") && (
                <div className="absolute top-2 right-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    <span>Linked</span>
                </div>
            )}

            {/* Slider Interactive Preview */}
            {
                node.kind === "slider" && (
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
                )
            }

            {/* Badge (Featured or Custom) */}
            {
                (node.emphasis === "featured" || node.badgeText) && (
                    <div
                        className="absolute -top-2 -right-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                        style={{ background: node.badgeColor || accent }}
                    >
                        {node.badgeText || "FEATURED"}
                    </div>
                )
            }
        </div >
    );
}
