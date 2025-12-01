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
  await pool.query(`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS renews_on TIMESTAMPTZ`);
  await pool.query(`
    ALTER TABLE user_plans
    ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false
  `);
}

function serializeDate(date: unknown) {
  if (!date) return null;
  const d = new Date(date as string | number | Date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getDefaultRenewalDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function GET() {
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
    "SELECT plan, renews_on, cancel_at_period_end FROM user_plans WHERE user_id = $1 LIMIT 1",
    [id]
  );
  const plan = coercePlan(rows[0]?.plan as Plan | undefined) as PlanId;

  return NextResponse.json(
    {
      id,
      email: id,
      plan,
      renewsOn: serializeDate(rows[0]?.renews_on),
      cancelAtPeriodEnd: !!rows[0]?.cancel_at_period_end,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(req: Request) {
  const db = getPool();

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

  const payload = (body ?? {}) as {
    plan?: Plan;
    renewsOn?: string | null;
    cancelAtPeriodEnd?: boolean;
  };

  const existing = await db.query(
    "SELECT plan, renews_on, cancel_at_period_end FROM user_plans WHERE user_id = $1 LIMIT 1",
    [id]
  );
  const currentRow = existing.rows[0];
  const currentPlan = coercePlan(currentRow?.plan as Plan | undefined) as PlanId;

  const hasPlanChange = typeof payload.plan === "string";
  const nextPlan = hasPlanChange ? (coercePlan(payload.plan as Plan) as PlanId) : currentPlan;

  const renewsOnProvided = Object.prototype.hasOwnProperty.call(payload, "renewsOn");
  let renewsOn: Date | null | undefined = undefined;
  if (renewsOnProvided) {
    if (payload.renewsOn === null) {
      renewsOn = null;
    } else if (typeof payload.renewsOn === "string") {
      const parsed = new Date(payload.renewsOn);
      if (!Number.isNaN(parsed.getTime())) renewsOn = parsed;
    }
  } else if (hasPlanChange) {
    renewsOn = nextPlan === "free" ? null : getDefaultRenewalDate();
  }

  let cancelAtPeriodEnd: boolean | null = null;
  if (typeof payload.cancelAtPeriodEnd === "boolean") {
    cancelAtPeriodEnd = payload.cancelAtPeriodEnd;
  } else if (hasPlanChange) {
    cancelAtPeriodEnd = false;
  }

  if (!currentRow && !hasPlanChange) {
    return NextResponse.json({ error: "Plan not set yet" }, { status: 400 });
  }

  if (!currentRow) {
    await db.query(
      `INSERT INTO user_plans (user_id, plan, renews_on, cancel_at_period_end)
       VALUES ($1, $2, $3, $4)`,
      [id, nextPlan, renewsOn ?? null, cancelAtPeriodEnd ?? false]
    );
  } else {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (hasPlanChange) {
      updates.push(`plan = $${params.length + 1}`);
      params.push(nextPlan);
    }

    if (renewsOn !== undefined) {
      updates.push(`renews_on = $${params.length + 1}`);
      params.push(renewsOn);
    }

    if (cancelAtPeriodEnd !== null) {
      updates.push(`cancel_at_period_end = $${params.length + 1}`);
      params.push(cancelAtPeriodEnd);
    }

    if (updates.length) {
      params.push(id);
      await db.query(
        `UPDATE user_plans SET ${updates.join(", ")} WHERE user_id = $${params.length}`,
        params
      );
    }
  }

  const { rows: updatedRows } = await db.query(
    "SELECT plan, renews_on, cancel_at_period_end FROM user_plans WHERE user_id = $1 LIMIT 1",
    [id]
  );
  const latest = updatedRows[0];
  const latestPlan = coercePlan(latest?.plan as Plan | undefined) as PlanId;

  // Nakon promene plana — enforce publish cap:
  // zadrži najnovijih N online, ostale automatski ugasi.
  let unpublished = 0;
  if (hasPlanChange) {
    const cap = getPublishedCap(nextPlan);
    if (cap !== "unlimited") {
      try {
        unpublished = await calcsStore.bulkUnpublishAboveLimit(id, cap);
      } catch (e) {
        // Ne ruši zahtev zbog ovoga; samo zabeleži pa nastavi.
        console.error("bulkUnpublishAboveLimit failed:", e);
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      id,
      plan: latestPlan,
      renewsOn: serializeDate(latest?.renews_on),
      cancelAtPeriodEnd: !!latest?.cancel_at_period_end,
      unpublished,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
