"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n";
import type { PlanId, UsageNeeds } from "@/lib/entitlements";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  const t = useT();
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
    // SECURITY FIX: Redirect to Lemon Squeezy checkout instead of directly changing plan
    // The plan will be updated via webhook after successful payment
    try {
      setLoading(true);

      // Build the plan key for checkout (e.g., "starter_yearly", "growth_monthly")
      const planKey = `${requiredPlan}_${interval}`;

      const res = await fetch("/api/integrations/lemon/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Checkout creation failed:", errorData);
        throw new Error(errorData?.error || "checkout_failed");
      }

      const data = await res.json();

      if (data.url) {
        // Redirect to Lemon Squeezy checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (e) {
      console.error("Upgrade failed:", e);
      // Fallback: redirect to pricing page
      window.location.href = `/start?highlight=${requiredPlan}&interval=${interval}`;
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={() => (loading ? null : setOpen(false))}
          aria-hidden
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-[81] h-full w-full max-w-md bg-[var(--bg)]",
          "shadow-2xl border-l border-[var(--border)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={t("Upgrade")}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">{t("Unlock Full Power")} 🚀</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {entrypoint === "limits"
                  ? t("You've reached the limits of your current plan.")
                  : t("This feature is available on higher plans.")}
              </p>
            </div>
            <button
              onClick={() => (loading ? null : setOpen(false))}
              className="rounded-full p-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition"
              aria-label={t("Close")}
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Feature/Limit Context */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#4F46E5]/10 to-[#22D3EE]/10 border border-[#4F46E5]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-[#4F46E5] to-[#22D3EE] opacity-10 blur-2xl rounded-full"></div>

              <h3 className="text-base font-bold text-[var(--text)] mb-2">
                {entrypoint === "limits" ? t("Limit Reached") : t("Premium Feature")}
              </h3>

              {needPairs.length > 0 ? (
                <ul className="space-y-2">
                  {needPairs.map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)] capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="font-bold text-[var(--text)]">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  {t("Upgrade to")}{" "}
                  <span className="font-bold text-[#22D3EE] capitalize">{requiredPlan}</span>
                  {" "}{t("to use this feature without restrictions.")}
                </p>
              )}
            </div>

            {/* Plan Recommendation */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">{t("Recommended Upgrade")}</h4>

              <div
                className={`p-5 rounded-2xl border-2 bg-[var(--card)] relative shadow-lg ${requiredPlan === "starter"
                  ? "border-teal-500 shadow-teal-500/10"
                  : requiredPlan === "growth"
                    ? "border-red-500 shadow-red-500/10"
                    : "border-transparent shadow-indigo-500/10"
                  }`}
                style={requiredPlan === "pro" ? {
                  background: "linear-gradient(var(--card), var(--card)) padding-box, linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #14b8a6 100%) border-box",
                  border: "2px solid transparent"
                } : {}}
              >
                <div
                  className={`absolute -top-3 left-4 px-3 py-1 text-white text-[10px] font-bold uppercase tracking-wide rounded-full ${requiredPlan === "starter"
                    ? "bg-teal-600"
                    : requiredPlan === "growth"
                      ? "bg-red-600"
                      : ""
                    }`}
                  style={requiredPlan === "pro" ? {
                    background: "linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #14b8a6 100%)"
                  } : {}}
                >
                  {t("Best Choice")}
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3
                      className={`text-lg font-bold capitalize ${requiredPlan === "starter"
                          ? "text-teal-500"
                          : requiredPlan === "growth"
                            ? "text-red-500"
                            : ""
                        }`}
                      style={requiredPlan === "pro" ? {
                        background: "linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #14b8a6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      } : {}}
                    >{requiredPlan} Plan</h3>
                    <p className="text-xs text-[var(--muted)]">{t("Everything you need to grow.")}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[var(--text)]">
                      {requiredPlan === "starter" ? "$6.99" : requiredPlan === "growth" ? "$14.99" : "$29.99"}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">/{interval === "yearly" ? t("mo") : t("month")}</div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <Button
                    onClick={handleUpgrade}
                    isLoading={loading}
                    variant={requiredPlan === "pro" ? "brand" : "neutral"}
                    size="md"
                    className={`w-full shadow-lg ${requiredPlan === "starter"
                      ? "!bg-teal-600 hover:!bg-teal-700 !text-white shadow-teal-500/20"
                      : requiredPlan === "growth"
                        ? "!bg-red-600 hover:!bg-red-700 !text-white shadow-red-500/20"
                        : "shadow-indigo-500/20"
                      }`}
                  >
                    {t("Upgrade Now")}
                  </Button>

                  <Link href={`/start?highlight=${requiredPlan}&interval=${interval}`} onClick={() => setOpen(false)} className="block">
                    <Button variant="ghost" size="sm" className="w-full">
                      {t("Compare All Plans")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
