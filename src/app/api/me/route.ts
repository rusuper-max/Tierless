import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { PlanId } from "@/lib/entitlements";
import { isPlanId, DEFAULT_PLAN } from "@/lib/entitlements";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUserIdFromHeaders(): string | null {
  const h = headers() as unknown as Headers;
  const cf =
    h.get?.("CF-Access-Authenticated-User-Email") ??
    h.get?.("cf-access-authenticated-user-email") ??
    null;
  return cf && cf.includes("@") ? cf.toLowerCase() : null;
}

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
  const uid = getUserIdFromHeaders();

  if (!uid) {
    return NextResponse.json({ id: null, email: null, plan: DEFAULT_PLAN });
  }

  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [uid]
  );
  const plan = rows[0]?.plan;
  const normalized: PlanId = isPlanId(plan) ? (plan as PlanId) : DEFAULT_PLAN;

  return NextResponse.json({ id: uid, email: uid, plan: normalized });
}