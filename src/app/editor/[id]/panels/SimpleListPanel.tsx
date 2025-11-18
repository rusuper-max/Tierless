"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
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

type SimpleSection = {
  id: string;
  label: string;
};

type ParsedOcrItem = {
  id: string;
  label: string;
  price: number | null;
  note?: string;
  rawLine?: string;
  sectionName?: string | null;
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
const CURRENCY_PRESETS = ["€", "$", "£", "CHF", "CAD", "AUD", "RSD", "BAM", "PLN"];

const createId = () => `sec_${Math.random().toString(36).slice(2, 10)}`;

/* ====================================================================== */

export default function SimpleListPanel() {
  const {
    calc,
    addItem,
    updateItem,
    removeItem,
    reorderItem,
    updateCalc,
  } = useEditorStore();
  const { plan } = useAccount(); // free | starter | growth | pro | tierless

  const items = (calc?.items ?? []) as any[];
  const meta = (calc?.meta || {}) as any;
  const i18n = (calc?.i18n || {}) as any;

  const simpleSections: SimpleSection[] = meta.simpleSections ?? [];
  const sectionStates: Record<string, boolean> =
    (meta.simpleSectionStates as Record<string, boolean>) ?? {};

  const canUseImages =
    plan === "growth" || plan === "pro" || plan === "tierless";

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // OCR state
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrItems, setOcrItems] = useState<ParsedOcrItem[]>([]);
  const [ocrSelectedIds, setOcrSelectedIds] = useState<string[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement | null>(null);

  const isCollapsed: boolean =
    typeof meta.simpleCollapsed === "boolean" ? meta.simpleCollapsed : true;

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
  const simpleSectionOutlinePublic: boolean =
    meta.simpleSectionOutlinePublic ?? false;

  const currency: string =
    typeof i18n.currency === "string" ? (i18n.currency as string) : "";
  const decimals: number = Number.isFinite(i18n.decimals)
    ? (i18n.decimals as number)
    : 0;

  const isBgGradient =
    typeof simpleBg === "string" && simpleBg.startsWith("linear-gradient");
  const isOutlineGradient =
    typeof simpleBorderColor === "string" &&
    simpleBorderColor.startsWith("linear-gradient");
  const currencyIsCustom =
    !currency || !CURRENCY_PRESETS.includes(currency);
  const currencyPresetValue = currencyIsCustom ? "__custom" : currency;

  useEffect(() => {
    setSelectedItems((prev) => {
      const next = new Set<string>();
      items.forEach((item) => {
        if (prev.has(item.id)) next.add(item.id);
      });
      return next;
    });
  }, [items]);

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

  const handleCurrencyPresetChange = (value: string) => {
    if (value === "__custom") {
      setI18n({ currency: "" });
    } else {
      setI18n({ currency: value });
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

  /* ---------------- OCR upload ---------------- */

  const handleOcrFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    setOcrError(null);
    setOcrItems([]);
    setOcrSelectedIds([]);
    setOcrUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/ocr-menu", {
        method: "POST",
        body: form,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (err) {
        console.error("ocr-menu json parse failed:", err);
      }

      if (!res.ok) {
        console.error("ocr-menu failed:", {
          status: res.status,
          data,
        });
        setOcrError(
          data?.error ||
            t("Failed to scan. Please try again.")
        );
        setOcrItems([]);
        setOcrSelectedIds([]);
        return;
      }

      const rawItems = (data?.items ?? []) as any[];
      if (!rawItems.length) {
        setOcrError(t("No items found in this image."));
        setOcrItems([]);
        setOcrSelectedIds([]);
        return;
      }

      const mapped: ParsedOcrItem[] = rawItems.map((it) => ({
        id: `ocr_${Math.random().toString(36).slice(2, 10)}`,
        label: (it.label ?? "").trim(),
        price: typeof it.price === "number" ? it.price : null,
        note: "",
        rawLine: it.rawLine,
        sectionName:
          typeof it.sectionName === "string"
            ? it.sectionName.trim()
            : undefined,
      }));

      const finalItems = mapped.filter((it) => it.label.length > 0);

      setOcrItems(finalItems);
      setOcrSelectedIds([]);
      setOcrError(null);
    } catch (err) {
      console.error("ocr-menu error:", err);
      setOcrError(t("Failed to scan. Please try again."));
      setOcrItems([]);
      setOcrSelectedIds([]);
    } finally {
      setOcrUploading(false);
    }
  };

  const toggleOcrSelection = (id: string) => {
    setOcrSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectAllOcrItems = () => {
    setOcrSelectedIds(ocrItems.map((it) => it.id));
  };

  const clearOcrSelection = () => {
    setOcrSelectedIds([]);
  };

  const deleteSelectedOcrItems = () => {
    if (!ocrSelectedIds.length) return;
    setOcrItems((prev) =>
      prev.filter((it) => !ocrSelectedIds.includes(it.id))
    );
    setOcrSelectedIds([]);
  };

  /* ---------------- items & sekcije ---------------- */

  const handleAddItem = () => {
    addItem(t("New item"), 0);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((it) => it.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    selectedItems.forEach((id) => removeItem(id));
    setSelectedItems(new Set());
  };

  const handleAddItemToSection = (sectionId: string) => {
    const defaultLabel = t("New item");
    const newId = addItem(defaultLabel, 0);
    updateItem(newId, { simpleSectionId: sectionId } as any);
  };

  const handleAddSection = () => {
    const newSection: SimpleSection = {
      id: createId(),
      label: t("New section"),
    };
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {} as any;
      const m = draft.meta as any;
      const current: SimpleSection[] = Array.isArray(m.simpleSections)
        ? m.simpleSections
        : [];
      m.simpleSections = [newSection, ...current];
      const states = {
        ...((m.simpleSectionStates as Record<string, boolean>) || {}),
      };
      states[newSection.id] = false;
      m.simpleSectionStates = states;
    });
  };

  const handleRenameSection = (id: string, label: string) => {
    const next = simpleSections.map((s) =>
      s.id === id ? { ...s, label } : s
    );
    setMeta({ simpleSections: next });
  };

  const handleMoveSection = (id: string, dir: -1 | 1) => {
    const idx = simpleSections.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= simpleSections.length) return;
    const next = [...simpleSections];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setMeta({ simpleSections: next });
  };

  const handleRemoveSection = (id: string) => {
    const nextSections = simpleSections.filter((s) => s.id !== id);
    updateCalc((draft) => {
      const m = (draft.meta || {}) as any;
      m.simpleSections = nextSections;
      const states = {
        ...((m.simpleSectionStates as Record<string, boolean>) || {}),
      };
      delete states[id];
      m.simpleSectionStates = states;
      if (Array.isArray(draft.items)) {
        (draft.items as any[]).forEach((it) => {
          if ((it as any).simpleSectionId === id) {
            (it as any).simpleSectionId = undefined;
          }
        });
      }
    });
  };

  const handleMoveExistingItemToSection = (
    itemId: string,
    sectionId: string
  ) => {
    if (!itemId) return;
    updateItem(itemId, { simpleSectionId: sectionId } as any);
  };

  const toggleSectionCollapsed = (sectionId: string) => {
    const next = { ...sectionStates, [sectionId]: !sectionStates[sectionId] };
    if (!next[sectionId]) {
      delete next[sectionId];
    }
    setMeta({ simpleSectionStates: next });
  };

  const spacingLabel = (s: SimpleSpacing) => {
    if (s === "compact") return t("Compact");
    if (s === "relaxed") return t("Relaxed");
    return t("Cozy");
  };

  const handleApplyOcrToList = () => {
    if (!ocrItems.length) return;

    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {};
      const m = draft.meta as any;

      const existingSections: SimpleSection[] = Array.isArray(
        m.simpleSections
      )
        ? m.simpleSections
        : [];

      const sectionNameToId = new Map<string, string>();
      for (const sec of existingSections) {
        if (sec.label) {
          sectionNameToId.set(sec.label.toLowerCase(), sec.id);
        }
      }

      const newSections: SimpleSection[] = [];
      for (const it of ocrItems) {
        const rawName =
          typeof it.sectionName === "string"
            ? it.sectionName.trim()
            : "";
        if (!rawName) continue;
        const key = rawName.toLowerCase();
        if (sectionNameToId.has(key)) continue;
        const newSec: SimpleSection = {
          id: createId(),
          label: rawName,
        };
        sectionNameToId.set(key, newSec.id);
        newSections.push(newSec);
      }

      const mergedSections = [...existingSections, ...newSections];
      m.simpleSections = mergedSections;

      const currentItems: any[] = Array.isArray(draft.items)
        ? (draft.items as any[])
        : [];

      for (const it of ocrItems) {
        const rawName =
          typeof it.sectionName === "string"
            ? it.sectionName.trim()
            : "";
        let sectionId: string | undefined = undefined;
        if (rawName) {
          const key = rawName.toLowerCase();
          sectionId = sectionNameToId.get(key);
        }

        currentItems.push({
          id: `it_${Math.random().toString(36).slice(2, 10)}`,
          label: it.label,
          price:
            typeof it.price === "number" ? it.price : null,
          note: it.note || undefined,
          simpleSectionId: sectionId,
        });
      }

      draft.items = currentItems;
    });

    setOcrOpen(false);
    setOcrItems([]);
    setOcrSelectedIds([]);
    setOcrError(null);
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

  /* ----------------- helper za 1 row itema ----------------- */

  const renderItemRow = (it: any) => {
    const index = items.findIndex((x) => x.id === it.id);
    const isFirst = index === 0;
    const isLast = index === items.length - 1;
    const isSelected = selectedItems.has(it.id);

    return (
      <div
        key={it.id}
        className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 sm:px-4 sm:py-3 hover:shadow-[0_16px_36px_rgba(2,6,23,.18)] transition"
      >
        {/* Selection + Reorder */}
        <div className="mt-1 flex flex-col items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
            checked={isSelected}
            onChange={() => toggleSelectItem(it.id)}
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
              onClick={() => reorderItem(it.id, -1)}
              disabled={isFirst}
              aria-label={t("Move up")}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
              onClick={() => reorderItem(it.id, 1)}
              disabled={isLast}
              aria-label={t("Move down")}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
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
                onClick={() => updateItem(it.id, { imageUrl: undefined })}
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
              onChange={(e) => updateItem(it.id, { label: e.target.value })}
              placeholder={t("Item name")}
            />
            <input
              type="number"
              className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-right text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
              value={it.price ?? ""}
              onChange={(e) =>
                updateItem(it.id, {
                  price:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder={t("Price")}
            />
          </div>
          <textarea
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--muted)] outline-none focus:border-[var(--brand-1,#4F46E5)] resize-none"
            rows={2}
            placeholder={t("Optional description, ingredients or notes")}
            value={it.note ?? ""}
            onChange={(e) => updateItem(it.id, { note: e.target.value })}
          />
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => {
            removeItem(it.id);
            setSelectedItems((prev) => {
              const next = new Set(prev);
              next.delete(it.id);
              return next;
            });
          }}
          className="cursor-pointer mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-red-300/70 bg-red-100/30 text-red-600 hover:bg-red-100 hover:border-red-400 hover:shadow-[0_10px_24px_rgba(220,38,38,.35)] transition"
          aria-label={t("Delete item")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  /* ================================================================== */

  // grupisanje po sekcijama
  const unsectionedItems = items.filter((it) => !it.simpleSectionId);
  const itemsBySection = new Map<string, any[]>();
  items.forEach((it) => {
    const sid = it.simpleSectionId as string | undefined;
    if (!sid) return;
    if (!itemsBySection.has(sid)) itemsBySection.set(sid, []);
    itemsBySection.get(sid)!.push(it);
  });

  return (
    <div className="p-4 sm:p-5">
      {/* Top: title + main actions */}
      <div className="space-y-1 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
          {t("Tierless price page")}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)]">
          {t(
            "Simple item list – perfect for restaurant menus, clinics, salons and all quick price pages."
          )}
        </p>
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    className="w-full sm:w-auto cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={currencyPresetValue}
                    onChange={(e) => handleCurrencyPresetChange(e.target.value)}
                  >
                    {CURRENCY_PRESETS.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                    <option value="__custom">{t("Custom…")}</option>
                  </select>
                  <input
                    type="text"
                    maxLength={6}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    placeholder={t("Currency code, e.g. RSD")}
                    value={currency ?? ""}
                    onChange={(e) => setI18n({ currency: e.target.value })}
                  />
                  <select
                    className="w-full sm:w-32 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
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
                            onChange={(e) => setOutlineSolid(e.target.value)}
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

                {/* Selections + inquiry + dots + section outline */}
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

                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 hover:border-[var(--brand-1,#4F46E5)] hover:bg-[var(--surface)]">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                        checked={simpleSectionOutlinePublic}
                        onChange={(e) =>
                          setMeta({
                            simpleSectionOutlinePublic: e.target.checked,
                          })
                        }
                      />
                      <span className="text-[var(--text)]">
                        {t("Use gradient outline for sections on public page")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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

        <button
          type="button"
          onClick={handleAddSection}
          className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
            {t("Add section (Drinks, Grill, Pizzas…)")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOcrOpen(true)}
          className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
            {t("Scan existing price list")}
          </span>
        </button>
      </div>

      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs text-[var(--muted)] cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
              checked={items.length > 0 && selectedItems.size === items.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            {t("Select all")}
          </label>
          {selectedItems.size > 0 && (
            <>
              <span className="text-[11px] sm:text-xs text-[var(--muted)]">
                {selectedItems.size} {t("selected")}
              </span>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-red-600 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(220,38,38,.25)]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    padding: 1,
                    background: "linear-gradient(90deg,#f97316,#ef4444)",
                    WebkitMask:
                      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor" as any,
                    maskComposite: "exclude" as any,
                  }}
                />
                <span className="relative z-[1]">
                  {t("Delete selected")}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Items list + sekcije */}
      <div className="space-y-3" data-tour-id="tour-items">
        {/* Items bez sekcije */}
        {unsectionedItems.map((it) => renderItemRow(it))}

        {/* Sekcije */}
        {simpleSections.map((section) => {
          const sectionItems = itemsBySection.get(section.id) ?? [];
          const collapsed = !!sectionStates[section.id];

          return (
            <div
              key={section.id}
              className="rounded-2xl p-[1px]"
              style={{ backgroundImage: BRAND_GRADIENT }}
            >
              <div className="rounded-[inherit] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4 border border-transparent">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2.5">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)]"
                    value={section.label}
                    onChange={(e) =>
                      handleRenameSection(section.id, e.target.value)
                    }
                    placeholder={t("New section")}
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSectionCollapsed(section.id)}
                      className="px-3 py-1.5 text-[11px] sm:text-xs rounded-full border border-[var(--border)] text-[var(--text)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)] transition"
                    >
                      {collapsed ? t("Expand") : t("Collapse")}
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
                      onClick={() => handleMoveSection(section.id, -1)}
                      disabled={
                        simpleSections.findIndex((s) => s.id === section.id) ===
                        0
                      }
                      aria-label={t("Move section up")}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-default"
                      onClick={() => handleMoveSection(section.id, 1)}
                      disabled={
                        simpleSections.findIndex((s) => s.id === section.id) ===
                        simpleSections.length - 1
                      }
                      aria-label={t("Move section down")}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(section.id)}
                      className="cursor-pointer inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-red-300/70 bg-red-100/30 text-red-600 hover:bg-red-100 hover:border-red-400 hover:shadow-[0_10px_24px_rgba(220,38,38,.35)] transition"
                      aria-label={t("Delete section")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items unutar sekcije */}
                {!collapsed ? (
                  <>
                    <div className="space-y-2">
                      {sectionItems.length === 0 && (
                        <div className="text-[11px] sm:text-xs text-[var(--muted)]">
                          {t("No items in this section yet. Add your first item.")}
                        </div>
                      )}

                      {sectionItems.map((it) => renderItemRow(it))}
                    </div>

                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleAddItemToSection(section.id)}
                        className="relative inline-flex items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                          {t("Add item to this section")}
                        </span>
                      </button>

                      {unsectionedItems.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[11px] sm:text-xs text-[var(--muted)]">
                            {t("Or move an existing item into this section")}
                          </div>
                          <select
                            defaultValue=""
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[11px] sm:text-xs text-[var(--text)] outline-none focus:border-[var(--brand-1,#4F46E5)] cursor-pointer"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              handleMoveExistingItemToSection(val, section.id);
                              e.target.value = "";
                            }}
                          >
                            <option value="">
                              {t("Choose item to move")}
                            </option>
                            {unsectionedItems.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.label || t("Untitled item")}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] sm:text-xs text-[var(--muted)] italic">
                    {t("Section collapsed. Expand to view items.")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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

      {/* OCR modal */}
      {ocrOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text)]">
                  {t("Scan existing price list")}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
                  {t(
                    "Upload a photo or PDF of your menu. We will try to detect items, prices and sections and add them to your list."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOcrOpen(false);
                  setOcrItems([]);
                  setOcrSelectedIds([]);
                  setOcrError(null);
                }}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => ocrFileRef.current?.click()}
                disabled={ocrUploading}
                className="relative inline-flex cursor-pointer items-center rounded-full bg-[var(--card)] px-3.5 py-1.5 text-xs sm:text-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)] disabled:cursor-not-allowed disabled:opacity-60"
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
                <span className="relative z-[1]">
                  {ocrUploading
                    ? t("Scanning…")
                    : t("Upload menu photo or PDF")}
                </span>
              </button>

              {ocrItems.length > 0 && (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2">
                  <div className="mb-1 text-[11px] sm:text-xs text-[var(--muted)]">
                    {t("Preview")} ({ocrItems.length} {t("items found")})
                  </div>
                  <div className="max-h-40 overflow-auto text-[11px] sm:text-xs">
                    {ocrItems.slice(0, 20).map((it) => {
                      const checked = ocrSelectedIds.includes(it.id);
                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 py-0.5 last:border-b-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              className="h-3 w-3 cursor-pointer accent-[var(--brand-1,#4F46E5)]"
                              checked={checked}
                              onChange={() => toggleOcrSelection(it.id)}
                            />
                            <div className="min-w-0">
                              <div className="truncate">{it.label}</div>
                              {it.sectionName && (
                                <div className="text-[10px] text-[var(--muted)] truncate">
                                  {it.sectionName}
                                </div>
                              )}
                            </div>
                          </div>
                          {typeof it.price === "number" && (
                            <span className="whitespace-nowrap font-medium text-[var(--text)]">
                              {it.price}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {ocrItems.length > 20 && (
                      <div className="mt-1 text-[10px] text-[var(--muted)]">
                        {t("Showing first 20 items. All items will be added.")}
                      </div>
                    )}
                  </div>

                  {ocrItems.length > 0 && (
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={selectAllOcrItems}
                          className="underline decoration-dotted hover:text-[var(--text)]"
                        >
                          {t("Select all")}
                        </button>
                        <button
                          type="button"
                          onClick={clearOcrSelection}
                          className="underline decoration-dotted hover:text-[var(--text)]"
                        >
                          {t("Clear selection")}
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={ocrSelectedIds.length === 0}
                        onClick={deleteSelectedOcrItems}
                        className="text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-default"
                      >
                        {t("Delete selected")}{" "}
                        {ocrSelectedIds.length > 0
                          ? `(${ocrSelectedIds.length})`
                          : ""}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {ocrUploading && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[var(--brand-1,#4F46E5)]">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand-1,#4F46E5)] border-t-transparent" />
                  {t("Reading your document…")}
                </div>
              )}

              {ocrError && (
                <div className="mt-1 text-[11px] text-red-500">
                  {ocrError}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOcrOpen(false);
                  setOcrItems([]);
                  setOcrSelectedIds([]);
                  setOcrError(null);
                }}
                className="text-[11px] sm:text-xs text-[var(--muted)] hover:text-[var(--text)]"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                disabled={ocrItems.length === 0}
                onClick={handleApplyOcrToList}
                className="relative inline-flex items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.18)]"
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
                  {t("Add items to list")}
                </span>
              </button>
            </div>

            <input
              ref={ocrFileRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleOcrFileChange}
            />
          </div>
        </div>
      )}

      {/* Hidden input za upload slika, delimo ga za sve iteme */}
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
