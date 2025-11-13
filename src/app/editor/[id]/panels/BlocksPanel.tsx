// src/app/editor/[id]/panels/BlocksPanel.tsx
"use client";

import { useMemo } from "react";
import { useEditorStore, type FeatureOption, type OptionGroup } from "@/hooks/useEditorStore";
import { t } from "@/i18n";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, Star } from "lucide-react";

type Btn = "brand" | "neutral" | "danger";
const outline = (v: Btn) => ({
  padding: 1.5,
  background:
    v === "brand"
      ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
      : v === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor" as any,
  maskComposite: "exclude",
  borderRadius: "9999px",
});

function Btn({
  children,
  onClick,
  disabled,
  v = "neutral",
  title,
  size = "sm",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  v?: Btn;
  title?: string;
  size?: "xs" | "sm";
}) {
  const pad = size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative inline-flex items-center gap-2 rounded-full ${pad} text-sm bg-[var(--card)] group ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] hover:-translate-y-0.5 transition"
      }`}
      style={{ whiteSpace: "nowrap" }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outline(v)} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: v === "danger" ? "0 0 10px 3px rgba(244,63,94,.22)" : "0 0 14px 4px rgba(34,211,238,.22)",
          transition: "opacity .18s ease",
        }}
      />
      <span className={`relative z-[1] ${v === "danger" ? "text-rose-700 dark:text-rose-300" : "text-[var(--text)]"} inline-flex items-center gap-2 whitespace-nowrap`}>
        {children}
      </span>
    </button>
  );
}

function InlineInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`field ${props.className ?? ""}`}
      style={{ borderRadius: 10, padding: "6px 10px" }}
    />
  );
}

export default function BlocksPanel() {
  const s = useEditorStore();
  const calc = s.calc!;
  const mode = calc?.meta?.editorMode || "advanced";

  const packages = calc?.packages ?? [];
  const fields = calc?.fields ?? [];
  const addons = calc?.addons ?? [];
  const items = calc?.items ?? [];

  const featuresByPkg = useMemo(() => {
    const map = new Map<string, OptionGroup>();
    fields.forEach((g) => {
      if (g.type === "features" && g.pkgId) map.set(g.pkgId, g);
    });
    return map;
  }, [fields]);

  /* ------------ SIMPLE (Tierless list) ------------ */
  if (mode === "simple") {
    return (
      <div className="p-4 space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-[var(--text)]">{t("Items")}</div>
            <Btn v="brand" onClick={() => s.addItem(t("New item"), 0)} size="sm">
              <Plus className="size-4" /> {t("Add item")}
            </Btn>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">{t("No items yet.")}</div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_auto] items-center">
                  <InlineInput
                    placeholder={t("Label")}
                    value={it.label || ""}
                    onChange={(e) => s.updateItem(it.id, { label: e.target.value })}
                  />
                  <InlineInput
                    placeholder={t("Price")}
                    inputMode="decimal"
                    value={it.price ?? 0}
                    onChange={(e) => s.updateItem(it.id, { price: Number(e.target.value || 0) })}
                  />
                  <div className="flex items-center gap-2">
                    <InlineInput
                      placeholder={t("Note (optional)")}
                      value={it.note || ""}
                      onChange={(e) => s.updateItem(it.id, { note: e.target.value })}
                      className="flex-1"
                    />
                    <Btn title={t("Up")} onClick={() => s.reorderItem(it.id, -1)} size="xs">
                      <ArrowUp className="size-4" />
                    </Btn>
                    <Btn title={t("Down")} onClick={() => s.reorderItem(it.id, +1)} size="xs">
                      <ArrowDown className="size-4" />
                    </Btn>
                    <Btn v="danger" title={t("Remove")} onClick={() => s.removeItem(it.id)} size="xs">
                      <Trash2 className="size-4" />
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-[var(--text)]">{t("Extras")}</div>
            <Btn v="brand" onClick={() => s.addExtra(t("New extra"))}>
              <Plus className="size-4" /> {t("Add extra")}
            </Btn>
          </div>
          {addons.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">{t("No extras yet.")}</div>
          ) : (
            <div className="space-y-2">
              {addons.map((x) => (
                <div key={x.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_110px_auto] items-center">
                  <InlineInput
                    placeholder={t("Extra text")}
                    value={x.text || ""}
                    onChange={(e) => s.updateExtra(x.id, { text: e.target.value })}
                  />
                  <InlineInput
                    placeholder={t("Price")}
                    inputMode="decimal"
                    value={x.price ?? 0}
                    onChange={(e) => s.updateExtra(x.id, { price: Number(e.target.value || 0) })}
                  />
                  <label className="small inline-flex items-center gap-2 justify-self-start">
                    <input
                      type="checkbox"
                      checked={!!x.selected}
                      onChange={(e) => s.updateExtra(x.id, { selected: e.target.checked })}
                    />
                    {t("selected")}
                  </label>
                  <Btn v="danger" title={t("Remove")} onClick={() => s.removeExtra(x.id)} size="xs">
                    <Trash2 className="size-4" />
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ------------ TIERS ------------ */
  if (mode === "tiers") {
    return (
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text)]">{t("Tiers")}</div>
          <Btn v="brand" onClick={() => s.addPackage({})}>
            <Plus className="size-4" /> {t("Add tier")}
          </Btn>
        </div>

        {packages.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">{t("No tiers yet.")}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((p) => {
              const grp = featuresByPkg.get(p.id);
              return (
                <div key={p.id} className={`rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg)] ${p.featured ? "ring-1 ring-[var(--brand-2)]" : ""}`}>
                  <div className="flex items-center justify-between">
                    <InlineInput
                      value={p.label || ""}
                      onChange={(e) => s.updatePackage(p.id, { label: e.target.value })}
                      placeholder={t("Tier name")}
                      className="text-base font-semibold"
                    />
                    <div className="flex items-center gap-2">
                      <Btn title={t("Up")} onClick={() => s.reorderPackage(p.id, -1)} size="xs"><ArrowUp className="size-4" /></Btn>
                      <Btn title={t("Down")} onClick={() => s.reorderPackage(p.id, +1)} size="xs"><ArrowDown className="size-4" /></Btn>
                      <Btn title={t("Duplicate")} onClick={() => s.duplicatePackage(p.id)} size="xs"><Copy className="size-4" /></Btn>
                      <Btn v="danger" title={t("Delete")} onClick={() => s.removePackage(p.id)} size="xs"><Trash2 className="size-4" /></Btn>
                    </div>
                  </div>

                  <div className="mt-2">
                    <InlineInput
                      placeholder={t("Short description")}
                      value={p.description || ""}
                      onChange={(e) => s.updatePackage(p.id, { description: e.target.value })}
                    />
                  </div>

                  <div className="mt-3">
                    <label className="small">{t("Price")}</label>
                    <InlineInput
                      inputMode="decimal"
                      value={p.basePrice ?? 0}
                      onChange={(e) => s.updatePackage(p.id, { basePrice: Number(e.target.value || 0) })}
                      className="text-xl font-semibold"
                    />
                  </div>

                  <div className="mt-2">
                    <label className="small">{t("Featured")}</label>
                    <div className="mt-1">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!p.featured}
                          onChange={(e) => s.updatePackage(p.id, { featured: e.target.checked })}
                        />
                        <Star className={`size-4 ${p.featured ? "fill-[var(--brand-1)] text-[var(--brand-1)]" : ""}`} />
                        {t("Highlight card")}
                      </label>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="small font-medium text-[var(--text)]">{t("Features")}</div>
                      <Btn v="brand" onClick={() => { s.ensureFeatureGroup(p.id); s.addFeature(p.id, t("New feature")); }}>
                        <Plus className="size-4" /> {t("Add")}
                      </Btn>
                    </div>

                    {!grp || !Array.isArray(grp.options) || grp.options.length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">{t("No features yet.")}</div>
                    ) : (
                      <ul className="space-y-2">
                        {(grp.options as FeatureOption[]).map((f) => (
                          <li key={f.id} className="flex items-center gap-2">
                            <input
                              className="field flex-1"
                              value={f.label || ""}
                              onChange={(e) => s.updateFeature(p.id, f.id, { label: e.target.value })}
                            />
                            <label className="small inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!f.highlighted}
                                onChange={(e) => s.updateFeature(p.id, f.id, { highlighted: e.target.checked })}
                              />
                              {t("highlight")}
                            </label>
                            <Btn v="danger" title={t("Remove")} onClick={() => s.removeFeature(p.id, f.id)} size="xs">
                              <Trash2 className="size-4" />
                            </Btn>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ------------ ADVANCED ------------ */
  return (
    <div className="p-4 space-y-8">
      {/* (ostalo isto kao ranije, sa istim Btn komponentama koje ne lome liniju) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text)]">{t("Packages")}</div>
          <Btn v="brand" onClick={() => s.addPackage({})}>
            <Plus className="size-4" /> {t("Add package")}
          </Btn>
        </div>

        {calc.packages?.length ? (
          <div className="space-y-4">
            {calc.packages.map((p) => {
              const grp = featuresByPkg.get(p.id);
              return (
                <div key={p.id} className="rounded-xl border border-[var(--border)] p-3 bg-[var(--bg)]">
                  <div className="flex items-center justify-between gap-2">
                    <InlineInput
                      placeholder={t("Package name")}
                      value={p.label || ""}
                      onChange={(e) => s.updatePackage(p.id, { label: e.target.value })}
                      className="w-full"
                    />
                    <div className="flex items-center gap-2">
                      <Btn title={t("Up")} onClick={() => s.reorderPackage(p.id, -1)} size="xs"><ArrowUp className="size-4" /></Btn>
                      <Btn title={t("Down")} onClick={() => s.reorderPackage(p.id, +1)} size="xs"><ArrowDown className="size-4" /></Btn>
                      <Btn title={t("Duplicate")} onClick={() => s.duplicatePackage(p.id)} size="xs"><Copy className="size-4" /></Btn>
                      <Btn v="danger" title={t("Delete")} onClick={() => s.removePackage(p.id)} size="xs"><Trash2 className="size-4" /></Btn>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="small">{t("Base price")}</label>
                      <InlineInput inputMode="decimal" value={p.basePrice ?? 0} onChange={(e) => s.updatePackage(p.id, { basePrice: Number(e.target.value || 0) })} />
                    </div>
                    <div>
                      <label className="small">{t("Featured")}</label>
                      <div className="mt-1">
                        <label className="inline-flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                          <input type="checkbox" checked={!!p.featured} onChange={(e) => s.updatePackage(p.id, { featured: e.target.checked })} />
                          <Star className={`size-4 ${p.featured ? "fill-[var(--brand-1)] text-[var(--brand-1)]" : ""}`} />
                          {t("Highlight")}
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="small">{t("Accent color")}</label>
                      <InlineInput placeholder="#14b8a6" value={p.color || ""} onChange={(e) => s.updatePackage(p.id, { color: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="small">{t("Description")}</label>
                    <textarea className="field mt-1" rows={3} placeholder={t("Short package description…")} value={p.description || ""} onChange={(e) => s.updatePackage(p.id, { description: e.target.value })} />
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-[var(--text)]">{t("Features")}</div>
                      <Btn v="brand" onClick={() => { s.ensureFeatureGroup(p.id); s.addFeature(p.id, t("New feature")); }}>
                        <Plus className="size-4" /> {t("Add feature")}
                      </Btn>
                    </div>

                    {!grp || !Array.isArray(grp.options) || grp.options.length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">{t("No features yet.")}</div>
                    ) : (
                      <div className="space-y-2">
                        {(grp.options as FeatureOption[]).map((f) => (
                          <div key={f.id} className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
                            <InlineInput value={f.label || ""} onChange={(e) => s.updateFeature(p.id, f.id, { label: e.target.value })} />
                            <label className="small inline-flex items-center gap-2 justify-self-start cursor-pointer">
                              <input type="checkbox" checked={!!f.highlighted} onChange={(e) => s.updateFeature(p.id, f.id, { highlighted: e.target.checked })} />
                              {t("highlighted")}
                            </label>
                            <Btn v="danger" title={t("Remove")} onClick={() => s.removeFeature(p.id, f.id)} size="xs"><Trash2 className="size-4" /></Btn>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-[var(--muted)]">{t("No packages yet.")}</div>
        )}
      </section>
    </div>
  );
}