export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSessionUser, signSession, coercePlan } from "@/lib/auth";
import { setUserPlan } from "@/lib/account-store";

/**
 * POST /api/plan
 * Body: { plan: "free" | "starter" | "growth" | "pro" | "tierless" }
 * Efekat: upiše plan u SERVER STORE + session cookie (JWT) i vrati { ok:true, plan }
 */
export async function POST(req: Request) {
  const me = await getSessionUser(req);
  if (!me) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nextPlan = coercePlan(body?.plan);

  // 1) Persist na serveru (source of truth)
  await setUserPlan(me.email, nextPlan);

  // 2) Osveži session cookie da UI odmah zna
  const cookie = await signSession({ email: me.email, plan: nextPlan });

  const res = NextResponse.json({ ok: true, plan: nextPlan });
  res.headers.set("Set-Cookie", cookie);
  // cache-busters da SPA odmah vidi novo stanje
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "Cookie");
  return res;
}