// src/app/dashboard/trash/page.client.tsx
"use client";

import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import Link from "next/link";
import { t } from "@/i18n";
import { GripVertical } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Brand outline buttons — 1:1 sa Dashboard-a                          */
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
  // Bela slova (osim danger)
  const text =
  variant === "danger"
    ? "text-rose-700 dark:text-rose-300"
    : "text-[var(--text,#111827)]";
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
        className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} relative z-20`}
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
      className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} relative z-20`}
    >
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Types & utils                                                       */
/* ------------------------------------------------------------------ */
type TrashRow = {
  meta: { name: string; slug: string };
  template?: string;
  config?: any;
  deletedAt: string; // ISO
};
type ApiList = { rows?: TrashRow[]; ttlDays?: number };

const TRASH_MAX = 50;
const rowKey = (r: TrashRow) => `${r.meta.slug}#${r.deletedAt}`;

// LS key za redosled (stabilni ID-jevi)
const LS_TRASH_ORDER = "tl_trash_order_v2";

function daysLeft(deletedAt: string, ttlDays: number) {
  const del = new Date(deletedAt).getTime();
  const expires = del + ttlDays * 24 * 60 * 60 * 1000;
  const diff = Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000));
  return diff < 0 ? 0 : diff;
}

const loadOrderLS = (): string[] | null => {
  try {
    const raw = localStorage.getItem(LS_TRASH_ORDER);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : null;
  } catch {
    return null;
  }
};
const saveOrderLS = (ids: string[]) => {
  try {
    localStorage.setItem(LS_TRASH_ORDER, JSON.stringify(ids));
  } catch {}
};

