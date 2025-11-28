"use client";

import React, { useState, useRef, ChangeEvent, useEffect, useMemo } from "react";
import { Search, MapPin, Clock, Plus, Minus, ShoppingBag, Wifi, Phone, Mail, ChevronUp, ChevronDown, X, Image as ImageIcon, Trash2, Eye, EyeOff, GripVertical, MoreHorizontal, Ban, Lock, ScanLine, List, Sparkles, ChevronRight, Tag, Store, Check, Palette, Settings, AlertTriangle, LayoutList, ScrollText, Share2, Globe, Percent, MessageCircle } from "lucide-react";
import { t } from "@/i18n";
import { useEditorStore, type SimpleSection, type BrandTheme } from "@/hooks/useEditorStore";
import { useAccount } from "@/hooks/useAccount";
import { ENTITLEMENTS, canFeature, getLimit } from "@/lib/entitlements";
import { useEntitlement } from "@/hooks/useEntitlement";
// --- FIX 1: Import pointerWithin for smoother drag ---
import { DndContext, pointerWithin, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/Button";

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
  { key: "rosegold", label: "Rose Gold", color: "bg-gradient-to-br from-[#e0a899] to-[#d4af37]", desc: "Soft pink & gold" },
  { key: "emerald", label: "Emerald", color: "bg-gradient-to-br from-[#10b981] to-[#d4af37]", desc: "Deep green & gold" },
  { key: "sapphire", label: "Sapphire", color: "bg-gradient-to-br from-[#3b82f6] to-[#e5e7eb]", desc: "Royal blue & silver" },
  { key: "obsidian", label: "Obsidian", color: "bg-black border border-white", desc: "Pure black & white" },
  { key: "goldluxury", label: "Gold Luxury", color: "bg-gradient-to-br from-[#0a0a0a] to-[#d4af37]", desc: "Premium gold & black" },
];

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";
const CURRENCY_PRESETS = ["€", "$", "£", "CHF", "CAD", "AUD", "RSD", "BAM", "PLN"];

const createId = () => `sec_${Math.random().toString(36).slice(2, 10)}`;

/* ====================================================================== */

