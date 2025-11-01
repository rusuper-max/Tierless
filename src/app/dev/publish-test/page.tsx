// src/app/dev/publish-test/page.tsx
"use client";

import { useState } from "react";
import type { PlanId, UsageNeeds } from "@/lib/entitlements";
import PublishGuardButton from "@/components/publish/PublishGuardButton";

const PLAN_OPTS: PlanId[] = ["free", "starter", "growth", "pro", "tierless"];

// Koercija na number za prikaz u inputima (UsageNeeds može biti number | "unlimited" | undefined)
function n(v: UsageNeeds[keyof UsageNeeds] | undefined, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

export default function PublishTestPage() {
  const [plan, setPlan] = useState<PlanId>("free");
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [needs, setNeeds] = useState<UsageNeeds>({
    items: 150,       // namerno preko Free limita
    pages: 1,
    tiersPerPage: 3,
    maxPublicPages: 0,
  });

  async function doPublish() {
    // Poziv backendu; prosledi plan header da /api/publish zna “trenutni plan”
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-plan": plan,
      },
      body: JSON.stringify({ needs }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Publish blocked");
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Publish Guard — Dev Test</h1>
      <p className="mt-2 text-slate-600">
        Ovde testiraš modal sa <b>See plans</b> i deep-link ka <code>/start?highlight=…&interval=…</code>.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Plan */}
        <div className="rounded-xl border p-4">
          <label className="block text-sm font-medium mb-2">Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanId)}
            className="w-full rounded-md border px-3 py-2"
          >
            {PLAN_OPTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Interval za deep-link */}
        <div className="rounded-xl border p-4">
          <label className="block text-sm font-medium mb-2">Deep-link interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as "monthly" | "yearly")}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
          <p className="mt-2 text-xs text-slate-600">
            Prosleđuje se u <code>PublishGuardButton.deeplinkInterval</code>.
          </p>
        </div>

        {/* Needs kratko */}
        <div className="rounded-xl border p-4">
          <label className="block text-sm font-medium mb-2">Needs (kratko)</label>
          <div className="grid grid-cols-3 gap-2 items-end">
            <NumberField label="items" value={n(needs.items)} onChange={(v) => setNeeds({ ...needs, items: v })} />
            <NumberField label="pages" value={n(needs.pages)} onChange={(v) => setNeeds({ ...needs, pages: v })} />
            <NumberField
              label="tiersPerPage"
              value={n(needs.tiersPerPage)}
              onChange={(v) => setNeeds({ ...needs, tiersPerPage: v })}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-4 bg-slate-50">
        <pre className="text-xs text-slate-700 overflow-auto">{JSON.stringify({ plan, interval, needs }, null, 2)}</pre>
      </div>

      <div className="mt-6">
        <PublishGuardButton
          needs={needs}
          onPublish={doPublish}
          deeplinkInterval={interval}
          planOverride={plan}
          label="Publish"
        />
        <p className="mt-2 text-xs text-slate-500">
          Ako si iznad limita — pojaviće se modal sa <b>See plans</b> i <b>Upgrade</b>.
        </p>
      </div>
    </main>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border px-2 py-1.5"
      />
    </label>
  );
}