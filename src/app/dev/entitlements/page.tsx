// src/app/dev/entitlements/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Gate from "@/components/gate/Gate";
import type { FeatureKey, PlanId, UsageNeeds } from "@/lib/entitlements";
import { PLAN_ORDER } from "@/lib/entitlements";
import UpgradeSheetDev from "@/components/upsell/UpgradeSheet";

const FEATURES: FeatureKey[] = [
  "customColors",
  "removeBadge",
  "templates",
  "backgroundVideo",
  "eventsAnalytics",
  "advancedFormulas",
  "webhooks",
  "aiAgent",
  "whiteLabel",
];

export default function DevEntitlementsPage() {
  const [planOverride, setPlanOverride] = useState<PlanId>("free");
  const [feature, setFeature] = useState<FeatureKey>("backgroundVideo");

  const [items, setItems] = useState<number>(20);
  const [pages, setPages] = useState<number>(1);
  const [tiersPerPage, setTiersPerPage] = useState<number>(2);
  const [maxPublicPages, setMaxPublicPages] = useState<number>(1);

  const needs: UsageNeeds = useMemo(
    () => ({
      items,
      pages,
      tiersPerPage,
      maxPublicPages,
    }),
    [items, pages, tiersPerPage, maxPublicPages]
  );

  // Emituj ručno TL_UPSELL_OPEN za brzu proveru
  const fireManualUpsell = () => {
    window.dispatchEvent(
      new CustomEvent("TL_UPSELL_OPEN", {
        detail: { requiredPlan: undefined, feature, needs, entrypoint: "manual" },
      })
    );
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Entitlements / Gate — Dev</h1>
          <Link
            href="/start"
            className="rounded-lg px-3 py-2 text-sm font-medium transition"
            style={{ background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box", border: "2px solid transparent", color: "#0f172a" }}
          >
            Open Pricing
          </Link>
        </header>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PLANS */}
          <div className="rounded-2xl border p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Plan override</h2>
            <select
              value={planOverride}
              onChange={(e) => setPlanOverride(e.target.value as PlanId)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {PLAN_ORDER.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <h2 className="text-sm font-semibold text-slate-700 mt-4 mb-2">Feature to test (lock)</h2>
            <select
              value={feature}
              onChange={(e) => setFeature(e.target.value as FeatureKey)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {FEATURES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <button
              onClick={fireManualUpsell}
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm font-medium transition hover:-translate-y-[1px]"
              style={{ background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box", border: "2px solid transparent", color: "#0f172a" }}
            >
              Fire TL_UPSELL_OPEN (manual)
            </button>
          </div>

          {/* LIMITS */}
          <div className="rounded-2xl border p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Limits to test</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="items" value={items} onChange={setItems} />
              <Field label="pages" value={pages} onChange={setPages} />
              <Field label="tiersPerPage" value={tiersPerPage} onChange={setTiersPerPage} />
              <Field label="maxPublicPages" value={maxPublicPages} onChange={setMaxPublicPages} />
            </div>
            <p className="mt-3 text-xs text-slate-500">Povećaj vrednosti iznad limita za trenutni plan da vidiš JIT upsell.</p>
          </div>

          {/* DEMO TARGET */}
          <div className="rounded-2xl border p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Demo Gate</h2>

            <Gate feature={feature} needs={needs} planOverride={planOverride}>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-700">
                  Ovo je “otključana” kontrola — videćeš je samo ako plan dozvoljava feature i limiti nisu probijeni.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition"
                    style={{ background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box", border: "2px solid transparent", color: "#0f172a" }}
                  >
                    Demo action
                  </button>
                  <span className="text-xs text-slate-500">Radi samo kada Gate prođe.</span>
                </div>
              </div>
            </Gate>
          </div>
        </div>
      </section>

      {/* Dev Upsell listener */}
      <UpgradeSheetDev />
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        min={0}
      />
    </label>
  );
}