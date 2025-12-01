import React from "react";
import { t } from "@/i18n";
import { ArrowRight } from "lucide-react";
import { BRAND_GRADIENT, type AdvancedTheme } from "@/app/editor/[id]/panels/advanced/types";

export type SummaryProps = {
    total: number;
    hasAnyBlocks: boolean;
    formatPrice: (v: number | null | undefined, o?: any) => string;
    showInquiry: boolean;
    theme: AdvancedTheme;
};

export function Summary({
    total,
    hasAnyBlocks,
    formatPrice,
    showInquiry,
    theme,
}: SummaryProps) {
    if (!hasAnyBlocks) return null;

    const summaryShadow =
        theme === "tierless"
            ? "0 28px 65px rgba(5,8,30,.75)"
            : theme === "dark"
                ? "0 18px 40px rgba(2,6,23,.5)"
                : "0 12px 30px rgba(15,23,42,.12)";

    return (
        <section
            className={`rounded-2xl border border-[var(--border)] px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4 transition-all ${theme === "tierless" ? "bg-[var(--glass)] backdrop-blur-xl" : "bg-[var(--card)]"
                }`}
            style={{ boxShadow: summaryShadow }}
        >
            <div className="space-y-1">
                <div className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider text-[10px]">
                    {t("Estimated total")}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-[var(--text)] tracking-tight">
                    {formatPrice(total)}
                </div>
                <p className="text-xs text-[var(--muted)] opacity-80">
                    {t(
                        "This is a rough estimate based on selected packages and extras."
                    )}
                </p>
            </div>

            {showInquiry && (
                <button
                    type="button"
                    className="group relative inline-flex items-center justify-center rounded-xl bg-[var(--brand-1)] px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 mt-2"
                >
                    <span className="relative z-[1] inline-flex items-center gap-2">
                        {t("Send inquiry")}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </button>
            )}
        </section>
    );
}
