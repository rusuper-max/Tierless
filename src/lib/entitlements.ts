// src/lib/entitlements.ts
// Centralizovane dozvole, limiti i pomoćne funkcije za gating/upsell.

export type PlanId = "free" | "starter" | "growth" | "pro" | "tierless";

export type FeatureKey =
  | "customColors"
  | "removeBadge"
  | "templates"
  | "backgroundVideo"
  | "eventsAnalytics"
  | "advancedFormulas"
  | "webhooks"
  | "aiAgent"
  | "whiteLabel";

export type Limits = {
  pages: number | "unlimited";
  tiersPerPage: number | "unlimited";
  items: number | "unlimited";
  /** Koliko stranica može biti ONLINE istovremeno (tj. “published” cap) */
  maxPublicPages: number | "unlimited";
  teamSeats: number | "unlimited";
  customDomains: number | "unlimited";
};

export type Entitlements = {
  features: Record<FeatureKey, boolean>;
  limits: Limits;
};

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  tierless: 4,
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "growth", "pro", "tierless"];

// ---- Defaults & guards ----
// default plan koji koristimo kad nema ničega u cookie/session-u
export const DEFAULT_PLAN: PlanId = "free";

// helpers
export const isPlanId = (v: unknown): v is PlanId =>
  typeof v === "string" && (PLAN_ORDER as readonly string[]).includes(v);

export const coercePlan = (v: unknown): PlanId =>
  isPlanId(v) ? v : DEFAULT_PLAN;

// Glavna mapa: šta koji plan dozvoljava
export const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    features: {
      customColors: false,
      removeBadge: false,
      templates: false,
      backgroundVideo: false,
      eventsAnalytics: false,
      advancedFormulas: false,
      webhooks: false,
      aiAgent: false,
      whiteLabel: false,
    },
    limits: {
      pages: 1,
      tiersPerPage: 2,
      items: 20,
      maxPublicPages: 1, // published cap
      teamSeats: 1,
      customDomains: 0,
    },
  },
  starter: {
    features: {
      customColors: true,
      removeBadge: true,
      templates: false,
      backgroundVideo: false,
      eventsAnalytics: false,
      advancedFormulas: false,
      webhooks: false,
      aiAgent: false,
      whiteLabel: false,
    },
    limits: {
      pages: 1,
      tiersPerPage: 3,
      items: 40,
      maxPublicPages: 1, // published cap
      teamSeats: 1,
      customDomains: 0,
    },
  },
  growth: {
    features: {
      customColors: true,
      removeBadge: true,
      templates: true,
      backgroundVideo: true,
      eventsAnalytics: true,
      advancedFormulas: false,
      webhooks: false,
      aiAgent: false,
      whiteLabel: false,
    },
    limits: {
      pages: 2,
      tiersPerPage: 5,
      items: 80,
      maxPublicPages: 2, // published cap
      teamSeats: 1,
      customDomains: 0,
    },
  },
  pro: {
    features: {
      customColors: true,
      removeBadge: true,
      templates: true,
      backgroundVideo: true,
      eventsAnalytics: true,
      advancedFormulas: true,
      webhooks: true,
      aiAgent: false,
      whiteLabel: false,
    },
    limits: {
      pages: 5,
      tiersPerPage: 5,
      items: 130,
      maxPublicPages: 3, // ← traženo: 3 published stranice
      teamSeats: 3,
      customDomains: 0,
    },
  },
  tierless: {
    features: {
      customColors: true,
      removeBadge: true,
      templates: true,
      backgroundVideo: true,
      eventsAnalytics: true,
      advancedFormulas: true,
      webhooks: true,
      aiAgent: true,
      whiteLabel: true,
    },
    limits: {
      pages: "unlimited",
      tiersPerPage: "unlimited",
      items: 300, // anti-abuse cap
      maxPublicPages: 5, // ← “možda 5” — lako podižeš na 10 kad poželiš
      teamSeats: 10,
      customDomains: 3,
    },
  },
};

// ---- Helpers ----

export function hasFeature(plan: PlanId, feature: FeatureKey): boolean {
  return ENTITLEMENTS[plan].features[feature] === true;
}

export function firstPlanWithFeature(feature: FeatureKey): PlanId {
  return PLAN_ORDER.find((p) => ENTITLEMENTS[p].features[feature]) ?? "tierless";
}

export function canFeature(feature: FeatureKey, plan: PlanId): { allowed: boolean; requiredPlan?: PlanId } {
  const allowed = hasFeature(plan, feature);
  if (allowed) return { allowed: true };
  return { allowed: false, requiredPlan: firstPlanWithFeature(feature) };
}

export type UsageNeeds = Partial<
  Pick<Limits, "pages" | "tiersPerPage" | "items" | "maxPublicPages" | "teamSeats" | "customDomains">
>;

export type LimitsCheck = {
  ok: boolean;
  failures: Array<{ key: keyof Limits; need: number; allow: number | "unlimited" }>;
};

// Nađi najniži plan koji zadovoljava zadate potrebe (brojčani limiti)
export function findPlanForNeeds(needs: UsageNeeds): PlanId {
  const ok = (p: PlanId) => withinLimits(needs, p).ok;
  return PLAN_ORDER.find(ok) ?? "tierless";
}

// Da li su potrebe unutar limita datog plana
export function withinLimits(
  needs: UsageNeeds,
  plan: PlanId
): LimitsCheck {
  const lim = ENTITLEMENTS[plan].limits;
  const failures: Array<{ key: keyof Limits; need: number; allow: number | "unlimited" }> = [];

  (["pages", "tiersPerPage", "items", "maxPublicPages", "teamSeats", "customDomains"] as const).forEach((key) => {
    const need = needs[key];
    if (need == null) return;
    const allow = lim[key];
    if (allow !== "unlimited" && typeof need === "number" && need > allow) {
      failures.push({ key, need, allow });
    }
  });

  return { ok: failures.length === 0, failures };
}

// Sugeriši plan po limitima: minimalni plan koji prolazi
export function suggestPlanByLimits(needs: UsageNeeds, current: PlanId): PlanId | null {
  if (withinLimits(needs, current).ok) return null;
  return PLAN_ORDER.find((p) => withinLimits(needs, p).ok) ?? "tierless";
}

/** Helper alias da bude jasno da je “published cap” = limits.maxPublicPages */
export function getPublishedCap(plan: PlanId): number | "unlimited" {
  return ENTITLEMENTS[plan].limits.maxPublicPages;
}

