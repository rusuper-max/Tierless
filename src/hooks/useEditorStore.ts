// src/hooks/useEditorStore.ts
import { create } from "zustand";
import type {
  CalcJson, Mode, Pkg, FeatureOption, Extra, OptionGroup, ItemRow,
  BrandTheme, SimpleSection, CalcMeta
} from "@/types/editor";
import { genId, clone, ensureShape } from "@/lib/editor-utils";

// Re-export types za komponente koje ih koriste direktno iz ovog fajla
export type { CalcJson, Mode, BrandTheme, SimpleSection, ItemRow, Pkg, OptionGroup, Extra, FeatureOption };

type EditorState = {
  slug: string;
  calc: CalcJson | null;

  isDirty: boolean;
  isSaving: boolean;
  lastSaved: number | null;

  maxPackages: number;
  lastWarn?: string;
  lastError?: string;

  init: (slug: string, initialCalc: CalcJson) => void;
  setCalc: (calc: CalcJson) => void;
  updateCalc: (fn: (draft: CalcJson) => void) => void;
  setMeta: (patch: Partial<CalcMeta>) => void;

  setEditorMode: (mode?: Mode | null) => void;

  // Packages
  addPackage: (partial?: Partial<Pkg>) => string | void;
  updatePackage: (id: string, patch: Partial<Pkg>) => void;
  removePackage: (id: string) => void;
  duplicatePackage: (id: string) => void;
  reorderPackage: (id: string, dir: -1 | 1) => void;

  // Features
  ensureFeatureGroup: (pkgId: string) => string;
  addFeature: (pkgId: string, label?: string) => string | void;
  updateFeature: (pkgId: string, featId: string, patch: Partial<FeatureOption>) => void;
  removeFeature: (pkgId: string, featId: string) => void;

  // Extras
  addExtra: (text?: string) => string;
  updateExtra: (id: string, patch: Partial<Extra>) => void;
  removeExtra: (id: string) => void;

  // Ranges
  addRangeGroup: (title?: string) => string;
  updateRangeGroup: (id: string, patch: Partial<OptionGroup>) => void;
  removeRangeGroup: (id: string) => void;

  // Items (simple)
  addItem: (label?: string, price?: number) => string;
  updateItem: (id: string, patch: Partial<ItemRow>) => void;
  removeItem: (id: string) => void;
  reorderItem: (id: string, dir: -1 | 1) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;

  bulkAddItems: (
    items: { label: string; price: number | null; note?: string }[],
    mode?: "append" | "replace"
  ) => void;

  setMaxPackages: (n: number) => void;
  setPlanCaps: (plan: string) => void;

  setWarn: (msg?: string) => void;
  setError: (msg?: string) => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  slug: "",
  calc: null,

  isDirty: false,
  isSaving: false,
  lastSaved: null,

  maxPackages: 6,
  lastWarn: undefined,
  lastError: undefined,

  /* --------------------------------------------------------- */
  /* Core Actions                                              */
  /* --------------------------------------------------------- */

  init: (slug, initialCalc) => {
    const safe = ensureShape(clone(initialCalc));
    if (!safe.meta.editorMode) safe.meta.editorMode = "setup";
    if (!safe.i18n) safe.i18n = { currency: "€", decimals: 0 };
    if (!safe.meta.theme) safe.meta.theme = "tierless";

    set({
      slug,
      calc: safe,
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      lastWarn: undefined,
      lastError: undefined,
    });
  },

  setCalc: (next) => {
    const safe = ensureShape(clone(next));
    set({ calc: safe, isDirty: false, lastError: undefined, lastWarn: undefined });
  },

  updateCalc: (fn) =>
    set((state) => {
      if (!state.calc) return {};
      const next = clone(state.calc);
      fn(next);
      return { calc: next, isDirty: true };
    }),

  setMeta: (patch) =>
    set((state) => {
      if (!state.calc) return {};
      const next = clone(state.calc);
      if (!next.meta) next.meta = {};
      Object.assign(next.meta, patch);
      return { calc: next, isDirty: true };
    }),

  setEditorMode: (mode) => {
    const st = get();
    const calc = st.calc;
    if (!calc) return;

    const next = clone(calc);

    // 1. Set mode
    if (!mode || mode === "setup") {
      next.meta = { ...(next.meta || {}), editorMode: "setup" };
      set({ calc: ensureShape(next), isDirty: true });
      return;
    }
    next.meta = { ...(next.meta || {}), editorMode: mode };

    // 2. Seed initial data if empty
    if (mode === "simple") {
      if (!next.items || !next.items.length) {
        next.items = [
          { id: genId("it"), label: "Espresso", price: 2 },
          { id: genId("it"), label: "Cappuccino", price: 3 },
          { id: genId("it"), label: "Latte", price: 3.5 },
        ];
      }
    } else {
      // Advanced default
      if (!next.packages.length && (!next.items || !next.items.length)) {
        const p = {
          id: genId("pkg"),
          label: "Starter",
          basePrice: 29,
          description: "",
          featured: false,
        } as Pkg;
        next.packages = [p];
        next.fields.push({
          id: genId("feat"),
          title: "Features",
          type: "features",
          pkgId: p.id,
          options: [{ id: genId("f"), label: "Feature" }],
        });
      }
    }

    set({ calc: ensureShape(next), isDirty: true });
  },

  /* --------------------------------------------------------- */
  /* Packages                                                  */
  /* --------------------------------------------------------- */

  addPackage: (partial) => {
    const st = get();
    const calc = st.calc;
    if (!calc) return;
    if (calc.packages.length >= st.maxPackages) {
      set({ lastWarn: `Package limit reached: ${st.maxPackages}.` });
      return;
    }
    const id = genId("pkg");
    const pkg: Pkg = {
      id,
      label: partial?.label ?? `Package ${calc.packages.length + 1}`,
      basePrice: partial?.basePrice ?? 0,
      description: partial?.description ?? "",
      featured: partial?.featured ?? false,
      color: partial?.color,
    };
    const next = clone(calc);
    next.packages.push(pkg);
    set({ calc: next, isDirty: true, lastWarn: undefined });
    return id;
  },

  updatePackage: (id, patch) => {
    const calc = get().calc;
    if (!calc) return;
    const next = clone(calc);
    next.packages = next.packages.map((p) => (p.id === id ? { ...p, ...patch } : p));
    set({ calc: next, isDirty: true });
  },

  removePackage: (id) => {
    const calc = get().calc;
    if (!calc) return;
    const next = clone(calc);
    next.packages = next.packages.filter((p) => p.id !== id);
    next.fields = next.fields.filter(
      (g) => !(g.type === "features" && g.pkgId === id)
    );
    set({ calc: next, isDirty: true });
  },

  duplicatePackage: (id) => {
    const calc = get().calc;
    if (!calc) return;
    const idx = calc.packages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const next = clone(calc);
    const src = next.packages[idx];
    const newId = genId("pkg");
    const dup: Pkg = {
      ...src,
      id: newId,
      label: `${src.label || "Package"} (copy)`,
    };
    next.packages.splice(idx + 1, 0, dup);

    // Duplicate features linked to this package
    const oldGrp = next.fields.find(
      (g) => g.type === "features" && g.pkgId === src.id
    );
    if (oldGrp) {
      next.fields.push({
        ...clone(oldGrp),
        id: genId("feat"),
        pkgId: newId,
        options: (oldGrp.options || []).map((f) => ({ ...f, id: genId("f") })),
      });
    }
    set({ calc: next, isDirty: true });
  },

  reorderPackage: (id, dir) => {
    const calc = get().calc;
    if (!calc) return;
    const idx = calc.packages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const next = clone(calc);
    const to = Math.max(0, Math.min(next.packages.length - 1, idx + dir));
    if (to === idx) return;
    const [item] = next.packages.splice(idx, 1);
    next.packages.splice(to, 0, item);
    set({ calc: next, isDirty: true });
  },

  /* --------------------------------------------------------- */
  /* Features                                                  */
  /* --------------------------------------------------------- */

  ensureFeatureGroup: (pkgId) => {
    const calc = get().calc!;
    const existing = calc.fields.find(
      (g) => g.type === "features" && g.pkgId === pkgId
    );
    if (existing) return existing.id;
    const id = genId("feat");
    const next = clone(calc);
    next.fields.push({ id, title: "Features", type: "features", pkgId, options: [] });
    set({ calc: next, isDirty: true });
    return id;
  },

  addFeature: (pkgId, label) => {
    const calc = get().calc!;
    const next = clone(calc);
    let grp = next.fields.find((g) => g.type === "features" && g.pkgId === pkgId);
    if (!grp) {
      grp = {
        id: genId("feat"),
        title: "Features",
        type: "features",
        pkgId,
        options: [],
      };
      next.fields.push(grp);
    }
    const id = genId("f");
    (grp.options as FeatureOption[]).push({
      id,
      label: label ?? "New feature",
      highlighted: false,
    });
    set({ calc: next, isDirty: true });
    return id;
  },

  updateFeature: (pkgId, featId, patch) => {
    const calc = get().calc!;
    const next = clone(calc);
    const grp = next.fields.find((g) => g.type === "features" && g.pkgId === pkgId);
    if (!grp || !grp.options) return;
    grp.options = (grp.options as FeatureOption[]).map((f) =>
      f.id === featId ? { ...f, ...patch } : f
    );
    set({ calc: next, isDirty: true });
  },

  removeFeature: (pkgId, featId) => {
    const calc = get().calc!;
    const next = clone(calc);
    const grp = next.fields.find((g) => g.type === "features" && g.pkgId === pkgId);
    if (!grp || !grp.options) return;
    grp.options = (grp.options as FeatureOption[]).filter((f) => f.id !== featId);
    set({ calc: next, isDirty: true });
  },

  /* --------------------------------------------------------- */
  /* Extras                                                    */
  /* --------------------------------------------------------- */

  addExtra: (text) => {
    const calc = get().calc!;
    const next = clone(calc);
    const id = genId("x");
    next.addons.push({
      id,
      text: text ?? "New extra",
      price: 0,
      selected: false,
    });
    set({ calc: next, isDirty: true });
    return id;
  },

  updateExtra: (id, patch) => {
    const calc = get().calc!;
    const next = clone(calc);
    next.addons = next.addons.map((x) => (x.id === id ? { ...x, ...patch } : x));
    set({ calc: next, isDirty: true });
  },

  removeExtra: (id) => {
    const calc = get().calc!;
    const next = clone(calc);
    next.addons = next.addons.filter((x) => x.id !== id);
    set({ calc: next, isDirty: true });
  },

  /* --------------------------------------------------------- */
  /* Ranges                                                    */
  /* --------------------------------------------------------- */

  addRangeGroup: (title) => {
    const calc = get().calc!;
    const next = clone(calc);
    const id = genId("rng");
    next.fields.push({
      id,
      title: title ?? "Range",
      type: "range",
      min: 0,
      max: 10,
      step: 1,
      base: 0,
      unit: "",
      pricing: { mode: "linear", deltaPerUnit: 0 },
    });
    set({ calc: next, isDirty: true });
    return id;
  },

  updateRangeGroup: (id, patch) => {
    const calc = get().calc!;
    const next = clone(calc);
    next.fields = next.fields.map((g) => (g.id === id ? { ...g, ...patch } : g));
    set({ calc: next, isDirty: true });
  },

  removeRangeGroup: (id) => {
    const calc = get().calc!;
    const next = clone(calc);
    next.fields = next.fields.filter((g) => g.id !== id);
    set({ calc: next, isDirty: true });
  },

  /* --------------------------------------------------------- */
  /* Items (Simple Mode)                                       */
  /* --------------------------------------------------------- */

  addItem: (label, price) => {
    const calc = get().calc!;
    const next = clone(calc);
    const id = genId("it");
    if (!Array.isArray(next.items)) next.items = [];
    next.items.push({
      id,
      label: label ?? "Item",
      price: Number.isFinite(price) ? (price as number) : 0,
    });
    set({ calc: next, isDirty: true });
    return id;
  },

  updateItem: (id, patch) => {
    const calc = get().calc!;
    const next = clone(calc);
    if (!Array.isArray(next.items)) next.items = [];
    next.items = next.items.map((r) => (r.id === id ? { ...r, ...patch } : r));
    set({ calc: next, isDirty: true });
  },

  removeItem: (id) => {
    const calc = get().calc!;
    const next = clone(calc);
    if (!Array.isArray(next.items)) next.items = [];
    next.items = next.items.filter((r) => r.id !== id);
    set({ calc: next, isDirty: true });
  },

  reorderItem: (id, dir) => {
    const calc = get().calc!;
    if (!Array.isArray(calc.items)) return;
    const idx = calc.items.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const next = clone(calc);
    const to = Math.max(0, Math.min(next.items!.length - 1, idx + dir));
    if (to === idx) return;
    const [row] = next.items!.splice(idx, 1);
    next.items!.splice(to, 0, row);
    set({ calc: next, isDirty: true });
  },

  moveItem: (fromIndex, toIndex) => {
    const calc = get().calc!;
    if (!Array.isArray(calc.items)) return;
    const next = clone(calc);
    const [item] = next.items!.splice(fromIndex, 1);
    next.items!.splice(toIndex, 0, item);
    set({ calc: next, isDirty: true });
  },

  bulkAddItems: (items, mode = "append") => {
    const calc = get().calc;
    if (!calc) return;

    const next = clone(calc);
    if (!Array.isArray(next.items)) next.items = [];

    const prepared = items
      .map((it) => {
        const label = (it.label || "").trim();
        if (!label) return null;

        const price =
          it.price === null || typeof it.price === "undefined"
            ? 0
            : Number(it.price);

        return {
          id: genId("it"),
          label,
          price: Number.isFinite(price) ? price : 0,
          note: it.note ?? "",
        } as ItemRow;
      })
      .filter(Boolean) as ItemRow[];

    if (!prepared.length) {
      return;
    }

    if (mode === "replace") {
      next.items = prepared;
    } else {
      next.items = [...(next.items || []), ...prepared];
    }

    set({ calc: next, isDirty: true });
  },

  /* --------------------------------------------------------- */
  /* Settings & Caps                                           */
  /* --------------------------------------------------------- */

  setMaxPackages: (n) => set({ maxPackages: Math.max(0, n) }),
  setPlanCaps: (plan) => {
    const map: Record<string, number> = {
      free: 1,
      starter: 3,
      growth: 5,
      pro: 8,
      tierless: 12,
    };
    const n = map[plan] ?? 6;
    set({ maxPackages: n });
  },

  setWarn: (msg) => set({ lastWarn: msg }),
  setError: (msg) => set({ lastError: msg }),
}));