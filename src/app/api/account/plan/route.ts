// src/app/api/account/plan/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { PlanId } from "@/lib/entitlements";
import { isPlanId, DEFAULT_PLAN } from "@/lib/entitlements";
import { getPool } from "@/lib/db";

// Node runtime is required for `pg`
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read user identity from Cloudflare Access header (preview) or session (local). */
async function getUserId(): Promise<string | null> {
  // 1) Cloudflare Access header (preview.tierless.net behind Access)
  const h = (headers() as unknown as Headers);
  const cfEmail =
    h.get?.("CF-Access-Authenticated-User-Email") ??
    h.get?.("cf-access-authenticated-user-email") ?? null;
  if (cfEmail && typeof cfEmail === "string" && cfEmail.includes("@")) {
    return cfEmail.toLowerCase();
  }

  // 2) Fallback to app session (local dev)
  try {
    const { getSessionUser } = await import("@/lib/auth");
    const u = await getSessionUser();
    const id = (u as any)?.id ?? (u as any)?.email ?? null;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/** Ensure table exists (safe on cold start in serverless). */
async function ensureTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL
    )
  `);
}

export async function GET() {
  await ensureTable();
  const pool = getPool();
  const uid = await getUserId();

  if (!uid) {
    return NextResponse.json({ plan: DEFAULT_PLAN });
  }

  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [uid]
  );
  const plan = rows[0]?.plan;
  return NextResponse.json({
    plan: isPlanId(plan) ? (plan as PlanId) : DEFAULT_PLAN,
  });
}

export async function PUT(req: Request) {
  await ensureTable();
  const pool = getPool();
  const uid = await getUserId();

  if (!uid) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextPlan = (body as any)?.plan;
  if (!isPlanId(nextPlan)) {
    return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO user_plans (user_id, plan)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan`,
    [uid, String(nextPlan)]
  );

  return NextResponse.json({ ok: true, plan: nextPlan as PlanId });
}