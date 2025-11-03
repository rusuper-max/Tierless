// src/app/dashboard/page.client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAccount } from "@/hooks/useAccount";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";
import { ChevronUp, ChevronDown, Copy as CopyIcon, Star } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mini UI tokens                                                      */
/* ------------------------------------------------------------------ */
type BtnVariant = "brand" | "neutral" | "danger";
type BtnSize = "xs" | "sm";

function outlineStyle(variant: BtnVariant) {
  const grad =
    variant === "brand"
      ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
      : variant === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)";
  return {
    padding: 1.5,
    background: grad,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor" as any,
    maskComposite: "exclude",
    borderRadius: "9999px",
    transition: "opacity .15s ease",
  } as React.CSSProperties;
}

function ActionButton({
  label,
  title,
  href,
  onClick,
  disabled,
  variant = "neutral",
  size = "xs",
}: {
  label: string;
  title?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: BtnVariant;
  size?: BtnSize;
}) {
  const base =
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--card,white)] text-sm font-medium transition will-change-transform select-none";
  const pad = size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";
  const text = variant === "danger" ? "text-rose-700" : "text-neutral-900";
  const state = disabled
    ? "opacity-50 cursor-not-allowed"
    : "hover:shadow-[0_10px_24px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";
  const inner =
    "relative z-[1] inline-flex items-center gap-1 " + (size === "xs" ? "text-xs" : "text-sm");

  const Glow = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
      style={{
        boxShadow:
          variant === "danger"
            ? "0 0 10px 3px rgba(244,63,94,.22)"
            : "0 0 12px 3px rgba(34,211,238,.20)",
        transition: "opacity .2s ease",
      }}
    />
  );
  const Outline = (
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outlineStyle(variant)} />
  );

  const content = (
    <span className={`${base} ${pad} ${text} ${state}`} title={title}>
      {Outline}
      {Glow}
      <span className={inner}>{label}</span>
    </span>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        aria-disabled={disabled}
        className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {content}
    </button>
  );
}

