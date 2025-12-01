/**
 * LemonSqueezy Configuration
 * Maps plan names to LemonSqueezy Variant IDs
 */

export type PlanTier = "growth" | "pro" | "scale";
export type BillingPeriod = "monthly" | "yearly";

export const LEMON_VARIANT_IDS: Record<string, string> = {
    // Growth Plans
    growth_monthly: "1123104",
    growth_yearly: "1123107",

    // Pro Plans
    pro_monthly: "1123105",
    pro_yearly: "1123108",

    // Scale Plans
    scale_monthly: "1122011",
    scale_yearly: "1123106",
};

/**
 * Get Variant ID for a specific plan and billing period
 */
export function getVariantId(tier: PlanTier, period: BillingPeriod): string | null {
    const key = `${tier}_${period}`;
    return LEMON_VARIANT_IDS[key] || null;
}

/**
 * Get Variant ID from a combined plan key (e.g., "growth_monthly")
 */
export function getVariantIdByKey(planKey: string): string | null {
    return LEMON_VARIANT_IDS[planKey] || null;
}
