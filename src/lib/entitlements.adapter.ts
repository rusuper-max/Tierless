// src/lib/entitlements.adapter.ts
// Adapter preko tvoje postojeće ENTITLEMENTS mape.
// Ne menja postojeću strukturu; samo iz nje izvodi praktične helpers.

import {
  ENTITLEMENTS,
  PLAN_RANK,
  type PlanId,
  type FeatureKey,
  type Limits,
} from "@/lib/entitlements";

export type Plan = PlanId;

export function entitlementsFor(plan: Plan): string[] {
  const e = ENTITLEMENTS[plan];
  const out: string[] = [];

  // Limits → u string obliku koji UI može lako da “parsa”
  const lim = e.limits;
  const asStr = (v: number | "unlimited") =>
    v === "unlimited" ? "unlimited" : String(v);

  out.push(`pages:${asStr(lim.pages)}`);
  out.push(`tiersPerPage:${asStr(lim.tiersPerPage)}`);
  out.push(`items:${asStr(lim.items)}`);
  out.push(`maxPublicPages:${asStr(lim.maxPublicPages)}`);
  out.push(`teamSeats:${asStr(lim.teamSeats)}`);
  out.push(`customDomains:${asStr(lim.customDomains)}`);

  // Features → flagovi tipa "feature:advancedFormulas"
  const feats = e.features;
  (Object.keys(feats) as FeatureKey[]).forEach((k) => {
    if (feats[k]) out.push(`feature:${k}`);
  });

  return out;
}

export function getNumericLimit(
  plan: Plan,
  key: keyof Limits
): number | null {
  const v = ENTITLEMENTS[plan].limits[key];
  return typeof v === "number" ? v : null;
}

export function hasFeature(plan: Plan, feature: FeatureKey): boolean {
  return ENTITLEMENTS[plan].features[feature] === true;
}

export function planRank(plan: Plan): number {
  return PLAN_RANK[plan];
}