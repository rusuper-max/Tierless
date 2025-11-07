// src/hooks/useEntitlement.ts
"use client";

import { useCallback, useMemo } from "react";
import type { FeatureKey, PlanId, UsageNeeds } from "@/lib/entitlements";
import {
  canFeature,
  findPlanForNeeds,
  suggestPlanByLimits,
  withinLimits,
  ENTITLEMENTS,
} from "@/lib/entitlements";
import { useAccount } from "./useAccount";

export function openUpsell(payload: {
  requiredPlan: PlanId;
  entrypoint?: "limits" | "feature" | string;
  needs?: Partial<UsageNeeds>;
  interval?: "monthly" | "yearly";
}) {
  window.dispatchEvent(new CustomEvent("TL_UPSELL_OPEN", { detail: payload }));
}

export function useEntitlement(opts: {
  feature?: FeatureKey;
  needs?: UsageNeeds;
  /** ako želiš ručno da “glumiš” plan (npr. u previewu) */
  planOverride?: PlanId | null;
}) {
  const account = useAccount(); // << jedini izvor istine
  const plan = (opts.planOverride ?? account.plan) as PlanId;
  const loading = account.loading;

  const featureCheck = useMemo(() => {
    if (!opts.feature) return { allowed: true as boolean, requiredPlan: undefined as PlanId | undefined };
    return canFeature(opts.feature, plan);
  }, [opts.feature, plan]);

  const limitsCheck = useMemo(() => {
    if (!opts.needs) return { ok: true, failures: [] as any[] };
    return withinLimits(opts.needs, plan);
  }, [opts.needs, plan]);

  const suggestPlan = useMemo(() => {
    if (opts.feature && !featureCheck.allowed) {
      return featureCheck.requiredPlan ?? findPlanForNeeds({});
    }
    if (opts.needs && !limitsCheck.ok) {
      return suggestPlanByLimits(opts.needs, plan);
    }
    return null;
  }, [plan, opts.feature, opts.needs, featureCheck, limitsCheck]);

  const openUpsellFromHook = useCallback(
    (entry: {
      requiredPlan?: PlanId;
      feature?: FeatureKey;
      needs?: UsageNeeds;
      interval?: "monthly" | "yearly";
    }) => {
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
    limits: ENTITLEMENTS[plan].limits,
    feature: featureCheck,
    limitsCheck,
    suggestPlan,
    openUpsell: openUpsellFromHook,
  };
}