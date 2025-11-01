// src/app/api/upgrade/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { PLAN_ORDER, type PlanId } from "@/lib/entitlements";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = String(body?.plan || "").toLowerCase();
    const plan = (PLAN_ORDER as readonly string[]).includes(raw) ? (raw as PlanId) : null;

    if (!plan) {
      return NextResponse.json({ ok: false, error: "invalid_plan" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true, plan });
    // Dev simulacija: upiši plan u kolačić (nije HttpOnly da bi CSR mogao da pročita ako baš treba)
    res.cookies.set("tl_plan", plan, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const plan = (req.cookies.get("tl_plan")?.value as PlanId) || "free";
  return NextResponse.json({ ok: true, plan });
}