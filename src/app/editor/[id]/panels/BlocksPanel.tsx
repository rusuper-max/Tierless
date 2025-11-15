// src/app/editor/[id]/panels/BlocksPanel.tsx
"use client";

import { useMemo } from "react";
import {
  useEditorStore,
  type FeatureOption,
  type OptionGroup,
} from "@/hooks/useEditorStore";
import { t } from "@/i18n";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, Star } from "lucide-react";

type BtnVariant = "brand" | "neutral" | "danger";
type ColorMode = "solid" | "gradient";

const outline = (v: BtnVariant) => ({
  padding: 1.5,
  background:
    v === "brand"
      ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
      : v === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)",
  WebkitMask:
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
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
  v?: BtnVariant;
  title?: string;
  size?: "xs" | "sm";
}) {
  const pad = size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative inline-flex items-center gap-2 rounded-full ${pad} text-sm bg-[var(--card)] group ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] hover:-translate-y-0.5 transition"
      }`}
      style={{ whiteSpace: "nowrap" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={outline(v)}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
        style={{
          boxShadow:
            v === "danger"
              ? "0 0 10px 3px rgba(244,63,94,.22)"
              : "0 0 14px 4px rgba(34,211,238,.22)",
          transition: "opacity .18s ease",
        }}
      />
      <span
        className={`relative z-[1] ${
          v === "danger"
            ? "text-rose-700 dark:text-rose-300"
            : "text-[var(--text)]"
        } inline-flex items-center gap-2 whitespace-nowrap`}
      >
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

/* ---------------- Color mode toggle (SOLID / GRADIENT) ---------------- */

function ColorModeToggle({
  value,
  onChange,
}: {
  value: ColorMode;
  onChange: (mode: ColorMode) => void;
}) {
  const modes: ColorMode[] = ["solid", "gradient"];

  return (
    <div className="mt-2 inline-flex rounded-full bg-[var(--track)] p-0.5 text-[10px] font-semibold">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-2.5 py-1 rounded-full uppercase tracking-wide transition ${
            value === m
              ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
              : "text-[var(--muted)]"
          }`}
        >
          {m === "solid" ? t("Solid") : t("Gradient")}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Page header (title + description) ---------------- */

function PageHeaderSettings() {
  const calc = useEditorStore((s) => s.calc);
  const name = calc?.meta?.name ?? "";
  const description: string = String(calc?.meta?.description ?? "");

  const setMeta = (patch: { name?: string; description?: string }) => {
    const { calc: current } = useEditorStore.getState();
    if (!current) return;
    const next = {
      ...current,
      meta: { ...(current.meta || {}), ...patch },
    } as any;
    (useEditorStore as any).setState({ calc: next, isDirty: true });
  };

  return (
    <section className="mb-5 space-y-2">
      <InlineInput
        placeholder={t("Page title (optional)")}
        value={name}
        onChange={(e) => setMeta({ name: e.target.value })}
        className="w-full text-base font-semibold"
      />
      <textarea
        className="field w-full text-sm"
        rows={2}
        placeholder={t("Short intro or description…")}
        value={description}
        onChange={(e) => setMeta({ description: e.target.value })}
      />
    </section>
  );
}

/* ---------------- BlocksPanel root ---------------- */

