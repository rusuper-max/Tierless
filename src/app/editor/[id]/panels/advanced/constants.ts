import { BillingPeriod } from "./types";

export const t = (s: string) => s;

export const CURRENCY_PRESETS = ["€", "$", "£", "CHF", "CAD", "AUD", "RSD", "BAM", "PLN"];

export const COLORS = [
    { name: "Slate", hex: "#64748b" },
    { name: "Red", hex: "#ef4444" },
    { name: "Orange", hex: "#f97316" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Yellow", hex: "#eab308" },
    { name: "Lime", hex: "#84cc16" },
    { name: "Green", hex: "#22c55e" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Teal", hex: "#14b8a6" },
    { name: "Cyan", hex: "#06b6d4" },
    { name: "Sky", hex: "#0ea5e9" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Indigo", hex: "#6366f1" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Purple", hex: "#a855f7" },
    { name: "Fuchsia", hex: "#d946ef" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Rose", hex: "#f43f5e" },
];

export const BILLING_OPTIONS: { value: BillingPeriod; label: string }[] = [
    { value: "once", label: t("One-time") },
    { value: "month", label: t("Monthly") },
    { value: "year", label: t("Yearly") },
];

export const FONT_OPTIONS = [
    { value: "sans", label: "Sans Serif", preview: "font-sans" },
    { value: "serif", label: "Serif", preview: "font-serif" },
    { value: "mono", label: "Monospace", preview: "font-mono" },
];
