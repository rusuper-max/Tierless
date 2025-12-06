// src/lib/ocrUsage.ts
// Track OCR usage per user with monthly limits

import { getPool } from "./db";

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
 * Ensure the ocr_usage table exists
 */
export async function ensureOcrUsageTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ocr_usage (
      user_id TEXT NOT NULL,
      usage_month TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      lifetime_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, usage_month)
    )
  `);
}

/**
 * Get current month key (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get OCR usage for current month
 */
export async function getOcrUsageThisMonth(userId: string): Promise<{ monthly: number; lifetime: number }> {
  const pool = getPool();
  const currentMonth = getCurrentMonth();
  
  // Get this month's count
  const { rows: monthRows } = await pool.query(
    `SELECT count FROM ocr_usage 
     WHERE user_id = $1 AND usage_month = $2`,
    [userId, currentMonth]
  );
  
  // Get lifetime total
  const { rows: lifetimeRows } = await pool.query(
    `SELECT COALESCE(SUM(count), 0) as total FROM ocr_usage WHERE user_id = $1`,
    [userId]
  );
  
  return {
    monthly: monthRows[0]?.count || 0,
    lifetime: Number(lifetimeRows[0]?.total) || 0,
  };
}

/**
 * Increment OCR usage for a user (call after successful OCR)
 */
export async function incrementOcrUsage(userId: string): Promise<{ monthly: number; lifetime: number }> {
  const pool = getPool();
  const currentMonth = getCurrentMonth();
  
  const { rows } = await pool.query(
    `INSERT INTO ocr_usage (user_id, usage_month, count, lifetime_count)
     VALUES ($1, $2, 1, 1)
     ON CONFLICT (user_id, usage_month)
     DO UPDATE SET count = ocr_usage.count + 1
     RETURNING count`,
    [userId, currentMonth]
  );
  
  // Get updated lifetime total
  const { rows: lifetimeRows } = await pool.query(
    `SELECT COALESCE(SUM(count), 0) as total FROM ocr_usage WHERE user_id = $1`,
    [userId]
  );
  
  return {
    monthly: rows[0]?.count || 1,
    lifetime: Number(lifetimeRows[0]?.total) || 1,
  };
}

/**
 * Check if user can use OCR
 * - Free users: 3 lifetime trial scans only
 * - Paid users: monthly limit based on plan
 */
export async function canUseOcr(userId: string, plan: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  isLifetimeTrial: boolean;
  lifetimeUsed?: number;
}> {
  const usage = await getOcrUsageThisMonth(userId);
  
  // Free plan: lifetime trial only
  if (plan === "free") {
    const lifetimeRemaining = Math.max(0, FREE_LIFETIME_TRIAL - usage.lifetime);
    return {
      allowed: usage.lifetime < FREE_LIFETIME_TRIAL,
      used: usage.lifetime,
      limit: FREE_LIFETIME_TRIAL,
      remaining: lifetimeRemaining,
      isLifetimeTrial: true,
      lifetimeUsed: usage.lifetime,
    };
  }
  
  // Paid plans: monthly limit
  const monthlyLimit = OCR_MONTHLY_LIMITS[plan] || OCR_MONTHLY_LIMITS.starter;
  const remaining = Math.max(0, monthlyLimit - usage.monthly);
  
  return {
    allowed: usage.monthly < monthlyLimit,
    used: usage.monthly,
    limit: monthlyLimit,
    remaining,
    isLifetimeTrial: false,
  };
}

/**
 * Get usage display string for UI
 */
export function formatOcrUsage(used: number, limit: number, isLifetimeTrial: boolean): string {
  if (isLifetimeTrial) {
    return `${used}/${limit} trial scans`;
  }
  return `${used}/${limit} this month`;
}

/**
 * Clean up old usage records (run periodically)
 * Keeps only last 12 months of data
 */
export async function cleanupOldUsage(): Promise<number> {
  const pool = getPool();
  const cutoffMonth = new Date();
  cutoffMonth.setMonth(cutoffMonth.getMonth() - 12);
  const cutoff = `${cutoffMonth.getFullYear()}-${String(cutoffMonth.getMonth() + 1).padStart(2, '0')}`;
  
  const { rowCount } = await pool.query(
    `DELETE FROM ocr_usage WHERE usage_month < $1`,
    [cutoff]
  );
  
  return rowCount || 0;
}

