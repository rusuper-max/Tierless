"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

type MiniCalc = { meta: { name: string; slug: string } };

export default function DashboardPage() {
  const [rows, setRows] = useState<MiniCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/calculators", { cache: "no-store", credentials: "same-origin" });
      const json = (await r.json()) as MiniCalc[];
      setRows(Array.isArray(json) ? json : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createBlank() {
    setBusy("new");
    try {
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error("create_failed");
      const json = (await r.json()) as { slug?: string };
      if (json?.slug) window.location.href = `/editor/${json.slug}`;
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
      if (!r.ok) throw new Error("dup_failed");
      const json = (await r.json()) as { slug?: string };
      if (json?.slug) window.location.href = `/editor/${json.slug}`;
    } finally {
      setBusy(null);
    }
  }

  async function remove(slug: string) {
    if (!confirm("Delete this page?")) return;
    setBusy(slug);
    try {
      await fetch(`/api/calculators/${slug}`, { method: "DELETE", credentials: "same-origin" });
    } finally {
      setBusy(null);
      load();
    }
  }

  return (
    <main className="container-page space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="text-xs text-neutral-500">Create, edit and share your Tierless pages.</p>
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
          <p className="text-neutral-500">Create a blank page or start from a template.</p>
          <div className="mt-3 flex gap-2 flex-nowrap whitespace-nowrap">
            <Button onClick={createBlank}>New Page</Button>
            <Button href="/templates" variant="plain">Browse Templates</Button>
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
                    {/* wrapper dozvoljava horizontalni scroll ako baš mora */}
                    <div className="min-w-[340px] overflow-x-auto">
                      <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                        <Button href={`/p/${r.meta.slug}`} className="text-xs">Public</Button>
                        <Button href={`/editor/${r.meta.slug}`} className="text-xs">Edit</Button>
                        <Button
                          onClick={() => duplicate(r.meta.slug, r.meta.name)}
                          disabled={busy === r.meta.slug}
                          className="text-xs"
                        >
                          {busy === r.meta.slug ? "Duplicating…" : "Duplicate"}
                        </Button>
                        {/* DELETE — puno crveno */}
                        <Button
                          variant="danger"
                          className="text-xs btn-danger--solid"
                          onClick={() => remove(r.meta.slug)}
                          disabled={busy === r.meta.slug}
                          aria-label={`Delete ${r.meta.name}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}