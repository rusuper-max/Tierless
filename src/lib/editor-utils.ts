import type { CalcJson, OptionGroup } from "@/types/editor";

export function genId(prefix = "id"): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
        .toString(36)
        .slice(-4)}`;
}

export function clone<T>(v: T): T {
    return (globalThis as any).structuredClone
        ? (structuredClone as any)(v)
        : JSON.parse(JSON.stringify(v));
}

export function ensureShape(calc: CalcJson): CalcJson {
    if (!Array.isArray(calc.packages)) calc.packages = [];
    if (!Array.isArray(calc.fields)) calc.fields = [];
    if (!Array.isArray(calc.addons)) calc.addons = [];
    if (!Array.isArray(calc.items)) calc.items = [];

    if (!calc.meta) calc.meta = {};
    if (!calc.meta.business) calc.meta.business = {};

    calc.fields = calc.fields.map((g: any) => {
        const type: OptionGroup["type"] =
            g?.type === "range" || g?.type === "options" || g?.type === "features"
                ? g.type
                : "options";

        const base: OptionGroup = {
            id: g.id ?? genId("grp"),
            title: g.title ?? (type === "range" ? "Range" : "Group"),
            type,
        };

        // ... (kopiraj logiku mapiranja polja iz originalnog fajla ovde) ...
        // Zbog dužine ne kopiram sve, ali prebaci ceo taj blok ovde

        if (type === "features") {
            base.pkgId = g.pkgId;
            base.options = Array.isArray(g.options) ? g.options : [];
        } else if (type === "range") {
            base.min = Number.isFinite(g.min) ? g.min : 0;
            base.max = Number.isFinite(g.max) ? g.max : 10;
            base.step = Number.isFinite(g.step) ? g.step : 1;
            base.unit = g.unit ?? "";
            base.base = Number.isFinite(g.base) ? g.base : 0;
            base.pricing =
                g.pricing && g.pricing.mode === "per-step"
                    ? {
                        mode: "per-step",
                        perStep: Array.isArray(g.pricing.perStep) ? g.pricing.perStep : [],
                    }
                    : { mode: "linear", deltaPerUnit: Number(g?.pricing?.deltaPerUnit ?? 0) };
        } else {
            base.options = Array.isArray(g.options) ? g.options : [];
        }
        if (g.color) base.color = g.color;
        return base;
    });

    return calc;
}