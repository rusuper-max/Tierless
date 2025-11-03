"use client";
/**
 * DEV-ONLY: Tier switcher (press 'D' to toggle)
 * Sets `tl_plan` cookie and reloads page.
 */
import { useEffect, useState } from "react";

const plans = ["free","starter","growth","pro","tierless"] as const;
type PlanId = typeof plans[number];

export default function DevControls() {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PlanId>("free");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)tl_plan=([^;]+)/);
    const raw = decodeURIComponent(m?.[1] || "").toLowerCase();
    if (plans.includes(raw as PlanId)) setPlan(raw as PlanId);
  }, []);

  const setCookie = (p: PlanId) => {
    document.cookie = `tl_plan=${encodeURIComponent(p)}; path=/; max-age=31536000; SameSite=Lax`;
    setPlan(p);
  };

  const apply = () => {
    // refresh da backend odmah pročita plan i odradi auto-trash/move
    location.reload();
  };

  if (!open) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] rounded-xl border border-neutral-300 bg-white shadow-lg p-3 text-sm">
      <div className="font-semibold mb-2">DEV: Plan switcher</div>
      <div className="space-y-1">
        {plans.map((p) => (
          <label key={p} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="dev-plan"
              value={p}
              checked={plan === p}
              onChange={() => setCookie(p)}
            />
            <span className="capitalize">{p}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn btn-plain" onClick={() => setOpen(false)}>Close</button>
        <button className="btn" onClick={apply}>Apply & Reload</button>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">Press “D” to toggle</div>
    </div>
  );
}