import type { Calculator, Block, PackagesBlock, ItemsBlock } from "@/types/calculator";

function money(v: number | undefined, currency = "EUR") {
  const n = typeof v === "number" && isFinite(v) ? v : 0;
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
  catch { return `${n.toFixed(2)} ${currency}`; }
}

export function RenderBlock({ calc, block }: { calc: Calculator; block: Block }) {
  const currency = calc.i18n?.currency ?? "EUR";

  switch (block.type) {
    case "packages": {
      const packages = Array.isArray(calc.packages) ? calc.packages : [];
      if (packages.length === 0) return null;
      return (
        <section className="space-y-4">
          <div className="font-medium">{block.title ?? "Plans"}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {packages.map((p) => (
              <div
                key={p.id}
                className={`card p-4 space-y-3 ${p.featured ? "accent-glow" : ""}`}
                style={{ borderColor: p.featured ? "var(--accent)" : undefined }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.label}</div>
                  {typeof p.basePrice === "number" ? (
                    <div className="text-sm">{money(p.basePrice, currency)}</div>
                  ) : null}
                </div>
                {p.description ? (
                  <p className="text-sm text-neutral-400">{p.description}</p>
                ) : null}
                {Array.isArray(p.covers) && p.covers.length > 0 ? (
                  <ul className="mt-2 list-disc pl-6 text-sm">
                    {p.covers.map((c, i) => (
                      <li key={i} className={c.premium ? "accent-text" : ""}>{c.text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "items": {
      const b = block as ItemsBlock;
      const items = Array.isArray(calc.items) ? calc.items : [];
      const total = items.reduce((acc, it) => {
        const price = Number.isFinite(it.price) ? Number(it.price) : 0;
        const qty = Number.isFinite(it.qty) ? Number(it.qty) : 0;
        return acc + price * qty;
      }, 0);
      return (
        <section className="space-y-3">
          <div className="font-medium">{block.title ?? "Price list"}</div>
          {items.length === 0 ? (
            <div className="text-sm text-neutral-500">No items.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
              <table className="w-full text-sm">
                <thead style={{ background: "color-mix(in oklab, var(--card) 78%, var(--bg))" }}>
                  <tr className="text-left">
                    <th className="p-3">Item</th>
                    <th className="p-3 w-24">Unit</th>
                    <th className="p-3 w-28">Price</th>
                    <th className="p-3 w-24">Qty</th>
                    <th className="p-3 w-28 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const price = Number.isFinite(it.price) ? Number(it.price) : 0;
                    const qty = Number.isFinite(it.qty) ? Number(it.qty) : 0;
                    const sub = price * qty;
                    return (
                      <tr key={it.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="p-3">
                          <div className="font-medium">{it.label}</div>
                          {it.note ? <div className="text-xs text-neutral-500 mt-1">{it.note}</div> : null}
                        </td>
                        <td className="p-3">{it.unit ?? ""}</td>
                        <td className="p-3">{money(price, currency)}</td>
                        <td className="p-3">{qty || ""}</td>
                        <td className="p-3 text-right">{money(sub, currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {b.showTotals !== false ? (
                  <tfoot>
                    <tr style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="p-3 text-right font-medium" colSpan={4}>Total</td>
                      <td className="p-3 text-right font-semibold">{money(total, currency)}</td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          )}
        </section>
      );
    }

    case "options": {
      const fields = Array.isArray(calc.fields) ? calc.fields : [];
      if (fields.length === 0) return null;
      return (
        <section className="space-y-3">
          <div className="font-medium">{block.title ?? "Options"}</div>
          <div className="rounded-2xl border border-[color:var(--border)]">
            <table className="w-full text-sm">
              <tbody>
                {fields.map((f: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="p-3 w-1/3 text-neutral-500">{String(f?.label ?? f?.key ?? "Option")}</td>
                    <td className="p-3">
                      {f?.type === "select"
                        ? String(f?.default ?? f?.options?.[0]?.label ?? "—")
                        : f?.type === "slider"
                        ? String(f?.default ?? 0)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    case "extras": {
      const addons = Array.isArray(calc.addons) ? calc.addons : [];
      if (addons.length === 0) return null;
      return (
        <section className="space-y-3">
          <div className="font-medium">{block.title ?? "Extras"}</div>
          <ul className="space-y-2 text-sm">
            {addons.map((a: any, i) => {
              const val = Number.isFinite(a?.price) ? a.price : Number.isFinite(a?.value) ? a.value : undefined;
              return (
                <li key={i} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] px-3 py-2">
                  <span>{String(a?.label ?? "Extra")}</span>
                  <span className="text-neutral-400">{val !== undefined ? money(val, currency) : "—"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      );
    }

    default:
      return null;
  }
}