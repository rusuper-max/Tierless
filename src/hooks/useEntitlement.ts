// src/hooks/useEntitlement.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureKey, PlanId, UsageNeeds } from "@/lib/entitlements";
import {
  canFeature,
  findPlanForNeeds,
  suggestPlanByLimits,
  withinLimits,
} from "@/lib/entitlements";

export function openUpsell(payload: {
  requiredPlan: PlanId;
  entrypoint?: "limits" | "feature" | string;
  needs?: Partial<UsageNeeds>;
  interval?: "monthly" | "yearly";
}) {
  window.dispatchEvent(new CustomEvent("TL_UPSELL_OPEN", { detail: payload }));
}

type UseUserPlanState = {
  plan: PlanId | null;
  loading: boolean;
  error?: string;
};

export function useUserPlan(): UseUserPlanState {
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const me = await fetch("/api/me", { credentials: "include", cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
        const p = me?.user?.plan as PlanId | undefined;
        if (mounted) setPlan(p && ["free","starter","growth","pro","tierless"].includes(p) ? p : "free");
      } catch {
        if (mounted) setPlan("free");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();

    const onChanged = () => run();
    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);
    return () => {
      mounted = false;
      window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
    };
  }, []);

  return { plan, loading };
}

export function useEntitlement(opts: {
  feature?: FeatureKey;
  needs?: UsageNeeds;
  planOverride?: PlanId | null;
}) {
  const { plan: ctxPlan, loading } = useUserPlan();
  const plan = opts.planOverride ?? ctxPlan ?? null;

  const featureCheck = useMemo(() => {
    if (!opts.feature || !plan) return { allowed: true as boolean, requiredPlan: undefined as PlanId | undefined };
    return canFeature(opts.feature, plan);
  }, [opts.feature, plan]);

  const limitsCheck = useMemo(() => {
    if (!opts.needs || !plan) return { ok: true, failures: [] as any[] };
    return withinLimits(opts.needs, plan);
  }, [opts.needs, plan]);

  const suggestPlan = useMemo(() => {
    if (!plan) return null;
    if (opts.feature && !featureCheck.allowed) return featureCheck.requiredPlan ?? findPlanForNeeds({});
    if (opts.needs && !limitsCheck.ok) return suggestPlanByLimits(opts.needs, plan);
    return null;
  }, [plan, opts.feature, opts.needs, featureCheck, limitsCheck]);

  const openUpsellFromHook = useCallback(
    (entry: { requiredPlan?: PlanId; feature?: FeatureKey; needs?: UsageNeeds; interval?: "monthly" | "yearly" }) => {
      const required = entry.requiredPlan ?? suggestPlan ?? "pro";
      const entrypoint: "limits" | "feature" = entry.feature ? "feature" : "limits";
      openUpsell({
        requiredPlan: required,
        entrypoint,
        needs: entry.needs,
        interval: entry.interval ?? "yearly",
      });
    },
    [suggestPlan]
  );

  return {
    loading,
    plan,
    feature: featureCheck,
    limits: limitsCheck,
    suggestPlan,
    openUpsell: openUpsellFromHook,
  };
}