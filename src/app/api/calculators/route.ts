// src/app/api/calculators/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore"; // ← obrati pažnju na "s"
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ensure plans table exists (safe on cold start). */
async function ensurePlansTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL
    )
  `);
}

/** Read normalized plan for a user from DB (fallback "free"). */
async function getPlanForUser(userId: string): Promise<PlanId> {
  await ensurePlansTable();
  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  const raw = rows[0]?.plan as string | undefined;
  const isPlan =
    raw === "free" || raw === "starter" || raw === "growth" || raw === "pro" || raw === "tierless";
  return (isPlan ? raw : "free") as PlanId;
}

/* ======================= GET (list) ======================= */
export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ rows: [], notice: "Not authenticated" }, { headers: { "Cache-Control": "no-store" } });
  }

  // Plan iz baze (isti izvor istine za sve rute)
  const plan = await getPlanForUser(userId);
  const limits = ENTITLEMENTS[plan]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";
  const publishedAllow = (limits as any)?.maxPublicPages ?? (typeof pagesAllow === "number" ? pagesAllow : Infinity);

  const rows = await calcsStore.list(userId);

  // Debug info da odmah vidiš šta server “misli”
  const __debug = {
    userId,
    plan,
    allowPages: pagesAllow,
    allowPublished: publishedAllow,
    file: "(fs) /data/users/<uid>/calculators.json",
  };

  return NextResponse.json(
    { rows, __debug },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/* ======================= POST (create / duplicate) ======================= */
export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const plan = await getPlanForUser(userId);
  const limits = ENTITLEMENTS[plan]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // trenutna potrošnja
  const all = await calcsStore.list(userId);
  const current = all.length;

  // koliki bi bio "need" za create/duplicate
  const need = current + 1;

  // guard: pages
  if (pagesAllow !== "unlimited" && typeof pagesAllow === "number" && need > pagesAllow) {
    return NextResponse.json(
      { error: "PLAN_LIMIT", key: "pages", need, allow: pagesAllow, plan },
      { status: 409 }
    );
  }

  // create vs duplicate
  if (body?.from && typeof body.from === "string") {
    const name = (body?.name && String(body.name)) || "Copy";
    const slug = await calcsStore.duplicate(userId, body.from, name);
    if (!slug) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, slug }, { headers: { "Cache-Control": "no-store" } });
  }

  const created = await calcsStore.create(userId, "Untitled Page");
  return NextResponse.json({ ok: true, slug: created.meta.slug }, { headers: { "Cache-Control": "no-store" } });
}