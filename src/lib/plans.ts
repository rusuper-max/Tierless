// src/lib/plans.ts
export type PlanId = "free" | "starter" | "standard" | "business" | "signature";

export type PlanCaps = {
  tiers: number;
  addons: number;
  sliders: number;
  featuresPerTier: number;
  media: { images: number; videos: number };
  style: { basic: boolean; advanced: boolean; customCode: boolean };
  domain: { custom: boolean; removeBadge: boolean };
  analytics: { basic: boolean; events: boolean; ab: boolean };
  integrations: { webhooks: boolean; exportCSV: boolean; exportJSON: boolean; embeds: boolean };
  team: { seats: number };
};

export const planCaps: Record<PlanId, PlanCaps> = {
  free:      { tiers:2, addons:3,  sliders:1, featuresPerTier:8,  media:{images:10,  videos:0},  style:{basic:true, advanced:false, customCode:false}, domain:{custom:false, removeBadge:false}, analytics:{basic:true, events:false, ab:false}, integrations:{webhooks:false, exportCSV:false, exportJSON:false, embeds:false}, team:{seats:1} },
  starter:   { tiers:3, addons:6,  sliders:2, featuresPerTier:10, media:{images:30,  videos:1},  style:{basic:true, advanced:true,  customCode:false}, domain:{custom:false, removeBadge:true }, analytics:{basic:true, events:false, ab:false}, integrations:{webhooks:false, exportCSV:true,  exportJSON:false, embeds:true },  team:{seats:1} },
  standard:  { tiers:5, addons:12, sliders:3, featuresPerTier:16, media:{images:100, videos:3},  style:{basic:true, advanced:true,  customCode:false}, domain:{custom:true,  removeBadge:true }, analytics:{basic:true, events:true,  ab:true },  integrations:{webhooks:false, exportCSV:true,  exportJSON:true,  embeds:true },  team:{seats:1} },
  business:  { tiers:8, addons:99, sliders:4, featuresPerTier:24, media:{images:500, videos:10}, style:{basic:true, advanced:true,  customCode:true },  domain:{custom:true,  removeBadge:true }, analytics:{basic:true, events:true,  ab:true },  integrations:{webhooks:true,  exportCSV:true,  exportJSON:true,  embeds:true },  team:{seats:2} },
  signature: { tiers:99,addons:999,sliders:6, featuresPerTier:48, media:{images:2000,videos:30},style:{basic:true, advanced:true,  customCode:true },  domain:{custom:true,  removeBadge:true }, analytics:{basic:true, events:true,  ab:true },  integrations:{webhooks:true,  exportCSV:true,  exportJSON:true,  embeds:true },  team:{seats:8} },
};

export const DEFAULT_PLAN: PlanId = "free";

export function capsFor(plan: PlanId | undefined | null): PlanCaps {
  return planCaps[(plan || DEFAULT_PLAN) as PlanId];
}