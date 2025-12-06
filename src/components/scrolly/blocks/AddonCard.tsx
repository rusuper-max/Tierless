import React from "react";
import { t } from "@/i18n";
import { renderKindIcon } from "./utils";
import type {
    AdvancedNode,
    BillingPeriod,
} from "@/app/editor/[id]/panels/advanced/types";

export type AddonCardProps = {
    node: AdvancedNode;
    checked: boolean;
    onToggle: () => void;
    formatPrice: (v: number | null | undefined, o?: any) => string;
    billingMode: BillingPeriod;
    enableYearly: boolean;
    yearlyDiscountPercent: number | null;
    compact?: boolean; // New prop
};

export function getAddonEffectivePrice(
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

export function AddonCard({
    node,
    checked,
    onToggle,
    formatPrice,
    billingMode,
    enableYearly,
    yearlyDiscountPercent,
    compact = false, // Default to false
}: AddonCardProps) {
    const accent = node.accentColor || "var(--brand-1,#4F46E5)";
    const isGradientAccent = typeof accent === "string" && accent.includes("gradient");
    const gradientColors = isGradientAccent ? accent.match(/#[0-9a-fA-F]{6}/g) : null;
    const accentPrimary = gradientColors?.[0] || accent;
    const useAccentOutline = node.useAccentOutline !== false;

    // Show accent color when checked or alwaysColored is true
    const showAccentColor = checked || node.alwaysColored === true;

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

    const borderColor = showAccentColor && useAccentOutline ? accentPrimary : "var(--border)";
    const hoverBorderColor = useAccentOutline ? accentPrimary : "var(--brand-1)";

    // Compact Mode Rendering
    if (compact) {
        return (
            <label
                className={`flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-all duration-200 ${checked
                    ? "shadow-sm"
                    : "hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    }`}
                style={
                    checked
                        ? {
                            background: "var(--card)",
                            borderColor: borderColor,
                            boxShadow: `0 0 0 1px ${borderColor}`,
                        }
                        : {
                            background: "var(--surface)",
                            borderColor: showAccentColor ? borderColor : "var(--border)",
                        }
                }
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors`}
                        style={{
                            borderColor: checked ? borderColor : "var(--muted)",
                            backgroundColor: checked ? borderColor : "transparent",
                        }}
                    >
                        {checked && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onToggle}
                        className="hidden"
                    />
                    <span className="text-xs font-semibold text-[var(--text)] truncate">
                        {node.label || t("Untitled addon")}
                    </span>
                </div>
                {priceStr && (
                    <div className="text-[10px] font-bold text-[var(--text)] whitespace-nowrap bg-[var(--card)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                        +{priceStr}
                    </div>
                )}
            </label>
        );
    }

    // Standard Mode Rendering
    return (
        <label
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm cursor-pointer transition-all duration-200 ${checked
                ? "shadow-lg"
                : "hover:shadow-md"
                }`}
            style={
                checked
                    ? {
                        background: "var(--card)",
                        borderColor: borderColor,
                        boxShadow: `0 0 0 1px ${borderColor}, 0 4px 12px rgba(0,0,0,0.1)`,
                    }
                    : {
                        background: "var(--surface)",
                        borderColor: showAccentColor ? borderColor : "var(--border)",
                    }
            }
            onMouseEnter={(e) => {
                if (!checked && useAccentOutline) {
                    e.currentTarget.style.borderColor = hoverBorderColor;
                }
            }}
            onMouseLeave={(e) => {
                if (!checked) {
                    e.currentTarget.style.borderColor = showAccentColor ? borderColor : "var(--border)";
                }
            }}
        >
            <div className="flex items-start gap-3 min-w-0">
                <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors`}
                    style={{
                        borderColor: checked ? borderColor : "var(--muted)",
                        backgroundColor: checked ? borderColor : "transparent",
                    }}
                >
                    {checked && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                    className="hidden"
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-[var(--text)] truncate text-base">
                            {node.label || t("Untitled addon")}
                        </span>
                    </div>
                    {node.description && (
                        <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                            {node.description}
                        </p>
                    )}
                </div>
            </div>

            {priceStr && (
                <div className="ml-2 text-right font-bold text-[var(--text)] whitespace-nowrap">
                    +{priceStr}
                </div>
            )}
        </label>
    );
}
