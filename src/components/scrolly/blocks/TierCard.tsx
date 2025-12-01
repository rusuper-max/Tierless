import React from "react";
import { t } from "@/i18n";
import { renderKindIcon } from "./utils";
import type {
    AdvancedNode,
    AdvancedTheme,
    BillingPeriod,
} from "@/app/editor/[id]/panels/advanced/types";

export type TierCardProps = {
    node: AdvancedNode;
    isActive: boolean;
    onSelect: () => void;
    formatPrice: (v: number | null | undefined, o?: any) => string;
    billingMode: BillingPeriod;
    enableYearly: boolean;
    yearlyDiscountPercent: number | null;
    theme: AdvancedTheme;
};

export function getTierEffectivePrice(
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

export function TierCard({
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
            ? "rgba(255, 255, 255, 0.03)" // Glassy base
            : theme === "dark"
                ? "rgba(10,13,24,0.96)"
                : "var(--card)";

    let borderColor =
        theme === "light"
            ? "var(--border)"
            : theme === "tierless"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(148,163,184,.35)";
    let bg: string | undefined = baseBg;
    let boxShadow =
        theme === "light"
            ? "0 12px 28px rgba(15,23,42,.18)"
            : theme === "tierless"
                ? "0 8px 32px rgba(0, 0, 0, 0.4)" // Deep shadow
                : "0 20px 35px rgba(2,6,23,.55)";
    const restingShadow =
        theme === "light"
            ? "0 6px 16px rgba(15,23,42,.18)"
            : theme === "tierless"
                ? "0 4px 20px rgba(0, 0, 0, 0.2)"
                : "0 10px 24px rgba(4,6,20,.65)";

    if (variant === "outline") {
        borderColor = useAccentOutline ? accent : borderColor;
        bg =
            theme === "light"
                ? "var(--bg)"
                : theme === "tierless"
                    ? "transparent"
                    : "rgba(6,9,18,0.6)";
    } else if (variant === "ghost") {
        borderColor = "transparent";
        bg = "transparent";
        boxShadow = "none";
    }

    if (emphasis === "featured") {
        boxShadow =
            theme === "light"
                ? "0 18px 40px rgba(15,23,42,.35)"
                : theme === "tierless"
                    ? "0 20px 50px rgba(0, 0, 0, 0.6)"
                    : "0 25px 60px rgba(2,6,23,.75)";
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
            className={`group w-full text-left rounded-2xl border px-4 py-4 sm:px-6 sm:py-6 transition-all duration-300 transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-1,#4F46E5)] ${theme === "tierless" ? "backdrop-blur-md" : ""
                }`}
            style={{
                borderColor: isActive
                    ? accent
                    : useAccentOutline && variant !== "ghost"
                        ? borderColor
                        : "var(--border)",
                background: isActive
                    ? theme === "tierless"
                        ? `linear-gradient(to bottom right, ${accent}20, transparent), ${bg}`
                        : `radial-gradient(circle at 0 0, rgba(79,70,229,.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.18), transparent 55%), ${bg}`
                    : bg,
                boxShadow: isActive
                    ? theme === "tierless"
                        ? `0 0 0 1px ${accent}, 0 0 40px ${accent}30, ${boxShadow}`
                        : boxShadow
                    : restingShadow,
            }}
        >
            <div className="flex flex-col h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors"
                                style={{
                                    backgroundColor: theme === "tierless" ? "rgba(255,255,255,0.1)" : "var(--surface)",
                                    color: textColor
                                }}
                            >
                                {node.iconEmoji ? (
                                    <span className="leading-none text-base">{node.iconEmoji}</span>
                                ) : (
                                    renderKindIcon("tier")
                                )}
                            </span>
                            <div className="min-w-0">
                                <div
                                    className="text-base sm:text-lg font-bold truncate tracking-tight"
                                    style={{ color: textColor }}
                                >
                                    {node.label || t("Untitled tier")}
                                </div>
                            </div>
                            {node.badgeText && (
                                <span
                                    className="inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                                    style={{
                                        borderColor: node.badgeColor || accent,
                                        color: theme === "tierless" ? "#fff" : (node.badgeColor || accent),
                                        backgroundColor: theme === "tierless" ? (node.badgeColor || accent) : "rgba(15,23,42,0.02)",
                                        boxShadow: theme === "tierless" ? `0 2px 10px ${node.badgeColor || accent}60` : "none"
                                    }}
                                >
                                    {node.badgeText}
                                </span>
                            )}
                        </div>

                        {node.description && (
                            <p className="text-sm text-[var(--muted)] leading-relaxed">
                                {node.description}
                            </p>
                        )}
                    </div>
                </div>

                {priceStr && (
                    <div className="mt-2">
                        <div className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
                            {priceStr}
                        </div>
                        <div className="text-xs text-[var(--muted)] font-medium mt-1">
                            {t("Tier")}
                            {billingForLabel && billingForLabel !== "once"
                                ? ` · ${billingForLabel === "month"
                                    ? t("Billed monthly")
                                    : t("Billed yearly")
                                }`
                                : ""}
                        </div>
                    </div>
                )}

                {node.features && node.features.length > 0 && (
                    <div className="pt-4 mt-auto border-t border-[var(--border)]">
                        <ul className="space-y-2 text-xs sm:text-sm">
                            {node.features.map((feat) => {
                                if (!feat.label && !feat.highlighted) return null;
                                if (feat.highlighted) {
                                    return (
                                        <li key={feat.id}>
                                            <span
                                                className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold"
                                                style={{
                                                    borderColor: accent,
                                                    color: theme === "tierless" ? accent : accent,
                                                    backgroundColor: theme === "tierless" ? `${accent}15` : "rgba(15,23,42,0.02)",
                                                }}
                                            >
                                                {feat.label || t("Feature")}
                                            </span>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={feat.id} className="flex items-start gap-2.5 text-[var(--muted)]">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                                        <span className="leading-snug">{feat.label || t("Feature")}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </button>
    );
}
