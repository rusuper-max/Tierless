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
            ? "linear-gradient(135deg, rgba(13,16,48,0.95), rgba(5,8,25,0.9))"
            : theme === "dark"
                ? "rgba(10,13,24,0.96)"
                : "var(--card)";

    let borderColor =
        theme === "light"
            ? "var(--border)"
            : theme === "tierless"
                ? "rgba(125,136,255,0.45)"
                : "rgba(148,163,184,.35)";
    let bg: string | undefined = baseBg;
    let boxShadow =
        theme === "light"
            ? "0 12px 28px rgba(15,23,42,.18)"
            : theme === "tierless"
                ? "0 22px 55px rgba(5,8,30,.75)"
                : "0 20px 35px rgba(2,6,23,.55)";
    const restingShadow =
        theme === "light"
            ? "0 6px 16px rgba(15,23,42,.18)"
            : theme === "tierless"
                ? "0 14px 30px rgba(2,6,32,.7)"
                : "0 10px 24px rgba(4,6,20,.65)";

    if (variant === "outline") {
        borderColor = useAccentOutline ? accent : borderColor;
        bg =
            theme === "light"
                ? "var(--bg)"
                : theme === "tierless"
                    ? "rgba(8,11,35,0.8)"
                    : "rgba(6,9,18,0.6)";
    } else if (variant === "ghost") {
        borderColor = "transparent";
        bg =
            theme === "light"
                ? "transparent"
                : theme === "tierless"
                    ? "rgba(5,9,26,0.35)"
                    : "transparent";
        boxShadow =
            theme === "light"
                ? "0 8px 20px rgba(15,23,42,.20)"
                : theme === "tierless"
                    ? "0 20px 40px rgba(3,7,30,.75)"
                    : "0 12px 32px rgba(0,0,0,.65)";
    }

    if (emphasis === "featured") {
        boxShadow =
            theme === "light"
                ? "0 18px 40px rgba(15,23,42,.35)"
                : theme === "tierless"
                    ? "0 35px 85px rgba(4,9,42,.85)"
                    : "0 25px 60px rgba(2,6,23,.75)";
    } else if (emphasis === "subtle") {
        boxShadow =
            theme === "light"
                ? "0 8px 18px rgba(15,23,42,.18)"
                : theme === "tierless"
                    ? "0 12px 24px rgba(4,6,24,.6)"
                    : "0 15px 30px rgba(2,6,23,.58)";
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
            className="group w-full text-left rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 transition transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-1,#4F46E5)]"
            style={{
                borderColor: isActive
                    ? "transparent"
                    : useAccentOutline && variant !== "ghost"
                        ? borderColor
                        : "var(--border)",
                background: isActive
                    ? `radial-gradient(circle at 0 0, rgba(79,70,229,.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.18), transparent 55%), ${bg}`
                    : bg,
                boxShadow: isActive ? boxShadow : restingShadow,
            }}
        >
            <div className="flex flex-col h-full gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-xs">
                                {node.iconEmoji ? (
                                    <span className="leading-none">{node.iconEmoji}</span>
                                ) : (
                                    renderKindIcon("tier")
                                )}
                            </span>
                            <div className="min-w-0">
                                <div
                                    className="text-sm sm:text-base font-semibold truncate"
                                    style={{ color: textColor }}
                                >
                                    {node.label || t("Untitled tier")}
                                </div>
                                <div className="text-[11px] text-[var(--muted)]">
                                    {t("Tier")}
                                    {billingForLabel && billingForLabel !== "once"
                                        ? ` · ${billingForLabel === "month"
                                            ? t("Billed monthly")
                                            : t("Billed yearly")
                                        }`
                                        : ""}
                                </div>
                            </div>
                            {node.badgeText && (
                                <span
                                    className="inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                        borderColor: node.badgeColor || accent,
                                        color: node.badgeColor || accent,
                                        backgroundColor: "rgba(15,23,42,0.02)",
                                    }}
                                >
                                    {node.badgeText}
                                </span>
                            )}
                        </div>

                        {node.description && (
                            <p className="text-xs sm:text-[13px] text-[var(--muted)]">
                                {node.description}
                            </p>
                        )}
                    </div>

                    {priceStr && (
                        <div className="ml-2 text-right shrink-0">
                            <div className="text-sm sm:text-lg font-semibold text-[var(--text)]">
                                {priceStr}
                            </div>
                        </div>
                    )}
                </div>

                {node.features && node.features.length > 0 && (
                    <ul className="mt-1 space-y-1 text-[11px] sm:text-xs">
                        {node.features.map((feat) => {
                            if (!feat.label && !feat.highlighted) return null;
                            if (feat.highlighted) {
                                return (
                                    <li key={feat.id}>
                                        <span
                                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                                            style={{
                                                borderColor: accent,
                                                color: accent,
                                                backgroundColor: "rgba(15,23,42,0.02)",
                                            }}
                                        >
                                            {feat.label || t("Feature")}
                                        </span>
                                    </li>
                                );
                            }

                            return (
                                <li key={feat.id}>
                                    <span className="inline-flex items-center text-[var(--muted)]">
                                        <span className="mr-2 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
                                        <span>{feat.label || t("Feature")}</span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </button>
    );
}
