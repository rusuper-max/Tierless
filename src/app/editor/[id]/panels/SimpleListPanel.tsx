"use client";

import { useState, useRef, ChangeEvent, useEffect, useMemo } from "react";
import {
  ArrowUp, ArrowDown, Trash2, Image as ImageIcon, Plus, X, ScanLine,
  Palette, Settings, List, MapPin, Phone, Wifi, Clock, Store, Check, Mail, Tag,
  Eye, EyeOff, Ban, MoreHorizontal, Sparkles, ChevronDown, ChevronRight
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

/* ---------------- Configuration ---------------- */

const BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "popular", label: "⭐ Popular" },
  { value: "spicy", label: "🌶️ Spicy" },
  { value: "vegan", label: "🌱 Vegan" },
  { value: "new", label: "🔥 New" },
  { value: "sale", label: "💰 Sale" },
  { value: "chef", label: "👨‍🍳 Chef's" },
  { value: "gf", label: "Gluten Free" },
];

const THEME_OPTIONS: { key: BrandTheme; label: string; color: string; desc: string }[] = [
  { key: "tierless", label: "Tierless", color: "bg-gradient-to-br from-[#4F46E5] to-[#22D3EE]", desc: "Modern generic gradient" },
  { key: "minimal", label: "Minimal", color: "bg-white border border-gray-200", desc: "Clean & airy white" },
  { key: "luxury", label: "Luxury", color: "bg-[#0f0f0f] border border-[#d4af37]", desc: "Dark mode with gold" },
  { key: "elegant", label: "Elegant", color: "bg-[#fdfbf7] border border-[#d4af37]", desc: "Warm cream & serif" },
  { key: "midnight", label: "Midnight", color: "bg-slate-950", desc: "Deep blue night" },
  { key: "cafe", label: "Cafe", color: "bg-[#4a3b32]", desc: "Cozy brown tones" },
  { key: "ocean", label: "Ocean", color: "bg-blue-900", desc: "Fresh calm blues" },
  { key: "forest", label: "Forest", color: "bg-[#064e3b]", desc: "Organic greens" },
  { key: "sunset", label: "Sunset", color: "bg-[#be123c]", desc: "Vibrant reds" },
];

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";
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

  // OCR
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrItems, setOcrItems] = useState<ParsedOcrItem[]>([]);
  const [ocrSelectedIds, setOcrSelectedIds] = useState<string[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement | null>(null);

  // --- Config Getters ---
  const simpleTitle: string = meta.simpleTitle ?? "";
  const currency: string = typeof i18n.currency === "string" ? (i18n.currency as string) : "";
  const decimals: number = Number.isFinite(i18n.decimals) ? (i18n.decimals as number) : 0;
  const activeTheme: BrandTheme = meta.theme || "tierless";

  // --- Brand Score Calculation (Hidden from UI but kept for logic) ---
  const brandScore = useMemo(() => {
    let score = 0;
    if (simpleTitle) score += 10;
    if (simpleLogo) score += 20;
    if (simpleCoverImage) score += 20;
    if (business.description) score += 10;
    if (business.phone || business.email) score += 10;
    if (items.length > 0) score += 20;
    if (simpleSections.length > 0) score += 10;
    return Math.min(score, 100);
  }, [simpleTitle, simpleLogo, simpleCoverImage, business, items.length, simpleSections.length]);

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

  /* ---------------- Components ---------------- */

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`cursor-default flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all relative ${isActive ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
          }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-[#22D3EE]" : ""}`} />
        <span className="relative z-10">{label}</span>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: BRAND_GRADIENT }} />
        )}
      </button>
    );
  };

  /* ---------------- Item Rendering ---------------- */
  const renderItemRow = (it: any) => {
    return (
      <div key={it.id} className={`group relative flex items-stretch gap-0 rounded-lg border bg-[var(--card)] transition-all overflow-hidden ${it.hidden ? "border-dashed border-yellow-300/50 opacity-70" : "border-[var(--border)] hover:border-[#22D3EE] hover:shadow-sm"} ${it.soldOut ? "grayscale opacity-80" : ""}`}>

        {/* Drag Handle */}
        <div className="w-6 flex items-center justify-center bg-[var(--bg)]/50 border-r border-[var(--border)] cursor-grab active:cursor-grabbing text-[var(--muted)] hover:text-[var(--text)]">
          <MoreHorizontal className="w-4 h-4 rotate-90 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Image - Compact */}
        {canUseImages && (
          <div className="w-20 relative border-r border-[var(--border)] bg-[var(--track)] group/img cursor-default" onClick={() => triggerGenericUpload(it.id, "item")}>
            {it.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--muted)] opacity-30 group-hover/img:opacity-100 transition">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition text-white">
              <Plus className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Main Inputs */}
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-2">
          <div className="flex items-start gap-3">
            <input
              type="text"
              className={`flex-1 bg-transparent text-sm font-semibold text-[var(--text)] outline-none placeholder-[var(--muted)]/50 ${it.hidden ? "line-through text-[var(--muted)]" : ""}`}
              value={it.label}
              onChange={e => updateItem(it.id, { label: e.target.value })}
              placeholder={t("Item Name")}
            />
            <div className="flex items-center gap-1 bg-[var(--surface)] px-2 py-1 rounded-md border border-[var(--border)] focus-within:border-[#22D3EE] transition-colors">
              <span className="text-xs text-[var(--muted)]">{currency}</span>
              <input
                type="number"
                className="w-16 bg-transparent text-sm text-right font-medium text-[var(--text)] outline-none placeholder-[var(--muted)]/30"
                value={it.price ?? ""}
                onChange={e => updateItem(it.id, { price: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-transparent text-xs text-[var(--muted)] outline-none focus:text-[var(--text)] transition-colors placeholder-[var(--muted)]/40"
              placeholder={t("Description (ingredients, details)...")}
              value={it.note ?? ""}
              onChange={e => updateItem(it.id, { note: e.target.value })}
            />

            {/* Badge Pill */}
            <div className="relative">
              <select
                value={it.badge || ""}
                onChange={(e) => updateItem(it.id, { badge: e.target.value })}
                className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[10px] h-6 pl-2 pr-6 rounded-full outline-none focus:border-[#22D3EE] cursor-default text-[var(--text)] hover:bg-[var(--bg)] font-medium transition-colors"
              >
                {BADGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Tag className="w-3 h-3 absolute right-2 top-1.5 pointer-events-none text-[var(--muted)]" />
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="flex flex-col border-l border-[var(--border)] bg-[var(--bg)]/30 w-10 divide-y divide-[var(--border)]">
          <button
            onClick={() => updateItem(it.id, { hidden: !it.hidden })}
            className={`cursor-default flex-1 flex items-center justify-center hover:bg-[var(--surface)] transition-colors ${it.hidden ? "text-yellow-600 bg-yellow-50" : "text-[var(--muted)]"}`}
            title={it.hidden ? t("Hidden") : t("Visible")}
            data-help="Toggle item visibility. Hidden items won't show on your public menu but stay in your list for later."
          >
            {it.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => updateItem(it.id, { soldOut: !it.soldOut })}
            className={`cursor-default flex-1 flex items-center justify-center hover:bg-[var(--surface)] transition-colors ${it.soldOut ? "text-red-500 bg-red-50" : "text-[var(--muted)]"}`}
            title={it.soldOut ? t("Sold Out") : t("Available")}
            data-help="Mark items as sold out. They'll show on your menu with a strikethrough so customers know they're unavailable."
          >
            <Ban className="w-4 h-4" />
          </button>
          <button
            onClick={() => removeItem(it.id)}
            className="cursor-default flex-1 flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            data-help="Delete this item permanently from your menu. This can't be undone!"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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

        {/* Hero Card */}
        <div className="relative rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-sm group">
          <div className="h-40 bg-[var(--track)] relative flex items-center justify-center">
            {simpleCoverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={simpleCoverImage} alt="Cover" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-xs font-medium uppercase tracking-wide opacity-60">{t("Cover Image")}</span>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button onClick={() => triggerGenericUpload("cover", "cover")} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition cursor-default" data-help="Upload a cover image for your menu. This appears at the top and grabs attention! Recommended size: 1200x400px.">{t("Upload Cover")}</button>
              {simpleCoverImage && (
                <button onClick={() => setMeta({ simpleCoverImage: "" })} className="p-2 bg-white/20 text-white rounded-full hover:bg-red-500 hover:text-white transition cursor-default"><X className="w-4 h-4" /></button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              {/* Logo */}
              <div className="relative group/logo">
                <div className="w-24 h-24 rounded-2xl bg-[var(--card)] p-1 shadow-lg border border-[var(--border)]">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-[var(--track)] relative flex items-center justify-center">
                    {simpleLogo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={simpleLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-[var(--muted)] opacity-40" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition flex items-center justify-center">
                      <button onClick={() => triggerGenericUpload("logo", "logo")} className="text-[10px] font-bold text-white uppercase tracking-wide cursor-default" data-help="Upload your business logo. This appears prominently on your menu page. Square images work best!">{t("Edit")}</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button onClick={() => addItem(t("New item"), 0)} className="cursor-default flex items-center gap-2 px-4 py-2 bg-[#22D3EE] text-black text-xs font-bold rounded-lg shadow hover:bg-[#22D3EE]/90 transition" data-help="Add a new menu item with a name, price, and description.">
                  <Plus className="w-3.5 h-3.5" /> {t("Add Item")}
                </button>
                <button onClick={handleAddSection} className="cursor-default flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-lg hover:bg-[var(--surface)] transition" data-help="Organize your menu by creating sections like 'Appetizers', 'Main Dishes', or 'Desserts'.">
                  <List className="w-3.5 h-3.5" /> {t("Section")}
                </button>
                <button onClick={() => setOcrOpen(true)} className="cursor-default flex items-center gap-2 px-3 py-2 bg-[var(--card)] border border-[var(--border)] text-[#22D3EE] text-xs font-bold rounded-lg hover:bg-[var(--surface)] transition" title={t("Scan Menu (OCR)")} data-help="Upload a photo of your existing menu and our AI will automatically extract all items with prices!">
                  <ScanLine className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{t("Page Title")}</label>
              <input
                value={simpleTitle}
                onChange={e => setMeta({ simpleTitle: e.target.value })}
                className="w-full text-2xl font-bold bg-transparent outline-none placeholder-[var(--muted)] text-[var(--text)] border-b border-transparent focus:border-[var(--border)] transition-colors"
                placeholder={t("My Awesome Brand")}
                data-help="The main title of your menu page. This is what customers see first - make it catchy!"
              />
            </div>
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-6">
          {/* Unsectioned */}
          {unsectionedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-[var(--border)]"></div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{t("Loose Items")}</div>
                <div className="h-px flex-1 bg-[var(--border)]"></div>
              </div>
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
              <div key={section.id} className="group/section rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                {/* Section Header */}
                <div className="flex items-center gap-3 p-3 bg-[var(--card)]">
                  <button onClick={toggleCollapse} className="cursor-default p-1.5 hover:bg-[var(--surface)] rounded-md text-[var(--muted)] transition-colors">
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Section Image Thumbnail (Mini) */}
                  <div className="relative w-10 h-10 rounded-md bg-[var(--track)] overflow-hidden shrink-0 group/secimg cursor-default" onClick={() => triggerGenericUpload(section.id, "section")}>
                    {section.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={section.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : <ImageIcon className="w-5 h-5 m-auto text-[var(--muted)] opacity-50 relative top-2.5" />}
                    {section.imageUrl && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/secimg:opacity-100 flex items-center justify-center text-white">
                        <X className="w-3 h-3 cursor-default" onClick={(e) => {
                          e.stopPropagation();
                          const next = simpleSections.map(s => s.id === section.id ? { ...s, imageUrl: undefined } : s);
                          setMeta({ simpleSections: next });
                        }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      className="w-full bg-transparent text-base font-bold text-[var(--text)] outline-none placeholder-[var(--muted)]"
                      value={section.label}
                      onChange={(e) => {
                        const next = simpleSections.map(s => s.id === section.id ? { ...s, label: e.target.value } : s);
                        setMeta({ simpleSections: next });
                      }}
                      placeholder={t("Section Name")}
                    />
                    {!collapsed && (
                      <input
                        className="w-full bg-transparent text-xs text-[var(--muted)] outline-none"
                        value={section.description || ""}
                        onChange={(e) => {
                          const next = simpleSections.map(s => s.id === section.id ? { ...s, description: e.target.value } : s);
                          setMeta({ simpleSections: next });
                        }}
                        placeholder={t("Optional description...")}
                      />
                    )}
                  </div>

                  <button onClick={() => {
                    const next = simpleSections.filter(s => s.id !== section.id);
                    setMeta({ simpleSections: next });
                  }} className="cursor-default p-2 text-[var(--muted)] hover:text-red-500 opacity-0 group-hover/section:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>

                {!collapsed && (
                  <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)]/50 space-y-3">
                    {sectionItems.map(renderItemRow)}
                    <button onClick={() => handleAddItemToSection(section.id)} className="cursor-default w-full py-2 border border-dashed border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:border-[#22D3EE] hover:bg-[#22D3EE]/5 transition flex items-center justify-center gap-2 group/add">
                      <Plus className="w-3.5 h-3.5 group-hover/add:rotate-90 transition-transform" /> {t("Add item to")} {section.label}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg)]/50 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#4F46E5] opacity-50" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="text-sm font-bold text-[var(--text)]">{t("Start building your menu")}</h3>
                <p className="text-xs text-[var(--muted)]">{t("Add items manually or use our AI scanner to import from a photo.")}</p>
              </div>
              <button onClick={() => setOcrOpen(true)} className="cursor-default text-xs font-bold text-[#4F46E5] hover:underline">{t("Try AI Scan")}</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBusinessTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <Store className="w-4 h-4 text-[#4F46E5]" /> {t("Business Identity")}
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">{t("About")}</span>
            <textarea
              rows={4}
              value={business.description || ""}
              onChange={e => setBusiness({ description: e.target.value })}
              className="w-full p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE] transition-all resize-none"
              placeholder="Tell your story. e.g. 'Family owned since 1985, serving the best coffee in town...'"
            />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#22D3EE]" /> {t("Contact & Location")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium">{t("Phone Number")}</span>
            <div className="flex items-center px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus-within:border-[#22D3EE] transition-colors">
              <Phone className="w-3.5 h-3.5 text-[var(--muted)] mr-2" />
              <input type="text" value={business.phone || ""} onChange={e => setBusiness({ phone: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" placeholder="+1 234 567 890" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-[var(--muted)] font-medium">{t("Email Address")}</span>
            <div className="flex items-center px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus-within:border-[#22D3EE] transition-colors">
              <Mail className="w-3.5 h-3.5 text-[var(--muted)] mr-2" />
              <input type="text" value={business.email || ""} onChange={e => setBusiness({ email: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" placeholder="hello@example.com" />
            </div>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-xs text-[var(--muted)] font-medium">{t("Google Maps Link")}</span>
            <div className="flex items-center px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus-within:border-[#22D3EE] transition-colors">
              <MapPin className="w-3.5 h-3.5 text-[var(--muted)] mr-2" />
              <input type="text" value={business.location || ""} onChange={e => setBusiness({ location: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" placeholder="https://maps.google.com/..." />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2"><Wifi className="w-4 h-4 text-orange-500" /> {t("Guest WiFi")}</h3>
          <div className="space-y-3">
            <input type="text" value={business.wifiSsid || ""} onChange={e => setBusiness({ wifiSsid: e.target.value })} className="w-full p-2 bg-[var(--bg)] border-b border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Network Name (SSID)" />
            <input type="text" value={business.wifiPass || ""} onChange={e => setBusiness({ wifiPass: e.target.value })} className="w-full p-2 bg-[var(--bg)] border-b border-[var(--border)] text-sm outline-none focus:border-[#22D3EE]" placeholder="Password" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2"><Clock className="w-4 h-4 text-green-500" /> {t("Hours")}</h3>
          <div className="space-y-3">
            <textarea rows={3} value={business.hours || ""} onChange={e => setBusiness({ hours: e.target.value })} className="w-full p-2 bg-[var(--bg)] border border-none text-sm outline-none resize-none" placeholder="Mon-Fri: 9am - 10pm&#10;Sat-Sun: 10am - 11pm" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesignTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-lg font-bold text-[var(--text)]">{t("Choose your vibe")}</h2>
        <p className="text-sm text-[var(--muted)]">{t("Select a theme that matches your brand's personality.")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {THEME_OPTIONS.map(th => {
          const isActive = activeTheme === th.key;
          return (
            <button
              key={th.key}
              onClick={() => setMeta({ theme: th.key })}
              className={`cursor-default relative group p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${isActive
                ? "border-[#22D3EE] shadow-lg scale-[1.02] ring-1 ring-[#22D3EE]"
                : "border-[var(--border)] hover:border-[var(--text)] hover:shadow-md"
                }`}
            >
              <div className={`absolute inset-0 opacity-[0.03] ${th.color}`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-16 h-16 rounded-xl shadow-inner border border-black/5 ${th.color}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--text)] mb-0.5">{th.label}</div>
                  <div className="text-xs text-[var(--muted)]">{th.desc}</div>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-[#22D3EE] flex items-center justify-center text-white shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide">{t("Configuration")}</h3>

        <div className="grid grid-cols-2 gap-6">
          <label className="space-y-2 group cursor-default">
            <span className="text-xs text-[var(--muted)] font-medium group-hover:text-[var(--text)] transition-colors">{t("Currency Symbol")}</span>
            <select value={currency || "€"} onChange={e => setI18n({ currency: e.target.value })} className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE] cursor-default">
              {CURRENCY_PRESETS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-2 group cursor-default">
            <span className="text-xs text-[var(--muted)] font-medium group-hover:text-[var(--text)] transition-colors">{t("Price Decimals")}</span>
            <select value={decimals} onChange={e => setI18n({ decimals: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm outline-none focus:border-[#22D3EE] cursor-default">
              <option value={0}>0 (100)</option>
              <option value={2}>2 (100.00)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide">{t("Advanced Options")}</h3>

        <label className="flex items-center justify-between p-2 rounded-lg cursor-default hover:bg-[var(--bg)] transition-colors">
          <span className="text-sm text-[var(--text)] font-medium">{t("Show 'Powered by Tierless' Badge")}</span>
          <div className="relative inline-flex items-center cursor-default">
            <input type="checkbox" checked={meta.simpleShowBadge !== false} onChange={e => setMeta({ simpleShowBadge: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
          </div>
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg cursor-default hover:bg-[var(--bg)] transition-colors">
          <div className="space-y-0.5">
            <span className="text-sm text-[var(--text)] font-medium block">{t("Allow User Selection")}</span>
            <span className="text-[10px] text-[var(--muted)] block">{t("Lets customers tap items to calculate total.")}</span>
          </div>
          <div className="relative inline-flex items-center cursor-default">
            <input type="checkbox" checked={meta.simpleAllowSelection || false} onChange={e => setMeta({ simpleAllowSelection: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-[var(--bg)]">

      {/* Brand Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 pt-4 pb-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)] leading-tight">{t("Brand Editor")}</h1>
              <p className="text-[10px] text-[var(--muted)]">{t("Customize your menu presence")}</p>
            </div>
          </div>

          {/* Setup Score Widget (HIDDEN per user request, can be re-enabled by removing hidden class) */}
          {/* <div className="flex flex-col items-end w-32">
               <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase">{t("Setup Score")}</span>
                  <span className="text-[10px] font-bold text-[#4F46E5]">{brandScore}%</span>
               </div>
               <ProgressBar value={brandScore} />
            </div>
            */}
        </div>

        {/* Navigation */}
        <div className="flex border-b border-transparent">
          {(["content", "business", "design", "settings"] as const).map(tKey => (
            <TabButton
              key={tKey}
              id={tKey}
              label={t(tKey.charAt(0).toUpperCase() + tKey.slice(1))}
              icon={
                tKey === "content" ? List :
                  tKey === "business" ? Store :
                    tKey === "design" ? Sparkles : Settings
              }
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pb-20">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)]">{t("AI Menu Scan")}</h3>
                <p className="text-sm text-[var(--muted)]">{t("Upload a photo to auto-magically extract items.")}</p>
              </div>
              <button onClick={() => { setOcrOpen(false); setOcrItems([]); setOcrSelectedIds([]); setOcrError(null); }} className="p-2 rounded-full hover:bg-[var(--bg)] text-[var(--text)]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <button onClick={() => ocrFileRef.current?.click()} disabled={ocrUploading} className="w-full h-40 border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-[var(--muted)] hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#4F46E5]/5 transition disabled:opacity-50 group cursor-default">
                {ocrUploading ? <div className="animate-spin h-8 w-8 border-4 border-[#4F46E5] border-t-transparent rounded-full mb-2" /> : <ScanLine className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />}
                <span className="text-sm font-bold">{ocrUploading ? t("Analyzing Menu...") : t("Click to Upload Photo")}</span>
              </button>

              {ocrError && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-xl font-medium text-center">{ocrError}</div>}

              {ocrItems.length > 0 && (
                <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg)]/50">
                  <div className="p-3 bg-[var(--surface)] border-b border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text)]">{ocrItems.length} {t("items detected")}</span>
                    <div className="flex gap-3">
                      <button onClick={selectAllOcrItems} className="text-xs text-[#4F46E5] hover:underline font-bold cursor-default">{t("Select All")}</button>
                      <button onClick={clearOcrSelection} className="text-xs text-[var(--muted)] hover:underline cursor-default">{t("Clear")}</button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {ocrItems.map(it => (
                      <label key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--card)] cursor-default border border-transparent hover:border-[var(--border)] transition group">
                        <input type="checkbox" checked={ocrSelectedIds.includes(it.id)} onChange={() => toggleOcrSelection(it.id)} className="accent-[#4F46E5] h-4 w-4 rounded-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[var(--text)] truncate">{it.label}</div>
                          {it.sectionName && <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide group-hover:text-[#4F46E5] transition-colors">{it.sectionName}</div>}
                        </div>
                        {it.price && <div className="text-sm font-bold text-[var(--text)] bg-[var(--surface)] px-2 py-0.5 rounded-md">{it.price}</div>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setOcrOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition cursor-default">{t("Cancel")}</button>
              <button onClick={handleApplyOcrToList} disabled={ocrSelectedIds.length === 0} className="relative inline-flex items-center justify-center rounded-xl border border-transparent px-6 py-2.5 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all duration-200 cursor-default group disabled:opacity-50 disabled:shadow-none bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] text-white hover:scale-105 active:scale-95">
                {t("Import Items")} ({ocrSelectedIds.length})
              </button>
            </div>
            <input ref={ocrFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOcrFileChange} />
          </div>
        </div>
      )}
    </div>
  );
}