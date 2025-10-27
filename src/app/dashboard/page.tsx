"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

type MiniCalc = { meta: { name: string; slug: string } };
type ApiRows =
  | MiniCalc[]
  | { rows?: MiniCalc[]; __debug?: { userId: string; file: string } };

// ——— Modal potvrde brisanja (tip “Delete”)
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
  const [typed, setTyped] = useState("");

  // reset input svaki put kad se modal otvori
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      {/* content */}
      <div className="relative z-[101] card w-[92vw] max-w-md p-4">
        <div className="text-lg font-semibold">Delete “{name}”</div>
        <p className="mt-2 text-sm text-neutral-500">
          Ova akcija je nepovratna. Da potvrdiš, ukucaj tačno: <b>Delete</b>
        </p>
        <input
          className="field mt-3 w-full"
          placeholder='Type "Delete" to confirm'
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn btn-plain" disabled={busy}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger btn-danger--solid"
            disabled={busy || typed !== "Delete"}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [rows, setRows] = useState<MiniCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [userDebug, setUserDebug] = useState<{ userId: string; file: string } | null>(null);

  // modal state
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/calculators", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await r.json()) as ApiRows;

      const arr = Array.isArray(json) ? json : json?.rows ?? [];
      setRows(Array.isArray(arr) ? arr : []);

      if (!Array.isArray(json) && json?.__debug) setUserDebug(json.__debug);
      else setUserDebug(null);
    } catch {
      setRows([]);
      setUserDebug(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createBlank() {
    setBusy("new");
    try {
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
        // optimistic add
        setRows((prev) => [...prev, { meta: { name: "Untitled Page", slug: json.slug! } }]);
        // odmah u editor (ili ukloni liniju ako želiš da ostaneš na listi)
        window.location.href = `/editor/${json.slug}`;
      }
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(slug: string, name: string) {
    setBusy(slug);
    try {
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: slug, name: `Copy of ${name}` }),
      });
      const payload = await r.text();
      if (!r.ok) {
        console.error("DUP /api/calculators ->", payload);
        throw new Error(`dup_failed: ${payload}`);
      }
      const json = JSON.parse(payload) as { slug?: string };
      if (json?.slug) {
        setRows((prev) => [...prev, { meta: { name: `Copy of ${name}`, slug: json.slug! } }]);
        // ako želiš odmah editor kopije, otkomentariši:
        // window.location.href = `/editor/${json.slug}`;
      }
    } finally {
      setBusy(null);
    }
  }

  function openConfirm(slug: string, name: string) {
    setConfirmSlug(slug);
    setConfirmName(name);
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
        throw new Error(`delete_failed: ${payload}`);
      }
      // instant uklanjanje iz liste
      setRows((prev) => prev.filter((x) => x.meta.slug !== slug));
      setConfirmSlug(null);
      setConfirmName("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="container-page space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="text-xs text-neutral-500">
            Create, edit and share your Tierless pages.
          </p>
          {userDebug && (
            <p className="mt-1 text-[11px] text-neutral-500">
              user: <code>{userDebug.userId}</code> • file:{" "}
              <code>{userDebug.file}</code>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
          <Button href="/templates">Templates</Button>
          <Button onClick={createBlank} disabled={busy === "new"}>
            {busy === "new" ? "Creating…" : "New Page"}
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-sm">
          <div className="font-medium mb-2">No pages yet</div>
          <p className="text-neutral-500">
            Create a blank page or start from a template.
          </p>
          <div className="mt-3 flex gap-2 flex-nowrap whitespace-nowrap">
            <Button onClick={createBlank}>New Page</Button>
            <Button href="/templates" variant="plain">
              Browse Templates
            </Button>
          </div>
        </div>
      ) : (
        <div className="table shadow-ambient">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Name</th>
                <th>Slug</th>
                <th className="w-[340px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.meta.slug} className="align-middle">
                  <td className="font-medium">{r.meta.name}</td>
                  <td className="text-neutral-500">{r.meta.slug}</td>
                  <td className="align-middle">
                    <div className="min-w-[340px] overflow-x-auto">
                      <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                        <Button href={`/p/${r.meta.slug}`} className="text-xs">
                          Public
                        </Button>
                        <Button href={`/editor/${r.meta.slug}`} className="text-xs">
                          Edit
                        </Button>
                        <Button
                          onClick={() => duplicate(r.meta.slug, r.meta.name)}
                          disabled={busy === r.meta.slug}
                          className="text-xs"
                        >
                          {busy === r.meta.slug ? "Duplicating…" : "Duplicate"}
                        </Button>
                        {/* DELETE — otvara modal */}
                        <button className="btn btn-danger text-xs"
                          onClick={() => openConfirm(r.meta.slug, r.meta.name)}
                          disabled={busy === r.meta.slug}
                          aria-label={`Delete ${r.meta.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!confirmSlug}
        name={confirmName}
        onCancel={() => { if (!busy) { setConfirmSlug(null); setConfirmName(""); } }}
        onConfirm={removeConfirmed}
        busy={!!busy}
      />
    </main>
  );
}