/* ------------------------------------------------------------------ */
/* Confirm modal                                                       */
/* ------------------------------------------------------------------ */
function ConfirmForever({
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
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-[101] card w-[92vw] max-w-md p-4">
        <div className="text-lg font-semibold">
          {t("Delete permanently")} “{name}”
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {t("This action cannot be undone.")} {t("Type")} <b>DELETE FOREVER</b> {t("to confirm")}.
        </p>
        <input
          className="field mt-3 w-full"
          placeholder="DELETE FOREVER"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <ActionButton label={t("Cancel")} onClick={onCancel} disabled={busy} variant="brand" />
          <ActionButton
            label={busy ? t("Deleting…") : t("Delete forever")}
            onClick={onConfirm}
            disabled={busy || typed !== "DELETE FOREVER"}
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function TrashPageClient() {
  const [rows, setRows] = useState<TrashRow[]>([]);
  const [ttl, setTtl] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [info, setInfo] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [freeSlots, setFreeSlots] = useState<number>(0);

  // DRAG state
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after" | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  // <- FIX: koristimo ref-ove da izbegnemo stale state u onMouseUp
  const dragIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);
  const overPosRef = useRef<"before" | "after" | null>(null);

  useEffect(() => { dragIdRef.current = dragId; }, [dragId]);
  useEffect(() => { overIdRef.current = overId; }, [overId]);
  useEffect(() => { overPosRef.current = overPos; }, [overPos]);

  async function refreshFreeSlots(): Promise<number> {
    try {
      const r = await fetch("/api/calculators", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const j = await r.json();
      const limit = typeof j?.limit === "number" ? j.limit : NaN;
      const used = Array.isArray(j?.rows) ? j.rows.length : 0;
      const free = Number.isFinite(limit) ? Math.max(0, limit - used) : Number.POSITIVE_INFINITY;
      setFreeSlots(free);
      return free;
    } catch {
      setFreeSlots(0);
      return 0;
    }
  }

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/trash", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const j = (await r.json()) as ApiList;
      let list = j?.rows ?? [];

      // Primarni sort: najskorije obrisano
      list = [...list].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

      // Primeni sačuvani redosled po stabilnim ID-jevima ako postoji
      const saved = loadOrderLS();
      if (saved && saved.length) {
        const idxById = new Map<string, number>();
        saved.forEach((id, i) => idxById.set(id, i));
        list = list
          .map((r) => ({ r, id: rowKey(r) }))
          .sort((a, b) => {
            const ai = idxById.has(a.id) ? (idxById.get(a.id) as number) : 999999;
            const bi = idxById.has(b.id) ? (idxById.get(b.id) as number) : 999999;
            return ai - bi;
          })
          .map(({ r }) => r);
      }

      setRows(list);
      setTtl(j?.ttlDays ?? 30);
      setSelected(new Set());

      if (list.length > TRASH_MAX) {
        setWarning(
          `Trash is over capacity ${list.length}/${TRASH_MAX}. Items above the limit will be permanently removed within 24h, starting from the ones next in the deletion queue.`
        );
      } else {
        setWarning(null);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      void refreshFreeSlots();
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => [...rows], [rows]);

  function openConfirm(row: TrashRow) {
    setConfirmSlug(row.meta.slug);
    setConfirmName(row.meta.name);
    setConfirmKey(rowKey(row));
  }

  async function restoreRow(row: TrashRow) {
    if (freeSlots === 0) {
      setInfo("You reached your pages limit. Restore is not available.");
      return;
    }
    const key = rowKey(row);
    setBusyKey(key);
    try {
      const r = await fetch("/api/trash", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "restore", slug: row.meta.slug }),
      });
      if (!r.ok) {
        setInfo("You reached your pages limit. Restore failed.");
        return;
      }
      setRows((prev) => prev.filter((x) => rowKey(x) !== key));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      const cur = loadOrderLS() || [];
      saveOrderLS(cur.filter((id) => id !== key));
      window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
      setFreeSlots((v) => (Number.isFinite(v) ? Math.max(0, v - 1) : v));
    } finally {
      setBusyKey(null);
    }
  }

  async function restoreSelected() {
    const items = sorted.filter((r) => selected.has(rowKey(r)));
    if (items.length === 0) return;

    const free = await refreshFreeSlots();
    if (free === 0) {
      setInfo("No free slots on your plan. Consider upgrading.");
      return;
    }

    let restored = 0;
    for (const r of items) {
      if (Number.isFinite(free) && restored >= free) break;
      const resp = await fetch("/api/trash", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "restore", slug: r.meta.slug }),
      });
      if (resp.ok) {
        restored++;
        const key = rowKey(r);
        setRows((prev) => prev.filter((x) => rowKey(x) !== key));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        const cur = loadOrderLS() || [];
        saveOrderLS(cur.filter((id) => id !== key));
      }
    }
    window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
    setFreeSlots((v) => (Number.isFinite(v) ? Math.max(0, v - restored) : v));

    if (Number.isFinite(free) && restored < items.length) {
      setInfo(`Restored ${restored}/${items.length}. No more free slots.`);
    } else {
      setInfo(`Restored ${restored} item(s).`);
    }
  }

  async function purgeConfirmed() {
    if (!confirmSlug || !confirmKey) return;
    setBusyKey(confirmKey);
    try {
      const r = await fetch("/api/trash", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: confirmSlug }),
      });
      if (!r.ok) return;
      setRows((prev) => prev.filter((x) => rowKey(x) !== confirmKey));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(confirmKey);
        return next;
      });
      const cur = loadOrderLS() || [];
      saveOrderLS(cur.filter((id) => id !== confirmKey));
      setConfirmSlug(null);
      setConfirmName("");
      setConfirmKey(null);
      window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
    } finally {
      setBusyKey(null);
    }
  }

  async function purgeSelected() {
    const items = sorted.filter((r) => selected.has(rowKey(r)));
    if (items.length === 0) return;
    if (!confirm("Delete selected forever? This cannot be undone.")) return;

    let removed = 0;
    for (const r of items) {
      const resp = await fetch("/api/trash", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: r.meta.slug }),
      });
      if (resp.ok) {
        removed++;
        const key = rowKey(r);
        setRows((prev) => prev.filter((x) => rowKey(x) !== key));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        const cur = loadOrderLS() || [];
        saveOrderLS(cur.filter((id) => id !== key));
      }
    }
  }

  const allSelected = selected.size > 0 && selected.size === sorted.length;
  const toggleAll = (on?: boolean) => {
    const want = on ?? !allSelected;
    setSelected(want ? new Set(sorted.map((r) => rowKey(r))) : new Set());
  };
  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const trashPct = useMemo(
    () => Math.min(100, Math.round((sorted.length / Math.max(1, TRASH_MAX)) * 100)),
    [sorted.length]
  );

  /* ---------------------- Drag & drop (pointer) --------------------- */
  const startDragCleanup = useRef<null | (() => void)>(null);

  const reorderById = (drag: string, over: string, pos: "before" | "after") => {
    setRows((prev) => {
      const withIds = prev.map((r) => ({ id: rowKey(r), row: r }));
      const fromIdx = withIds.findIndex((x) => x.id === drag);
      const toIdxOriginal = withIds.findIndex((x) => x.id === over);
      if (fromIdx < 0 || toIdxOriginal < 0 || fromIdx === toIdxOriginal) return prev;

      const next = [...withIds];
      const [item] = next.splice(fromIdx, 1);

      let insertIndex = toIdxOriginal;
      if (fromIdx < toIdxOriginal) insertIndex = toIdxOriginal - 1;
      if (pos === "after") insertIndex += 1;
      insertIndex = Math.max(0, Math.min(next.length, insertIndex));

      next.splice(insertIndex, 0, item);

      // persist stable ids redosleda
      saveOrderLS(next.map((x) => x.id));
      return next.map((x) => x.row);
    });
  };

  const onPointerDragStart = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragId(id);
    dragIdRef.current = id;
    setOverId(null);
    overIdRef.current = null;
    setOverPos(null);
    overPosRef.current = null;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    document.body.classList.add("tl-drag-active");

    const onMove = (ev: MouseEvent) => {
      const y = ev.clientY;
      const table = tableRef.current;
      if (!table) return;

      const rowsEls = Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-id]"));
      if (rowsEls.length === 0) return;

      const firstRect = rowsEls[0].getBoundingClientRect();
      const lastRect = rowsEls[rowsEls.length - 1].getBoundingClientRect();
      if (y < firstRect.top) {
        const id0 = rowsEls[0].dataset.id!;
        setOverId(id0); setOverPos("before");
        overIdRef.current = id0; overPosRef.current = "before";
        return;
      }
      if (y > lastRect.bottom) {
        const idN = rowsEls[rowsEls.length - 1].dataset.id!;
        setOverId(idN); setOverPos("after");
        overIdRef.current = idN; overPosRef.current = "after";
        return;
      }

      for (const rowEl of rowsEls) {
        const rect = rowEl.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          const mid = rect.top + rect.height / 2;
          const pos = y < mid ? "before" : "after";
          const rid = rowEl.dataset.id!;
          setOverId(rid); setOverPos(pos);
          overIdRef.current = rid; overPosRef.current = pos;
          break;
        }
      }
    };

    const onUp = () => {
      const d = dragIdRef.current;
      const o = overIdRef.current;
      const p = overPosRef.current || "before";
      if (d && o && d !== o) {
        reorderById(d, o, p);
      }
      setDragId(null);
      dragIdRef.current = null;
      setOverId(null);
      overIdRef.current = null;
      setOverPos(null);
      overPosRef.current = null;

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.classList.remove("tl-drag-active");
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    startDragCleanup.current = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.classList.remove("tl-drag-active");
    };
  };

  useEffect(() => {
    return () => { if (startDragCleanup.current) startDragCleanup.current(); };
  }, []);

  /* ----------------------------- UI -------------------------------- */
  return (
    <main className="container-page space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t("Trash")}</h1>
          {/* Traženo: ceo red u belo */}
          <p className="text-xs text-neutral-500 dark:text-white">
  {t("Deleted pages are kept for")} {ttl} {t("days before permanent removal.")} •{" "}
  <span className="font-medium text-neutral-700 dark:text-white">
    Trash {sorted.length} / {TRASH_MAX}
  </span>
</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Traženo: white */}
          <Link className="text-sm text-neutral-700 hover:underline dark:text-white" href="/dashboard">
  {t("Back to Pages")}
