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
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3"
            style={{ boxShadow: summaryShadow }}
        >
            <div className="space-y-0.5">
                <div className="text-xs sm:text-sm text-[var(--muted)]">
                    {t("Estimated total")}
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
                    {formatPrice(total)}
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--muted)]">
                    {t(
                        "This is a rough estimate based on selected packages and extras."
                    )}
                </p>
            </div>

            {showInquiry && (
                <button
                    type="button"
                    className="relative inline-flex items-center justify-center rounded-full bg-[var(--card)] px-4 py-2 text-sm sm:text-base text-[var(--text)] mt-1"
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                            padding: 1.5,
                            background: BRAND_GRADIENT,
                            WebkitMask:
                                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor" as any,
                            maskComposite: "exclude",
                        }}
                    />
                    <span className="relative z-[1] font-medium inline-flex items-center gap-1.5">
                        {t("Send inquiry")}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </button>
            )}
        </section>
    );
}
