import ShinyButton from "@/components/marketing/ShinyButton";
import { ArrowRight } from "lucide-react";

// Theme type (matches PublicRenderer)
type AdvancedTheme = "light" | "dark" | "tierless";

// Simple passthrough for translation (no i18n in this component)
const t = (s: string) => s;

export type SummaryProps = {
    total: number;
    hasAnyBlocks: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            className={`rounded-2xl border border-[var(--border)] px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-6 transition-all ${theme === "tierless" ? "bg-[var(--glass)] backdrop-blur-xl" : "bg-[var(--card)]"
                }`}
            style={{ boxShadow: summaryShadow }}
        >
            {showInquiry && (
                <div className="w-full">
                    {theme === "tierless" ? (
                        <ShinyButton className="w-full" rounded="rounded-xl">
                            {t("Send inquiry")}
                        </ShinyButton>
                    ) : (
                        <button
                            type="button"
                            className="group relative w-full inline-flex items-center justify-center rounded-xl bg-[var(--brand-1)] px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span className="relative z-[1] inline-flex items-center gap-2">
                                {t("Send inquiry")}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-1 mt-auto pt-4 border-t border-[var(--border)]">
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
        </section>
    );
}
