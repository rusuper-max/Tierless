// src/app/api/me/plan/route.ts
import { NextResponse } from "next/server";
import type { Plan } from "@/lib/auth";
import { coercePlan, getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const id = await getUserIdFromRequest(); // ← bez req, jer smo u Next route handleru
  if (!id) return NextResponse.json({ plan: "free" });

  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [id]
  );
  const plan = rows[0]?.plan ?? "free";
  return NextResponse.json({ plan });
}

export async function PUT(req: Request) {
  await ensureTable();
  const pool = getPool();

  const id = await getUserIdFromRequest(req); // ← ⚠️ proslediti req!
  if (!id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextPlan = coercePlan((body as any)?.plan as Plan);
  await pool.query(
    `INSERT INTO user_plans (user_id, plan)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan`,
    [id, nextPlan]
  );

  return NextResponse.json({ ok: true, plan: nextPlan });
}