// src/app/dashboard/trash/page.client.tsx
"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { t } from "@/i18n";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Action Button Wrapper (maps to global Button)                      */
/* ------------------------------------------------------------------ */
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
  variant?: "brand" | "neutral" | "danger";
  size?: "xs" | "sm";
}) {
  return (
    <Button
      href={href}
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
      title={title}
    >
      {label}
    </Button>
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

function daysLeft(deletedAt: string, ttlDays: number) {
  const del = new Date(deletedAt).getTime();
  const expires = del + ttlDays * 24 * 60 * 60 * 1000;
  const diff = Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000));
  return diff < 0 ? 0 : diff;
}

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
      const list = j?.rows ?? [];
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

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()),
    [rows]
  );

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
      }
    }
    window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
    setInfo(`Deleted ${removed} item(s) forever.`);
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

  return (
    <main className="container-page space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t("Trash")}</h1>
          <p className="text-xs text-neutral-500">
            {t("Deleted pages are kept for")} {ttl} {t("days before permanent removal.")} •{" "}
            <span className="font-medium text-neutral-700">
              Trash {sorted.length} / {TRASH_MAX}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="text-sm text-neutral-700 hover:underline" href="/dashboard">
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

          {/* Table (bez sečenja) */}
          <div className="table shadow-ambient mt-3 relative z-[1] overflow-visible pt-2">
            <table className="w-full text-sm">
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
                </tr>
              </thead>

              {/* KLJUČ: izolovan stacking na body + z-index po redu */}
              <tbody className="relative z-0 isolate">
                {sorted.map((r) => {
                  const key = rowKey(r);
                  const left = daysLeft(r.deletedAt, ttl);
                  const deletedShort = new Date(r.deletedAt).toLocaleString();
                  const isSel = selected.has(key);
                  const disableRestore = freeSlots === 0;

                  return (
                    <tr key={key} className="relative z-0 hover:z-30">
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

                      {/* "Luft" hack: increased padding prevents button hover cutoff */}
                      <td className="relative py-2">
                        <div className="min-w-[320px] overflow-visible relative z-10">
                          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap relative z-20">
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
                    </tr>
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
    </main>
  );
}