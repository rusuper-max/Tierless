"use client";

import { useEffect, useMemo, useState } from "react";
import type { Calculator, Branding, Item, PricingMode } from "@/types/calculator";

type PlanId = "free" | "starter" | "pro" | "business";
const LIMITS: Record<PlanId, { maxPackages: number; maxItems: number; canHideBadge: boolean }> = {
  free:     { maxPackages: 2,  maxItems: 50,   canHideBadge: false },
  starter:  { maxPackages: 3,  maxItems: 200,  canHideBadge: true  },
  pro:      { maxPackages: 99, maxItems: 1000, canHideBadge: true  },
  business: { maxPackages: 999,maxItems: 100000, canHideBadge: true },
};
const DEV = process.env.NODE_ENV !== "production";

function money(n?: number, currency = "EUR") {
  const v = typeof n === "number" && isFinite(n) ? n : 0;
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v); }
  catch { return `${v.toFixed(2)} ${currency}`; }
}

export default function EditorClient({ slug }: { slug: string }) {
  const [data, setData] = useState<Calculator | null>(null);
  const [plan, setPlan] = useState<PlanId>("free");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dupLoading, setDupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // whoami → za Public link (?u=<userId>)
  const [ownerId, setOwnerId] = useState<string>("");

  // toasts
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  function showToast(text: string, kind: "ok" | "err" = "ok") {
    setToast({ text, kind }); setTimeout(() => setToast(null), 2200);
  }

  const canSave = useMemo(() => {
    if (!data) return false;
    const name = (data.meta?.name || "").trim();
    if (name.length < 3) return false;
    return true;
  }, [data]);

  // Load
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);

    fetch(`/api/me`, { credentials: "same-origin", cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then((me) => {
        const p = me?.user?.plan;
        setPlan(p === "starter" || p === "pro" || p === "business" ? p : "free");
      })
      .catch(() => { setPlan("free"); });

    // ko je owner (za Public ?u=)
    fetch("/api/whoami", { credentials: "same-origin", cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive && j?.userId) setOwnerId(j.userId); })
      .catch(() => {});

    fetch(`/api/calculators/${slug}`, {
      method: "GET", credentials: "same-origin", headers: { "cache-control": "no-store" },
    })
      .then(async (res) => { if (!res.ok) throw new Error(`GET ${res.status}`); return res.json(); })
      .then((json) => {
        if (!alive) return;
        const calc = json as Calculator;
        if (!calc.pricingMode) calc.pricingMode = "packages";
        if (calc.pricingMode === "list" && !Array.isArray(calc.items)) calc.items = [];
        // defaults for branding
        calc.meta.branding = {
          theme: calc.meta.branding?.theme ?? "dark",
          accent: calc.meta.branding?.accent ?? "#7c3aed",
          layout: calc.meta.branding?.layout ?? "cards",
          hideBadge: calc.meta.branding?.hideBadge ?? false,
        };
        setData(calc);
      })
      .catch((e) => { console.error(e); setError("Failed to load page."); })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [slug]);

  async function handleSave() {
    if (!data) return;
    if ((data.meta?.name || "").trim().length < 3) {
      showToast("Name must be at least 3 characters.", "err"); return;
    }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/calculators/${slug}`, {
        method: "PUT", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.text();
if (!res.ok) {
  let reason = "save_failed";
  try {
    const j = JSON.parse(payload);
    if (j?.error) reason = j.error;
    if (j?.detail && typeof j.detail === "string") console.error("SAVE detail:", j.detail);
  } catch {
    // payload nije JSON
  }
  console.error("SAVE /api/calculators/", slug, "->", payload);
  showToast(`Save failed: ${reason}`, "err");
  throw new Error(`PUT ${res.status}: ${payload}`);
}
      showToast("Saved.");
    } catch (e) {
      console.error(e); setError("Save failed.");
    } finally { setSaving(false); }
  }

  async function handleDuplicate() {
    if (!data) return;
    setDupLoading(true); setError(null);
    try {
      const res = await fetch("/api/calculators", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: slug, name: `Copy of ${data.meta.name}` }),
      });
      if (!res.ok) throw new Error(`POST duplicate ${res.status}`);
      const json = (await res.json()) as { ok?: boolean; slug?: string };
      if (!json?.slug) throw new Error("No slug");
      showToast("Duplicated."); window.location.href = `/editor/${json.slug}`;
    } catch (e) {
      console.error(e); setError("Duplicate failed."); showToast("Duplicate failed.", "err");
    } finally { setDupLoading(false); }
  }

  function setPricingMode(mode: PricingMode) {
    if (!data) return;
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, pricingMode: mode };
      if (mode === "list" && !Array.isArray(next.items)) next.items = [];
      return next;
    });
  }

  // Items helpers
  function addItem() {
    if (!data) return;
    const id = `item${Date.now()}`;
    const next = { id, label: "New item", price: 0, qty: 1 };
    setData({ ...data, items: [...(data.items ?? []), next] as any });
  }
  function updateItem(id: string, patch: Partial<Item>) {
    if (!data) return;
    const items = (data.items ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it));
    setData({ ...data, items });
  }
  function removeItem(id: string) {
    if (!data) return;
    const items = (data.items ?? []).filter((it) => it.id !== id);
    setData({ ...data, items });
  }

  if (loading) return <main className="container-page"><div className="text-sm text-neutral-500">Loading…</div></main>;
  if (error)   return <main className="container-page"><div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div></main>;
  if (!data)   return <main className="container-page"><div className="text-sm text-neutral-500">No data.</div></main>;

  const currency = data?.i18n?.currency ?? "EUR";
  const branding: Branding = {
    theme: data?.meta.branding?.theme ?? "dark",
    accent: data?.meta.branding?.accent ?? "#7c3aed",
    layout: data?.meta.branding?.layout ?? "cards",
    hideBadge: data?.meta.branding?.hideBadge ?? false,
  };

  const itemsTotal = (data.items ?? []).reduce((acc, it: any) => {
    const price = Number.isFinite(it?.price) ? Number(it.price) : 0;
    const qty = Number.isFinite(it?.qty) ? Number(it.qty) : 0;
    return acc + price * qty;
  }, 0);

  // Public href sa owner-om (sprečava 404 na /p/[slug])
  const publicHref = `/p/${data.meta.slug}${ownerId ? `?u=${encodeURIComponent(ownerId)}` : ""}`;

  return (
    <main className="container-page space-y-6" style={{ ["--accent" as any]: branding.accent }}
      data-theme={branding.theme === "light" ? "light" : undefined}
    >
      {toast ? (
        <div className={`fixed right-4 top-4 z-50 rounded-lg border px-3 py-2 text-sm shadow ${toast.kind === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"}`}>
          {toast.text}
        </div>
      ) : null}

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.meta.name}</h1>
          <p className="text-xs text-neutral-500">/editor/{data.meta.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Public sa ?u=ownerId */}
          <a href={publicHref} className="btn">Public</a>
          <button onClick={handleDuplicate} disabled={dupLoading} className="btn accent-border">
            {dupLoading ? "Duplicating…" : "Duplicate"}
          </button>
          <button onClick={handleSave} disabled={saving || !canSave} className="btn accent-border">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Meta */}
      <section className="card p-4 space-y-3">
        <div className="font-medium">Meta</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm sm:col-span-2">
            <span className="block text-neutral-500">Name</span>
            <input className="field mt-1" value={data.meta.name}
              onChange={(e) => setData({ ...data, meta: { ...data.meta, name: e.target.value } })}
            />
            {(data.meta.name || "").trim().length < 3 ? (
              <span className="mt-1 block text-xs text-red-600">Min 3 characters.</span>
            ) : null}
          </label>
          <label className="text-sm">
            <span className="block text-neutral-500">Slug</span>
            <input className="field mt-1" value={data.meta.slug} readOnly />
          </label>
        </div>
      </section>

      {/* Branding */}
      <section className="card p-4 space-y-4">
        <div className="font-medium">Branding</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-sm">
            <div className="text-neutral-500 mb-1">Theme</div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="theme" checked={(branding.theme ?? "dark") === "dark"}
                  onChange={() => setData({ ...data, meta: { ...data.meta, branding: { ...branding, theme: "dark" } } })}
                />
                <span>Dark</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="theme" checked={branding.theme === "light"}
                  onChange={() => setData({ ...data, meta: { ...data.meta, branding: { ...branding, theme: "light" } } })}
                />
                <span>Light</span>
              </label>
            </div>
          </div>

          <div className="text-sm sm:col-span-2">
            <div className="text-neutral-500 mb-1">Accent color</div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { name: "Purple", val: "#7c3aed" },
                { name: "Orange", val: "#f97316" },
                { name: "Teal",   val: "#14b8a6" },
              ].map(p => (
                <button key={p.val}
                  className="btn"
                  style={{ borderColor: p.val }}
                  onClick={() => setData({ ...data, meta: { ...data.meta, branding: { ...branding, accent: p.val } } })}
                >
                  <span className="inline-block h-3 w-3 rounded-full mr-2" style={{ background: p.val }} />
                  {p.name}
                </button>
              ))}
              <label className="btn">
                <span className="mr-2">Custom</span>
                <input type="color" value={branding.accent ?? "#7c3aed"}
                  onChange={(e) => setData({ ...data, meta: { ...data.meta, branding: { ...branding, accent: e.target.value } } })}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-3 text-xs">
          Preview · accent <span className="accent-text font-semibold">{branding.accent}</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="card p-3 accent-glow">
              <div className="text-sm font-medium">Featured plan</div>
              <div className="text-xs text-neutral-400 mt-1">Example glow with current accent.</div>
            </div>
            <div className="card p-3">
              <button className="btn accent-border">Button</button>
              <input className="field ml-2" placeholder="Field" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing mode */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Pricing Mode</div>
          <div className="text-xs text-neutral-500">
            {(data.pricingMode ?? "packages") === "packages"
              ? `${(data.packages ?? []).length} packages`
              : `${(data.items ?? []).length} items`}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={(data.pricingMode ?? "packages") === "packages"} onChange={() => setPricingMode("packages")} />
            <span>Packages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={data.pricingMode === "list"} onChange={() => setPricingMode("list")} />
            <span>List of items</span>
          </label>
        </div>
      </section>

      {/* Items editor (list mode) */}
      {data.pricingMode === "list" ? (
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Items</div>
            <button className="btn accent-border" onClick={addItem}>+ Add item</button>
          </div>
          {(data.items ?? []).length === 0 ? (
            <div className="text-sm text-neutral-500">No items yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Label</th>
                    <th className="p-2 w-24">Unit</th>
                    <th className="p-2 w-28">Price</th>
                    <th className="p-2 w-24">Qty</th>
                    <th className="p-2 w-28 text-right">Subtotal</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items ?? []).map((it) => {
                    const price = Number.isFinite((it as any).price) ? Number((it as any).price) : 0;
                    const qty = Number.isFinite((it as any).qty) ? Number((it as any).qty) : 0;
                    const sub = price * qty;
                    return (
                      <tr key={(it as any).id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="p-2">
                          <input className="field" value={(it as any).label ?? ""} onChange={(e) => updateItem((it as any).id, { label: e.target.value } as any)} />
                          {(it as any).note ? (
                            <input className="field mt-2" placeholder="Note (optional)" value={(it as any).note}
                              onChange={(e) => updateItem((it as any).id, { note: e.target.value } as any)} />
                          ) : (
                            <button className="text-xs underline mt-1" onClick={() => updateItem((it as any).id, { note: "" } as any)}>+ note</button>
                          )}
                        </td>
                        <td className="p-2">
                          <input className="field" placeholder="h / pcs" value={(it as any).unit ?? ""} onChange={(e) => updateItem((it as any).id, { unit: e.target.value } as any)} />
                        </td>
                        <td className="p-2">
                          <input className="field" type="number" min={0}
                            value={Number.isFinite((it as any).price) ? String((it as any).price) : ""}
                            onChange={(e) => updateItem((it as any).id, { price: e.target.value === "" ? undefined : Number(e.target.value) } as any)} />
                        </td>
                        <td className="p-2">
                          <input className="field" type="number" min={0}
                            value={Number.isFinite((it as any).qty) ? String((it as any).qty) : ""}
                            onChange={(e) => updateItem((it as any).id, { qty: e.target.value === "" ? undefined : Number(e.target.value) } as any)} />
                        </td>
                        <td className="p-2 text-right">{money(sub, currency)}</td>
                        <td className="p-2 text-right">
                          <button className="btn btn-danger" onClick={() => removeItem((it as any).id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="p-2 text-right font-medium" colSpan={4}>Total</td>
                    <td className="p-2 text-right font-semibold">{money(itemsTotal, currency)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/* Debug only in dev */}
      {DEV ? (
        <section className="card p-4 space-y-3">
          <div className="font-medium">Config (debug)</div>
          <pre className="overflow-auto rounded-lg border bg-black/30 p-3 text-xs">
{JSON.stringify(
  { i18n: data.i18n ?? {}, pricingMode: data.pricingMode ?? "packages", packages: data.packages ?? [], items: data.items ?? [], addons: data.addons ?? [], fields: data.fields ?? [], branding },
  null,
  2
)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}