</Link>
        </div>
      </header>

      {/* Capacity bar */}
      <section className="card p-4 border border-[var(--border)] rounded-[var(--radius)]">
        <div className="text-sm font-medium text-neutral-700">{t("Trash capacity")}</div>
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width]"
            style={{ width: `${trashPct}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {sorted.length} / {TRASH_MAX}
        </div>
        {warning && (
          <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-[var(--radius)] p-3">
            {warning}
          </div>
        )}
      </section>

      {/* Info banner */}
      {info && (
        <div className="rounded-[var(--radius)] border border-amber-300/50 bg-amber-50 text-amber-900 p-3 text-sm">
          {info}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500">{t("Loading…")}</div>
      ) : sorted.length === 0 ? (
        <div className="card p-6 text-sm">
          <div className="font-medium mb-2">{t("Trash is empty")}</div>
          <p className="text-neutral-500">{t("Deleted pages will appear here for 30 days.")}</p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <ActionButton
              label={allSelected ? t("Unselect all") : t("Select all")}
              onClick={() => toggleAll()}
              variant="neutral"
              size="xs"
            />
            <ActionButton
              label={t("Restore selected")}
              onClick={restoreSelected}
              disabled={selected.size === 0 || freeSlots === 0}
              title={freeSlots === 0 ? t("No free slots on your plan") : undefined}
              variant="brand"
              size="xs"
            />
            <ActionButton
              label={t("Delete selected forever")}
              onClick={purgeSelected}
              disabled={selected.size === 0}
              variant="danger"
              size="xs"
            />
            <div className="ml-auto text-xs text-neutral-500">
              {selected.size} {t("selected")} • {t("Free slots")}: {Number.isFinite(freeSlots) ? freeSlots : "∞"}
            </div>
          </div>

          {/* Table */}
          <div className="table shadow-ambient mt-3 relative z-[1] overflow-visible pt-2">
            <table ref={tableRef} className="w-full text-sm">
              <thead className="relative z-0">
                <tr className="text-left">
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all"
                    />
                  </th>
                  <th>{t("Name")}</th>
                  <th>{t("Slug")}</th>
                  <th>{t("Deleted")}</th>
                  <th>{t("Expires in")}</th>
                  <th className="w-[320px]">{t("Actions")}</th>
                  <th className="w-[110px] text-center">{t("Reorder")}</th>
                </tr>
              </thead>

              <tbody className="relative z-0 isolate">
                {sorted.map((r) => {
                  const key = rowKey(r);
                  const left = daysLeft(r.deletedAt, ttl);
                  const deletedShort = new Date(r.deletedAt).toLocaleString();
                  const isSel = selected.has(key);
                  const disableRestore = freeSlots === 0;
                  const isDragging = dragId === key;

                  return (
                    <Fragment key={key}>
                      {/* preview linija PRE */}
                      {overId === key && overPos === "before" && (
                        <tr className="tl-drop-gap">
                          <td colSpan={7}>
                            <div className="tl-gap-strip" />
                          </td>
                        </tr>
                      )}

                      <tr className={`relative z-0 hover:z-30 ${isDragging ? "tl-row--dragging" : ""}`} data-id={key}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(key)}
                            aria-label={`Select ${r.meta.name}`}
                          />
                        </td>
                        <td className="font-medium">{r.meta.name}</td>
                        <td className="text-neutral-500">{r.meta.slug}</td>
                        <td className="text-neutral-500">{deletedShort}</td>
                        <td className={left <= 3 ? "text-rose-600 font-semibold" : "text-neutral-600"}>
                          {left} {t("days")}
                        </td>

                        <td className="relative">
                          <div className="min-w-[320px] overflow-visible relative z-10 -mt-1">
                            <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap relative z-20 pt-1">
                              <ActionButton
                                label={busyKey === key ? t("Restoring…") : t("Restore")}
                                onClick={() => restoreRow(r)}
                                disabled={busyKey === key || disableRestore}
                                title={disableRestore ? t("No free slots on your plan") : undefined}
                                variant="brand"
                                size="xs"
                              />
                              <ActionButton
                                label={t("Delete forever")}
                                onClick={() => openConfirm(r)}
                                disabled={busyKey === key}
                                variant="danger"
                                size="xs"
                              />
                            </div>
                          </div>
                        </td>

                        {/* ručka za drag */}
                        <td className="text-center">
                          <button
                            className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-neutral-500 cursor-grab active:cursor-grabbing hover:bg-neutral-100"
                            title="Drag to reorder"
                            aria-label="Drag to reorder"
                            onMouseDown={(e) => onPointerDragStart(key, e)}
                          >
                            <GripVertical className="size-5" />
                          </button>
                        </td>
                      </tr>

                      {/* preview linija POSLE */}
                      {overId === key && overPos === "after" && (
                        <tr className="tl-drop-gap">
                          <td colSpan={7}>
                            <div className="tl-gap-strip" />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmForever
        open={!!confirmSlug}
        name={confirmName}
        onCancel={() => {
          if (!busyKey) {
            setConfirmSlug(null);
            setConfirmName("");
            setConfirmKey(null);
          }
        }}
        onConfirm={purgeConfirmed}
        busy={!!busyKey}
      />

      {/* Minimalno, samo za drag vizualno (ne menja ostatak dizajna) */}
      <style jsx global>{`
        .cursor-grab { cursor: grab; cursor: -webkit-grab; }
        .cursor-grabbing { cursor: grabbing; cursor: -webkit-grabbing; }
        .tl-row--dragging { opacity: 0; visibility: hidden; }
        .tl-drop-gap .tl-gap-strip{
          height: 10px;
          position: relative;
        }
        .tl-drop-gap .tl-gap-strip::after{
          content: "";
          position: absolute;
          left: 0; right: 0; top: 4px; height: 2px;
          background: linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE));
          border-radius: 2px;
        }
        .tl-drag-active { cursor: grabbing !important; }
      `}</style>
    </main>
  );
}