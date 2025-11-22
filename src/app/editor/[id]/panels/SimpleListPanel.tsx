"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  ArrowUp, ArrowDown, Trash2, Image as ImageIcon, Plus, X, ScanLine,
  Palette, Settings, List, MapPin, Phone, Wifi, Clock, Store, Check, Mail, Tag,
  Eye, EyeOff, Ban // <--- OVO JE FALILO
} from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type SimpleSection, type BrandTheme } from "@/hooks/useEditorStore";
import { useAccount } from "@/hooks/useAccount";

type ParsedOcrItem = {
  id: string;
  label: string;
  price: number | null;
  note?: string;
  rawLine?: string;
  sectionName?: string | null;
};

type Tab = "content" | "business" | "design" | "settings";

/* ---------------- Konfiguracija ---------------- */

// Bedževi (Novi feature)
const BADGE_OPTIONS = [
  { value: "", label: t("No Badge") },
  { value: "popular", label: "⭐ Popular" },
  { value: "spicy", label: "🌶️ Spicy" },
  { value: "vegan", label: "🌱 Vegan" },
  { value: "new", label: "🔥 New" },
  { value: "sale", label: "💰 Sale" },
  { value: "chef", label: "👨‍🍳 Chef's" },
  { value: "gf", label: "Gluten Free" },
];

