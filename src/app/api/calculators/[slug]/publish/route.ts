// src/app/api/calculators/[slug]/publish/route.ts
import { NextResponse } from "next/server";

import { getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { coercePlan, type Plan } from "@/lib/auth";
import { getPublishedCap, type PlanId } from "@/lib/entitlements";
import * as calcsStore from "@/lib/calcsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------ */
/* Helper: dohvati plan iz user_plans                           */
/* ------------------------------------------------------------ */
async function getUserPlan(userId: string): Promise<PlanId> {
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
  return coercePlan(rows[0]?.plan as Plan | undefined) as PlanId;
}

/* ------------------------------------------------------------ */
export async function POST(
  req: Request,
  context: { params?: { slug?: string } }
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Robusno dohvatanje sluga (params ili iz URL-a)
  const url = new URL(req.url);
  const slug =
    context?.params?.slug ??
    decodeURIComponent(url.pathname.split("/").slice(-2, -1)[0] || "");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // Telo je opcionalno
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const nextPublish: boolean = !!body.publish;

  // Učitaj trenutni zapis (iz PG backed calcsStore)
  const current = await calcsStore.get(userId, slug);
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isCurrentlyPublished = !!current.meta?.published;

  // Ako zaista prelazimo iz off->on, proveri cap
  if (nextPublish && !isCurrentlyPublished) {
    const plan = await getUserPlan(userId);
    const cap = getPublishedCap(plan);
    if (cap !== "unlimited") {
      const already = await calcsStore.countPublished(userId);
      // posle ovog publish-a bilo bi already + 1
      if (already + 1 > cap) {
        return NextResponse.json(
          {
            error: "PLAN_LIMIT",
            key: "maxPublicPages",
            need: already + 1,
            allow: cap,
            plan,
          },
          { status: 409 }
        );
      }
    }
  }

  // Zapiši novo stanje (PG) — bez FS-a
  const ok = await calcsStore.setPublished(userId, slug, nextPublish);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, slug, published: nextPublish, updatedAt: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}