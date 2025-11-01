// src/components/gate/Gate.tsx
"use client";

import Link from "next/link";
import { t } from "@/i18n";
import { useEntitlement } from "@/hooks/useEntitlement";
import type { FeatureKey, PlanId, UsageNeeds } from "@/lib/entitlements";
import { ENTITLEMENTS, PLAN_ORDER } from "@/lib/entitlements";

type GateProps = {
  /** Ako je zadat, proverava i feature gating. Ako nije — samo limiti. */
  feature?: FeatureKey;
  /** Potrebe koje poredimo sa limitima (items/pages/tiersPerPage/maxPublicPages/...) */
  needs?: UsageNeeds;
  /** Za dev/QA — forsiraj plan bez realne autentikacije. */
  planOverride?: PlanId;
  /** Deep-link interval ka /start za CTA */
  deeplinkInterval?: "monthly" | "yearly";
  /** Deca koja se prikazuju ako gate prođe */
  children: React.ReactNode;
  /** Ako želiš “inline” fallback (bez okvira), postavi true */
  inlineFallback?: boolean;
};

function indexOfPlan(p: PlanId | null | undefined) {
  return p ? PLAN_ORDER.indexOf(p) : -1;
}

export default function Gate({
  feature,
  needs,
  planOverride,
  deeplinkInterval = "yearly",
  children,
  inlineFallback = false,
}: GateProps) {
  const { loading, plan, limits, suggestPlan, openUpsell } = useEntitlement({
    feature, // može biti undefined — hook to podržava
    needs,
    planOverride,
  });

  if (loading) {
    return (
      <div className="rounded-xl border p-4 animate-pulse bg-white">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
      </div>
    );
  }

  const currentPlan = plan ?? "free";

  // 1) Limit check (iz hook-a)
  const withinLimits = !!limits?.ok;

  // 2) Feature check (ako je zadat feature)
  let featureAllowed = true;
  if (feature) {
    try {
      featureAllowed = !!ENTITLEMENTS[currentPlan].features[feature];
    } catch {
      featureAllowed = false;
    }
  }

  const allowed = withinLimits && featureAllowed;

  if (allowed) {
    return <>{children}</>;
  }

  // Fallback: zaključano
  const target = suggestPlan ?? "tierless";
  const isUpgrade = indexOfPlan(target) > indexOfPlan(currentPlan);

  const Wrapper = inlineFallback ? "div" : (props: any) => (
    <div className="rounded-xl border p-4 bg-white" {...props} />
  );

  return (
    <Wrapper>
      <p className="text-sm text-slate-700">
        {!withinLimits && feature
          ? t("This feature or your current limits are not available on your plan.")
          : !withinLimits
          ? t("You have reached your plan limits.")
          : t("This feature isn’t available on your current plan.")
        }
      </p>

      {needs && Object.keys(needs).length > 0 ? (
        <pre className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-700 overflow-auto">
{JSON.stringify(needs, null, 2)}
        </pre>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`/start?highlight=${target}&interval=${deeplinkInterval}`}
          className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:-translate-y-[1px]"
          style={{
            background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
            border: "2px solid transparent",
            color: "#0f172a",
          }}
          aria-label={t("See plans")}
        >
          {t("See plans")}
        </Link>

        <button
          type="button"
          onClick={() =>
            openUpsell({
              requiredPlan: target,
              entrypoint: feature ? "feature" : "limits",
              needs,
              interval: deeplinkInterval,
            } as any) // ← tip-bridge dok ne usaglasimo tip u useEntitlement
          }
          className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:-translate-y-[1px]"
          style={{
            background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
            border: "2px solid transparent",
            color: "#0f172a",
          }}
        >
          {isUpgrade ? t("Upgrade") : t("View plans")}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {t("Recommended: {plan}", { plan: target })}
      </p>
    </Wrapper>
  );
}