// Teme
const THEME_OPTIONS: { key: BrandTheme; label: string; color: string }[] = [
  { key: "tierless", label: "Tierless", color: "bg-gradient-to-br from-[#4F46E5] to-[#22D3EE]" },
  { key: "minimal", label: "Minimal", color: "bg-white border border-gray-200" },
  { key: "luxury", label: "Luxury", color: "bg-[#0f0f0f] border border-[#d4af37]" },
  { key: "elegant", label: "Elegant", color: "bg-[#fdfbf7] border border-[#d4af37]" },
  { key: "midnight", label: "Midnight", color: "bg-slate-950" },
  { key: "cafe", label: "Cafe", color: "bg-[#4a3b32]" },
  { key: "ocean", label: "Ocean", color: "bg-blue-900" },
  { key: "forest", label: "Forest", color: "bg-[#064e3b]" },
  { key: "sunset", label: "Sunset", color: "bg-[#be123c]" },
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
  const simpleLogo: string = business.logoUrl || "";

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

  const showTierlessBadge: boolean = meta.simpleShowBadge ?? true;
  const simpleAllowSelection: boolean = meta.simpleAllowSelection ?? false;

  const currency: string = typeof i18n.currency === "string" ? (i18n.currency as string) : "";
  const decimals: number = Number.isFinite(i18n.decimals) ? (i18n.decimals as number) : 0;
  const activeTheme: BrandTheme = meta.theme || "tierless";

  useEffect(() => {
    setSelectedItems((prev) => {
      const next = new Set<string>();
      items.forEach((item) => { if (prev.has(item.id)) next.add(item.id); });
      return next;
    });
  }, [items]);

  /* ---------------- Helpers ---------------- */

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

          <div className="flex items-center gap-2">
            {/* BADGE SELECTOR */}
            <div className="relative group/badge">
              <select
                value={it.badge || ""}
                onChange={(e) => updateItem(it.id, { badge: e.target.value })}
                className="appearance-none bg-[var(--bg)] border border-[var(--border)] text-[10px] h-6 pl-2 pr-6 rounded-full outline-none focus:border-[#22D3EE] cursor-pointer text-[var(--text)] hover:bg-[var(--surface)] font-medium"
              >
                {BADGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Tag className="w-3 h-3 absolute right-2 top-1.5 pointer-events-none text-[var(--muted)]" />
            </div>

            <input
              type="text"
              className="flex-1 bg-transparent text-xs text-[var(--muted)] outline-none border-b border-transparent focus:border-[#22D3EE]"
              placeholder={t("Description...")}
              value={it.note ?? ""}
              onChange={e => updateItem(it.id, { note: e.target.value })}
            />
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center gap-3 mt-1">
            <button onClick={() => updateItem(it.id, { hidden: !it.hidden })} className={`text-[10px] font-medium flex items-center gap-1 ${it.hidden ? "text-yellow-600" : "text-[var(--muted)] hover:text-[var(--text)]"}`} title={t("Hide from menu")}>
              {it.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {it.hidden ? t("Hidden") : t("Visible")}
            </button>
            <button onClick={() => updateItem(it.id, { soldOut: !it.soldOut })} className={`text-[10px] font-medium flex items-center gap-1 ${it.soldOut ? "text-red-500" : "text-[var(--muted)] hover:text-[var(--text)]"}`} title={t("Mark as Sold Out")}>
              <Ban className="w-3 h-3" />
              {it.soldOut ? t("Sold Out") : t("Available")}
            </button>
            {it.imageUrl && (
              <button onClick={() => updateItem(it.id, { imageUrl: undefined })} className="text-[10px] text-red-400 hover:text-red-600 hover:underline">{t("Remove Image")}</button>
            )}
          </div>
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

  /* ---------------- TABS ---------------- */

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
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center gap-3">
                {simpleLogo && (
                  <div className="w-12 h-12 rounded-full bg-white p-0.5 overflow-hidden shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={simpleLogo} alt="" className="w-full h-full object-cover rounded-full" />
                  </div>
                )}
                <h2 className="text-white text-2xl font-bold drop-shadow-md">{simpleTitle || t("Page Title")}</h2>
              </div>
              <button onClick={() => setMeta({ simpleCoverImage: "", business: { ...business, coverUrl: "" } })} className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-600/90 transition opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <div className="text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-[var(--muted)] mx-auto" />
              <p className="text-sm text-[var(--muted)]">{t("Add a cover image to make your menu pop")}</p>
            </div>
          )}

          <button
            onClick={() => triggerGenericUpload("cover", "cover")}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition text-transparent group-hover:text-white font-medium cursor-pointer"
          >
            {simpleCoverImage ? t("Change Cover") : t("Upload Cover")}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-[var(--border)]">
          <button onClick={() => addItem(t("New item"), 0)} className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium group hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] transition cursor-pointer border border-[var(--border)]">
            <Plus className="w-4 h-4 text-[#22D3EE]" /> {t("Add Item")}
          </button>

          <button onClick={handleAddSection} className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium group hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] transition cursor-pointer border border-[var(--border)]">
            <List className="w-4 h-4 text-[#4F46E5]" /> {t("Add Section")}
          </button>

          <button onClick={() => setOcrOpen(true)} className="relative inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium group hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] transition ml-auto cursor-pointer border border-[var(--border)]">
            <ScanLine className="w-4 h-4 text-[#22D3EE]" /> {t("Scan Menu (OCR)")}
          </button>
        </div>

        {/* Lists */}
        <div className="space-y-8">
          {/* Unsectioned */}
          {unsectionedItems.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pl-1">{t("Uncategorized Items")}</div>
              <div className="grid gap-3">{unsectionedItems.map(renderItemRow)}</div>
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
                {/* Section Header */}
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

      {/* Logo & Description */}
      <div className="flex gap-4 items-start">
        <div className="shrink-0">
          <div className="w-20 h-20 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center relative group overflow-hidden">
            {simpleLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={simpleLogo} alt="" className="w-full h-full object-cover" />
            ) : <Store className="w-8 h-8 text-[var(--muted)]" />}
            <button onClick={() => triggerGenericUpload("logo", "logo")} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition">Change</button>
          </div>
          <div className="text-center text-[10px] text-[var(--muted)] mt-1">Logo</div>
        </div>
        <label className="flex-1 space-y-1.5">
          <span className="text-xs text-[var(--muted)] font-medium">{t("Business Description")}</span>
          <textarea rows={3} value={business.description || ""} onChange={e => setBusiness({ description: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Best coffee in town..." />
        </label>
      </div>

      <div className="space-y-4 border-t border-[var(--border)] pt-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide">{t("Contact Info")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> {t("Phone")}</span>
            <input type="text" value={business.phone || ""} onChange={e => setBusiness({ phone: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="+1 234 567 890" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> {t("Email")}</span>
            <input type="text" value={business.email || ""} onChange={e => setBusiness({ email: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="hello@example.com" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> {t("Location (Google Maps Link)")}</span>
            <input type="text" value={business.location || ""} onChange={e => setBusiness({ location: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="http://maps.google.com/..." />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1"><Wifi className="w-3 h-3" /> {t("WiFi Name")}</span>
            <input type="text" value={business.wifiSsid || ""} onChange={e => setBusiness({ wifiSsid: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Guest WiFi" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium">{t("WiFi Password")}</span>
            <input type="text" value={business.wifiPass || ""} onChange={e => setBusiness({ wifiPass: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="SecretPass123" />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {t("Opening Hours")}</span>
          <input type="text" value={business.hours || ""} onChange={e => setBusiness({ hours: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Mon-Fri: 9am - 10pm" />
        </label>
      </div>
    </div>
  );

  const renderDesignTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-1">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Themes")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map(th => (
            <button
              key={th.key}
              onClick={() => setMeta({ theme: th.key })}
              className={`relative p-3 rounded-xl border text-left transition-all hover:-translate-y-1 ${activeTheme === th.key ? "border-[#22D3EE] shadow-md ring-1 ring-[#22D3EE]" : "border-[var(--border)] hover:border-[var(--text)]"}`}
            >
              <div className={`h-12 w-full rounded-lg mb-2 border border-black/10 ${th.color}`} />
              <div className="text-xs font-bold capitalize text-[var(--text)]">{th.label}</div>
              {activeTheme === th.key && <div className="absolute top-2 right-2 bg-[#22D3EE] text-white rounded-full p-0.5"><Check className="w-3 h-3" /></div>}
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
          <span className="text-xs text-[var(--muted)] font-medium">{t("Page Title")}</span>
          <input type="text" value={simpleTitle} onChange={e => setMeta({ simpleTitle: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide border-b border-[var(--border)] pb-2">{t("Settings")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium">{t("Currency")}</span>
            <select value={currency || "€"} onChange={e => setI18n({ currency: e.target.value })} className="w-full p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]">
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

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[#22D3EE] transition">
            <span className="text-sm text-[var(--text)]">{t("Show 'Powered by Tierless'")}</span>
            <input type="checkbox" checked={meta.simpleShowBadge !== false} onChange={e => setMeta({ simpleShowBadge: e.target.checked })} className="accent-[#4F46E5] h-4 w-4" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[#22D3EE] transition">
            <span className="text-sm text-[var(--text)]">{t("Allow Selection (Calculator)")}</span>
            <input type="checkbox" checked={meta.simpleAllowSelection || false} onChange={e => setMeta({ simpleAllowSelection: e.target.checked })} className="accent-[#4F46E5] h-4 w-4" />
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
                  <span aria-hidden className="pointer-events-none absolute inset-0 rounded-lg" style={{ padding: 1.5, background: BRAND_GRADIENT, WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
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
              <button onClick={() => ocrFileRef.current?.click()} disabled={ocrUploading} className="w-full py-8 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center text-[var(--muted)] hover:border-[#4F46E5] hover:text-[#4F46E5] transition bg-[var(--bg)] disabled:opacity-50">
                {ocrUploading ? <div className="animate-spin h-8 w-8 border-4 border-[#4F46E5] border-t-transparent rounded-full mb-2" /> : <ScanLine className="w-8 h-8 mb-2" />}
                <span className="text-sm font-medium">{ocrUploading ? t("Scanning...") : t("Click to upload menu")}</span>
              </button>

              {ocrError && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{ocrError}</div>}

              {ocrItems.length > 0 && (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)]">
                  <div className="p-2 bg-[var(--surface)] border-b border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--muted)]">{ocrItems.length} {t("items found")}</span>
                    <div className="flex gap-2">
                      <button onClick={selectAllOcrItems} className="text-xs text-[#4F46E5] hover:underline font-medium">{t("Select All")}</button>
                      <button onClick={clearOcrSelection} className="text-xs text-[var(--muted)] hover:underline">{t("Clear")}</button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {ocrItems.map(it => (
                      <label key={it.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--card)] cursor-pointer border border-transparent hover:border-[var(--border)] transition">
                        <input type="checkbox" checked={ocrSelectedIds.includes(it.id)} onChange={() => toggleOcrSelection(it.id)} className="accent-[#4F46E5] h-4 w-4" />
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
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={{ padding: 1.5, background: BRAND_GRADIENT, WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", opacity: 0.9 }} />
                <span className="relative z-[1] text-[var(--text)] font-semibold group-hover:text-[#4F46E5] transition-colors">{t("Add Selected")} ({ocrSelectedIds.length})</span>
              </button>
            </div>
            <input ref={ocrFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOcrFileChange} />
          </div>
        </div>
      )}
    </div>
  );
}