// src/app/api/calculators/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";
import * as calcsStore from "@/lib/calcsStore";
import * as fullStore from "@/lib/fullStore";
import { ENTITLEMENTS, isPlanId, DEFAULT_PLAN } from "@/lib/entitlements";
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

  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");

  // --- TEAM CONTEXT ---
  if (teamId) {
    // 1. Verify membership FIRST
    const { requireTeamMember } = await import("@/lib/permissions");
    const perm = await requireTeamMember(userId, teamId, "viewer");

    if (!perm.allowed) {
      return NextResponse.json(
        { error: perm.reason || "Forbidden" },
        { status: 403 }
      );
    }

    // 2. Fetch team calcs
    const rows = await calcsStore.listTeamCalcs(teamId);

    // 3. Enrich with IDs (same logic as personal context)
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const slug = r?.meta?.slug;
        const ownerId = r?.meta?.userId || userId;
        if (!slug) return r;

        try {
          let full = await fullStore.getFull(ownerId, slug);

          if (!full) {
            full = calcFromMetaConfig(r);
          }

          if (!full?.meta?.id) {
            const newId = randomBytes(9).toString("base64url");
            full = { ...full, meta: { ...(full?.meta || {}), id: newId } };
            await fullStore.putFull(ownerId, slug, full);
          }

          return { ...r, meta: { ...r.meta, id: full.meta.id }, teamName: r.teamName };
        } catch {
          return { ...r, teamName: r.teamName };
        }
      })
    );

    return NextResponse.json(
      { rows: enriched, __debug: { userId, teamId, role: perm.role } },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // --- PERSONAL CONTEXT (Existing Logic) ---
  const pool = getPool();

  // Get user plan
  const { rows: planRows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  const rawPlan = planRows[0]?.plan;
  const plan = isPlanId(rawPlan) ? rawPlan : DEFAULT_PLAN;

  const limits = ENTITLEMENTS[plan as keyof typeof ENTITLEMENTS]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";

  const rows = await calcsStore.listWithTeams(userId);

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

        return { ...r, meta: { ...r.meta, id: full.meta.id }, teamName: r.teamName };
      } catch {
        return { ...r, teamName: r.teamName };
      }
    })
  );

  return NextResponse.json(
    { rows: enriched, __debug: { userId, plan, allowPages: pagesAllow } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ======================= POST (create / duplicate) =======================
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
  const plan = isPlanId(rawPlan) ? rawPlan : DEFAULT_PLAN;

  const limits = ENTITLEMENTS[plan as keyof typeof ENTITLEMENTS]?.limits;
  const pagesAllow = limits?.pages ?? "unlimited";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // --- TEAM CONTEXT CHECK ---
  let teamId: string | undefined = undefined;
  if (body?.teamId && typeof body.teamId === "string") {
    // Check permission to create in team
    const { requireTeamMember } = await import("@/lib/permissions");
    const perm = await requireTeamMember(userId, body.teamId, "editor");
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.reason || "Forbidden" }, { status: 403 });
    }
    teamId = body.teamId;

    // NOTE: Plan limits are currently per-user.
    // If we wanted team-level limits, we'd check them here.
    // For now, we count team pages against the creator's limit (simplest mvp) or just allow them.
    // Let's count them against creator for now to prevent abuse.
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
    const slug = await calcsStore.duplicate(userId, body.from, name, teamId);
    if (!slug) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, slug }, { headers: { "Cache-Control": "no-store" } });
  }

  const created = await calcsStore.create(userId, "Untitled Page", teamId);
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
  const { findCalcBySlug, requireCanDelete } = await import("@/lib/permissions");

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
      // 1. Determine ownership
      const ownership = await findCalcBySlug(slug);
      if (!ownership) continue; // Not found

      // 2. Check permission
      const perm = await requireCanDelete(userId, ownership.userId, slug);
      if (!perm.allowed) {
        console.warn(`User ${userId} attempted to delete ${slug} without permission: ${perm.reason}`);
        continue;
      }

      // 3. Perform delete
      // Note: calcsStore.remove(userId, slug) usually expects `userId` to be owner.
      // But if it's a team deletion, the `userId` passed to remove should probably be the OWNER's userId?
      // Actually `calcsStore.remove` query is `DELETE FROM calculators WHERE user_id=$1 AND slug=$2`.
      // If `ownership.userId` is the creator, we must pass THAT.
      const row = await calcsStore.get(ownership.userId, slug);
      await calcsStore.remove(ownership.userId, slug);

      if (row) {
        // Trash logic acts on behalf of the deleter, but stores it under the OWNER's trash?
        // Or maybe team trash? For now, let's put it in owner's trash.
        await trash.push(ownership.userId, row);
      }

      removed++;
    } catch (e) {
      console.error("Failed to delete calc", slug, e);
    }
  }

  return NextResponse.json({ ok: true, removed });
}
