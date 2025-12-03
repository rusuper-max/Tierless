import React from "react";
import { t } from "@/i18n";
import { renderKindIcon } from "./utils";
import type {
    AdvancedNode,
    SliderColorMode,
} from "@/app/editor/[id]/panels/advanced/types";

export type SliderBlockProps = {
    node: AdvancedNode;
    value: number;
    onChange: (v: number) => void;
    formatPrice: (v: number | null | undefined, o?: any) => string;
    sliderColorMode: SliderColorMode;
    sliderSolidColor: string | null;
};

export function SliderBlock({
    node,
    value,
    onChange,
    formatPrice,
    sliderColorMode,
    sliderSolidColor,
}: SliderBlockProps) {
    const min = typeof node.min === "number" ? node.min : 0;
    const max = typeof node.max === "number" ? node.max : 100;
    const step = typeof node.step === "number" && node.step > 0 ? node.step : 1;

    const pricePerStepStr =
        typeof node.pricePerStep === "number"
            ? formatPrice(node.pricePerStep, {
                billing: node.billingPeriod || "once",
                unitLabel: node.unitLabel,
            })
            : "";

    const added =
        typeof node.pricePerStep === "number" ? value * node.pricePerStep : 0;

    const addedStr =
        added > 0
            ? formatPrice(added, {
                billing: node.billingPeriod || "once",
                unitLabel: node.unitLabel,
            })
            : "";

    // Use node.accentColor if available, otherwise fall back to global slider colors
    const accent = node.accentColor;
    const isGradientAccent = typeof accent === "string" && accent.includes("gradient");

    let fillGradient: string;
    if (accent) {
        // Node has its own accent color
        if (isGradientAccent) {
            // Use the gradient as-is
            fillGradient = accent;
        } else {
            // Solid color - create a gradient from same color
            fillGradient = `linear-gradient(90deg,${accent},${accent})`;
        }
    } else {
        // Fall back to global slider colors
        fillGradient =
            sliderColorMode === "brand"
                ? `linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))`
                : sliderColorMode === "solid" && sliderSolidColor
                    ? `linear-gradient(90deg,${sliderSolidColor},${sliderSolidColor})`
                    : `linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-1,#4F46E5))`;
    }

    const percent =
        max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)]">
                        {node.iconEmoji ? (
                            <span className="text-xs leading-none">{node.iconEmoji}</span>
                        ) : (
                            renderKindIcon("slider")
                        )}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text)]">
                            {node.label || t("Untitled slider")}
                        </div>
                        {node.description && (
                            <div className="text-[11px] text-[var(--muted)] line-clamp-2 mt-0.5">
                                {node.description}
                            </div>
                        )}
                        <div className="text-[10px] text-[var(--muted)] opacity-70 mt-0.5">
                            {t("Range")}: {min} – {max} {node.unit && `(${node.unit})`}
                        </div>
                    </div>
                </div>
                <div className="text-right text-[11px] text-[var(--muted)] space-y-0.5">
                    <div>
                        {t("Current")}: {value}
                    </div>
                    {pricePerStepStr && (
                        <div>
                            {t("Price per step")}: {pricePerStepStr}
                        </div>
                    )}
                    {addedStr && (
                        <div>
                            {t("Adds")}: {addedStr}
                        </div>
                    )}
                </div>
            </div>

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-[var(--track)]"
                style={{
                    backgroundImage: `${fillGradient}, linear-gradient(var(--track), var(--track))`,
                    backgroundSize: `${percent}% 100%, 100% 100%`,
                    backgroundRepeat: "no-repeat",
                }}
            />
        </div>
    );
}
