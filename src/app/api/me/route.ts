// src/app/api/me/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import type { PlanId } from "@/lib/entitlements";

export async function GET(req: NextRequest) {
  const plan = (req.cookies.get("tl_plan")?.value as PlanId) || "free";
  const res = NextResponse.json({
    authenticated: true,            // OK u dev-u (izvor istine je /api/auth/status)
    user: { plan },
    plan,                            // opcioni “dup” radi pogodnosti
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}