export default function SimpleListPanel() {
  const { calc, updateCalc, addItem, updateItem, removeItem, moveItem, setMeta } = useEditorStore();
  const { plan } = useAccount();
  const { openUpsell } = useEntitlement({ feature: "ocrImport" });

  // --- Feature Gates & Limits ---
  const { allowed: ocrAllowed } = canFeature("ocrImport", plan);
  const { allowed: removeBadgeAllowed } = canFeature("removeBadge", plan);
  const { allowed: premiumThemesAllowed } = canFeature("premiumThemes", plan);

  const itemLimit = getLimit(plan, "items");
  const maxItems = itemLimit === "unlimited" ? Infinity : itemLimit;

  const handleOcrClick = () => {
    if (!ocrAllowed) {
      openUpsell({ feature: "ocrImport" });
      return;
    }
    setOcrOpen(true);
  };

  const items = (calc?.items ?? []) as any[];
  const meta = (calc?.meta || {}) as any;
  const i18n = (calc?.i18n || {}) as any;
  const business = meta.business || {};

  const simpleSections: SimpleSection[] = meta.simpleSections ?? [];
  const sectionStates: Record<string, boolean> = (meta.simpleSectionStates as Record<string, boolean>) ?? {};

  // Count visible items
  const visibleItemsCount = items.filter((item: any) => !item.hidden).length;

  const simpleCoverImage: string = business.coverUrl || meta.simpleCoverImage || "";
  const simpleLogo: string = business.logoUrl || "";

  const canUseImages = plan === "growth" || plan === "pro" || plan === "tierless" || plan === "starter";

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<SimpleSection | null>(null);

  // OCR State
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrItems, setOcrItems] = useState<ParsedOcrItem[]>([]);
  const [ocrSelectedIds, setOcrSelectedIds] = useState<string[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // --- Config Getters ---
  const simpleTitle: string = meta.simpleTitle ?? "";
  const currency: string = typeof i18n.currency === "string" ? (i18n.currency as string) : "";
  const decimals: number = Number.isFinite(i18n.decimals) ? (i18n.decimals as number) : 0;
  const activeTheme: BrandTheme = meta.theme || "tierless";

  /* ---------------- Helpers ---------------- */

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

  const handleConfirmDeleteSection = () => {
    if (!sectionToDelete) return;
    updateCalc((draft) => {
      const m = draft.meta as any;
      m.simpleSections = (m.simpleSections || []).filter((s: any) => s.id !== sectionToDelete.id);
      if (Array.isArray(draft.items)) {
        draft.items = draft.items.filter((it: any) => it.simpleSectionId !== sectionToDelete.id);
      }
    });
    setSectionToDelete(null);
  };

  const handleGenericUpload = async (e: ChangeEvent<HTMLInputElement>, targetId: string, type: 'item' | 'section' | 'cover' | 'logo') => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) { setError(t("Only image files are allowed.")); return; }

    // Client-side size check (optional, but good UX)
    // Cloudinary free tier has limits, but they are higher than Vercel's 4.5MB
    const maxBytes = (ENTITLEMENTS[plan]?.limits as any)?.uploadSize || 10 * 1024 * 1024; // Increased limit for direct upload
    if (file.size > maxBytes) {
      const limitMB = Math.round(maxBytes / 1024 / 1024);
      setError(t(`Image is too large (max ${limitMB}MB for your plan). Upgrade for more.`));
      return;
    }

    try {
      setUploadingId(targetId);

      // 1. Get Signature from Backend
      const signRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "sign" })
      });

      if (!signRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const signData = await signRes.json();
      if (signData.error) throw new Error(signData.error);

      const { signature, timestamp, folder, apiKey, cloudName } = signData;

      // 2. Direct Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("signature", signature);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadRes = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error("Cloudinary Direct Upload Failed:", errText);
        throw new Error("Upload failed");
      }

      const data = await uploadRes.json();
      const url = data.secure_url || data.url;
      const publicId = data.public_id;

      // Helper to destroy old image
      const destroyOldImage = async (oldPublicId?: string) => {
        if (!oldPublicId) return;
        try {
          await fetch("/api/cloudinary/destroy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: oldPublicId })
          });
        } catch (e) {
          console.error("Failed to destroy old image:", e);
        }
      };

      // 3. Update State
      if (type === "item") {
        const oldItem = items.find(it => it.id === targetId);
        if (oldItem?.imagePublicId) destroyOldImage(oldItem.imagePublicId);
        updateItem(targetId, { imageUrl: url, imagePublicId: publicId });
      } else if (type === "cover") {
        if (business.coverPublicId) destroyOldImage(business.coverPublicId);
        setBusiness({ coverUrl: url, coverPublicId: publicId });
        setMeta({ simpleCoverImage: url });
      } else if (type === "logo") {
        if (business.logoPublicId) destroyOldImage(business.logoPublicId);
        setBusiness({ logoUrl: url, logoPublicId: publicId });
      } else if (type === "section") {
        updateCalc((draft) => {
          const m = draft.meta as any;
          const secs: SimpleSection[] = m.simpleSections || [];
          const oldSec = secs.find(s => s.id === targetId);
          if (oldSec?.imagePublicId) destroyOldImage(oldSec.imagePublicId);

          const next = secs.map(s => s.id === targetId ? { ...s, imageUrl: url, imagePublicId: publicId } : s);
          m.simpleSections = next;
        });
      }
    } catch (err) {
      console.error(err);
      setError(t("Upload failed. Please try again."));
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
    const selected = ocrItems.filter(it => ocrSelectedIds.includes(it.id));

    if (items.length + selected.length > maxItems) {
      openUpsell({ needs: { items: items.length + selected.length }, requiredPlan: "starter" });
      return;
    }

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

  // --- FIX 2: Better Drag Sensors & Collision ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Must move 5px to start drag (prevents accidental clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      moveItem(oldIndex, newIndex);
      const activeItem = items[oldIndex];
      const overItem = items[newIndex];
      if (activeItem.simpleSectionId !== overItem.simpleSectionId) {
        updateItem(activeItem.id, { simpleSectionId: overItem.simpleSectionId });
      }
    }
  };

  /* ---------------- Buffered Input (Fixes Focus Loss) ---------------- */
  const BufferedInput = ({ value, onCommit, className, placeholder, disabled, type = "text", ...props }: any) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    return (
      <input
        {...props}
        type={type}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) {
            onCommit(localValue);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (localValue !== value) {
              onCommit(localValue);
            }
            e.currentTarget.blur();
          }
        }}
      />
    );
  };

  /* ---------------- Sortable Item Row (EXTRACTED FOR PERFORMANCE) ---------------- */
  const SortableItemRow = React.memo(({
    item,
    index,
    maxItems,
    currency,
    uploadingId,
    updateItem,
    removeItem,
    triggerGenericUpload,
    openUpsell,
    t,
    canUseImages
  }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : "auto",
      opacity: isDragging ? 0.5 : 1,
    };

    const isOverLimit = index >= maxItems;
    const isHidden = item.hidden;
    const isSoldOut = item.soldOut;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex items-stretch gap-0 rounded-xl border bg-[var(--card)] transition-all overflow-hidden ${isHidden ? "border-dashed border-yellow-300/50 opacity-70" : "border-[var(--border)] hover:border-[#22D3EE] hover:shadow-sm"} ${isSoldOut ? "grayscale opacity-80" : ""} ${isOverLimit ? "opacity-50 grayscale" : ""}`}
      >
        {/* Drag Handle */}
        <div
          className="w-6 flex items-center justify-center bg-[var(--bg)]/50 border-r border-[var(--border)] cursor-grab active:cursor-grabbing text-[var(--muted)] hover:text-[var(--text)] outline-none"
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Image */}
        {canUseImages && (
          <div
            className="w-24 relative border-r border-[var(--border)] bg-[var(--track)] group/img cursor-default shrink-0"
            onClick={() => !isOverLimit && triggerGenericUpload(item.id, "item")}
            data-help="Click to upload an image for this item."
          >
            {item.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                <ImageIcon className="w-6 h-6 text-[var(--muted)] opacity-50 transition-opacity group-hover/img:opacity-0" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/5">
                  <Plus className="w-5 h-5 text-[var(--text)]" />
                </div>
              </div>
            )}

            {!isOverLimit && (
              <>
                {uploadingId === item.id ? (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#22D3EE', borderRightColor: '#6366f1' }} />
                  </div>
                ) : item.imageUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white">
                    <X className="w-4 h-4 cursor-default" onClick={(e) => {
                      e.stopPropagation();
                      updateItem(item.id, { imageUrl: undefined });
                    }} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-between p-3 gap-2 min-w-0">
          {/* Top Row */}
          <div className="flex gap-2 items-start">
            <BufferedInput
              className="flex-1 bg-transparent font-bold text-[var(--text)] outline-none placeholder-[var(--muted)] text-sm"
              value={item.label || ""}
              onCommit={(val: string) => updateItem(item.id, { label: val })}
              placeholder={t("Item Name")}
              disabled={isOverLimit}
              data-help="Enter the name of your item."
            />
            <div className="flex items-center gap-1 bg-[var(--bg)] rounded-lg px-2 border border-[var(--border)] focus-within:border-[#22D3EE] transition-colors shrink-0 h-8">
              <span className="text-xs text-[var(--muted)] font-bold">{currency}</span>
              <BufferedInput
                type="number"
                className="w-16 bg-transparent text-right font-bold text-[var(--text)] outline-none text-sm py-1"
                value={item.price ?? ""}
                onCommit={(val: string) => updateItem(item.id, { price: parseFloat(val) })}
                placeholder="0.00"
                disabled={isOverLimit}
                data-help="Set the price for this item."
              />
            </div>

            {/* Unit Selector */}
            <div className="relative shrink-0" data-help="Select unit of measure for pricing">
              <select
                value={item.unit || "pcs"}
                onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-xs h-8 pl-2 pr-6 rounded-lg outline-none focus:border-[#22D3EE] cursor-pointer text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
                disabled={isOverLimit}
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="custom">custom</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-2.5 pointer-events-none text-[var(--muted)]" />
            </div>

            {/* Custom Unit Input (conditionally shown) */}
            {item.unit === "custom" && (
              <BufferedInput
                className="w-16 bg-[var(--surface)] border border-[var(--border)] text-xs h-8 px-2 rounded-lg outline-none focus:border-[#22D3EE] text-[var(--text)] transition-colors"
                value={item.customUnit || ""}
                onCommit={(val: string) => updateItem(item.id, { customUnit: val })}
                placeholder="unit"
                disabled={isOverLimit}
                data-help="Enter custom unit name"
              />
            )}
          </div>

          {/* Bottom Row */}
          <div className="flex items-center gap-2 mt-auto">
            <BufferedInput
              className="flex-1 bg-transparent text-xs text-[var(--muted)] outline-none focus:text-[var(--text)] transition-colors placeholder-[var(--muted)]/40"
              value={item.note || ""}
              onCommit={(val: string) => updateItem(item.id, { note: val })}
              placeholder={t("Description (ingredients, details)...")}
              disabled={isOverLimit}
              data-help="Add a short description or list ingredients."
            />

            <div className="relative shrink-0" data-help="Add a badge like 'Spicy' or 'Vegan' to this item.">
              <select
                value={item.badge || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateItem(item.id, {
                    badge: val,
                    discountPercent: val === 'sale' ? (item.discountPercent ?? 10) : undefined
                  });
                }}
                className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[10px] h-6 pl-2 pr-6 rounded-full outline-none focus:border-[#22D3EE] cursor-pointer text-[var(--text)] hover:bg-[var(--bg)] font-medium transition-colors"
                disabled={isOverLimit}
              >
                {BADGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Tag className="w-3 h-3 absolute right-2 top-1.5 pointer-events-none text-[var(--muted)]" />
            </div>
          </div>

          {/* Sale Discount Panel */}
          {/* Sale Discount Panel - kept in DOM to preserve focus */}
          <div className={`mt-2 p-3 bg-[var(--surface)] rounded-xl border border-[#22D3EE]/30 flex items-center gap-4 animate-in slide-in-from-top-1 ${item.badge === 'sale' ? '' : 'hidden'}`}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#22D3EE]/10 text-[#22D3EE] rounded-lg">
                <Percent className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wide">{t("Discount")}</span>
                <div className="flex items-center gap-1">
                  <BufferedInput
                    type="number"
                    min="0"
                    max="95"
                    value={item.discountPercent ?? 0}
                    onCommit={(val: string) => {
                      let num = parseInt(val) || 0;
                      if (num < 0) num = 0;
                      if (num > 95) num = 95;
                      updateItem(item.id, { discountPercent: num });
                    }}
                    className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-1.5 py-0.5 text-sm font-bold text-[var(--text)] outline-none focus:border-[#22D3EE] text-center"
                  />
                  <span className="text-sm font-bold text-[var(--text)]">%</span>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-[var(--border)]"></div>

            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wide">{t("New Price")}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-[var(--muted)] line-through decoration-red-500/50">
                    {item.price?.toFixed(2)}
                  </span>
                  <span className="text-sm font-bold text-[#22D3EE]">
                    {(item.price * (1 - (item.discountPercent || 0) / 100)).toFixed(2)} {currency}
                  </span>
                </div>
              </div>
              <button
                onClick={() => updateItem(item.id, { discountPercent: 0 })}
                className="text-[10px] font-bold text-[var(--muted)] hover:text-[var(--text)] hover:underline"
              >
                {t("Reset")}
              </button>
            </div>
          </div>
        </div>

        {/* Actions Sidebar - FIX: Better colors & Tooltip structure */}
        <div className="flex flex-col border-l border-[var(--border)] bg-[var(--bg)]/30 w-10 divide-y divide-[var(--border)] relative z-20">
          {/* Visibility Toggle - Green if visible, Gray if hidden */}
          <button
            onClick={() => updateItem(item.id, { hidden: !item.hidden })}
            className={`p-2 flex items-center justify-center transition-colors ${!isHidden
              ? 'text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10'
              : 'text-[var(--muted)] hover:text-emerald-500 hover:bg-emerald-500/5'
              }`}
            title={isHidden ? t("Hidden") : t("Visible")}
            data-help="Toggle item visibility. Green means visible on public page."
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Sold Out Toggle - Orange when Active or Hover */}
          <button
            onClick={() => updateItem(item.id, { soldOut: !item.soldOut })}
            disabled={isOverLimit}
            className={`p-2 flex items-center justify-center transition-colors ${isSoldOut
              ? 'text-orange-500 bg-orange-500/10'
              : 'text-[var(--muted)] hover:text-orange-500 hover:bg-orange-500/10'
              } ${isOverLimit ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={isSoldOut ? t("Sold Out") : t("Available")}
            data-help="Mark as Sold Out."
          >
            <Ban className="w-4 h-4" />
          </button>

          {/* Delete - Red on Hover */}
          <button
            onClick={() => removeItem(item.id)}
            className="p-2 flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title={t("Delete Item")}
            data-help="Delete this item permanently."
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOverLimit && (
          <div className="absolute inset-0 bg-[var(--bg)]/10 z-10 cursor-not-allowed" title={t("This item is hidden because it exceeds your plan limits.")} />
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function - samo re-renderuj ako se promenio ovaj item
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.label === nextProps.item.label &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.note === nextProps.item.note &&
      prevProps.item.imageUrl === nextProps.item.imageUrl &&
      prevProps.item.hidden === nextProps.item.hidden &&
      prevProps.item.soldOut === nextProps.item.soldOut &&
      prevProps.item.unit === nextProps.item.unit &&
      prevProps.item.customUnit === nextProps.item.customUnit &&
      prevProps.item.badge === nextProps.item.badge &&
      prevProps.item.discountPercent === nextProps.item.discountPercent &&
      prevProps.item.imagePublicId === nextProps.item.imagePublicId &&
      prevProps.index === nextProps.index &&
      prevProps.uploadingId === nextProps.uploadingId &&
      prevProps.currency === nextProps.currency &&
      prevProps.maxItems === nextProps.maxItems
    );
  });

  SortableItemRow.displayName = 'SortableItemRow';

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

  /* ---------------- TABS ---------------- */

  const renderContentTab = () => {
    const filterItem = (item: any) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const label = (item.label || "").toLowerCase();
      const price = (item.price || "").toString();
      return label.includes(query) || price.includes(query);
    };

    // 1. Valid Section IDs
    const validSectionIds = new Set(simpleSections.map(s => s.id));

    // 2. Unsectioned Items
    const unsectionedItems = items.filter((it) =>
      (!it.simpleSectionId || !validSectionIds.has(it.simpleSectionId)) &&
      filterItem(it)
    );

    const itemsBySection = new Map<string, any[]>();
    items.forEach((it) => {
      const sid = it.simpleSectionId as string | undefined;
      if (!sid || !validSectionIds.has(sid) || !filterItem(it)) return;

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
      if (items.length >= maxItems) {
        openUpsell({ needs: { items: items.length + 1 }, requiredPlan: "starter" });
        return;
      }
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
              {uploadingId === "cover" ? (
                <div className="w-8 h-8 rounded-full border-3 border-transparent animate-spin" style={{ borderTopColor: '#22D3EE', borderRightColor: '#6366f1', borderWidth: '3px' }} />
              ) : (
                <>
                  <button onClick={() => triggerGenericUpload("cover", "cover")} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition cursor-default" data-help="Upload a cover image for your page. This appears at the top and grabs attention! Recommended size: 1200x400px.">{t("Upload Cover")}</button>
                  {simpleCoverImage && (
                    <button
                      onClick={() => {
                        if (confirm(t("This will remove your cover image. Do you want to continue?"))) {
                          setMeta({ simpleCoverImage: "" });
                          setBusiness({ coverUrl: "" });
                        }
                      }}
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-red-500 hover:text-white transition cursor-default"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              {/* Logo */}
              <div className="relative group/logo cursor-pointer" onClick={() => triggerGenericUpload("logo", "logo")}>
                <div className="w-24 h-24 rounded-2xl bg-[var(--card)] p-1 shadow-lg border border-[var(--border)] transition-transform group-hover/logo:scale-105 duration-300">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-[var(--track)] relative flex items-center justify-center">
                    {simpleLogo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={simpleLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <Store className="w-8 h-8 text-[var(--muted)] opacity-40 transition-opacity group-hover/logo:opacity-0" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                          <Plus className="w-8 h-8 text-[var(--text)]" />
                        </div>
                      </div>
                    )}

                    {/* Overlay for Edit/Loading */}
                    {(simpleLogo || uploadingId === "logo") && (
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${uploadingId === "logo" ? "opacity-100" : "opacity-0 group-hover/logo:opacity-100"}`}>
                        {uploadingId === "logo" ? (
                          <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#22D3EE', borderRightColor: '#6366f1' }} />
                        ) : (
                          <span className="text-[10px] font-bold text-white uppercase tracking-wide">{t("Edit")}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                {/* Premium Usage Badge */}
                <div className={`h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${visibleItemsCount >= maxItems
                  ? "bg-red-500/5 text-red-500 border-red-500/20"
                  : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"
                  }`}>
                  <span className={visibleItemsCount >= maxItems ? "text-red-500" : "text-[#22D3EE]"}>{visibleItemsCount}</span>
                  <span className="text-[var(--muted)]">/</span>
                  <span className="text-[var(--muted)]">{itemLimit === "unlimited" ? "∞" : maxItems}</span>
                </div>

                {/* Add Item Button */}
                <button
                  onClick={() => {
                    if (items.length >= maxItems) {
                      openUpsell({ needs: { items: items.length + 1 }, requiredPlan: "starter" });
                      return;
                    }
                    addItem(t("New item"), 0);
                  }}
                  className={`h-9 cursor-default flex items-center gap-2 px-4 text-xs font-bold rounded-lg shadow-sm transition-all shrink-0 ${items.length >= maxItems
                    ? "bg-[var(--surface)] text-[var(--muted)] opacity-50 cursor-not-allowed"
                    : "bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90 hover:shadow-md"
                    }`}
                  data-help="Add a new item (product, service, or plan) with a name and price."
                >
                  <Plus className="w-3.5 h-3.5" /> {t("Add Item")}
                </button>

                {/* Add Section Button */}
                <button
                  onClick={handleAddSection}
                  className="h-9 cursor-default flex items-center gap-2 px-4 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted)] text-xs font-bold hover:text-[var(--text)] hover:border-[#22D3EE] hover:bg-[#22D3EE]/5 transition shrink-0"
                  data-help="Organize your items by creating sections."
                >
                  <List className="w-3.5 h-3.5" /> {t("Section")}
                </button>

                {/* Scan Button */}
                <button
                  onClick={handleOcrClick}
                  className="h-9 w-9 cursor-default flex items-center justify-center rounded-lg border border-[var(--border)] text-[#22D3EE] hover:bg-[var(--surface)] transition shrink-0 ml-auto"
                  title={t("Scan Document / Menu")}
                  data-help="Upload a photo of your existing menu and our AI will automatically extract all items!"
                >
                  {!ocrAllowed ? <Lock className="w-3.5 h-3.5 opacity-70" /> : <ScanLine className="w-3.5 h-3.5" />}
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

        {/* Search Bar */}
        {items.length > 5 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search items...")}
              className="w-full h-10 pl-10 pr-4 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none focus:border-[#22D3EE] transition-colors placeholder-[var(--muted)]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Lists */}
        <div className="space-y-6">
          {/* --- FIX 3: Use pointerWithin for collision (Snappier Drag) --- */}
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
            {/* Unsectioned Items */}
            {unsectionedItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-[var(--border)]"></div>
                  <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{t("Items")}</span>
                  <div className="h-px flex-1 bg-[var(--border)]"></div>
                </div>
                <SortableContext items={unsectionedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid gap-3">
                    {unsectionedItems.map((it, i) => (
                      <SortableItemRow
                        key={it.id}
                        item={it}
                        index={i}
                        maxItems={maxItems}
                        currency={currency}
                        uploadingId={uploadingId}
                        updateItem={updateItem}
                        removeItem={removeItem}
                        triggerGenericUpload={triggerGenericUpload}
                        openUpsell={openUpsell}
                        t={t}
                        canUseImages={canUseImages}
                      />
                    ))}
                  </div>
                </SortableContext>
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
                    <button onClick={toggleCollapse} className="cursor-default p-1.5 hover:bg-[var(--surface)] rounded-md text-[var(--muted)] transition-colors" data-help="Collapse or expand this section to organize your view. Items inside won't be affected.">
                      {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Section Image Thumbnail (Mini) */}
                    <div className="relative w-10 h-10 rounded-md bg-[var(--track)] overflow-hidden shrink-0 group/secimg cursor-default" onClick={() => triggerGenericUpload(section.id, "section")}>
                      {section.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={section.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : <ImageIcon className="w-5 h-5 m-auto text-[var(--muted)] opacity-50 relative top-2.5" />}
                      {uploadingId === section.id ? (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#22D3EE', borderRightColor: '#6366f1' }} />
                        </div>
                      ) : section.imageUrl && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/secimg:opacity-100 flex items-center justify-center text-white">
                          <X className="w-3 h-3 cursor-default" onClick={(e) => {
                            e.stopPropagation();
                            const next = simpleSections.map(s => s.id === section.id ? { ...s, imageUrl: undefined } : s);
                            setMeta({ simpleSections: next });
                          }} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full bg-transparent text-base font-bold text-[var(--text)] outline-none placeholder-[var(--muted)]"
                        value={section.label}
                        onChange={(e) => {
                          const next = simpleSections.map(s => s.id === section.id ? { ...s, label: e.target.value } : s);
                          setMeta({ simpleSections: next });
                        }}
                        placeholder={t("Section Name")}
                      />
                      <div className="text-xs text-[var(--muted)]">{sectionItems.length} {t("items")}</div>

                      {/* Video URL Input (Pro Only) */}
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          className={`flex-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[#22D3EE] transition-colors placeholder-[var(--muted)] ${plan !== 'pro' ? 'opacity-50' : ''}`}
                          value={(section as any).videoUrl || ''}
                          onChange={(e) => {
                            if (plan !== 'pro') {
                              openUpsell({ requiredPlan: 'pro' });
                              return;
                            }
                            const next = simpleSections.map(s => s.id === section.id ? { ...s, videoUrl: e.target.value } as any : s);
                            setMeta({ simpleSections: next });
                          }}
                          placeholder={t("Video URL (Pro)")}
                          disabled={plan !== 'pro'}
                        />
                        {plan !== 'pro' && (
                          <Lock className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </div>
                    </div>

                    <button onClick={() => setSectionToDelete(section)} className="p-2 text-[var(--muted)] hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Section Items */}
                  {!collapsed && (
                    <div className="p-3 border-t border-[var(--border)] space-y-3">
                      <SortableContext items={sectionItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="grid gap-3">
                          {sectionItems.map((it, i) => (
                            <SortableItemRow
                              key={it.id}
                              item={it}
                              index={i}
                              maxItems={maxItems}
                              currency={currency}
                              uploadingId={uploadingId}
                              updateItem={updateItem}
                              removeItem={removeItem}
                              triggerGenericUpload={triggerGenericUpload}
                              openUpsell={openUpsell}
                              t={t}
                              canUseImages={canUseImages}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      <button
                        onClick={() => handleAddItemToSection(section.id)}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-[var(--muted)] border border-dashed border-[var(--border)] rounded-lg hover:border-[#22D3EE] hover:text-[#22D3EE] hover:bg-[#22D3EE]/5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> {t("Add Item to Section")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </DndContext>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg)]/50 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#4F46E5] opacity-50" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="text-sm font-bold text-[var(--text)]">{t("Start building your menu")}</h3>
                <p className="text-xs text-[var(--muted)]">{t("Add items manually or use our AI scanner to import from a photo.")}</p>
              </div>
              <button onClick={handleOcrClick} className="cursor-default text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 mx-auto">
                {t("Try AI Scan")} {!ocrAllowed && <Lock className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Render other tabs (business, design, settings) ---
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
              placeholder="Tell your story. e.g. 'Family owned since 1985...'"
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
              <input type="text" value={business.location || ""} onChange={e => setBusiness({ location: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" placeholder="http://googleusercontent.com/maps..." />
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
            <textarea rows={3} value={business.hours || ""} onChange={e => setBusiness({ hours: e.target.value })} className="w-full p-2 bg-[var(--bg)] border border-none text-sm outline-none resize-none" placeholder="Mon-Fri: 9am - 10pm..." />
          </div>
        </div>
      </div>

      {/* Social Networks */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <Share2 className="w-4 h-4 text-pink-500" /> {t("Social Networks")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...', icon: <div className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500" /> },
            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...', icon: <div className="w-3.5 h-3.5 rounded bg-blue-600" /> },
            { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...', icon: <div className="w-3.5 h-3.5 rounded bg-black border border-white/20" /> },
            { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...', icon: <div className="w-3.5 h-3.5 rounded bg-red-600" /> },
            { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/...', icon: <MessageCircle className="w-3.5 h-3.5 text-green-500" /> },
            { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...', icon: <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> },
            { key: 'website', label: 'Website', placeholder: 'https://...', icon: <Globe className="w-3.5 h-3.5 text-[var(--muted)]" /> },
          ].map((soc) => (
            <div key={soc.key} className="space-y-1.5">
              <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1.5">
                {soc.icon} {soc.label}
              </span>
              <div className="flex items-center px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus-within:border-[#22D3EE] transition-colors">
                <input
                  type="text"
                  value={(business.social as any)?.[soc.key] || ""}
                  onChange={e => {
                    const nextSocial = { ...(business.social || {}), [soc.key]: e.target.value };
                    setBusiness({ social: nextSocial });
                  }}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-[var(--muted)]/50"
                  placeholder={soc.placeholder}
                />
              </div>
            </div>
          ))}
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
          const isPremium = ["luxury", "midnight", "elegant", "rosegold", "emerald", "sapphire", "obsidian", "goldluxury"].includes(th.key);
          const locked = isPremium && !premiumThemesAllowed;
          return (
            <button
              key={th.key}
              onClick={() => {
                if (locked) {
                  openUpsell({ feature: "premiumThemes" });
                  return;
                }
                setMeta({ theme: th.key });
              }}
              className={`cursor-default relative group p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${isActive
                ? "border-[#22D3EE] shadow-lg scale-[1.02] ring-1 ring-[#22D3EE]"
                : "border-[var(--border)] hover:border-[var(--text)] hover:shadow-md"
                } ${locked ? "opacity-75 grayscale-[0.5]" : ""}`}
            >
              <div className={`absolute inset-0 opacity-[0.03] ${th.color}`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-16 h-16 rounded-xl shadow-inner border border-black/5 ${th.color} flex items-center justify-center`}>
                  {locked && <Lock className="w-6 h-6 text-white/50" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-[var(--text)] mb-0.5">{th.label}</div>
                    {isPremium && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">PRO</span>}
                  </div>
                  <div className="text-xs text-[var(--muted)]">{th.desc}</div>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-[#22D3EE] flex items-center justify-center text-white shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                {locked && !isActive && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[var(--muted)]">
                    <Lock className="w-3 h-3" />
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

        {/* Layout Mode Setting */}
        <div className="space-y-3 pt-2">
          <div className="space-y-0.5">
            <span className="text-sm text-[var(--text)] font-medium block">{t("Layout Mode")}</span>
            <span className="text-[10px] text-[var(--muted)] block">{t("Choose structure based on your content size")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SCROLL OPTION */}
            <button
              onClick={() => setMeta({ layoutMode: 'scroll' })}
              className={`cursor-default relative group p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 ${(!meta.layoutMode || meta.layoutMode === 'scroll')
                ? "border-[#22D3EE] bg-[var(--surface)] ring-1 ring-[#22D3EE]"
                : "border-[var(--border)] hover:border-[var(--text)] bg-[var(--bg)]"
                }`}
            >
              <div className={`p-2 rounded-lg ${(!meta.layoutMode || meta.layoutMode === 'scroll') ? "bg-[#22D3EE]/10 text-[#22D3EE]" : "bg-[var(--track)] text-[var(--muted)]"}`}>
                <ScrollText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text)]">Scroll (Default)</span>
                  {(!meta.layoutMode || meta.layoutMode === 'scroll') && <div className="w-4 h-4 bg-[#22D3EE] rounded-full flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></div>}
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-1 leading-snug">
                  {t("Best for lists & pricing pages with fewer than 50 items.")}
                </p>
              </div>
            </button>

            {/* ACCORDION OPTION */}
            <button
              onClick={() => setMeta({ layoutMode: 'accordion' })}
              className={`cursor-default relative group p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 ${meta.layoutMode === 'accordion'
                ? "border-[#22D3EE] bg-[var(--surface)] ring-1 ring-[#22D3EE]"
                : "border-[var(--border)] hover:border-[var(--text)] bg-[var(--bg)]"
                }`}
            >
              <div className={`p-2 rounded-lg ${meta.layoutMode === 'accordion' ? "bg-[#22D3EE]/10 text-[#22D3EE]" : "bg-[var(--track)] text-[var(--muted)]"}`}>
                <LayoutList className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text)]">Accordion</span>
                  {meta.layoutMode === 'accordion' && <div className="w-4 h-4 bg-[#22D3EE] rounded-full flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></div>}
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-1 leading-snug">
                  {t("Best for extensive menus (>50 items) organized by categories.")}
                </p>
              </div>
            </button>
          </div>

          {/* Solo Mode Option (Only for Accordion) */}
          {meta.layoutMode === 'accordion' && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
              <label className="flex items-center justify-between p-3 rounded-xl cursor-default bg-[var(--surface)] border border-[var(--border)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-full w-1 rounded-full bg-gradient-to-b from-[#4F46E5] to-[#22D3EE]"></div>
                  <div className="space-y-0.5">
                    <span className="text-sm text-[var(--text)] font-bold block">{t("Solo Mode")}</span>
                    <span className="text-[10px] text-[var(--muted)] block">{t("Auto-close other sections when one is opened")}</span>
                  </div>
                </div>
                <div className="relative inline-flex items-center cursor-default">
                  <input type="checkbox" checked={meta.layoutAccordionSolo || false} onChange={e => setMeta({ layoutAccordionSolo: e.target.checked })} className="sr-only peer" />
                  <div className={`w-9 h-5 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${meta.layoutAccordionSolo ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-200"}`}></div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Show 'Powered by Tierless' Badge */}
        <label className={`flex items-center justify-between p-2 rounded-lg cursor-default hover:bg-[var(--bg)] transition-colors ${!removeBadgeAllowed ? "opacity-75" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text)] font-medium">{t("Show 'Powered by Tierless' Badge")}</span>
            {!removeBadgeAllowed && <Lock className="w-3 h-3 text-[var(--muted)]" />}
          </div>
          <div className="relative inline-flex items-center cursor-default">
            <input
              type="checkbox"
              checked={meta.simpleShowBadge !== false}
              onChange={e => {
                if (!e.target.checked && !removeBadgeAllowed) {
                  openUpsell({ feature: "removeBadge" });
                  return;
                }
                setMeta({ simpleShowBadge: e.target.checked });
              }}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${meta.simpleShowBadge !== false ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-200"}`}></div>
          </div>
        </label>

        {/* Enable Calculations */}
        <label className="flex items-center justify-between p-2 rounded-lg cursor-default hover:bg-[var(--bg)] transition-colors">
          <div className="space-y-0.5">
            <span className="text-sm text-[var(--text)] font-medium block">{t("Enable Calculations")}</span>
            <span className="text-[10px] text-[var(--muted)] block">{t("Shows prices and allows quantity selection")}</span>
          </div>
          <div className="relative inline-flex items-center cursor-default">
            <input type="checkbox" checked={meta.simpleEnableCalculations || false} onChange={e => setMeta({ simpleEnableCalculations: e.target.checked })} className="sr-only peer" />
            <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${meta.simpleEnableCalculations ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-200"}`}></div>
          </div>
        </label>

        {/* Add Checkout Button */}
        {meta.simpleEnableCalculations && (
          <label className="flex items-center justify-between p-2 rounded-lg cursor-default hover:bg-[var(--bg)] transition-colors border-l-2 border-[#22D3EE]/30 ml-2 pl-3">
            <div className="space-y-0.5">
              <span className="text-sm text-[var(--text)] font-medium block">{t("Add Checkout Button")}</span>
              <span className="text-[10px] text-[var(--muted)] block">{t("Adds a button for customers to send their order via WhatsApp or Email.")}</span>
              <span className="text-[9px] text-[var(--muted)]/70 block italic">{t("Configure delivery method in Account Settings")}</span>
            </div>
            <div className="relative inline-flex items-center cursor-default">
              <input type="checkbox" checked={meta.simpleAddCheckout || false} onChange={e => setMeta({ simpleAddCheckout: e.target.checked })} className="sr-only peer" />
              <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${meta.simpleAddCheckout ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-200"}`}></div>
            </div>
          </label>
        )}

        {/* Show Unit in Public View */}
        <label className="flex items-center justify-between p-2 rounded-lg cursor-default hover:bg-[var(--bg)] transition-colors">
          <div className="space-y-0.5">
            <span className="text-sm text-[var(--text)] font-medium block">{t("Show Units")}</span>
            <span className="text-[10px] text-[var(--muted)] block">{t("Display unit of measure (kg, pcs, etc.) next to prices")}</span>
          </div>
          <div className="relative inline-flex items-center cursor-default">
            <input type="checkbox" checked={meta.simpleShowUnits || false} onChange={e => setMeta({ simpleShowUnits: e.target.checked })} className="sr-only peer" />
            <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${meta.simpleShowUnits ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-200"}`}></div>
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-[var(--bg)]">

      {/* DELETE CONFIRMATION MODAL */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Delete "{sectionToDelete.label}"?</h3>
                <p className="text-sm text-[var(--muted)] mt-2">
                  This will delete the section <b>AND all items</b> inside it. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setSectionToDelete(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] transition">
                  {t("Cancel")}
                </button>
                <button onClick={handleConfirmDeleteSection} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                  {t("Delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 pt-4 pb-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)] leading-tight">{t("Page Design")}</h1>
              <p className="text-[10px] text-[var(--muted)]">{t("Style your pricing page or catalog")}</p>
            </div>
          </div>
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
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <Ban className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                      <button onClick={selectAllOcrItems} className="text-xs text-[#22D3EE] hover:underline font-bold cursor-default">{t("Select All")}</button>
                      <button onClick={clearOcrSelection} className="text-xs text-[var(--muted)] hover:underline cursor-default">{t("Clear")}</button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {ocrItems.map(it => (
                      <label key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--card)] cursor-default border border-transparent hover:border-[var(--border)] transition group">
                        <input type="checkbox" checked={ocrSelectedIds.includes(it.id)} onChange={() => toggleOcrSelection(it.id)} className="accent-[#22D3EE] h-4 w-4 rounded-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[var(--text)] truncate">{it.label}</div>
                          {it.sectionName && <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide group-hover:text-[#22D3EE] transition-colors">{it.sectionName}</div>}
                        </div>
                        {it.price && <div className="text-sm font-bold text-[var(--text)] bg-[var(--surface)] px-2 py-0.5 rounded-md">{it.price}</div>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button onClick={() => setOcrOpen(false)} variant="danger" size="sm">
                {t("Cancel")}
              </Button>
              <Button
                onClick={handleApplyOcrToList}
                disabled={ocrSelectedIds.length === 0}
                variant="brand"
                size="md"
                className="shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
              >
                {t("Import Items")} ({ocrSelectedIds.length})
              </Button>
            </div>
            <input ref={ocrFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOcrFileChange} />
          </div>
        </div>
      )}
    </div>
  );
}