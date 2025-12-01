// src/app/api/calculators/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";
import * as calcsStore from "@/lib/calcsStore";
import * as fullStore from "@/lib/fullStore";
import { ENTITLEMENTS } from "@/lib/entitlements";
import { calcFromMetaConfig } from "@/lib/calc-init";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ======================= GET (list) =======================
export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const pool = getPool();

  // Get user plan
  const { rows: planRows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  const rawPlan = planRows[0]?.plan;
  const plan = ["free", "starter", "growth", "pro"].includes(rawPlan) 
    ? rawPlan 
    : "free";

  const limits = ENTITLEMENTS[plan as keyof typeof ENTITLEMENTS]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";

  const rows = await calcsStore.list(userId);

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const slug = r?.meta?.slug;
      if (!slug) return r;

      try {
        let full = await fullStore.getFull(userId, slug);

        if (!full) {
          full = calcFromMetaConfig(r);
        }

        if (!full?.meta?.id) {
          const newId = randomBytes(9).toString("base64url");
          full = { ...full, meta: { ...(full?.meta || {}), id: newId } };
          await fullStore.putFull(userId, slug, full);
        }

        return { ...r, meta: { ...r.meta, id: full.meta.id } };
      } catch {
        return r;
      }
    })
  );

  return NextResponse.json(
    { rows: enriched, __debug: { userId, plan, allowPages: pagesAllow } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ======================= POST (create / duplicate) =======================
export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const pool = getPool();

  // Get user plan
  const { rows: planRows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  const rawPlan = planRows[0]?.plan;
  const plan = ["free", "starter", "growth", "pro"].includes(rawPlan) 
    ? rawPlan 
    : "free";

  const limits = ENTITLEMENTS[plan as keyof typeof ENTITLEMENTS]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const all = await calcsStore.list(userId);
  const current = all.length;
  const need = current + 1;

  if (pagesAllow !== "unlimited" && typeof pagesAllow === "number" && need > pagesAllow) {
    return NextResponse.json(
      { error: "PLAN_LIMIT", key: "pages", need, allow: pagesAllow, plan },
      { status: 409 }
    );
  }

  if (body?.from && typeof body.from === "string") {
    const name = (body?.name && String(body.name)) || "Copy";
    const slug = await calcsStore.duplicate(userId, body.from, name);
    if (!slug) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, slug }, { headers: { "Cache-Control": "no-store" } });
  }

  const created = await calcsStore.create(userId, "Untitled Page");
  return NextResponse.json(
    { ok: true, slug: created.meta.slug },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ======================= DELETE (remove / move to trash) =======================
export async function DELETE(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const trash = await import("@/lib/data/trash");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  let slugs: string[] = [];

  if (body) {
    if (Array.isArray(body.ids)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slugs = body.ids.map((x: any) => String(x));
    } else if (Array.isArray(body.slugs)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slugs = body.slugs.map((x: any) => String(x));
    } else if (typeof body.slug === "string") {
      slugs = [body.slug];
    } else if (typeof body.id === "string") {
      slugs = [body.id];
    }
  }

  if (!slugs.length) {
    return NextResponse.json({ error: "Missing slugs" }, { status: 400 });
  }

  let removed = 0;

  for (const slug of slugs) {
    try {
      const row = await calcsStore.get(userId, slug);
      await calcsStore.remove(userId, slug);

      if (row) {
        await trash.push(userId, row);
      }

      removed++;
    } catch (e) {
      console.error("Failed to delete calc", slug, e);
    }
  }

  return NextResponse.json({ ok: true, removed });
}
