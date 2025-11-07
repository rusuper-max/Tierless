// src/app/api/me/plan/route.ts
import { NextResponse } from "next/server";
import type { Plan } from "@/lib/auth";
import { coercePlan, getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { getPublishedCap, type PlanId } from "@/lib/entitlements";
import * as calcsStore from "@/lib/calcsStore";

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

  // Jedinstven način dobijanja user-a (CF Access -> session fallback)
  const id = await getUserIdFromRequest(); // bez req-a u Next route handleru
  if (!id) {
    return NextResponse.json(
      { id: null, email: null, plan: "free" as PlanId },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Čitanje plana iz tabele + normalizacija
  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [id]
  );
  const plan = coercePlan(rows[0]?.plan as Plan | undefined) as PlanId;

  return NextResponse.json(
    { id, email: id, plan },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(req: Request) {
  await ensureTable();
  const pool = getPool();

  // Jedinstven izvor identiteta (CF Access -> session fallback)
  const id = await getUserIdFromRequest(req);
  if (!id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Napomena: u produkciji plan se menja isključivo billing webhookom ili admin akcijom.
  const nextPlan = coercePlan((body as any)?.plan as Plan) as PlanId;

  // Upis plana
  await pool.query(
    `INSERT INTO user_plans (user_id, plan)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan`,
    [id, nextPlan]
  );

  // Nakon promene plana — enforce publish cap:
  // zadrži najnovijih N online, ostale automatski ugasi.
  let unpublished = 0;
  const cap = getPublishedCap(nextPlan);
  if (cap !== "unlimited") {
    try {
      unpublished = await calcsStore.bulkUnpublishAboveLimit(id, cap);
    } catch (e) {
      // Ne ruši zahtev zbog ovoga; samo zabeleži pa nastavi.
      console.error("bulkUnpublishAboveLimit failed:", e);
    }
  }

  return NextResponse.json(
    { ok: true, id, plan: nextPlan, unpublished },
    { headers: { "Cache-Control": "no-store" } }
  );
}