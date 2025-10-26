"use client";

import { useEffect, useState } from "react";

type Tpl = {
  slug: string;
  name: string;
  description?: string;
  defaultName?: string;
  mode: "packages" | "list";
};

export default function TemplatesPage() {
  const [rows, setRows] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/templates", { cache: "no-store" });
        const j = (await r.json()) as Tpl[];
        if (alive) setRows(Array.isArray(j) ? j : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function useTemplate(slug: string, name?: string) {
    setBusy(slug);
    try {
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateSlug: slug, name }),
      });
      if (!r.ok) throw new Error("create_failed");
      const json = (await r.json()) as { slug?: string };
      if (json?.slug) window.location.href = `/editor/${json.slug}`;
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-xs text-neutral-500">Ready-made pricing pages.</p>
      </header>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-sm">No templates for now.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((t) => (
            <article key={t.slug} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {t.mode === "list" ? "List of items" : "Packages"}
                  </div>
                </div>
                <span className="badge" title="Mode">{t.mode}</span>
              </div>
              {t.description ? (
                <p className="text-sm text-neutral-400">{t.description}</p>
              ) : null}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => useTemplate(t.slug, t.defaultName || t.name)}
                  disabled={busy === t.slug}
                  className="btn btn-outline"
                  style={{ borderColor: "var(--accent)" }}
                >
                  {busy === t.slug ? "Creating…" : "Use this template"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}