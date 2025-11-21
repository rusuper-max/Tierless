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
}: AddonCardProps) {
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

    return (
        <label
            className={`flex items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 text-sm cursor-pointer transition ${checked
                    ? "border-transparent shadow-[0_16px_32px_rgba(15,23,42,.45)]"
                    : "border-[var(--border)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,.30)]"
                }`}
            style={
                checked
                    ? {
                        background:
                            "radial-gradient(circle at 0 0, rgba(79,70,229,.22), transparent 55%), radial-gradient(circle at 100% 0, rgba(34,211,238,.20), transparent 55%), var(--card)",
                        boxShadow:
                            "0 18px 40px rgba(15,23,42,.55), 0 0 0 1px rgba(148,163,184,.5)",
                    }
                    : { background: "var(--card)" }
            }
        >
            <div className="flex items-start gap-2 min-w-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
                            {node.iconEmoji ? (
                                <span className="text-xs leading-none">{node.iconEmoji}</span>
                            ) : (
                                renderKindIcon("addon")
                            )}
                        </span>
                        <span className="font-medium text-[var(--text)] truncate">
                            {node.label || t("Untitled addon")}
                        </span>
                    </div>
                    {node.description && (
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                            {node.description}
                        </p>
                    )}
                </div>
            </div>

            {priceStr && (
                <div className="ml-2 text-right text-xs sm:text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                    +{priceStr}
                </div>
            )}
        </label>
    );
}
