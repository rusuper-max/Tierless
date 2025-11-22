"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  ArrowUp, ArrowDown, Trash2, Image as ImageIcon, Plus, X, ScanLine,
  Palette, Settings, List, MapPin, Phone, Wifi, Clock, Info, Store, Check, Mail
} from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type SimpleSection, type BrandTheme } from "@/hooks/useEditorStore";
import { useAccount } from "@/hooks/useAccount";

type SimpleSpacing = "compact" | "cozy" | "relaxed";

type ColorPreset = {
  key: string;
  label: string;
  value: string;
};

type ParsedOcrItem = {
  id: string;
  label: string;
  price: number | null;
  note?: string;
  rawLine?: string;
  sectionName?: string | null;
};

type Tab = "content" | "business" | "design" | "settings";

/* ---------------- Preseti ---------------- */

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

const BRAND_GRADIENT = "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";
const CURRENCY_PRESETS = ["€", "$", "£", "CHF", "CAD", "AUD", "RSD", "BAM", "PLN"];

const createId = () => `sec_${Math.random().toString(36).slice(2, 10)}`;

/* ====================================================================== */

export default function SimpleListPanel() {
  const { calc, addItem, updateItem, removeItem, reorderItem, updateCalc } = useEditorStore();
  const { plan } = useAccount();

  const items = (calc?.items ?? []) as any[];
  const meta = (calc?.meta || {}) as any;
  const i18n = (calc?.i18n || {}) as any;
  const business = meta.business || {};

  const simpleSections: SimpleSection[] = meta.simpleSections ?? [];
  const sectionStates: Record<string, boolean> = (meta.simpleSectionStates as Record<string, boolean>) ?? {};

  const simpleCoverImage: string = business.coverUrl || meta.simpleCoverImage || "";

  const canUseImages = plan === "growth" || plan === "pro" || plan === "tierless" || plan === "starter";

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // --- OCR State ---
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrItems, setOcrItems] = useState<ParsedOcrItem[]>([]);
  const [ocrSelectedIds, setOcrSelectedIds] = useState<string[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement | null>(null);

  // --- Config Getters ---
  const simpleTitle: string = meta.simpleTitle ?? "";
  const simpleBg: string = meta.simpleBg ?? "";
  const simpleBgGrad1: string = meta.simpleBgGrad1 ?? "#f9fafb";
  const simpleBgGrad2: string = meta.simpleBgGrad2 ?? "#e5e7eb";
  const simpleTextColor: string = meta.simpleTextColor ?? "";
  const simpleFont: string = meta.simpleFont ?? "system";
  const simpleFontSize: "sm" | "md" | "lg" = meta.simpleFontSize ?? "md";
  const simpleSpacing: SimpleSpacing = meta.simpleSpacing ?? "cozy";

  const showTierlessBadge: boolean = meta.simpleShowBadge ?? true;

  const simpleDots: boolean = meta.simpleDots ?? false;
  const simpleAllowSelection: boolean = meta.simpleAllowSelection ?? false;
  const simpleShowInquiry: boolean = meta.simpleShowInquiry ?? false;
  const currency: string = typeof i18n.currency === "string" ? (i18n.currency as string) : "";
  const decimals: number = Number.isFinite(i18n.decimals) ? (i18n.decimals as number) : 0;
  const activeTheme: BrandTheme = meta.theme || "tierless";

  const isBgGradient = typeof simpleBg === "string" && simpleBg.startsWith("linear-gradient");
  const currencyPresetValue = !currency || !CURRENCY_PRESETS.includes(currency) ? "__custom" : currency;

  useEffect(() => {
    setSelectedItems((prev) => {
      const next = new Set<string>();
      items.forEach((item) => { if (prev.has(item.id)) next.add(item.id); });
      return next;
    });
  }, [items]);

  /* ---------------- Helpers ---------------- */

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
              className={`relative inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] transition hover:-translate-y-0.5 cursor-pointer
                ${isSelected
                  ? "border-[var(--text)] bg-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--text)]"
                }`}
            >
              {isSelected && (
                <div className="absolute inset-0 rounded-full border-2 border-[#22D3EE] opacity-50 pointer-events-none" />
              )}
              <span className="relative z-[1] inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-black/10"
                  style={{
                    background: c.value === "" ? "linear-gradient(135deg,#e5e7eb,#f9fafb)" : c.value,
                  }}
                />
                <span className="whitespace-nowrap font-medium text-[var(--text)]">{t(c.label)}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const setMeta = (patch: Record<string, any>) => {
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {};
      Object.assign(draft.meta as any, patch);
    });
  };

  const setBusiness = (patch: Record<string, any>) => {
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {};
      if (!draft.meta.business) draft.meta.business = {};
      Object.assign(draft.meta.business as any, patch);
    });
  }

  const setI18n = (patch: Record<string, any>) => {
    updateCalc((draft) => {
      if (!draft.i18n) draft.i18n = {};
      Object.assign(draft.i18n as any, patch);
    });
  };

  const setBgSolid = (val: string) => setMeta({ simpleBg: val, simpleBgGrad1: undefined, simpleBgGrad2: undefined });
  const toggleBgMode = (mode: "solid" | "gradient") => {
    if (mode === "solid") setMeta({ simpleBg: "", simpleBgGrad1: undefined, simpleBgGrad2: undefined });
    else {
      const c1 = simpleBgGrad1 || "#f9fafb";
      const c2 = simpleBgGrad2 || "#e5e7eb";
      setMeta({ simpleBgGrad1: c1, simpleBgGrad2: c2, simpleBg: `linear-gradient(90deg,${c1},${c2})` });
    }
  };

  const handleCurrencyPresetChange = (value: string) => {
    if (value === "__custom") {
      setI18n({ currency: "" });
    } else {
      setI18n({ currency: value });
    }
  };

  const handleGenericUpload = async (e: ChangeEvent<HTMLInputElement>, targetId: string, type: 'item' | 'section' | 'cover' | 'logo') => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) { setError(t("Only image files are allowed.")); return; }
    if (file.size > 3 * 1024 * 1024) { setError(t("Image is too large (max 3 MB).")); return; }

    try {
      setUploadingId(targetId);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data?.url) { setError(t("Upload failed.")); return; }

      const url = data.url;

      if (type === "item") {
        updateItem(targetId, { imageUrl: url });
      } else if (type === "cover") {
        setBusiness({ coverUrl: url });
        setMeta({ simpleCoverImage: url });
      } else if (type === "logo") {
        setBusiness({ logoUrl: url });
      } else if (type === "section") {
        updateCalc((draft) => {
          const m = draft.meta as any;
          const secs: SimpleSection[] = m.simpleSections || [];
          const next = secs.map(s => s.id === targetId ? { ...s, imageUrl: url } : s);
          m.simpleSections = next;
        });
      }
    } catch (err) {
      console.error(err);
      setError(t("Upload failed."));
    } finally {
      setUploadingId(null);
    }
  };

  const triggerGenericUpload = (id: string, type: 'item' | 'section' | 'cover' | 'logo') => {
    setPendingFor(JSON.stringify({ id, type }));
    fileInputRef.current?.click();
  };

  /* ---------------- OCR Logic ---------------- */
  const handleOcrFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setOcrError(null); setOcrItems([]); setOcrSelectedIds([]); setOcrUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr-menu", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setOcrError(data?.error || t("Failed to scan.")); return; }
      const rawItems = (data?.items ?? []) as any[];
      if (!rawItems.length) { setOcrError(t("No items found.")); return; }
      const mapped: ParsedOcrItem[] = rawItems.map((it) => ({
        id: `ocr_${Math.random().toString(36).slice(2, 10)}`,
        label: (it.label ?? "").trim(),
        price: typeof it.price === "number" ? it.price : null,
        note: typeof it.note === "string" && it.note.trim() ? it.note.trim() : undefined,
        rawLine: it.rawLine,
        sectionName: typeof it.sectionName === "string" ? it.sectionName.trim() : undefined,
      }));
      setOcrItems(mapped.filter((it) => it.label.length > 0));
    } catch (err) {
      console.error(err);
      setOcrError(t("Failed to scan."));
    } finally {
      setOcrUploading(false);
    }
  };

  const toggleOcrSelection = (id: string) => {
    setOcrSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const selectAllOcrItems = () => setOcrSelectedIds(ocrItems.map((it) => it.id));
  const clearOcrSelection = () => setOcrSelectedIds([]);
  const deleteSelectedOcrItems = () => {
    if (!ocrSelectedIds.length) return;
    setOcrItems(prev => prev.filter(it => !ocrSelectedIds.includes(it.id)));
    setOcrSelectedIds([]);
  }

  const handleApplyOcrToList = () => {
    if (!ocrItems.length) return;
    updateCalc((draft) => {
      if (!draft.meta) draft.meta = {};
      const m = draft.meta as any;
      const existingSections: SimpleSection[] = Array.isArray(m.simpleSections) ? m.simpleSections : [];
      const sectionNameToId = new Map<string, string>();
      existingSections.forEach(s => sectionNameToId.set(s.label.toLowerCase(), s.id));
      const newSections: SimpleSection[] = [];
      const selectedItems = ocrItems.filter(it => ocrSelectedIds.includes(it.id));
      selectedItems.forEach(it => {
        const rawName = it.sectionName?.trim() || "";
        if (!rawName) return;
        const key = rawName.toLowerCase();
        if (!sectionNameToId.has(key)) {
          const newSec = { id: createId(), label: rawName };
          sectionNameToId.set(key, newSec.id);
          newSections.push(newSec);
        }
      });
      m.simpleSections = [...existingSections, ...newSections];
      if (!Array.isArray(draft.items)) draft.items = [];
      selectedItems.forEach(it => {
        const rawName = it.sectionName?.trim() || "";
        const sectionId = rawName ? sectionNameToId.get(rawName.toLowerCase()) : undefined;
        draft.items!.push({
          id: `it_${Math.random().toString(36).slice(2, 10)}`,
          label: it.label,
          price: it.price,
          note: it.note,
          simpleSectionId: sectionId
        });
      });
    });
    setOcrOpen(false); setOcrItems([]); setOcrSelectedIds([]);
  };

  /* ---------------- Item Rendering ---------------- */
  const renderItemRow = (it: any) => {
    return (
      <div key={it.id} className={`group relative flex items-start gap-3 rounded-xl border bg-[var(--card)] px-3 py-3 transition hover:border-[#22D3EE] hover:shadow-sm ${it.hidden ? "border-dashed border-yellow-300/50 opacity-70" : "border-[var(--border)]"} ${it.soldOut ? "grayscale opacity-60" : ""}`}>

        {/* Image */}
        {canUseImages && (
          <div className="flex flex-col items-center mr-1 shrink-0">
            <div className="h-16 w-16 rounded-lg bg-[var(--track)] overflow-hidden flex items-center justify-center relative group/img cursor-pointer border border-[var(--border)] hover:border-[#22D3EE] transition" onClick={() => triggerGenericUpload(it.id, "item")}>
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-[var(--muted)] opacity-50" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-[#22D3EE]/80 flex items-center justify-center text-transparent group-hover/img:text-white transition">
                <Plus className="w-5 h-5 drop-shadow-md" />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              className={`flex-1 bg-transparent text-sm font-bold text-[var(--text)] outline-none placeholder-[var(--muted)] border-b border-transparent focus:border-[#22D3EE] ${it.hidden ? "line-through text-[var(--muted)]" : ""}`}
              value={it.label}
              onChange={e => updateItem(it.id, { label: e.target.value })}
              placeholder={t("Item name")}
            />
            <div className="relative w-20">
              <input
                type="number"
                className="w-full bg-transparent text-sm text-right font-bold text-[var(--text)] outline-none placeholder-[var(--muted)] border-b border-transparent focus:border-[#22D3EE]"
                value={it.price ?? ""}
                onChange={e => updateItem(it.id, { price: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="0.00"
              />
              <span className="absolute -right-3 top-0 text-xs text-[var(--muted)] opacity-50">{currency}</span>
            </div>
          </div>
          <input
            type="text"
            className="w-full bg-transparent text-xs text-[var(--muted)] outline-none border-b border-transparent focus:border-[#22D3EE]"
            placeholder={t("Description (ingredients, portion size...)")}
            value={it.note ?? ""}
            onChange={e => updateItem(it.id, { note: e.target.value })}
          />
        </div>

        {/* Sort & Delete */}
        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => reorderItem(it.id, -1)} className="p-1 text-[var(--muted)] hover:text-[var(--text)]"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => reorderItem(it.id, 1)} className="p-1 text-[var(--muted)] hover:text-[var(--text)]"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => removeItem(it.id)} className="p-1 text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  };

  // --- Render Tabs ---

  const renderContentTab = () => {
    const unsectionedItems = items.filter((it) => !it.simpleSectionId);
    const itemsBySection = new Map<string, any[]>();
    items.forEach((it) => {
      const sid = it.simpleSectionId as string | undefined;
      if (!sid) return;
      if (!itemsBySection.has(sid)) itemsBySection.set(sid, []);
      itemsBySection.get(sid)!.push(it);
    });

    const handleAddSection = () => {
      const newSec = { id: createId(), label: t("New section") };
      updateCalc((draft) => {
        const m = draft.meta as any;
        m.simpleSections = [newSec, ...(m.simpleSections || [])];
      });
    };

    const handleAddItemToSection = (sid: string) => {
      const newId = addItem(t("New item"), 0);
      updateItem(newId, { simpleSectionId: sid } as any);
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

        {/* Cover Image Hero */}
        <div className="group relative w-full h-40 sm:h-52 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--track)] flex items-center justify-center">
          {simpleCoverImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={simpleCoverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <h2 className="text-white text-2xl font-bold drop-shadow-md">{simpleTitle || t("Page Title")}</h2>
              </div>
              <button onClick={() => setMeta({ simpleCoverImage: "" })} className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-600/90 transition opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <div className="text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-[var(--muted)] mx-auto" />
              <p className="text-sm text-[var(--muted)]">{t("No cover image")}</p>
            </div>
          )}

          <button
            onClick={() => triggerGenericUpload("cover", "cover")}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition text-transparent group-hover:text-white font-medium cursor-pointer"
          >
            {simpleCoverImage ? t("Change Cover") : t("Upload Cover")}
          </button>
        </div>

        {/* Quick Actions (BRAND BUTTONS) */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-[var(--border)]">

          {/* Add Item */}
          <button
            onClick={() => addItem(t("New item"), 0)}
            className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium group hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] transition cursor-pointer"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: 1.5,
                background: BRAND_GRADIENT,
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            <span className="relative z-[1] flex items-center gap-2 text-[var(--text)]">
              <Plus className="w-4 h-4" /> {t("Add Item")}
            </span>
          </button>

          {/* Add Section */}
          <button
            onClick={handleAddSection}
            className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium group hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] transition cursor-pointer"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: 1.5,
                background: BRAND_GRADIENT,
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            <span className="relative z-[1] flex items-center gap-2 text-[var(--text)]"><List className="w-4 h-4" /> {t("Add Section")}</span>
          </button>

          {/* Scan Menu */}
          <button
            onClick={() => setOcrOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium group hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] transition ml-auto cursor-pointer"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: 1.5,
                background: BRAND_GRADIENT,
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            <span className="relative z-[1] flex items-center gap-2 text-[var(--text)]"><ScanLine className="w-4 h-4 text-[#22D3EE]" /> {t("Scan Menu (OCR)")}</span>
          </button>
        </div>

        {/* Lists */}
        <div className="space-y-6">
          {/* Unsectioned */}
          {unsectionedItems.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pl-1">{t("Uncategorized Items")}</div>
              {unsectionedItems.map(renderItemRow)}
            </div>
          )}

          {/* Sections */}
          {simpleSections.map((section) => {
            const sectionItems = itemsBySection.get(section.id) ?? [];
            const collapsed = !!sectionStates[section.id];

            const toggleCollapse = () => {
              const next = { ...sectionStates, [section.id]: !sectionStates[section.id] };
              setMeta({ simpleSectionStates: next });
            };

            return (
              <div key={section.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 bg-[var(--surface)]/50 border-b border-[var(--border)] flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={toggleCollapse} className="p-1 hover:bg-[var(--bg)] rounded text-[var(--muted)]">
                      {collapsed ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                    <input
                      className="flex-1 bg-transparent text-lg font-bold text-[var(--text)] outline-none placeholder-[var(--muted)]/50 focus:border-b focus:border-[#22D3EE]"
                      value={section.label}
                      onChange={(e) => {
                        const next = simpleSections.map(s => s.id === section.id ? { ...s, label: e.target.value } : s);
                        setMeta({ simpleSections: next });
                      }}
                      placeholder={t("Section Name")}
                    />
                    <button onClick={() => {
                      const next = simpleSections.filter(s => s.id !== section.id);
                      setMeta({ simpleSections: next });
                    }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  {!collapsed && (
                    <div className="flex gap-3 pl-9">
                      {/* Section Image */}
                      <div className="shrink-0">
                        {section.imageUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden group border border-[var(--border)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={section.imageUrl} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => {
                              const next = simpleSections.map(s => s.id === section.id ? { ...s, imageUrl: undefined } : s);
                              setMeta({ simpleSections: next });
                            }} className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => triggerGenericUpload(section.id, "section")} className="w-16 h-16 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:border-[#22D3EE] hover:text-[#22D3EE] transition bg-[var(--bg)]">
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] resize-none focus:border-[#22D3EE] outline-none"
                        placeholder={t("Optional description (e.g. 'Served until 11am')")}
                        value={section.description || ""}
                        onChange={(e) => {
                          const next = simpleSections.map(s => s.id === section.id ? { ...s, description: e.target.value } : s);
                          setMeta({ simpleSections: next });
                        }}
                      />
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <div className="p-3 space-y-2 bg-[var(--bg)]/30">
                    {sectionItems.map(renderItemRow)}
                    <button onClick={() => handleAddItemToSection(section.id)} className="w-full py-3 border border-dashed border-[var(--border)] rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:border-[#22D3EE] hover:bg-[#22D3EE]/5 transition flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> {t("Add item to")} {section.label}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl">
              <p className="text-[var(--muted)] text-sm">{t("Your menu is empty. Add an item or scan a menu to start.")}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBusinessTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-1">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Contact & Info")}</h3>

        {/* Logo Upload */}
        <div className="flex gap-4 items-center mb-4 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="w-16 h-16 rounded-lg bg-[var(--bg)] border border-[var(--border)] overflow-hidden relative group">
            {business.logoUrl ? (
              <>
                <img src={business.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                <button onClick={() => setBusiness({ logoUrl: "" })} className="absolute top-0.5 right-0.5 bg-black/50 text-white p-0.5 rounded hover:bg-red-500"><X className="w-3 h-3" /></button>
              </>
            ) : (
              <ImageIcon className="w-6 h-6 text-[var(--muted)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text)]">{t("Business Logo")}</div>
            <div className="text-xs text-[var(--muted)] mb-2">{t("Displayed in header on public page")}</div>
            <button onClick={() => triggerGenericUpload("logo", "logo")} className="text-xs px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--surface)]">{business.logoUrl ? t("Change") : t("Upload")}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><Phone className="w-3.5 h-3.5" /> {t("Phone Number")}</div>
            <input type="text" value={business.phone || ""} onChange={e => setBusiness({ phone: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="+1 234 567 890" />
          </label>

          {/* NOVO: Email Polje */}
          <label className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><Mail className="w-3.5 h-3.5" /> {t("Contact Email")}</div>
            <input type="text" value={business.email || ""} onChange={e => setBusiness({ email: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="contact@example.com" />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)] font-medium">{t("Business Description (Optional)")}</span>
          <textarea
            rows={3}
            value={business.description || ""}
            onChange={e => setBusiness({ description: e.target.value })}
            className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE] resize-none"
            placeholder={t("Short description about your business, cuisine, etc.")}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><Phone className="w-3.5 h-3.5" /> {t("Phone Number")}</div>
            <input type="text" value={business.phone || ""} onChange={e => setBusiness({ phone: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="+1 234 567 890" />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><MapPin className="w-3.5 h-3.5" /> {t("Location (Google Maps Link)")}</div>
            <input type="text" value={business.location || ""} onChange={e => setBusiness({ location: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="https://maps.google.com..." />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
          <label className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><Wifi className="w-3.5 h-3.5" /> {t("WiFi Name (SSID)")}</div>
            <input type="text" value={business.wifiSsid || ""} onChange={e => setBusiness({ wifiSsid: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Guest WiFi" />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><Info className="w-3.5 h-3.5" /> {t("WiFi Password")}</div>
            <input type="text" value={business.wifiPass || ""} onChange={e => setBusiness({ wifiPass: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="SecretPass123" />
          </label>
        </div>

        <label className="block space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium"><Clock className="w-3.5 h-3.5" /> {t("Opening Hours")}</div>
          <input type="text" value={business.hours || ""} onChange={e => setBusiness({ hours: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Mon-Fri: 9am - 10pm, Sat-Sun: 10am - 11pm" />
        </label>
      </div>
    </div>
  );

  const renderDesignTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-1">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Themes")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["tierless", "classic", "midnight", "cafe", "ocean", "forest", "sunset", "minimal"] as const).map(th => (
            <button
              key={th}
              onClick={() => setMeta({
                theme: th,
                simpleBg: undefined,
                simpleBgGrad1: undefined,
                simpleBgGrad2: undefined,
                simpleTextColor: undefined,
                simpleBorderColor: undefined,
                simpleOutlineGrad1: undefined,
                simpleOutlineGrad2: undefined
              })}
              className={`relative p-3 rounded-xl border text-left transition-all hover:-translate-y-1 ${activeTheme === th ? "border-[#22D3EE] shadow-md ring-1 ring-[#22D3EE]" : "border-[var(--border)] hover:border-[var(--text)]"}`}
            >
              <div className={`h-12 w-full rounded-lg mb-2 border border-black/10 ${th === "midnight" ? "bg-slate-900" :
                th === "cafe" ? "bg-[#4a3b32]" :
                  th === "ocean" ? "bg-blue-900" :
                    th === "forest" ? "bg-[#064e3b]" :
                      th === "sunset" ? "bg-[#be123c]" :
                        th === "minimal" ? "bg-[#f3f4f6]" :
                          th === "classic" ? "bg-white" : "bg-gradient-to-br from-[#4F46E5] to-[#22D3EE]"
                }`} />
              <div className="text-xs font-bold capitalize text-[var(--text)]">{th}</div>
              {activeTheme === th && <div className="absolute top-2 right-2 bg-[#22D3EE] text-white rounded-full p-0.5"><Check className="w-3 h-3" /></div>}
            </button>
          ))}
        </div>
      </div>


    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-1">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Page Info")}</h3>
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)] font-medium">{t("Page Title (Visible on page)")}</span>
          <input type="text" value={simpleTitle} onChange={e => setMeta({ simpleTitle: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Localization")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium">{t("Currency")}</span>
            <select value={currencyPresetValue} onChange={e => handleCurrencyPresetChange(e.target.value)} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]">
              {CURRENCY_PRESETS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium">{t("Decimals")}</span>
            <select value={decimals} onChange={e => setI18n({ decimals: Number(e.target.value) })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]">
              <option value={0}>0 (100)</option>
              <option value={2}>2 (100.00)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Behavior & Features")}</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[#22D3EE] transition">
            <span className="text-sm text-[var(--text)]">{t("Show 'Powered by Tierless' Badge")}</span>
            <input type="checkbox" checked={showTierlessBadge} onChange={e => setMeta({ simpleShowBadge: e.target.checked })} className="accent-[#22D3EE] h-4 w-4" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[#22D3EE] transition">
            <span className="text-sm text-[var(--text)]">{t("Allow item selection (Calculator Mode)")}</span>
            <input type="checkbox" checked={simpleAllowSelection} onChange={e => setMeta({ simpleAllowSelection: e.target.checked })} className="accent-[#22D3EE] h-4 w-4" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[#22D3EE] transition">
            <span className="text-sm text-[var(--text)]">{t("Show Inquiry Button")}</span>
            <input type="checkbox" checked={simpleShowInquiry} onChange={e => setMeta({ simpleShowInquiry: e.target.checked })} className="accent-[#22D3EE] h-4 w-4" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[#22D3EE] transition">
            <span className="text-sm text-[var(--text)]">{t("Show dotted lines")}</span>
            <input type="checkbox" checked={simpleDots} onChange={e => setMeta({ simpleDots: e.target.checked })} className="accent-[#22D3EE] h-4 w-4" />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl shadow-sm relative">
          {(["content", "business", "design", "settings"] as const).map(tKey => {
            const isActive = activeTab === tKey;
            return (
              <button
                key={tKey}
                onClick={() => setActiveTab(tKey)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all group"
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-lg"
                    style={{
                      padding: 1.5,
                      background: BRAND_GRADIENT,
                      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 ${isActive ? "text-[var(--text)] font-bold" : "text-[var(--muted)] group-hover:text-[var(--text)]"}`}>
                  {tKey === "content" && <List className="w-4 h-4" />}
                  {tKey === "business" && <Store className="w-4 h-4" />}
                  {tKey === "design" && <Palette className="w-4 h-4" />}
                  {tKey === "settings" && <Settings className="w-4 h-4" />}
                  <span className="hidden sm:inline">{t(tKey.charAt(0).toUpperCase() + tKey.slice(1))}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "content" && renderContentTab()}
        {activeTab === "business" && renderBusinessTab()}
        {activeTab === "design" && renderDesignTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>

      {/* Global inputs */}
      {canUseImages && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (!pendingFor) return;
            try {
              const payload = JSON.parse(pendingFor);
              handleGenericUpload(e, payload.id, payload.type);
            } catch {
              handleGenericUpload(e, pendingFor, "item");
            }
            setPendingFor(null);
          }}
        />
      )}

      {/* OCR Modal */}
      {ocrOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">{t("Scan Menu")}</h3>
                <p className="text-sm text-[var(--muted)]">{t("Upload a photo/PDF to auto-detect items.")}</p>
              </div>
              <button onClick={() => { setOcrOpen(false); setOcrItems([]); setOcrSelectedIds([]); setOcrError(null); }} className="p-1 rounded-full hover:bg-[var(--bg)] text-[var(--text)]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <button onClick={() => ocrFileRef.current?.click()} disabled={ocrUploading} className="w-full py-8 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center text-[var(--muted)] hover:border-[#22D3EE] hover:text-[#22D3EE] transition bg-[var(--bg)] disabled:opacity-50">
                {ocrUploading ? <div className="animate-spin h-8 w-8 border-4 border-[#22D3EE] border-t-transparent rounded-full mb-2" /> : <ScanLine className="w-8 h-8 mb-2" />}
                <span className="text-sm font-medium">{ocrUploading ? t("Scanning...") : t("Click to upload menu")}</span>
              </button>

              {ocrError && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{ocrError}</div>}

              {ocrItems.length > 0 && (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)]">
                  <div className="p-2 bg-[var(--surface)] border-b border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--muted)]">{ocrItems.length} {t("items found")}</span>
                    <div className="flex gap-2">
                      <button onClick={selectAllOcrItems} className="text-xs text-[#22D3EE] hover:underline font-medium">{t("Select All")}</button>
                      <button onClick={clearOcrSelection} className="text-xs text-[var(--muted)] hover:underline">{t("Clear")}</button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {ocrItems.map(it => (
                      <label key={it.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--card)] cursor-pointer border border-transparent hover:border-[var(--border)] transition">
                        <input type="checkbox" checked={ocrSelectedIds.includes(it.id)} onChange={() => toggleOcrSelection(it.id)} className="accent-[#22D3EE] h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[var(--text)] truncate">{it.label}</div>
                          {it.sectionName && <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{it.sectionName}</div>}
                        </div>
                        {it.price && <div className="text-sm font-bold text-[var(--text)]">{it.price}</div>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setOcrOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]">{t("Cancel")}</button>
              <button onClick={handleApplyOcrToList} disabled={ocrSelectedIds.length === 0} className="relative inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 cursor-pointer group">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    padding: 1.5,
                    background: BRAND_GRADIENT,
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    opacity: 0.9,
                  }}
                />
                <span className="relative z-[1] text-[var(--text)] font-semibold group-hover:text-[#22D3EE] transition-colors">
                  {t("Add Selected")} ({ocrSelectedIds.length})
                </span>
              </button>
            </div>
            <input ref={ocrFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOcrFileChange} />
          </div>
        </div>
      )}
    </div>
  );
}