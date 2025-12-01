// src/lib/entitlements.ts

export type PlanId = "free" | "starter" | "growth" | "pro" | "tierless";

export type FeatureKey =
  | "customColors"       // Edit brand colors
  | "removeBadge"        // Remove "Powered by Tierless"
  | "templates"          // Access to templates
  | "backgroundVideo"    // (Future)
  | "eventsAnalytics"    // Basic view counters
  | "advancedFormulas"   // (Future)
  | "webhooks"           // (Future)
  | "aiAgent"            // (Future)
  | "whiteLabel"         // Full whitelabel
  | "ocrImport"          // Scan menu from image
  | "canEmbed"           // Embed menu on external website
  | "premiumFonts"       // Access to non-system fonts
  | "premiumThemes";     // Access to Luxury/Midnight themes

export type Limits = {
  /** Total number of pages user can create (Draft + Public) */
  pages: number | "unlimited";
  /** Number of pages that can be ONLINE simultaneously (STRICT LIMIT) */
  maxPublicPages: number | "unlimited";
  tiersPerPage: number | "unlimited";
  items: number | "unlimited";
  teamSeats: number | "unlimited";
  customDomains: number | "unlimited";
  /** Image upload size limit in bytes */
  uploadSize: number;
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
  tierless: 999, // Founder plan - highest rank
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "growth", "pro", "tierless"];
export const DEFAULT_PLAN: PlanId = "free";

export const isPlanId = (v: unknown): v is PlanId =>
  typeof v === "string" && (PLAN_ORDER as readonly string[]).includes(v);

export const coercePlan = (v: unknown): PlanId =>
  isPlanId(v) ? v : DEFAULT_PLAN;

// --- FINAL CONFIGURATION ---
export const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    features: {
      customColors: false,
      removeBadge: false,
      templates: true,
      backgroundVideo: false,
      eventsAnalytics: false,
      advancedFormulas: false,
      webhooks: false,
      aiAgent: false,
      whiteLabel: false,
      ocrImport: false,
      canEmbed: false,
      premiumFonts: false,
      premiumThemes: false,
    },
    limits: {
      pages: 3,              // 3 Drafts allowed
      maxPublicPages: 1,     // Only 1 LIVE page
      tiersPerPage: 2,
      items: 15,             // Strict teaser limit
      teamSeats: 1,
      customDomains: 0,
      uploadSize: 2 * 1024 * 1024, // 2 MB
    },
  },
  starter: {
    features: {
      customColors: true,
      removeBadge: false,    // Badge stays
      templates: true,
      backgroundVideo: false,
      eventsAnalytics: true,
      advancedFormulas: false,
      webhooks: false,
      aiAgent: false,
      whiteLabel: false,
      ocrImport: true,       // Key feature: AI Scan
      canEmbed: false,
      premiumFonts: true,    // Better typography
      premiumThemes: false,
    },
    limits: {
      pages: 5,
      maxPublicPages: 3,     // 3 Live pages (e.g. Food, Drinks, Happy Hour)
      tiersPerPage: 3,
      items: 50,             // Good for cafes
      teamSeats: 1,
      customDomains: 0,
      uploadSize: 5 * 1024 * 1024, // 5 MB
    },
  },
  growth: {
    features: {
      customColors: true,
      removeBadge: true,     // No branding!
      templates: true,
      backgroundVideo: true,
      eventsAnalytics: true,
      advancedFormulas: false,
      webhooks: false,
      aiAgent: false,
      whiteLabel: false,
      ocrImport: true,
      canEmbed: true,        // Key feature: Website Embed
      premiumFonts: true,
      premiumThemes: true,   // All themes unlocked
    },
    limits: {
      pages: 10,
      maxPublicPages: 5,     // 5 Live pages (Enough for one serious restaurant)
      tiersPerPage: 5,
      items: 100,            // Good for full restaurants
      teamSeats: 3,
      customDomains: 0,
      uploadSize: 8 * 1024 * 1024, // 8 MB
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
      aiAgent: true,
      whiteLabel: true,
      ocrImport: true,
      canEmbed: true,
      premiumFonts: true,
      premiumThemes: true,
    },
    limits: {
      pages: 50,
      maxPublicPages: 10,    // 10 Live pages
      tiersPerPage: "unlimited",
      items: "unlimited",
      teamSeats: 10,
      customDomains: 3,      // Key feature: 3 Custom Domains
      uploadSize: 15 * 1024 * 1024, // 15 MB
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
      ocrImport: true,
      canEmbed: true,
      premiumFonts: true,
      premiumThemes: true,
    },
    limits: {
      pages: "unlimited",
      maxPublicPages: "unlimited",
      tiersPerPage: "unlimited",
      items: "unlimited",
      teamSeats: "unlimited",
      customDomains: "unlimited",
      uploadSize: 50 * 1024 * 1024, // 50 MB
    },
  },
};

// --- HELPERS ---

export function hasFeature(plan: PlanId, feature: FeatureKey): boolean {
  return ENTITLEMENTS[plan].features[feature] === true;
}

export function getLimit(plan: PlanId, key: keyof Limits): number | "unlimited" {
  return ENTITLEMENTS[plan].limits[key];
}

export function firstPlanWithFeature(feature: FeatureKey): PlanId {
  return PLAN_ORDER.find((p) => ENTITLEMENTS[p].features[feature]) ?? "pro";
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

export function findPlanForNeeds(needs: UsageNeeds): PlanId {
  const ok = (p: PlanId) => withinLimits(needs, p).ok;
  return PLAN_ORDER.find(ok) ?? "pro";
}

export function withinLimits(
  needs: UsageNeeds,
  plan: PlanId
): LimitsCheck {
  const lim = ENTITLEMENTS[plan].limits;
  const failures: Array<{ key: keyof Limits; need: number; allow: number | "unlimited" }> = [];

  (Object.keys(needs) as Array<keyof UsageNeeds>).forEach((k) => {
    const key = k as keyof Limits;
    const need = needs[key as keyof UsageNeeds];
    if (need == null) return;

    const allow = lim[key];
    if (allow === "unlimited") return;

    if (typeof need === "number" && need > allow) {
      failures.push({ key, need, allow });
    }
  });

  return { ok: failures.length === 0, failures };
}

export function suggestPlanByLimits(needs: UsageNeeds, current: PlanId): PlanId | null {
  if (withinLimits(needs, current).ok) return null;
  return PLAN_ORDER.find((p) => withinLimits(needs, p).ok) ?? "pro";
}

export function getPublishedCap(plan: PlanId): number | "unlimited" {
  return ENTITLEMENTS[plan].limits.maxPublicPages;
}

/** Get upload size limit in bytes for a plan */
export function getUploadSizeLimit(plan: PlanId): number {
  return ENTITLEMENTS[plan].limits.uploadSize;
}
