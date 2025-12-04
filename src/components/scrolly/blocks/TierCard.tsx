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
    isNeonTemplate?: boolean;
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
    isNeonTemplate = false,
}: TierCardProps) {
    const accent = node.accentColor || "var(--brand-1,#4F46E5)";
    const isGradientAccent = typeof accent === "string" && accent.includes("gradient");
    const gradientColors = isGradientAccent ? accent.match(/#[0-9a-fA-F]{6}/g) : null;
    const accentPrimary = gradientColors?.[0] || accent;
    const textColor = node.textColor || "var(--text)";
    const variant = node.cardVariant || "solid";
    const emphasis = node.emphasis || "normal";
    const useAccentOutline = node.useAccentOutline !== false;

    // Only show accent colors when active (selected) or alwaysColored is true
    const showAccentColor = isActive || node.alwaysColored === true;

    const baseBg =
        theme === "tierless"
            ? "rgba(255, 255, 255, 0.03)" // Glassy base
            : theme === "dark"
                ? "rgba(10,13,24,0.96)"
                : theme === "editorial"
                    ? "rgba(28, 25, 23, 0.4)" // stone-900/40
                    : "var(--card)";

    let borderColor =
        theme === "light"
            ? "var(--border)"
            : theme === "tierless"
                ? "rgba(255, 255, 255, 0.08)"
                : theme === "editorial"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(148,163,184,.35)";
    let bg: string | undefined = baseBg;
    let boxShadow =
        theme === "light"
            ? "0 12px 28px rgba(15,23,42,.18)"
            : theme === "tierless"
                ? "0 8px 32px rgba(0, 0, 0, 0.4)" // Deep shadow
                : theme === "editorial"
                    ? "0 0 40px -10px rgba(251,146,60,0.1)" // Orange glow
                    : "0 20px 35px rgba(2,6,23,.55)";
    const restingShadow =
        theme === "light"
            ? "0 6px 16px rgba(15,23,42,.18)"
            : theme === "tierless"
                ? "0 4px 20px rgba(0, 0, 0, 0.2)"
                : theme === "editorial"
                    ? "none"
                    : "0 10px 24px rgba(4,6,20,.65)";

    if (variant === "outline") {
        borderColor = useAccentOutline ? accent : borderColor;
        bg =
            theme === "light"
                ? "var(--bg)"
                : theme === "tierless"
                    ? "transparent"
                    : theme === "editorial"
                        ? "rgba(28, 25, 23, 0.2)"
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
                    : theme === "editorial"
                        ? "0 0 60px -10px rgba(251,146,60,0.15)"
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

    // Only show gradient background when accent should be visible
    const showGradientBg = isGradientAccent && showAccentColor;
    const gradientBaseLayer =
        theme === "tierless"
            ? "rgba(8,12,24,0.9)"
            : theme === "dark"
                ? "rgba(6,9,18,0.92)"
                : theme === "editorial"
                    ? "rgba(28,25,23,0.6)"
                    : "var(--card)";

    const gradientBackground = showGradientBg
        ? `linear-gradient(${gradientBaseLayer}, ${gradientBaseLayer}) padding-box, ${accent} border-box`
        : undefined;

    // Separate selection indicator from accent color visibility
    // This ensures selected state is ALWAYS visible, even with alwaysColored
    const selectionGlow = isActive
        ? theme === "tierless"
            ? `0 0 0 2px ${accentPrimary}, 0 0 25px ${accentPrimary}50, 0 0 50px ${accentPrimary}30`
            : theme === "editorial"
                ? `0 0 0 2px rgba(251,146,60,0.8), 0 0 25px rgba(251,146,60,0.4)`
                : theme === "light"
                    ? `0 0 0 2px ${accentPrimary}, 0 0 20px ${accentPrimary}40, 0 8px 30px rgba(0,0,0,0.15)`
                    : `0 0 0 2px ${accentPrimary}, 0 0 30px ${accentPrimary}50, 0 0 60px ${accentPrimary}25`
        : null;

    const finalBoxShadow = selectionGlow
        ? selectionGlow
        : showAccentColor
            ? theme === "tierless"
                ? `0 0 0 1px ${accentPrimary}60, 0 0 20px ${accentPrimary}15, ${boxShadow}`
                : theme === "editorial"
                    ? `0 0 0 1px rgba(251,146,60,0.2), ${boxShadow}`
                    : boxShadow
            : restingShadow;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group relative w-full text-left rounded-2xl border px-4 py-4 sm:px-6 sm:py-6 transition-all duration-300 transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-1,#4F46E5)] ${theme === "tierless" ? "backdrop-blur-md" : ""} ${isActive ? "scale-[1.02] z-10" : ""} ${isNeonTemplate ? "neon-card" : ""} ${isNeonTemplate && emphasis === "featured" ? "neon-featured" : ""}`}
            style={{
                borderColor: gradientBackground
                    ? "transparent"
                    : isActive
                        ? accentPrimary
                        : showAccentColor
                            ? `${accentPrimary}80`
                            : "var(--border)",
                borderWidth: isActive ? "2px" : "1px",
                background: gradientBackground
                    ? gradientBackground
                    : showAccentColor
                        ? theme === "tierless"
                            ? `linear-gradient(to bottom right, ${accentPrimary}20, transparent), ${bg}`
                            : theme === "editorial"
                                ? `linear-gradient(to bottom, rgba(255,255,255,0.05), transparent), ${bg}`
                                : `radial-gradient(circle at 0 0, rgba(79,70,229,.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.18), transparent 55%), ${bg}`
                        : bg,
                boxShadow: finalBoxShadow,
            }}
        >
            {/* Selection indicator - top right corner */}
            {isActive && (
                <div 
                    className="absolute -top-2 -right-2 z-20 flex items-center justify-center w-6 h-6 rounded-full shadow-lg animate-in zoom-in-50 duration-200"
                    style={{
                        background: isGradientAccent ? accent : accentPrimary,
                        boxShadow: `0 2px 10px ${accentPrimary}60`,
                    }}
                >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            <div className="flex flex-col h-full gap-3">
                {/* Badge - positioned on top border edge */}
                {node.badgeText && (
                    <div className="absolute -top-3 left-6">
                        <span
                            className="inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm"
                            style={{
                                borderColor: showAccentColor ? (node.badgeColor || accentPrimary) : "var(--border)",
                                color: showAccentColor
                                    ? (theme === "tierless" ? "#fff" : (node.badgeColor || accentPrimary))
                                    : "var(--muted)",
                                backgroundColor: showAccentColor
                                    ? (theme === "tierless" ? (node.badgeColor || accentPrimary) : theme === "light" ? "#fff" : "rgba(28,25,23,0.95)")
                                    : theme === "light" ? "#fff" : "var(--card)",
                                boxShadow: showAccentColor && theme === "tierless"
                                    ? `0 2px 10px ${node.badgeColor || accentPrimary}60`
                                    : "0 2px 8px rgba(0,0,0,0.1)"
                            }}
                        >
                            {node.badgeText}
                        </span>
                    </div>
                )}

                {/* Header with icon and title */}
                <div className="flex items-start gap-3">
                    <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs transition-colors"
                        style={{
                            background: isGradientAccent && showAccentColor
                                ? accent
                                : showAccentColor && !isGradientAccent
                                    ? `${accentPrimary}20`
                                    : theme === "tierless"
                                        ? "rgba(255,255,255,0.1)"
                                        : "var(--surface)",
                            color: isGradientAccent && showAccentColor ? "#fff" : textColor
                        }}
                    >
                        {node.iconEmoji ? (
                            <span className="leading-none text-base">{node.iconEmoji}</span>
                        ) : (
                            renderKindIcon("tier")
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        {/* Title - now has full width, can wrap if needed */}
                        <div
                            className={`text-base sm:text-lg font-bold tracking-tight leading-tight ${theme === "editorial" ? "font-serif" : ""}`}
                            style={{ color: textColor }}
                            title={node.label || t("Untitled tier")}
                        >
                            {node.label || t("Untitled tier")}
                        </div>

                        {node.description && (
                            <p className="text-sm text-[var(--muted)] leading-relaxed mt-1.5">
                                {node.description}
                            </p>
                        )}
                    </div>
                </div>

                {priceStr && (
                    <div className="mt-2">
                        <div className={`text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight ${theme === "editorial" ? "font-serif font-light" : ""}`}>
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

                                // Determine accent for features - only show color if accent should be visible
                                const featureAccentPrimary = showAccentColor ? accentPrimary : "var(--muted)";

                                if (feat.highlighted) {
                                    // CONSISTENT STYLE: Bordered pill with colored/gradient text
                                    const useGradientText = showAccentColor && isGradientAccent;
                                    
                                    return (
                                        <li key={feat.id}>
                                            <span
                                                className="inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold"
                                                style={{
                                                    borderColor: showAccentColor ? featureAccentPrimary : "var(--border)",
                                                    backgroundColor: showAccentColor 
                                                        ? `${featureAccentPrimary}15`
                                                        : "var(--surface)",
                                                }}
                                            >
                                                {useGradientText ? (
                                                    // Gradient text for gradient accent colors
                                                    <span
                                                        style={{
                                                            background: accent,
                                                            WebkitBackgroundClip: "text",
                                                            WebkitTextFillColor: "transparent",
                                                            backgroundClip: "text",
                                                        }}
                                                    >
                                                        {feat.label || t("Feature")}
                                                    </span>
                                                ) : (
                                                    // Solid color text
                                                    <span style={{ color: showAccentColor ? featureAccentPrimary : "var(--text)" }}>
                                                        {feat.label || t("Feature")}
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={feat.id} className="flex items-start gap-2.5 text-[var(--muted)]">
                                        <span
                                            className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: featureAccentPrimary }}
                                        />
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
