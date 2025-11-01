// src/app/api/publish/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
// Ako ti alias "@" ne radi u dev-u, promeni import na relativni:
// import { PLAN_ORDER, type PlanId, type UsageNeeds, withinLimits, suggestPlanByLimits } from "../../../lib/entitlements";
import { PLAN_ORDER, type PlanId, type UsageNeeds, withinLimits, suggestPlanByLimits } from "@/lib/entitlements";

/** Minimalna detekcija plana (header ili cookie). U produkciji zameni stvarnim session-om. */
function resolvePlan(req: NextRequest): PlanId {
  const hdr = (req.headers.get("x-user-plan") || "").toLowerCase();
  const cookiePlan = req.cookies.get("tl_plan")?.value as PlanId | undefined;
  const p = (hdr || cookiePlan) as PlanId | undefined;
  return (p && (PLAN_ORDER as readonly PlanId[]).includes(p)) ? p : "free";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/publish",
    method: "POST",
    body: { needs: { items: 0, pages: 0, tiersPerPage: 0, maxPublicPages: 0, teamSeats: 0, customDomains: 0 } },
    note: "Pozivaj POST iz editora; GET je informativan.",
  });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const needs = (body?.needs || {}) as UsageNeeds; // tvoj tip već je Partial<...> u entitlements.ts
    const plan = resolvePlan(req);

    const { ok, failures } = withinLimits(needs, plan);
    if (!ok) {
      const target = suggestPlanByLimits(needs, plan) ?? "tierless";
      // Pretvaramo failures u prost “over” niz da bude čitljiv u dev-u
      const over = failures.map(f => `${String(f.key)}>${String(f.allow)}`);
      return NextResponse.json({ ok: false, plan, over, suggestPlan: target }, { status: 403 });
    }

    // TODO: stvarni publish (DB render, webhookovi...)
    return NextResponse.json({ ok: true, plan });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}