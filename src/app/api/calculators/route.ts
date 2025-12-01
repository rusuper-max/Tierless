// src/app/api/calculators/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";
import { getPool } from "@/lib/db";
import * as fullStore from "@/lib/fullStore";
import { randomBytes } from "crypto";
import * as trash from "@/lib/data/trash";

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

function genId(): string {
  return randomBytes(9).toString("base64url");
}
async function ensureIdOnFull(userId: string, slug: string, full: any) {
  if (full?.meta?.id) return full;
  const withId = { ...full, meta: { ...(full?.meta || {}), id: genId() } };
  await fullStore.putFull(userId, slug, withId);
  return withId;
}

// ======================= GET (list) =======================
export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    // Za smoke test i sigurnost: zaštićen endpoint vraća 401 kada nema sesije
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  const plan = await getPlanForUser(userId);
  const limits = ENTITLEMENTS[plan]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";
  const publishedAllow =
    (limits as any)?.maxPublicPages ??
    (typeof pagesAllow === "number" ? pagesAllow : Infinity);

  const rows = await calcsStore.list(userId);

  const { calcFromMetaConfig } = await import("@/lib/calc-init");

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
          full = await ensureIdOnFull(userId, slug, full);
        }

        return { ...r, meta: { ...r.meta, id: full.meta.id } };
      } catch {
        return r;
      }
    })
  );

  const __debug = {
    userId,
    plan,
    allowPages: pagesAllow,
    allowPublished: publishedAllow,
    file: "(fs) /data/users/<uid>/calculators.json",
  };

  return NextResponse.json(
    { rows: enriched, __debug },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ======================= POST (create / duplicate) =======================
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
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  let slugs: string[] = [];

  if (body) {
    if (Array.isArray(body.ids)) {
      slugs = body.ids.map((x: any) => String(x));
    } else if (Array.isArray(body.slugs)) {
      slugs = body.slugs.map((x: any) => String(x));
    } else if (typeof body.slug === "string") {
      slugs = [body.slug];
    } else if (typeof body.id === "string") {
      slugs = [body.id];
    }
  }

  if (!slugs.length) {
    return NextResponse.json(
      { error: "Missing slugs" },
      { status: 400 }
    );
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
