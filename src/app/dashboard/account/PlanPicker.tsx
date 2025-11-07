"use client";

import { useState } from "react";

type PlanId = "free" | "starter" | "growth" | "pro" | "tierless";

export default function PlanPicker({ initialPlan }: { initialPlan: PlanId }) {
  const [saving, setSaving] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string>("");

  async function setPlan(plan: PlanId) {
    try {
      setSaving(plan);
      setMessage("");
      const r = await fetch("/api/me/plan", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      // obavijesti ostatak app-a da se plan promijenio (sidebar, hooks…)
      window.dispatchEvent(new CustomEvent("TL_AUTH_CHANGED"));
      setMessage("Saved");
    } catch (err: any) {
      setMessage(err?.message ?? "Error");
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const Btn = ({ id, label }: { id: PlanId; label: string }) => (
    <button
      onClick={() => setPlan(id)}
      disabled={!!saving}
      className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-60"
      aria-busy={saving === id}
    >
      {label}
    </button>
  );

  return (
    <div className="card p-6 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <b>Plan</b>
        {message && <span className="text-xs text-neutral-500">{message}</span>}
      </div>

      <div className="flex gap-2">
        <Btn id="starter" label="Starter" />
        <Btn id="growth"  label="Growth" />
        <Btn id="pro"     label="Pro" />
      </div>

      <div className="text-xs text-neutral-500">
        Current: <code>{initialPlan}</code>
      </div>
    </div>
  );
}