// src/app/api/account/plan/route.ts
import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/plans";
import { DEFAULT_PLAN } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Trenutno: vraća uvek 'free' (stub).
 * Kasnije: poveži sa DB/Billing-om ili session payload-om.
 */
export async function GET() {
  let plan: PlanId = DEFAULT_PLAN;

  // Ako već imaš getSessionUser u "@/lib/auth", možeš ovde da odrediš plan na osnovu usera.
  try {
    const { getSessionUser } = await import("@/lib/auth");
    const u = await getSessionUser();
    if (u && (u as any)?.plan) {
      plan = (u as any).plan as PlanId;
    }
  } catch {
    // nema auth helpera ili nije bitno – ostaje 'free'
  }

  return NextResponse.json({ plan });
}