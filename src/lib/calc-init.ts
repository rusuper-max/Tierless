import type { Calculator, Package, Item, Block } from "@/types/calculator";

/** Generiši “full” kalkulator iz minimalnog zapisa (meta + config) */
export function calcFromMetaConfig(mini: any): Calculator {
  const meta = mini?.meta ?? {};
  const cfg = mini?.config ?? {};

  const pricingMode =
    (cfg?.pricingMode === "list" ? "list" : "packages") as "packages" | "list";

  const fields = Array.isArray(cfg.fields)
    ? cfg.fields.map((f: any) => {
      const key = String(f?.key ?? f?.name ?? "field").trim();
      const label = String(f?.label ?? f?.name ?? key).trim();

      if ((f?.type ?? "").toLowerCase() === "number") {
        const def = Number.isFinite(f?.default) ? Number(f.default) : 0;
        const max = Number.isFinite(f?.max) ? Number(f.max) : Math.max(10, def * 2 || 100);
        const step = Number.isFinite(f?.step) ? Number(f.step) : 1;
        const deltaPerUnit = Number.isFinite(f?.deltaPerUnit) ? Number(f.deltaPerUnit) : 0;
        return {
          key,
          type: "slider",
          label,
          min: Number.isFinite(f?.min) ? Number(f.min) : 0,
          max,
          step,
          default: def,
          deltaPerUnit,
        };
      }

      if (Array.isArray(f?.options) && f.options.length > 0) {
        return {
          key,
          type: "select",
          label,
          options: f.options.map((o: any) => ({
            value: String(o?.value ?? o?.id ?? o?.label ?? "opt").trim(),
            label: String(o?.label ?? o?.value ?? "Option").trim(),
            delta: Number.isFinite(o?.delta) ? Number(o.delta) : 0,
          })),
          default: String(f?.default ?? f?.options?.[0]?.value ?? "").trim(),
        };
      }

      return {
        key,
        type: "select",
        label,
        options: [{ value: "n/a", label: "N/A", delta: 0 }],
        default: "n/a",
      };
    })
    : [];

  const packages: Package[] =
    Array.isArray(cfg.packages) && cfg.packages.length
      ? cfg.packages.map((p: any, i: number) => ({
        id: String(p?.id ?? `pkg${i + 1}`),
        label: String(p?.label ?? p?.name ?? `Package ${i + 1}`),
        description: String(p?.description ?? ""),
        basePrice: Number.isFinite(p?.basePrice) ? Number(p.basePrice) : 0,
        featured: Boolean(p?.featured ?? i === 0),
        covers: Array.isArray(p?.covers)
          ? p.covers.map((c: any) => ({
            text: String(c?.text ?? ""),
            premium: Boolean(c?.premium),
          }))
          : undefined,
      }))
      : [{ id: "basic", label: "Basic", description: cfg?.description ?? "", basePrice: 0, featured: true }];

  const items: Item[] = Array.isArray(cfg.items)
    ? cfg.items.map((it: any, i: number) => ({
      id: String(it?.id ?? `item${i + 1}`),
      label: String(it?.label ?? it?.name ?? `Item ${i + 1}`),
      unit: it?.unit ? String(it.unit) : undefined,
      price: Number.isFinite(it?.price) ? Number(it.price) : undefined,
      qty: Number.isFinite(it?.qty) ? Number(it.qty) : undefined,
      note: it?.note ? String(it.note) : undefined,
    }))
    : [];

  // --- Blocks (auto) ---
  const blocks: Block[] = [];
  if (pricingMode === "packages" && packages.length > 0) {
    blocks.push({ id: "b_pkgs", type: "packages", title: "Plans", layout: "cards" });
  } else if (pricingMode === "list") {
    blocks.push({ id: "b_items", type: "items", title: "Price list", showTotals: true });
  }
  if (fields.length > 0) blocks.push({ id: "b_opts", type: "options", title: "Options" });
  if (Array.isArray(cfg.addons) && cfg.addons.length > 0) {
    blocks.push({ id: "b_extras", type: "extras", title: "Extras" });
  }

  return {
    meta: {
      name: String(meta?.name ?? "Untitled Page"),
      slug: String(meta?.slug ?? "untitled"),
      branding: {
        theme: "dark",
        accent: "#7c3aed",
        layout: "cards",
        hideBadge: false,
      },
      // Pass through advanced configuration if present
      ...(cfg?.advanced || {}),
    },
    i18n: {
      locale: String(cfg?.i18n?.locale ?? "en"),
      currency: String(cfg?.i18n?.currency ?? "EUR"),
      decimals: Number.isFinite(cfg?.i18n?.decimals) ? Number(cfg.i18n.decimals) : 0,
    },
    pricingMode,
    packages,
    items,
    addons: Array.isArray(cfg.addons) ? cfg.addons : [],
    fields,
    blocks, // NOVO
  } as unknown as Calculator;
}

/** Prazan “full” kao fallback */
export function calcBlank(slug: string, name = "Untitled Page"): Calculator {
  const blocks: Block[] = [
    { id: "b_pkgs", type: "packages", title: "Plans", layout: "cards" },
  ];
  return {
    meta: { name, slug, branding: { theme: "dark", accent: "#14b8a6", layout: "cards" } },
    i18n: { locale: "en", currency: "EUR", decimals: 0 },
    pricingMode: "packages",
    packages: [{ id: "basic", label: "Basic", basePrice: 0, featured: true }],
    items: [],
    addons: [],
    fields: [],
    blocks,
  } as unknown as Calculator;
}