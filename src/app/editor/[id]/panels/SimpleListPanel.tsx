// src/app/editor/[id]/panels/SimpleListPanel.tsx
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { ArrowUp, ArrowDown, Trash2, Image as ImageIcon } from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore } from "@/hooks/useEditorStore";
import { useAccount } from "@/hooks/useAccount";

type SimpleSpacing = "compact" | "cozy" | "relaxed";

type ColorPreset = {
  key: string;
  label: string;
  value: string; // "" = default
};

/* ---------------- Preseti boja (jednostavna paleta) ---------------- */

const BG_PRESETS: ColorPreset[] = [
  { key: "default", label: "Default", value: "" },
  { key: "soft", label: "Soft", value: "#f9fafb" },
  { key: "warm", label: "Warm", value: "#fef3c7" },
  { key: "cool", label: "Cool", value: "#eff6ff" },
  { key: "mint", label: "Mint", value: "#ecfdf5" },
  { key: "dark", label: "Dark", value: "#020617" },
];

const TEXT_PRESETS: ColorPreset[] = [
  { key: "default", label: "Default", value: "" },
  { key: "ink", label: "Ink", value: "#111827" },
  { key: "soft", label: "Soft", value: "#4b5563" },
  { key: "emerald", label: "Emerald", value: "#10b981" },
  { key: "sky", label: "Sky", value: "#0284c7" },
  { key: "rose", label: "Rose", value: "#e11d48" },
];

const OUTLINE_PRESETS: ColorPreset[] = [
  { key: "none", label: "None", value: "" },
  { key: "soft", label: "Soft", value: "#e5e7eb" },
  { key: "dark", label: "Dark", value: "#111827" },
  { key: "emerald", label: "Emerald", value: "#10b981" },
  { key: "rose", label: "Rose", value: "#e11d48" },
];

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

/* ====================================================================== */

