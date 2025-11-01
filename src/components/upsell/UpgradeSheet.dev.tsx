"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { t } from "@/i18n";
import type { PlanId, UsageNeeds } from "@/lib/entitlements";

type UpsellOpenDetail = {
  requiredPlan: PlanId;
  entrypoint?: "limits" | "feature" | string;
  needs?: Partial<UsageNeeds>;
  interval?: "monthly" | "yearly";
};

function summarizeNeeds(n?: Partial<UsageNeeds>) {
  if (!n) return [];
  const out: Array<[string, number]> = [];
  if (typeof n.items === "number") out.push(["items", n.items]);
  if (typeof n.pages === "number") out.push(["pages", n.pages]);
  if (typeof n.tiersPerPage === "number") out.push(["tiersPerPage", n.tiersPerPage]);
  if (typeof n.maxPublicPages === "number") out.push(["maxPublicPages", n.maxPublicPages]);
  return out;
}

export default function UpgradeSheetDev() {
  const [open, setOpen] = useState(false);
  const [requiredPlan, setRequiredPlan] = useState<PlanId>("pro");
  const [entrypoint, setEntrypoint] = useState<string>("limits");
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [needs, setNeeds] = useState<Partial<UsageNeeds> | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // PRESRETANJE dogadjaja u CAPTURE fazi da stari listeneri ne pokupe event pre nas
  useEffect(() => {
    function onOpen(ev: Event) {
      // spreči staru verziju da obradi isti event
      // @ts-ignore
      ev.stopImmediatePropagation?.();

      const det = (ev as CustomEvent<UpsellOpenDetail>).detail;
      if (!det) return;

      setRequiredPlan(det.requiredPlan);
      setEntrypoint(det.entrypoint ?? "limits");
      setNeeds(det.needs);
      setInterval(det.interval ?? "yearly");
      setOpen(true);
    }
    // capture: true → naš listener je prvi
    window.addEventListener("TL_UPSELL_OPEN", onOpen as EventListener, { capture: true });
    return () => window.removeEventListener("TL_UPSELL_OPEN", onOpen as EventListener, { capture: true } as any);
  }, []);

  const needPairs = useMemo(() => summarizeNeeds(needs), [needs]);

  async function handleUpgrade() {
    try {
      setLoading(true);
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: requiredPlan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "upgrade_failed");

      window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
      // Success toast optional (Toaster not required here)
      console.log("Plan upgraded:", requiredPlan);
      setOpen(false);
    } catch (e) {
      console.error("Upgrade failed. Please try again or pick a plan on the pricing page.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-slate-900/40"
          onClick={() => (loading ? null : setOpen(false))}
          aria-hidden
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-[81] h-full w-full max-w-md bg-white",
          "shadow-xl border-l border-slate-200",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={t("Upgrade")}
      >
        <div className="flex items-start justify-between p-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">DEV Upgrade Sheet</h2>
            <p className="mt-1 text-sm text-slate-600">
              {entrypoint === "limits"
                ? t("You’ve hit your plan limits. Pick a higher tier to continue.")
                : t("This feature isn’t available on your current plan.")}
            </p>
          </div>
          <button
            onClick={() => (loading ? null : setOpen(false))}
            className="rounded-md p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition disabled:opacity-50"
            aria-label={t("Close")}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="px-5">
          {needPairs.length > 0 && (
            <div className="mb-4 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">{t("What you’re trying to publish")}</p>
              <ul className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-slate-700">
                {needPairs.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border p-4">
            <p className="text-sm text-slate-700">
              {t("Recommended plan")}:
              <span className="ml-1 font-semibold capitalize">{requiredPlan}</span>
            </p>

            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/start?highlight=${requiredPlan}&interval=${interval}`}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:-translate-y-[1px]"
                style={{
                  background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                  border: "2px solid transparent",
                  color: "#0f172a",
                }}
                aria-label={t("See plans")}
                onClick={() => setOpen(false)}
              >
                {t("See plans")}
              </Link>

              <button
                type="button"
                onClick={handleUpgrade}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition hover:-translate-y-[1px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400",
                  "disabled:opacity-60",
                ].join(" ")}
                style={{
                  background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                  border: "2px solid transparent",
                  color: "#0f172a",
                }}
                aria-busy={loading}
                disabled={loading}
              >
                {loading ? t("Upgrading…") : t("Upgrade now")}
              </button>

              <button
                onClick={() => (loading ? null : setOpen(false))}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 disabled:opacity-50"
                disabled={loading}
              >
                {t("Close")}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {t("You’ll be taken to pricing with this plan pre-highlighted if you choose See plans.")}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}