export default function BlocksPanel() {
  const s = useEditorStore();
  const calc = s.calc!;

  const meta = calc?.meta ?? {};
  const mode = (meta as any).editorMode || "advanced";

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
        <PageHeaderSettings />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-[var(--text)]">
              {t("Items")}
            </div>
            <Btn v="brand" onClick={() => s.addItem(t("New item"), 0)} size="sm">
              <Plus className="size-4" /> {t("Add item")}
            </Btn>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              {t("No items yet.")}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_auto] items-center"
                >
                  <InlineInput
                    placeholder={t("Label")}
                    value={it.label || ""}
                    onChange={(e) =>
                      s.updateItem(it.id, { label: e.target.value })
                    }
                  />
                  <InlineInput
                    placeholder={t("Price")}
                    inputMode="decimal"
                    value={it.price ?? 0}
                    onChange={(e) =>
                      s.updateItem(it.id, {
                        price: Number(e.target.value || 0),
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <InlineInput
                      placeholder={t("Note (optional)")}
                      value={it.note || ""}
                      onChange={(e) =>
                        s.updateItem(it.id, { note: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Btn
                      v="brand"
                      title={t("Up")}
                      onClick={() => s.reorderItem(it.id, -1)}
                      size="xs"
                    >
                      <ArrowUp className="size-4" />
                    </Btn>
                    <Btn
                      v="brand"
                      title={t("Down")}
                      onClick={() => s.reorderItem(it.id, +1)}
                      size="xs"
                    >
                      <ArrowDown className="size-4" />
                    </Btn>
                    <Btn
                      v="danger"
                      title={t("Remove")}
                      onClick={() => s.removeItem(it.id)}
                      size="xs"
                    >
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
            <div className="text-sm font-medium text-[var(--text)]">
              {t("Extras")}
            </div>
            <Btn v="brand" onClick={() => s.addExtra(t("New extra"))}>
              <Plus className="size-4" /> {t("Add extra")}
            </Btn>
          </div>
          {addons.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              {t("No extras yet.")}
            </div>
          ) : (
            <div className="space-y-2">
              {addons.map((x) => (
                <div
                  key={x.id}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_110px_auto] items-center"
                >
                  <InlineInput
                    placeholder={t("Extra text")}
                    value={x.text || ""}
                    onChange={(e) =>
                      s.updateExtra(x.id, { text: e.target.value })
                    }
                  />
                  <InlineInput
                    placeholder={t("Price")}
                    inputMode="decimal"
                    value={x.price ?? 0}
                    onChange={(e) =>
                      s.updateExtra(x.id, {
                        price: Number(e.target.value || 0),
                      })
                    }
                  />
                  <label className="small inline-flex items-center gap-2 justify-self-start">
                    <input
                      type="checkbox"
                      checked={!!x.selected}
                      onChange={(e) =>
                        s.updateExtra(x.id, { selected: e.target.checked })
                      }
                    />
                    {t("selected")}
                  </label>
                  <Btn
                    v="danger"
                    title={t("Remove")}
                    onClick={() => s.removeExtra(x.id)}
                    size="xs"
                  >
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
        <PageHeaderSettings />

        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text)]">
            {t("Tiers")}
          </div>
          <Btn v="brand" onClick={() => s.addPackage({})}>
            <Plus className="size-4" /> {t("Add tier")}
          </Btn>
        </div>

        {packages.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">
            {t("No tiers yet.")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((p) => {
              const grp = featuresByPkg.get(p.id);
              const priceText = (p as any).priceText ?? "";
              const rawMode = (p as any).colorMode as
                | ColorMode
                | "animated"
                | undefined;
              const colorMode: ColorMode =
                rawMode === "gradient" ? "gradient" : "solid";
              const color = (p as any).color || "#14b8a6";
              const color2 = (p as any).color2 || "#22d3ee";
              const rounded = (p as any).rounded;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg)] ${
                    p.featured ? "ring-1 ring-[var(--brand-2)]" : ""
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <InlineInput
                      value={p.label || ""}
                      onChange={(e) =>
                        s.updatePackage(p.id, { label: e.target.value })
                      }
                      placeholder={t("Tier name")}
                      className="text-base font-semibold w-full"
                    />
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Btn
                        v="brand"
                        title={t("Up")}
                        onClick={() => s.reorderPackage(p.id, -1)}
                        size="xs"
                      >
                        <ArrowUp className="size-4" />
                      </Btn>
                      <Btn
                        v="brand"
                        title={t("Down")}
                        onClick={() => s.reorderPackage(p.id, +1)}
                        size="xs"
                      >
                        <ArrowDown className="size-4" />
                      </Btn>
                      <Btn
                        v="brand"
                        title={t("Duplicate")}
                        onClick={() => s.duplicatePackage(p.id)}
                        size="xs"
                      >
                        <Copy className="size-4" />
                      </Btn>
                      <Btn
                        v="danger"
                        title={t("Delete")}
                        onClick={() => s.removePackage(p.id)}
                        size="xs"
                      >
                        <Trash2 className="size-4" />
                      </Btn>
                    </div>
                  </div>

                  <div className="mt-2">
                    <InlineInput
                      placeholder={t("Short description")}
                      value={p.description || ""}
                      onChange={(e) =>
                        s.updatePackage(p.id, { description: e.target.value })
                      }
                    />
                  </div>

                  <div className="mt-3">
                    <label className="small">
                      {t("Price label (shown on card)")}
                    </label>
                    <InlineInput
                      placeholder={t("$19.99 /mo")}
                      value={priceText}
                      onChange={(e) =>
                        s.updatePackage(
                          p.id,
                          { priceText: e.target.value } as any
                        )
                      }
                    />
                  </div>

                  {/* Accent color + mode + Color2 */}
                  <div className="mt-3">
                    <label className="small">{t("Accent color")}</label>
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {/* Primary color */}
                        <input
                          type="color"
                          className="h-8 w-8 rounded-md border border-[var(--border)] bg-transparent cursor-pointer"
                          value={color}
                          onChange={(e) =>
                            s.updatePackage(
                              p.id,
                              { color: e.target.value } as any
                            )
                          }
                        />
                        {/* Second color for gradient */}
                        {colorMode === "gradient" && (
                          <input
                            type="color"
                            className="h-8 w-8 rounded-md border border-[var(--border)] bg-transparent cursor-pointer"
                            value={color2}
                            onChange={(e) =>
                              s.updatePackage(
                                p.id,
                                { color2: e.target.value } as any
                              )
                            }
                          />
                        )}
                        <Btn
                          v="danger"
                          size="xs"
                          onClick={() =>
                            s.updatePackage(
                              p.id,
                              {
                                color: undefined,
                                color2: undefined,
                                colorMode: "solid",
                              } as any
                            )
                          }
                          title={t("Reset to default")}
                        >
                          {t("Reset")}
                        </Btn>
                      </div>

                      <ColorModeToggle
                        value={colorMode}
                        onChange={(mode) =>
                          s.updatePackage(
                            p.id,
                            { colorMode: mode } as any
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Featured / outline toggle */}
                  <div className="mt-3">
                    <label className="small">{t("Accent outline")}</label>
                    <div className="mt-1">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!p.featured}
                          onChange={(e) =>
                            s.updatePackage(p.id, {
                              featured: e.target.checked,
                            })
                          }
                        />
                        <Star
                          className={`size-4 ${
                            p.featured
                              ? "fill-[var(--brand-1)] text-[var(--brand-1)]"
                              : ""
                          }`}
                        />
                        {t("Use accent color on card outline")}
                      </label>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                        {t(
                          "Turn this on if you want the card border to use the accent color."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="small font-medium text-[var(--text)]">
                        {t("Features")}
                      </div>
                      <Btn
                        v="brand"
                        onClick={() => {
                          s.ensureFeatureGroup(p.id);
                          s.addFeature(p.id, t("New feature"));
                        }}
                      >
                        <Plus className="size-4" /> {t("Add")}
                      </Btn>
                    </div>

                    {!grp ||
                    !Array.isArray(grp.options) ||
                    grp.options.length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">
                        {t("No features yet.")}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {(grp.options as FeatureOption[]).map((f) => (
                          <li
                            key={f.id}
                            className="flex items-center gap-2"
                          >
                            <input
                              className="field flex-1"
                              value={f.label || ""}
                              onChange={(e) =>
                                s.updateFeature(p.id, f.id, {
                                  label: e.target.value,
                                })
                              }
                            />
                            <label className="small inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!f.highlighted}
                                onChange={(e) =>
                                  s.updateFeature(p.id, f.id, {
                                    highlighted: e.target.checked,
                                  })
                                }
                              />
                              {t("highlight")}
                            </label>
                            <Btn
                              v="danger"
                              title={t("Remove")}
                              onClick={() =>
                                s.removeFeature(p.id, f.id)
                              }
                              size="xs"
                            >
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
      <PageHeaderSettings />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text)]">
            {t("Packages")}
          </div>
          <Btn v="brand" onClick={() => s.addPackage({})}>
            <Plus className="size-4" /> {t("Add package")}
          </Btn>
        </div>

        {calc.packages?.length ? (
          <div className="space-y-4">
            {calc.packages.map((p) => {
              const grp = featuresByPkg.get(p.id);
              const priceText = (p as any).priceText ?? "";
              const rawMode = (p as any).colorMode as
                | ColorMode
                | "animated"
                | undefined;
              const colorMode: ColorMode =
                rawMode === "gradient" ? "gradient" : "solid";
              const color = (p as any).color || "#14b8a6";
              const color2 = (p as any).color2 || "#22d3ee";
              const rounded = (p as any).rounded;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-[var(--border)] p-3 bg-[var(--bg)]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <InlineInput
                      placeholder={t("Package name")}
                      value={p.label || ""}
                      onChange={(e) =>
                        s.updatePackage(p.id, { label: e.target.value })
                      }
                      className="w-full"
                    />
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Btn
                        v="brand"
                        title={t("Up")}
                        onClick={() => s.reorderPackage(p.id, -1)}
                        size="xs"
                      >
                        <ArrowUp className="size-4" />
                      </Btn>
                      <Btn
                        v="brand"
                        title={t("Down")}
                        onClick={() => s.reorderPackage(p.id, +1)}
                        size="xs"
                      >
                        <ArrowDown className="size-4" />
                      </Btn>
                      <Btn
                        v="brand"
                        title={t("Duplicate")}
                        onClick={() => s.duplicatePackage(p.id)}
                        size="xs"
                      >
                        <Copy className="size-4" />
                      </Btn>
                      <Btn
                        v="danger"
                        title={t("Delete")}
                        onClick={() => s.removePackage(p.id)}
                        size="xs"
                      >
                        <Trash2 className="size-4" />
                      </Btn>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="small">
                        {t("Base price (number)")}
                      </label>
                      <InlineInput
                        inputMode="decimal"
                        value={p.basePrice ?? 0}
                        onChange={(e) =>
                          s.updatePackage(p.id, {
                            basePrice: Number(e.target.value || 0),
                          })
                        }
                      />
                      <label className="small mt-2 block">
                        {t("Price label (shown on card)")}
                      </label>
                      <InlineInput
                        placeholder={t("$19.99 /mo")}
                        value={priceText}
                        onChange={(e) =>
                          s.updatePackage(
                            p.id,
                            { priceText: e.target.value } as any
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="small">{t("Accent outline")}</label>
                      <div className="mt-1">
                        <label className="inline-flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!p.featured}
                            onChange={(e) =>
                              s.updatePackage(p.id, {
                                featured: e.target.checked,
                              })
                            }
                          />
                          <Star
                            className={`size-4 ${
                              p.featured
                                ? "fill-[var(--brand-1)] text-[var(--brand-1)]"
                                : ""
                            }`}
                          />
                          {t("Use accent color on card outline")}
                        </label>
                      </div>

                      <div className="mt-3">
                        <label className="small">{t("Card corners")}</label>
                        <div className="mt-1 inline-flex rounded-full bg-[var(--track)] p-0.5 text-[10px] font-semibold">
                          <button
                            type="button"
                            onClick={() =>
                              s.updatePackage(p.id, { rounded: true } as any)
                            }
                            className={`px-2.5 py-1 rounded-full uppercase tracking-wide transition ${
                              rounded === false
                                ? "text-[var(--muted)]"
                                : "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                            }`}
                          >
                            {t("Rounded")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              s.updatePackage(p.id, { rounded: false } as any)
                            }
                            className={`px-2.5 py-1 rounded-full uppercase tracking-wide transition ${
                              rounded === false
                                ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                                : "text-[var(--muted)]"
                            }`}
                          >
                            {t("Square")}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="small">{t("Accent color")}</label>
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-8 w-8 rounded-md border border-[var(--border)] bg-transparent cursor-pointer"
                            value={color}
                            onChange={(e) =>
                              s.updatePackage(
                                p.id,
                                { color: e.target.value } as any
                              )
                            }
                          />
                          {colorMode === "gradient" && (
                            <input
                              type="color"
                              className="h-8 w-8 rounded-md border border-[var(--border)] bg-transparent cursor-pointer"
                              value={color2}
                              onChange={(e) =>
                                s.updatePackage(
                                  p.id,
                                  { color2: e.target.value } as any
                                )
                              }
                            />
                          )}
                          <Btn
                            v="danger"
                            size="xs"
                            onClick={() =>
                              s.updatePackage(
                                p.id,
                                {
                                  color: undefined,
                                  color2: undefined,
                                  colorMode: "solid",
                                } as any
                              )
                            }
                            title={t("Reset to default")}
                          >
                            {t("Reset")}
                          </Btn>
                        </div>

                        <ColorModeToggle
                          value={colorMode}
                          onChange={(mode) =>
                            s.updatePackage(
                              p.id,
                              { colorMode: mode } as any
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="small">{t("Description")}</label>
                    <textarea
                      className="field mt-1"
                      rows={3}
                      placeholder={t("Short package description…")}
                      value={p.description || ""}
                      onChange={(e) =>
                        s.updatePackage(p.id, {
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-[var(--text)]">
                        {t("Features")}
                      </div>
                      <Btn
                        v="brand"
                        onClick={() => {
                          s.ensureFeatureGroup(p.id);
                          s.addFeature(p.id, t("New feature"));
                        }}
                      >
                        <Plus className="size-4" /> {t("Add feature")}
                      </Btn>
                    </div>

                    {!grp ||
                    !Array.isArray(grp.options) ||
                    grp.options.length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">
                        {t("No features yet.")}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(grp.options as FeatureOption[]).map((f) => (
                          <div
                            key={f.id}
                            className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center"
                          >
                            <InlineInput
                              value={f.label || ""}
                              onChange={(e) =>
                                s.updateFeature(p.id, f.id, {
                                  label: e.target.value,
                                })
                              }
                            />
                            <label className="small inline-flex items-center gap-2 justify-self-start cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!f.highlighted}
                                onChange={(e) =>
                                  s.updateFeature(p.id, f.id, {
                                    highlighted: e.target.checked,
                                  })
                                }
                              />
                              {t("highlighted")}
                            </label>
                            <Btn
                              v="danger"
                              title={t("Remove")}
                              onClick={() =>
                                s.removeFeature(p.id, f.id)
                              }
                              size="xs"
                            >
                              <Trash2 className="size-4" />
                            </Btn>
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
          <div className="text-sm text-[var(--muted)]">
            {t("No packages yet.")}
          </div>
        )}
      </section>
    </div>
  );
}