// src/app/api/publish/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPool } from "@/lib/db";
import { getUserIdFromRequest, coercePlan as coercePlanAuth } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore";
import { withinLimits, type PlanId } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getPlanForUser(userId: string): Promise<PlanId> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL
    )
  `);
  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return coercePlanAuth(rows[0]?.plan) as PlanId;
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { }

  const { slug, publish } = body ?? {};
  if (typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const plan = await getPlanForUser(userId);
  const current = await calcsStore.get(userId, slug);
  if (!current) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  const alreadyPublished = !!current.meta?.published;

  if (publish === true && !alreadyPublished) {
    const publishedNow = await calcsStore.countPublished(userId);
    const needs = { maxPublicPages: publishedNow + 1 };
    const limit = withinLimits(needs, plan);
    if (!limit.ok) {
      const fail = limit.failures[0];
      return NextResponse.json(
        { error: "PLAN_LIMIT", key: fail.key, need: fail.need, allow: fail.allow, plan },
        { status: 409 }
      );
    }
  }

  // 2) Upis u calcsStore (zaista postavlja config.published)
  const ok = await calcsStore.setPublished(userId, slug, !!publish);
  if (!ok) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // 3) Revalidate public paths (ISR)
  if (publish) {
    try {
      revalidatePath(`/p/${slug}`);
      revalidatePath(`/api/public/${slug}`);
    } catch (e) {
      console.error("Revalidate failed for", slug, e);
    }
  }

  return NextResponse.json({ ok: true, slug, publish: !!publish }, { headers: { "Cache-Control": "no-store" } });
}
