"use client";

import { useMemo, useState } from "react";
import type { Calculator, Package } from "@/types/calculator";

type Props = { calc: Calculator };

export function DemoRenderer({ calc }: Props) {
  const accent = calc.meta?.branding?.accent ?? "#14b8a6";
  const currency = calc.i18n?.currency ?? "EUR";

  // init state
  const [pkg, setPkg] = useState<string>(() => calc.packages?.[0]?.id ?? "");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    (calc.fields ?? []).forEach((f: any) => {
      if (f?.type === "select") init[f.key] = f.default ?? f.options?.[0]?.value ?? "";
      else if (f?.type === "slider") init[f.key] = Number.isFinite(f?.default) ? f.default : (f?.min ?? 0);
    });
    return init;
  });

  // Helpers
  const format = (v: number) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v); }
    catch { return `${v.toFixed(2)} ${currency}`; }
  };

  // Total
  const total = useMemo(() => {
    let sum = 0;

    // base from package
    const p: Package | undefined = (calc.packages ?? []).find((x) => x.id === pkg);
    if (p?.basePrice) sum += p.basePrice;

    // addons: podržavamo više oblika (price || value)
    for (const a of (calc.addons ?? [])) {
      if (!selectedAddons.includes(a?.id ?? a?.label)) continue;
      const val = Number.isFinite(a?.price) ? Number(a.price) :
                  Number.isFinite(a?.value) ? Number(a.value) : 0;
      sum += val;
    }

    // fields: select delta / slider deltaPerUnit
    for (const f of (calc.fields ?? [])) {
      if (!f) continue;
      if (f.type === "select" && Array.isArray(f.options)) {
        const v = fieldValues[f.key];
        const opt = f.options.find((o: any) => String(o.value) === String(v));
        if (opt && Number.isFinite(opt.delta)) sum += Number(opt.delta);
      } else if (f.type === "slider") {
        const v = Number(fieldValues[f.key] ?? f.default ?? 0);
        const dpu = Number(f.deltaPerUnit ?? 0);
        sum += v * dpu;
      }
    }

    return sum;
  }, [calc.addons, calc.fields, calc.packages, fieldValues, selectedAddons, pkg]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: Controls */}
      <div className="space-y-6">
        {/* Packages */}
        {Array.isArray(calc.packages) && calc.packages.length > 0 ? (
          <section className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-medium">Package</h2>
            <div className="grid gap-3">
              {calc.packages.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start justify-between rounded-xl border p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  style={pkg === p.id ? { borderColor: accent } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pkg"
                      checked={pkg === p.id}
                      onChange={() => setPkg(p.id)}
                    />
                    <span className="font-medium">{p.label}</span>
                    {p.featured && (
                      <span className="rounded bg-[var(--accent,#14b8a6)] px-2 py-0.5 text-xs text-white"
                        style={{ background: accent }}>
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-sm opacity-80">
                    {typeof p.basePrice === "number" ? format(p.basePrice) : ""}
                  </div>
                  {p.description && (
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 col-span-2">
                      {p.description}
                    </p>
                  )}
                  {Array.isArray(p.covers) && p.covers.length > 0 && (
                    <ul className="mt-2 list-disc pl-6 text-sm col-span-2">
                      {p.covers.map((c, i) => (
                        <li key={i} className={c.premium ? "text-[var(--accent,#14b8a6)]" : ""} style={c.premium ? { color: accent } : undefined}>
                          {c.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {/* Addons */}
        {Array.isArray(calc.addons) && calc.addons.length > 0 ? (
          <section className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-medium">Extras</h2>
            <div className="space-y-2">
              {calc.addons.map((a: any) => {
                const id = String(a?.id ?? a?.label);
                const checked = selectedAddons.includes(id);
                const price = Number.isFinite(a?.price) ? Number(a.price) :
                              Number.isFinite(a?.value) ? Number(a.value) : undefined;
                return (
                  <label key={id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedAddons((prev) =>
                            e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                          )
                        }
                      />
                      <span>{String(a?.label ?? id)}</span>
                    </div>
                    {price !== undefined ? (
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{format(price)}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Fields */}
        {Array.isArray(calc.fields) && calc.fields.length > 0 ? (
          <section className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-medium">Options</h2>
            <div className="space-y-3">
              {calc.fields.map((f: any) => (
                <div key={String(f?.key ?? "")} className="grid items-center gap-2 sm:grid-cols-3">
                  <div className="text-sm text-neutral-500">{String(f?.label ?? f?.key ?? "Option")}</div>
                  <div className="sm:col-span-2">
                    {f?.type === "select" ? (
                      <select
                        className="field"
                        value={fieldValues[f.key]}
                        onChange={(e) =>
                          setFieldValues((s) => ({ ...s, [f.key]: e.target.value }))
                        }
                      >
                        {Array.isArray(f.options)
                          ? f.options.map((o: any, i: number) => (
                              <option key={i} value={o.value}>
                                {o.label}
                                {Number.isFinite(o.delta) ? ` (${format(Number(o.delta))})` : ""}
                              </option>
                            ))
                          : null}
                      </select>
                    ) : f?.type === "slider" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={Number.isFinite(f.min) ? Number(f.min) : 0}
                          max={Number.isFinite(f.max) ? Number(f.max) : 100}
                          step={Number.isFinite(f.step) ? Number(f.step) : 1}
                          value={Number(fieldValues[f.key] ?? 0)}
                          onChange={(e) =>
                            setFieldValues((s) => ({ ...s, [f.key]: Number(e.target.value) }))
                          }
                          className="w-full"
                        />
                        <span className="text-sm w-12 text-right">
                          {String(fieldValues[f.key] ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm opacity-60">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* RIGHT: Summary */}
      <div className="space-y-4">
        <section className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Summary</h2>
          <div className="text-2xl font-semibold" style={{ color: accent }}>
            {format(total)}
          </div>
          <p className="mt-1 text-sm text-neutral-500">Estimated total</p>
        </section>
      </div>
    </div>
  );
}