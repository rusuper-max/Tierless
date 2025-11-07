// src/app/api/calculators/[slug]/publish/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

import { getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { coercePlan, type Plan } from "@/lib/auth";
import { getPublishedCap, type PlanId } from "@/lib/entitlements";
import * as calcsStore from "@/lib/calcsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------ */
/* Minimalni helpers za write (ne diramo calcsStore API)        */
/* ------------------------------------------------------------ */
const USERS_ROOT = path.join(process.cwd(), "data", "users");

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}
function fileFor(userId: string) {
  const uid = safeUserId(userId);
  return path.join(USERS_ROOT, uid, "calculators.json");
}
async function writeAll(userId: string, rows: any[]) {
  const file = fileFor(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

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

  // --- Robusno dohvatanje sluga: prvo iz params, pa iz URL-a ---
  const url = new URL(req.url);
  const slugFromUrl =
    context?.params?.slug ??
    decodeURIComponent(url.pathname.split("/").slice(-2, -1)[0] || "");

  if (!slugFromUrl) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // Telo je opcionalno – ne vraćamo 400 ako nije validan JSON
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const nextPublish = !!body.publish;

  // Učitaj listu
  const rows = await calcsStore.list(userId);
  const idx = rows.findIndex((r: any) => r?.meta?.slug === slugFromUrl);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ako tražimo publish=true — proveri cap
  if (nextPublish) {
    const plan = await getUserPlan(userId);
    const cap = getPublishedCap(plan);
    if (cap !== "unlimited") {
      // koliko je trenutno online (bez trenutnog sluga koji tek palimo)
      const already = rows.reduce((acc: number, r: any) => {
        if (!r?.meta) return acc;
        if (r.meta.slug === slugFromUrl) return acc;
        return r.meta.published ? acc + 1 : acc;
      }, 0);

      if (already >= cap) {
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

  // Upis stanja (published on/off) + updatedAt
  const now = Date.now();
  const row = rows[idx];
  const meta = { ...(row.meta || {}) };
  meta.published = nextPublish;
  meta.updatedAt = now;

  const next = [...rows];
  next[idx] = { ...row, meta };

  await writeAll(userId, next);

  return NextResponse.json(
    { ok: true, slug: slugFromUrl, published: nextPublish, updatedAt: now },
    { headers: { "Cache-Control": "no-store" } }
  );
}