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
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm cursor-pointer transition-all duration-200 ${checked
                ? "border-transparent shadow-lg"
                : "border-[var(--border)] hover:border-[var(--brand-1)] hover:shadow-md"
                }`}
            style={
                checked
                    ? {
                        background: "var(--card)",
                        borderColor: "var(--brand-1)",
                        boxShadow: "0 0 0 1px var(--brand-1), 0 4px 12px rgba(0,0,0,0.1)",
                    }
                    : { background: "var(--surface)" }
            }
        >
            <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${checked ? "border-[var(--brand-1)] bg-[var(--brand-1)]" : "border-[var(--muted)] bg-transparent"
                    }`}>
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
