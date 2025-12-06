// src/app/api/ocr-usage/route.ts
// API to get current OCR usage for display in UI

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, coercePlan } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { canUseOcr, ensureOcrUsageTable, formatOcrUsage } from "@/lib/ocrUsage";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1`,
      [user.email]
    );
    const plan = coercePlan(rows[0]?.plan || "free");

    // Ensure table exists and get usage
    await ensureOcrUsageTable();
    const usage = await canUseOcr(user.email, plan);

    return NextResponse.json({
      ok: true,
      plan,
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining,
      isLifetimeTrial: usage.isLifetimeTrial,
      displayText: formatOcrUsage(usage.used, usage.limit, usage.isLifetimeTrial),
      canScan: usage.allowed,
    });
  } catch (error) {
    console.error("[ocr-usage] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

