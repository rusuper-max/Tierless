// src/app/api/me/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import type { PlanId } from "@/lib/entitlements";

export async function GET(req: NextRequest) {
  // Dev: čitamo plan iz kolačića (prod kasnije iz DB/session)
  const plan = (req.cookies.get("tl_plan")?.value as PlanId) || "free";
  return NextResponse.json({
    user: { plan },
    authenticated: true,
  });
}