function IconButton({
  title,
  ariaLabel,
  onClick,
  disabled,
  children,
}: {
  title?: string;
  ariaLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "relative inline-flex items-center justify-center rounded-xl bg-[var(--card,white)] w-8 h-8 text-neutral-700 transition";
  const pointer = disabled
    ? "cursor-not-allowed opacity-50"
    : "cursor-pointer hover:shadow-[0_8px_18px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`${base} ${pointer}`}
      aria-disabled={disabled}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl" style={outlineStyle("neutral")} />
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Trash                                                        */
/* ------------------------------------------------------------------ */
function ConfirmDeleteModal({
  open,
  name,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-[101] card w-[92vw] max-w-md p-5">
        <div className="text-lg font-semibold">Move “{name}” to Trash?</div>
        <p className="mt-2 text-sm text-neutral-600">You can restore it from Trash within 30 days.</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <ActionButton label="Cancel" onClick={onCancel} disabled={busy} variant="brand" />
          <ActionButton label={busy ? "Moving…" : "Move to Trash"} onClick={onConfirm} disabled={busy} variant="danger" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */
type MiniCalc = {
  meta: {
    name: string;
    slug: string;
    published?: boolean;
    online?: boolean;        // backward fallback
    favorite?: boolean;
    order?: number;
    createdAt?: number;      // NEW
    updatedAt?: number;
    views7d?: number;
  };
};

type ApiRows =
  | MiniCalc[]
  | { rows?: MiniCalc[]; __debug?: { userId: string; file: string }; notice?: string };

const fmtDateTime = (ts?: number) =>
  ts ? new Date(ts).toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

/* ------------------------------------------------------------------ */
/* Filter chip (stabilno — bez children nizova)                        */
/* ------------------------------------------------------------------ */
function FilterChip({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      className="relative inline-flex items-center rounded-full text-sm bg-white px-3 py-1"
      title={label}
    >
      {/* gradient outline ispod teksta */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full z-0"
        style={outlineStyle(active ? "brand" : "neutral")}
      />
      {/* tekst ostaje uvek tamno-siv + malo bold kad je aktivan */}
      <span className={`relative z-10 text-neutral-900 ${active ? "font-medium" : ""}`}>
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Sort dropdown (lep brand outline)                                   */
/* ------------------------------------------------------------------ */
type SortId = "created_desc" | "name_asc" | "views_desc" | "status";

function SortDropdown({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (next: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const label =
    value === "created_desc"
      ? "Date created (newest)"
      : value === "name_asc"
      ? "Name A–Z"
      : value === "views_desc"
      ? "Views (7d)"
      : "Status (Online first)";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center rounded-full bg-white px-3 py-1.5 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Sort"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outlineStyle("neutral")} />
        <span className="relative z-[1] text-neutral-900">{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white shadow-ambient p-1 z-10">
          {([
            ["created_desc", "Date created (newest)"],
            ["name_asc", "Name A–Z"],
            ["views_desc", "Views (7d)"],
            ["status", "Status (Online first)"],
          ] as const).map(([v, l]) => (
            <button
              key={v}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 ${value === v ? "bg-neutral-50" : ""}`}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Jedan red tabele                                                    */
/* ------------------------------------------------------------------ */
function PageRow({
  row,
  index,
  lastIndex,
  isSelected,
  onSelectToggle,
  onMove,
  onCopyUrl,
  onRenameStart,
  onDuplicate,
  onDelete,
  onToggleOnline,
  onToggleFavorite,
  busySlug,
}: {
  row: MiniCalc;
  index: number;
  lastIndex: number;
  isSelected: boolean;
  onSelectToggle: (slug: string) => void;
  onMove: (slug: string, dir: -1 | 1) => void;
  onCopyUrl: (slug: string) => void;
  onRenameStart: (slug: string, name: string) => void;
  onDuplicate: (slug: string, name: string) => void;
  onDelete: (slug: string, name: string) => void;
  onToggleOnline: (slug: string, next: boolean) => void;
  onToggleFavorite: (slug: string, next: boolean) => void;
  busySlug: string | null;
}) {
  const { slug, name, favorite, views7d, createdAt } = row.meta;
  const published = !!(row.meta.published ?? row.meta.online);

  return (
    <tr className="align-middle">
      <td>
        <input type="checkbox" checked={isSelected} onChange={() => onSelectToggle(slug)} aria-label="Select row" />
      </td>

      <td className="font-medium">
        <div className="flex items-center gap-2">
          <button
            className={`p-1 rounded-md ${favorite ? "text-yellow-500" : "text-neutral-400"} hover:bg-neutral-50`}
            title={favorite ? "Unpin" : "Pin"}
            onClick={() => onToggleFavorite(slug, !favorite)}
          >
            <Star className="size-4" fill={favorite ? "currentColor" : "none"} />
          </button>
          <span className="cursor-text" onDoubleClick={() => onRenameStart(slug, name)} title="Double-click to rename">
            {name}
          </span>
        </div>
      </td>

      <td className="text-neutral-500">
        <div className="flex items-center gap-2">
          <IconButton title="Copy public link" ariaLabel="Copy public link" onClick={() => onCopyUrl(slug)}>
            <CopyIcon className="size-4" />
          </IconButton>
        </div>
      </td>

      <td className="text-neutral-500">{views7d ?? 0}</td>
      <td className="text-neutral-500">{fmtDateTime(createdAt)}</td>

      <td>
  <button
    className={`group inline-flex items-center rounded-full border px-3 py-1 text-sm transition cursor-pointer ${
      published
        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-[0_0_0_1px_rgba(34,197,94,.20)_inset]"
        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,.20)_inset]"
    }`}
    onClick={() => onToggleOnline(slug, !published)}
    disabled={busySlug === slug}
    aria-label={published ? "Unpublish" : "Publish"}
    title={published ? "Unpublish" : "Publish"}
  >
    <span className="block group-hover:hidden">{published ? "Online" : "Offline"}</span>
    <span className="hidden group-hover:block">{published ? "Unpublish" : "Publish"}</span>
  </button>
</td>

      <td className="align-middle">
        <div className="w-full flex justify-end">
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
            <IconButton title="Move up" ariaLabel="Move up" onClick={() => onMove(slug, -1)} disabled={index === 0}>
              <ChevronUp className="size-4" />
            </IconButton>
            <IconButton title="Move down" ariaLabel="Move down" onClick={() => onMove(slug, +1)} disabled={index === lastIndex}>
              <ChevronDown className="size-4" />
            </IconButton>
            <ActionButton label="Public" href={`/p/${slug}`} variant="brand" />
            <ActionButton label="Edit" href={`/editor/${slug}`} variant="brand" />
            <ActionButton label="Rename" onClick={() => onRenameStart(slug, name)} variant="brand" />
            <ActionButton
              label={busySlug === slug ? "Duplicating…" : "Duplicate"}
              onClick={() => onDuplicate(slug, name)}
              disabled={busySlug === slug}
              variant="brand"
            />
            <ActionButton label="Delete" onClick={() => onDelete(slug, name)} disabled={busySlug === slug} variant="danger" />
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Glavni Dashboard                                                    */
/* ------------------------------------------------------------------ */
type FilterId = "all" | "online" | "offline" | "favorites" | "recent";

export default function DashboardPageClient() {
  const account = useAccount();

  const [rows, setRows] = useState<MiniCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [userDebug, setUserDebug] = useState<{ userId: string; file: string } | null>(null);

  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [renSlug, setRenSlug] = useState<string | null>(null);
  const [renName, setRenName] = useState<string>("");
  const [renError, setRenError] = useState<string | null>(null);

  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");

  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  // NEW: default sort = date created desc
  const [sortBy, setSortBy] = useState<SortId>("created_desc");

  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1300);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!newMenuRef.current) return;
      if (!newMenuRef.current.contains(e.target as any)) setNewMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/calculators", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const json = (await r.json()) as ApiRows;
      const arr = Array.isArray(json) ? json : json?.rows ?? [];
      const safe = (Array.isArray(arr) ? arr : []).map((x) => ({
        ...x,
        meta: {
          ...x.meta,
          published: !!(x.meta?.published ?? x.meta?.online),
          favorite: !!x.meta?.favorite,
          order: typeof x.meta?.order === "number" ? x.meta.order : undefined,
          // Ako nemamo createdAt iz storage-a, fallback na updatedAt ili Date.now()
          createdAt: x.meta?.createdAt ? Number(x.meta.createdAt) : (x.meta?.updatedAt ? Number(x.meta.updatedAt) : Date.now()),
          updatedAt: x.meta?.updatedAt ? Number(x.meta.updatedAt) : undefined,
          views7d: typeof x.meta?.views7d === "number" ? x.meta.views7d : 0,
        },
      }));
      setRows(safe);

      if (!Array.isArray(json) && json?.__debug) setUserDebug(json.__debug);
      else setUserDebug(null);

      if (!Array.isArray(json) && json?.notice) setNotice(json.notice);
      else setNotice(null);
    } catch {
      setRows([]);
      setUserDebug(null);
      setNotice(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // Plan & quotas
  const plan = (account.plan as PlanId) || "free";
  const limits = ENTITLEMENTS[plan]?.limits;
  const pagesLimit = limits?.pages ?? "unlimited";
  const totalPages = rows.length;

  const publishedCount = useMemo(() => rows.reduce((acc, r) => (r.meta.published ? acc + 1 : acc), 0), [rows]);
  const publishedLimit = (limits as any)?.maxPublicPages ?? (typeof pagesLimit === "number" ? pagesLimit : Infinity);

  const canCreate = useMemo(() => {
    if (pagesLimit === "unlimited") return true;
    return totalPages < (pagesLimit as number);
  }, [pagesLimit, totalPages]);

  const pagesPct = useMemo(() => {
    if (pagesLimit === "unlimited") return 0;
    return Math.min(100, Math.round((totalPages / Math.max(1, pagesLimit as number)) * 100));
  }, [pagesLimit, totalPages]);

  // Derived list
  const derived = useMemo(() => {
    const term = q.trim().toLowerCase();

    let arr = rows.filter((r) => {
      const byText =
        !term || (r.meta.name?.toLowerCase() || "").includes(term) || (r.meta.slug?.toLowerCase() || "").includes(term);
      let byFilter = true;
      if (activeFilter === "online") byFilter = !!r.meta.published;
      else if (activeFilter === "offline") byFilter = !r.meta.published;
      else if (activeFilter === "favorites") byFilter = !!r.meta.favorite;
      return byText && byFilter;
    });

    // sort
    arr = [...arr].sort((a, b) => {
      if (sortBy === "created_desc") return (b.meta.createdAt || 0) - (a.meta.createdAt || 0);
      if (sortBy === "name_asc") return (a.meta.name || "").localeCompare(b.meta.name || "");
      if (sortBy === "views_desc") return (b.meta.views7d || 0) - (a.meta.views7d || 0);
      if (sortBy === "status") {
        const sa = a.meta.published ? 1 : 0;
        const sb = b.meta.published ? 1 : 0;
        return sb - sa;
      }
      return 0;
    });

    // favorites first
    arr = [...arr].sort((a, b) => (b.meta.favorite ? 1 : 0) - (a.meta.favorite ? 1 : 0));
    return arr;
  }, [rows, q, activeFilter, sortBy]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const editable = (e.target as HTMLElement)?.getAttribute?.("contenteditable") === "true";
      if (tag === "input" || tag === "textarea" || tag === "select" || editable) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate && !busy) createBlank();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canCreate, busy]);

  /* --------------------- CRUD helpers --------------------- */
  async function createBlank() {
    if (!canCreate) return;
    setBusy("new");
    try {
      const now = Date.now();
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await r.text();
      if (!r.ok) {
        console.error("CREATE /api/calculators ->", payload);
        throw new Error(`create_failed: ${payload}`);
      }
      const json = JSON.parse(payload) as { slug?: string };
      if (json?.slug) {
        setRows((prev) => [
          ...prev,
          { meta: { name: "Untitled Page", slug: json.slug!, published: false, createdAt: now, updatedAt: now } },
        ]);
        window.location.href = `/editor/${json.slug}`;
      }
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(slug: string, name: string) {
    setBusy(slug);
    try {
      const now = Date.now();
      const safeName = uniqueCopyName(name);
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: slug, name: safeName }),
      });
      const payload = await r.text();
      if (!r.ok) {
        console.warn("DUP /api/calculators ->", payload);
        alert("You reached your pages limit. Manage plan in Account.");
        return;
      }
      const json = JSON.parse(payload) as { slug?: string };
      if (json?.slug) {
        setRows((prev) => [
          ...prev,
          { meta: { name: safeName, slug: json.slug!, published: false, createdAt: now, updatedAt: now } },
        ]);
      }
    } finally {
      setBusy(null);
    }
  }

  async function setOnline(slug: string, next: boolean) {
    if (next && typeof publishedLimit === "number" && publishedCount >= publishedLimit) {
      showToast("Online limit reached for your plan");
      return;
    }
    setBusy(slug);
    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}/publish`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-plan": plan,
          "x-user-id": (account?.email || (account as any)?.user?.email || ""),
        },
        body: JSON.stringify({ publish: next, slug }),
      });
      const txt = await r.text();
      if (!r.ok) {
        if (r.status === 409 || txt.includes("publish_limit_reached")) {
          showToast("Online limit reached for your plan");
          return;
        }
        console.error("PUBLISH /api/calculators ->", txt);
        showToast("Failed to change status");
        return;
      }
      setRows((prev) =>
        prev.map((x) =>
          x.meta.slug === slug ? { ...x, meta: { ...x.meta, published: next, updatedAt: Date.now() } } : x
        )
      );
      showToast(next ? "Now online" : "Now offline");
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite(slug: string, next: boolean) {
    setRows((prev) => prev.map((x) => (x.meta.slug === slug ? { ...x, meta: { ...x.meta, favorite: next } } : x)));
    await fetch(`/api/calculators/${encodeURIComponent(slug)}/meta`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ meta: { favorite: next, updatedAt: Date.now() } }),
    }).catch(() => {});
  }

  async function persistOrder(nextArr: MiniCalc[]) {
    const order = nextArr.map((r) => r.meta.slug);
    await fetch(`/api/calculators/reorder`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => {});
  }

  async function renameConfirmed(newName: string) {
    if (!renSlug) return;
    const slug = renSlug;
    setBusy(slug);
    setRenError(null);
    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}/rename`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName, slug }),
      });
      const txt = await r.text();
      if (!r.ok) {
        if (r.status === 409 || txt.includes("name_exists")) {
          setRenError("You already have a page with that name.");
          return;
        }
        console.error("RENAME /api/calculators ->", txt);
        setRenError("Rename failed. Please try a different name.");
        return;
      }
      setRows((prev) =>
        prev.map((x) =>
          x.meta.slug === slug ? { ...x, meta: { ...x.meta, name: newName, updatedAt: Date.now() } } : x
        )
      );
      setRenSlug(null);
      setRenName("");
    } finally {
      setBusy(null);
    }
  }

  async function removeConfirmed() {
    if (!confirmSlug) return;
    const slug = confirmSlug;
    setBusy(slug);
    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = await r.text().catch(() => "");
      if (!r.ok) {
        console.error("DELETE /api/calculators ->", payload);
        alert("Failed to move to Trash.");
        return;
      }
      setRows((prev) => prev.filter((x) => x.meta.slug !== slug));
      window.dispatchEvent(new Event("TL_TRASH_BLINK"));
      window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
      setConfirmSlug(null);
      setConfirmName("");
    } finally {
      setBusy(null);
    }
  }

  const moveBy = (slug: string, dir: -1 | 1) => {
    setRows((prev) => {
      const idx = prev.findIndex((x) => x.meta.slug === slug);
      if (idx < 0) return prev;
      const next = [...prev];
      const newIdx = Math.max(0, Math.min(next.length - 1, idx + dir));
      if (newIdx === idx) return prev;
      const [item] = next.splice(idx, 1);
      next.splice(newIdx, 0, item);
      persistOrder(next);
      return next;
    });
  };

  const copyUrl = async (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Copied to clipboard");
    } catch {}
  };

  const allOnPage = derived.map((r) => r.meta.slug);
  const allSelected = allOnPage.length > 0 && allOnPage.every((s) => selected.has(s));
  const toggleSelect = (slug: string, on?: boolean) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (on === undefined) (s.has(slug) ? s.delete(slug) : s.add(slug));
      else on ? s.add(slug) : s.delete(slug);
      return s;
    });
  };

  async function bulkPublish(next: boolean) {
    const list = allOnPage.filter((s) => selected.has(s));
    for (const slug of list) {
      await setOnline(slug, next);
    }
    setSelected(new Set());
  }
  async function bulkDuplicate() {
    const list = allOnPage.filter((s) => selected.has(s));
    for (const slug of list) {
      const row = rows.find((r) => r.meta.slug === slug);
      if (row) await duplicate(slug, row.meta.name);
    }
    setSelected(new Set());
  }
  async function bulkDelete() {
    const list = allOnPage.filter((s) => selected.has(s));
    for (const slug of list) {
      setConfirmSlug(slug);
      setConfirmName(rows.find((r) => r.meta.slug === slug)?.meta.name || "");
      await removeConfirmed();
    }
    setSelected(new Set());
  }

  // inline rename controller (ako poželiš da ga zadržiš uz modal)
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>("");
  const [editingErr, setEditingErr] = useState<string | null>(null);

  const startInlineRename = (slug: string, current: string) => {
    setEditingSlug(slug);
    setEditingVal(current);
    setEditingErr(null);
  };
  const commitInlineRename = async () => {
    const name = editingVal.trim();
    const slug = editingSlug;
    if (!slug) return;
    if (!name) {
      setEditingErr("Name cannot be empty.");
      return;
    }
    const lower = name.toLowerCase();
    const exists = rows.some((r) => r.meta.slug !== slug && (r.meta.name || "").trim().toLowerCase() === lower);
    if (exists) {
      setEditingErr("You already have a page with that name.");
      return;
    }
    setEditingSlug(null);
    setEditingErr(null);
    setRenSlug(slug);
    await renameConfirmed(name);
  };

  const uniqueCopyName = (name: string) => {
    const existing = new Set(rows.map((r) => (r.meta.name || "").trim().toLowerCase()));
    const base = `Copy of ${name}`.trim();
    if (!existing.has(base.toLowerCase())) return base;
    for (let i = 2; i < 9999; i++) {
      const cand = `${base} (${i})`;
      if (!existing.has(cand.toLowerCase())) return cand;
    }
    return `${base} (${Date.now()})`;
  };

  /* --------------------- UI --------------------- */
  return (
    <main className="container-page space-y-6">
      {toast && <div className="fixed bottom-4 right-4 z-[120] card px-3 py-2 text-sm shadow-ambient">{toast}</div>}

      {notice && (
        <div className="rounded-[var(--radius)] border border-amber-300/50 bg-amber-50 text-amber-900 p-3 text-sm">
          {notice}
        </div>
      )}

      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="text-xs text-neutral-500">Create, edit and share your Tierless pages.</p>
          {userDebug && (
            <p className="mt-1 text-[11px] text-neutral-500">
              user: <code>{userDebug.userId}</code> • file: <code>{userDebug.file}</code>
            </p>
          )}
        </div>

        <div className="relative" ref={newMenuRef}>
          <ActionButton
            label={busy === "new" ? "Creating…" : "New Page"}
            onClick={() => setNewMenuOpen((v) => !v)}
            disabled={busy === "new" || !canCreate}
            title={!canCreate ? "You reached your pages limit — manage plan in Account" : undefined}
            variant="brand"
          />
          {newMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-ambient p-1 z-10">
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                onClick={() => {
                  setNewMenuOpen(false);
                  createBlank();
                }}
              >
                New from blank
              </button>
              <Link
                className="block px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                href="/templates"
                onClick={() => setNewMenuOpen(false)}
              >
                New from template
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Usage / quotas */}
      <section className="card p-4 border border-[var(--border)] rounded-[var(--radius)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-neutral-700">Pages</div>
            <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width]"
                style={{ width: `${pagesPct}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {typeof pagesLimit === "number" ? `${totalPages} / ${pagesLimit}` : `${totalPages} / ∞`}
            </div>
          </div>

          {/* Published pill — bez maski, čitljiv uvek */}
          <div className="flex items-start justify-end">
            <span
              className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900 shadow-sm"
              title="Published pages in your plan"
            >
              {publishedCount} / {Number.isFinite(publishedLimit) ? publishedLimit : "∞"} published
            </span>
          </div>
        </div>
      </section>

      {/* Search + Filters + Sort */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={searchRef}
            className="field w-full max-w-md"
            placeholder="Search by name or slug… (press / to focus)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-xs text-neutral-500">{derived.length} total</div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FilterChip label="All" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
            <FilterChip label="Online" active={activeFilter === "online"} onClick={() => setActiveFilter("online")} />
            <FilterChip label="Offline" active={activeFilter === "offline"} onClick={() => setActiveFilter("offline")} />
            <FilterChip label="Favorites" active={activeFilter === "favorites"} onClick={() => setActiveFilter("favorites")} />
            <FilterChip label="Recently edited" active={activeFilter === "recent"} onClick={() => setActiveFilter("recent")} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Sort</span>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 text-sm bg-neutral-50 border rounded-xl px-3 py-2">
          <div className="font-medium">{selected.size} selected</div>
          <div className="grow" />
          <ActionButton label="Publish" onClick={() => bulkPublish(true)} variant="brand" />
          <ActionButton label="Unpublish" onClick={() => bulkPublish(false)} variant="brand" />
          <ActionButton label="Duplicate" onClick={bulkDuplicate} variant="brand" />
          <ActionButton label="Delete" onClick={bulkDelete} variant="danger" />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : derived.length === 0 ? (
        <div className="card p-6 text-sm">
          <div className="font-medium mb-2">No pages found</div>
          <p className="text-neutral-500">Try a different search, create a blank page or pick a template.</p>
          <div className="mt-3 flex gap-2 flex-nowrap whitespace-nowrap">
            <ActionButton label="New Page" onClick={createBlank} disabled={!canCreate} variant="brand" />
            <ActionButton label="Browse Templates" href="/templates" variant="brand" />
          </div>
        </div>
      ) : (
        <div className="table shadow-ambient">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="w-[42px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      const on = e.target.checked;
                      const s = new Set(selected);
                      for (const slug of allOnPage) on ? s.add(slug) : s.delete(slug);
                      setSelected(s);
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Link</th>
                <th>Views (7d)</th>
                <th>Created</th>
                <th className="w-[140px]">Status</th>
                <th className="w-[560px]">
                  <div className="w-full flex justify-end">
                    <span className="inline-block">Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {derived.map((r, i) => {
                const { slug, name } = r.meta;
                const isSel = selected.has(slug);
                return (
                  <PageRow
                    key={slug}
                    row={r}
                    index={i}
                    lastIndex={derived.length - 1}
                    isSelected={isSel}
                    onSelectToggle={toggleSelect}
                    onMove={moveBy}
                    onCopyUrl={copyUrl}
                    onRenameStart={(slug, name) => {
                      setRenSlug(slug);
                      setRenName(name);
                      setRenError(null);
                    }}
                    onDuplicate={duplicate}
                    onDelete={(slug, name) => {
                      setConfirmSlug(slug);
                      setConfirmName(name);
                    }}
                    onToggleOnline={setOnline}
                    onToggleFavorite={toggleFavorite}
                    busySlug={busy}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline rename controller (opcioni) */}
      {editingSlug && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[115] card px-4 py-3 shadow-ambient flex items-center gap-2">
          <input
            className="field"
            value={editingVal}
            onChange={(e) => setEditingVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitInlineRename();
              if (e.key === "Escape") setEditingSlug(null);
            }}
            autoFocus
          />
          <ActionButton label="Save" onClick={commitInlineRename} variant="brand" />
          <ActionButton label="Cancel" onClick={() => setEditingSlug(null)} variant="neutral" />
          {editingErr && <span className="text-xs text-rose-600">{editingErr}</span>}
        </div>
      )}

      {/* Modals */}
      <ConfirmDeleteModal
        open={!!confirmSlug}
        name={confirmName}
        onCancel={() => {
          if (!busy) {
            setConfirmSlug(null);
            setConfirmName("");
          }
        }}
        onConfirm={removeConfirmed}
        busy={!!busy}
      />
      {renSlug && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setRenSlug(null)} />
          <div className="relative z-[111] card w-[92vw] max-w-md p-5">
            <div className="text-lg font-semibold">Rename page</div>
            <input
              className="field mt-3 w-full"
              placeholder="New name"
              value={renName}
              onChange={(e) => setRenName(e.target.value)}
              autoFocus
            />
            {!!renError && <p className="mt-2 text-sm text-rose-600">{renError}</p>}
            <div className="mt-5 flex items-center justify-end gap-2">
              <ActionButton label="Cancel" onClick={() => setRenSlug(null)} disabled={!!busy} variant="brand" />
              <ActionButton
                label={busy ? "Saving…" : "Save name"}
                onClick={() => renameConfirmed(renName.trim())}
                disabled={!!busy || !renName.trim()}
                variant="brand"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}