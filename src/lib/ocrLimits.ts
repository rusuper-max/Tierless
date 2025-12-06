// src/lib/ocrLimits.ts
// OCR limits - client-safe constants (no server imports)

// Monthly OCR limits by plan
// Free gets 3 LIFETIME scans as a trial, then must upgrade
export const OCR_MONTHLY_LIMITS: Record<string, number> = {
  free: 0,       // No monthly allowance - only lifetime trial
  starter: 10,   // Small business
  growth: 50,    // Medium business
  pro: 200,      // Large business
  tierless: 9999, // Unlimited for dev/founder
};

// Free users get 3 lifetime trial scans
export const FREE_LIFETIME_TRIAL = 3;

/**
 * Get OCR limit for a plan
 */
export function getOcrLimit(plan: string): number {
  if (plan === "free") return FREE_LIFETIME_TRIAL;
  return OCR_MONTHLY_LIMITS[plan] || OCR_MONTHLY_LIMITS.starter;
}

/**
 * Check if plan has unlimited OCR
 */
export function isUnlimitedOcr(plan: string): boolean {
  return (OCR_MONTHLY_LIMITS[plan] || 0) >= 9999;
}