export default function SimpleListPanel() {
  const { calc, addItem, updateItem, removeItem, reorderItem, updateCalc } =
    useEditorStore();
  const { plan } = useAccount(); // free | starter | growth | pro | tierless

  const items = calc?.items ?? [];
  const meta = (calc?.meta || {}) as any;
  const i18n = (calc?.i18n || {}) as any;

  const canUseImages =
    plan === "growth" || plan === "pro" || plan === "tierless";

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);

  const isCollapsed: boolean =
    typeof (meta as any)?.simpleCollapsed === "boolean"
      ? (meta as any).simpleCollapsed
      : true;

  const simpleTitle: string = meta.simpleTitle ?? "";
  const simpleBg: string = meta.simpleBg ?? "";
  const simpleBgGrad1: string = meta.simpleBgGrad1 ?? "#f9fafb";
  const simpleBgGrad2: string = meta.simpleBgGrad2 ?? "#e5e7eb";

  const simpleTextColor: string = meta.simpleTextColor ?? "";
  const simpleBorderColor: string = meta.simpleBorderColor ?? "";
  const simpleOutlineGrad1: string = meta.simpleOutlineGrad1 ?? "#4F46E5";
  const simpleOutlineGrad2: string = meta.simpleOutlineGrad2 ?? "#22D3EE";

  const simpleFont: string = meta.simpleFont ?? "system";
  const simpleFontSize: "sm" | "md" | "lg" = meta.simpleFontSize ?? "md";
  const simpleSpacing: SimpleSpacing = meta.simpleSpacing ?? "cozy";
  const showTierlessBadge: boolean = meta.simpleShowBadge ?? true;

  // meta za dots, selekciju i inquiry
  const simpleDots: boolean = meta.simpleDots ?? false;
  const simpleAllowSelection: boolean = meta.simpleAllowSelection ?? false;
  const simpleShowInquiry: boolean = meta.simpleShowInquiry ?? false;

  const currency: string = i18n.currency ?? "€";
  const decimals: number = Number.isFinite(i18n.decimals)
    ? Number(i18n.decimals)
    : 0;

  const isBgGradient =
    typeof simpleBg === "string" &&
    simpleBg.startsWith("linear-gradient");
  const isOutlineGradient =
    typeof simpleBorderColor === "string" &&
    simpleBorderColor.startsWith("linear-gradient");

  /* ---------------- helpers za meta/i18n update ---------------- */

  const setMeta = (patch: Record<string, any>) => {
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {};
      Object.assign(draft.meta as any, patch);
    });
  };

  const setI18n = (patch: Record<string, any>) => {
    updateCalc((draft) => {
      if (!draft.i18n) draft.i18n = {};
      Object.assign(draft.i18n as any, patch);
    });
  };

  const setBgSolid = (val: string) => {
    setMeta({
      simpleBg: val,
      simpleBgGrad1: undefined,
      simpleBgGrad2: undefined,
    });
  };

  const toggleBgMode = (mode: "solid" | "gradient") => {
    if (mode === "solid") {
      setMeta({
        simpleBg: "",
        simpleBgGrad1: undefined,
        simpleBgGrad2: undefined,
      });
    } else {
      const c1 = simpleBgGrad1 || "#f9fafb";
      const c2 = simpleBgGrad2 || "#e5e7eb";
      setMeta({
        simpleBgGrad1: c1,
        simpleBgGrad2: c2,
        simpleBg: `linear-gradient(90deg,${c1},${c2})`,
      });
    }
  };

  const setOutlineSolid = (val: string) => {
    setMeta({
      simpleBorderColor: val,
      simpleOutlineGrad1: undefined,
      simpleOutlineGrad2: undefined,
    });
  };

  const toggleOutlineMode = (mode: "solid" | "gradient") => {
    if (mode === "solid") {
      setMeta({
        simpleBorderColor: "",
        simpleOutlineGrad1: undefined,
        simpleOutlineGrad2: undefined,
      });
    } else {
      const c1 = simpleOutlineGrad1 || "#4F46E5";
      const c2 = simpleOutlineGrad2 || "#22D3EE";
      setMeta({
        simpleOutlineGrad1: c1,
        simpleOutlineGrad2: c2,
        simpleBorderColor: `linear-gradient(90deg,${c1},${c2})`,
      });
    }
  };

  /* ---------------- upload slike ---------------- */

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    itemId: string
  ) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError(t("Only image files are allowed."));
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(t("Image is too large (max 2 MB)."));
      return;
    }

    try {
      setUploadingId(itemId);
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("upload-image failed:", data);
        setError(t("Upload failed. Please try again."));
        return;
      }

      if (!data?.url) {
        setError(t("Upload failed. No URL returned."));
        return;
      }

      updateItem(itemId, { imageUrl: data.url });
    } catch (err: any) {
      console.error("upload-image error:", err);
      setError(t("Upload failed. Please try again."));
    } finally {
      setUploadingId(null);
    }
  };

  const triggerUpload = (itemId: string) => {
    setPendingFor(itemId);
    fileInputRef.current?.click();
  };

  /* ---------------- items ---------------- */

  const handleAddItem = () => {
    addItem(t("New item"), 0);
  };

  const spacingLabel = (s: SimpleSpacing) => {
    if (s === "compact") return t("Compact");
    if (s === "relaxed") return t("Relaxed");
    return t("Cozy");
  };

  /* ---------------- UI helper: palete boja ---------------- */

  const renderColorSwatches = (
    presets: ColorPreset[],
    selected: string,
    onSelect: (v: string) => void
  ) => {
    return (
      <div className="flex flex-wrap gap-1.5">
        {presets.map((c) => {
          const selectedVal = selected || "";
          const valueVal = c.value || "";
          const isSelected = selectedVal === valueVal;

          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.value)}
              className="relative inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] sm:text-[11px] transition hover:border-[var(--brand-1,#4F46E5)] hover:bg-[var(--surface)] cursor-pointer"
            >
              {isSelected && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    padding: 1,
                    background: BRAND_GRADIENT,
                    WebkitMask:
                      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor" as any,
                    maskComposite: "exclude" as any,
                  }}
                />
              )}
              <span className="relative z-[1] inline-flex items-center gap-1">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{
                    background:
                      c.value === ""
                        ? "linear-gradient(135deg,#e5e7eb,#f9fafb)"
                        : c.value,
                  }}
                />
                <span className="whitespace-nowrap">{t(c.label)}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  /* ================================================================== */

  return (
    <div className="p-4 sm:p-5">
      {/* Top: title + main actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
            {t("Tierless price page")}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            {t(
              "Simple item list – perfect for restaurant menus, clinics, salons and all quick price pages."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3.5 py-1.5 text-xs sm:text-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
              maskComposite: "exclude" as any,
            }}
          />
          <span className="relative z-[1]">{t("Add item")}</span>
        </button>
      </div>

      {/* Page-level settings */}
      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-3">
        {/* Page title + collapse toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {t("Page title")}
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
              placeholder={t("e.g. McDonald’s – Main menu")}
              value={simpleTitle}
              onChange={(e) => setMeta({ simpleTitle: e.target.value })}
              data-tour-id="tour-title"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !isCollapsed;
              setMeta({ simpleCollapsed: next });
            }}
            className="relative mt-1 sm:mt-6 inline-flex cursor-pointer items-center self-start rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: 1,
                background: BRAND_GRADIENT,
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor" as any,
                maskComposite: "exclude" as any,
              }}
            />
            <span className="relative z-[1]">
              {isCollapsed
                ? t("Show style options")
                : t("Hide style options")}
            </span>
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Font / currency */}
            <div className="grid gap-3 md:grid-cols-3">
              {/* Font + size */}
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  {t("Font & size")}
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={simpleFont}
                    onChange={(e) => setMeta({ simpleFont: e.target.value })}
                  >
                    <option value="system">{t("System")}</option>
                    <option value="serif">{t("Serif")}</option>
                    <option value="rounded">{t("Rounded")}</option>
                    <option value="mono">{t("Mono")}</option>
                  </select>
                  <select
                    className="w-24 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={simpleFontSize}
                    onChange={(e) =>
                      setMeta({
                        simpleFontSize:
                          e.target.value === "sm"
                            ? "sm"
                            : e.target.value === "lg"
                            ? "lg"
                            : "md",
                      })
                    }
                  >
                    <option value="sm">{t("Small")}</option>
                    <option value="md">{t("Medium")}</option>
                    <option value="lg">{t("Large")}</option>
                  </select>
                </div>
              </div>

              {/* Currency + decimals */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  {t("Currency & decimals")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={currency}
                    onChange={(e) =>
                      setI18n({ currency: e.target.value || "€" })
                    }
                  />
                  <select
                    className="w-28 sm:w-32 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={decimals}
                    onChange={(e) =>
                      setI18n({ decimals: Number(e.target.value) || 0 })
                    }
                  >
                    <option value={0}>{t("No decimals")}</option>
                    <option value={1}>{t("1 decimal")}</option>
                    <option value={2}>{t("2 decimals")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colors + spacing */}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {/* Background */}
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  {t("Background color")}
                </label>

                <div className="mb-1 inline-flex rounded-full bg-[var(--bg)] border border-[var(--border)] p-0.5">
                  {(["solid", "gradient"] as const).map((mode) => {
                    const active =
                      mode === "gradient" ? isBgGradient : !isBgGradient;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleBgMode(mode)}
                        className="relative cursor-pointer inline-flex items-center justify-center px-3 py-1 text-[11px] rounded-full transition text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-full"
                            style={{
                              padding: 1,
                              background: BRAND_GRADIENT,
                              WebkitMask:
                                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                              WebkitMaskComposite: "xor" as any,
                              maskComposite: "exclude" as any,
                            }}
                          />
                        )}
                        <span className="relative z-[1] font-medium">
                          {mode === "solid"
                            ? t("Solid color")
                            : t("Gradient")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!isBgGradient && (
                  <div className="space-y-1">
                    {renderColorSwatches(BG_PRESETS, simpleBg, (val) =>
                      setBgSolid(val)
                    )}

                    {/* Custom BG color */}
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        className="h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--bg)] cursor-pointer"
                        value={simpleBg || "#ffffff"}
                        onChange={(e) => setBgSolid(e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                        placeholder={t("Custom HEX, e.g. #111827")}
                        value={simpleBg}
                        onChange={(e) => setBgSolid(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {isBgGradient && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-[var(--muted)] mb-0.5">
                        {t("Color 1")}
                      </div>
                      {renderColorSwatches(
                        BG_PRESETS,
                        simpleBgGrad1,
                        (val) => {
                          const c1 = val || "#f9fafb";
                          const c2 = simpleBgGrad2 || "#e5e7eb";
                          setMeta({
                            simpleBgGrad1: c1,
                            simpleBgGrad2: c2,
                            simpleBg: `linear-gradient(90deg,${c1},${c2})`,
                          });
                        }
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--muted)] mb-0.5">
                        {t("Color 2")}
                      </div>
                      {renderColorSwatches(
                        BG_PRESETS,
                        simpleBgGrad2,
                        (val) => {
                          const c1 = simpleBgGrad1 || "#f9fafb";
                          const c2 = val || "#e5e7eb";
                          setMeta({
                            simpleBgGrad1: c1,
                            simpleBgGrad2: c2,
                            simpleBg: `linear-gradient(90deg,${c1},${c2})`,
                          });
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Text + outline color */}
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  {t("Text & outline color")}
                </label>

                <div className="space-y-2">
                  <div>
                    <div className="text-[10px] text-[var(--muted)] mb-0.5">
                      {t("Text")}
                    </div>
                    {renderColorSwatches(
                      TEXT_PRESETS,
                      simpleTextColor,
                      (val) => setMeta({ simpleTextColor: val })
                    )}

                    {/* Custom text color */}
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        className="h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--bg)] cursor-pointer"
                        value={simpleTextColor || "#111827"}
                        onChange={(e) =>
                          setMeta({ simpleTextColor: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                        placeholder={t("Custom HEX, e.g. #111827")}
                        value={simpleTextColor}
                        onChange={(e) =>
                          setMeta({ simpleTextColor: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="text-[10px] text-[var(--muted)] mb-0.5">
                      {t("Item outline")}
                    </div>

                    <div className="mb-1 inline-flex rounded-full bg-[var(--bg)] border border-[var(--border)] p-0.5">
                      {(["solid", "gradient"] as const).map((mode) => {
                        const active =
                          mode === "gradient"
                            ? isOutlineGradient
                            : !isOutlineGradient;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => toggleOutlineMode(mode)}
                            className="relative cursor-pointer inline-flex items-center justify-center px-3 py-1 text-[11px] rounded-full transition text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            {active && (
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 rounded-full"
                                style={{
                                  padding: 1,
                                  background: BRAND_GRADIENT,
                                  WebkitMask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                  WebkitMaskComposite: "xor" as any,
                                  maskComposite: "exclude" as any,
                                }}
                              />
                            )}
                            <span className="relative z-[1] font-medium">
                              {mode === "solid"
                                ? t("Solid color")
                                : t("Gradient")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {!isOutlineGradient && (
                      <div className="space-y-1">
                        {renderColorSwatches(
                          OUTLINE_PRESETS,
                          simpleBorderColor,
                          (val) => setOutlineSolid(val)
                        )}

                        {/* Custom outline color */}
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="color"
                            className="h-7 w-7 rounded-md border border-[var(--border)] bg-[var(--bg)] cursor-pointer"
                            value={simpleBorderColor || "#e5e7eb"}
                            onChange={(e) =>
                              setOutlineSolid(e.target.value)
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                            placeholder={t("Custom HEX, e.g. #10b981")}
                            value={simpleBorderColor}
                            onChange={(e) =>
                              setOutlineSolid(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {isOutlineGradient && (
                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] text-[var(--muted)] mb-0.5">
                            {t("Color 1")}
                          </div>
                          {renderColorSwatches(
                            TEXT_PRESETS,
                            simpleOutlineGrad1,
                            (val) => {
                              const c1 = val || "#4F46E5";
                              const c2 = simpleOutlineGrad2 || "#22D3EE";
                              setMeta({
                                simpleOutlineGrad1: c1,
                                simpleOutlineGrad2: c2,
                                simpleBorderColor: `linear-gradient(90deg,${c1},${c2})`,
                              });
                            }
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-[var(--muted)] mb-0.5">
                            {t("Color 2")}
                          </div>
                          {renderColorSwatches(
                            TEXT_PRESETS,
                            simpleOutlineGrad2,
                            (val) => {
                              const c1 = simpleOutlineGrad1 || "#4F46E5";
                              const c2 = val || "#22D3EE";
                              setMeta({
                                simpleOutlineGrad1: c1,
                                simpleOutlineGrad2: c2,
                                simpleBorderColor: `linear-gradient(90deg,${c1},${c2})`,
                              });
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spacing + Tierless badge + selections */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    {t("Spacing between items")}
                  </label>
                  <div className="inline-flex rounded-full bg-[var(--bg)] border border-[var(--border)] p-0.5">
                    {(["compact", "cozy", "relaxed"] as SimpleSpacing[]).map(
                      (s) => {
                        const isActive = simpleSpacing === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setMeta({ simpleSpacing: s })}
                            className="relative cursor-pointer inline-flex items-center justify-center px-3 py-1 text-[11px] rounded-full transition text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            {isActive && (
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 rounded-full"
                                style={{
                                  padding: 1,
                                  background: BRAND_GRADIENT,
                                  WebkitMask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                  WebkitMaskComposite: "xor" as any,
                                  maskComposite: "exclude" as any,
                                }}
                              />
                            )}
                            <span className="relative z-[1] font-medium">
                              {spacingLabel(s)}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    {t("Tierless badge")}
                  </label>
                  <div className="inline-flex rounded-full bg-[var(--bg)] border border-[var(--border)] p-0.5">
                    {(["show", "hide"] as const).map((mode) => {
                      const isActive =
                        mode === "show" ? showTierlessBadge : !showTierlessBadge;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            setMeta({
                              simpleShowBadge: mode === "show",
                            })
                          }
                          className="relative cursor-pointer inline-flex items-center justify-center px-3 py-1 text-[11px] rounded-full transition text-[var(--muted)] hover:text-[var(--text)]"
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-0 rounded-full"
                              style={{
                                padding: 1,
                                background: BRAND_GRADIENT,
                                WebkitMask:
                                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                WebkitMaskComposite: "xor" as any,
                                maskComposite: "exclude" as any,
                              }}
                            />
                          )}
                          <span className="relative z-[1] font-medium">
                            {mode === "show" ? t("Show") : t("Hide")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selections + inquiry + dots */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    {t("Selections & inquiry")}
                  </label>
                  <div className="space-y-1.5 text-[11px] sm:text-xs">
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 hover:border-[var(--brand-1,#4F46E5)] hover:bg-[var(--surface)]">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                        checked={simpleAllowSelection}
                        onChange={(e) =>
                          setMeta({
                            simpleAllowSelection: e.target.checked,
                          })
                        }
                      />
                      <span className="text-[var(--text)]">
                        {t("Allow visitors to select items and see total")}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 hover:border-[var(--brand-1,#4F46E5)] hover:bg-[var(--surface)]">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                        checked={simpleShowInquiry}
                        onChange={(e) =>
                          setMeta({
                            simpleShowInquiry: e.target.checked,
                          })
                        }
                      />
                      <span className="text-[var(--text)]">
                        {t("Show inquiry button (email setup in Account)")}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 hover:border-[var(--brand-1,#4F46E5)] hover:bg-[var(--surface)]">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                        checked={simpleDots}
                        onChange={(e) =>
                          setMeta({
                            simpleDots: e.target.checked,
                          })
                        }
                      />
                      <span className="text-[var(--text)]">
                        {t("Show dotted line between item and price")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-3" data-tour-id="tour-items">
        {items.map((it, index) => (
          <div
            key={it.id}
            className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 sm:px-4 sm:py-3 hover:shadow-[0_16px_36px_rgba(2,6,23,.18)] transition"
          >
            {/* Reorder buttons */}
            <div className="mt-1 flex flex-col gap-1">
              <button
                type="button"
                className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
                onClick={() => reorderItem(it.id, -1)}
                disabled={index === 0}
                aria-label={t("Move up")}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
                onClick={() => reorderItem(it.id, 1)}
                disabled={index === items.length - 1}
                aria-label={t("Move down")}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Image column */}
            {canUseImages && (
              <div className="flex flex-col items-center mr-1">
                <div className="h-14 w-14 rounded-lg bg-[var(--track)] overflow-hidden flex items-center justify-center">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.imageUrl}
                      alt={it.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-[var(--muted)]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => triggerUpload(it.id)}
                  className="cursor-pointer mt-1 text-[10px] text-[var(--muted)] underline decoration-dotted hover:text-[var(--text)] disabled:opacity-60 disabled:cursor-default"
                  disabled={uploadingId === it.id}
                >
                  {uploadingId === it.id
                    ? t("Uploading…")
                    : it.imageUrl
                    ? t("Change")
                    : t("Add image")}
                </button>
                {it.imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(it.id, { imageUrl: undefined })
                    }
                    className="cursor-pointer mt-0.5 text-[10px] text-red-500 hover:underline"
                  >
                    {t("Remove")}
                  </button>
                )}
              </div>
            )}

            {/* Text + price */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                  value={it.label}
                  onChange={(e) =>
                    updateItem(it.id, { label: e.target.value })
                  }
                  placeholder={t("Item name")}
                />
                <input
                  type="number"
                  className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-right text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                  value={it.price ?? ""}
                  onChange={(e) =>
                    updateItem(it.id, {
                      price:
                        e.target.value === ""
                          ? null
                          : Number(e.target.value),
                    })
                  }
                  placeholder={t("Price")}
                />
              </div>
              <textarea
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--muted)] outline-none focus:border-[var(--brand-1,#4F46E5)] resize-none"
                rows={2}
                placeholder={t(
                  "Optional description, ingredients or notes"
                )}
                value={it.note ?? ""}
                onChange={(e) =>
                  updateItem(it.id, { note: e.target.value })
                }
              />
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              className="cursor-pointer mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-red-300/70 bg-red-100/30 text-red-600 hover:bg-red-100 hover:border-red-400 hover:shadow-[0_10px_24px_rgba(220,38,38,.35)] transition"
              aria-label={t("Delete item")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-3 text-xs sm:text-sm text-[var(--muted)]">
          {t("No items yet. Add your first item to start your price list.")}
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-red-500">
          {error}
        </div>
      )}

      {/* Hidden input za upload, delimo ga za sve iteme */}
      {canUseImages && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (!pendingFor) return;
            handleFileChange(e, pendingFor);
            setPendingFor(null);
          }}
        />
      )}
    </div>
  );
}