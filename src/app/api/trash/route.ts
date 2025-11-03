// src/app/api/trash/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as mini from "@/lib/data/calcs";
import * as trash from "@/lib/data/trash";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

// ——— Plan helper (bez cookies().get)
function getPlanFromReq(req: Request): PlanId {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)tl_plan=([^;]+)/);
  const raw = decodeURIComponent(m?.[1] || "").toLowerCase();
  const ok: PlanId[] = ["free","starter","growth","pro","tierless"];
  return (ok.includes(raw as PlanId) ? (raw as PlanId) : "free");
}
function pagesLimit(plan: PlanId): number | "unlimited" {
  const lim = ENTITLEMENTS?.[plan]?.limits?.pages;
  return typeof lim === "number" ? lim : "unlimited";
}

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  try {
    await trash.gc(userId).catch(() => {});
    const rows = await trash.list(userId);
    const ttlDays = await trash.ttlDays().catch(() => 30);
    return jsonNoCache({ rows, ttlDays });
  } catch (e: any) {
    console.error("GET /api/trash failed:", e);
    return jsonNoCache({ error: "trash_list_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

export async function POST(req: Request) {
  // restore
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({} as any));
    if (body?.action !== "restore" || !body?.slug) {
      return jsonNoCache({ error: "bad_request" }, 400);
    }

    const plan = getPlanFromReq(req);
    const limit = pagesLimit(plan);
    const act = await mini.list(userId);

    if (typeof limit === "number" && act.length >= limit) {
      return jsonNoCache({ error: "limit_reached", limit }, 403);
    }

    const newSlug = await trash.restore(userId, String(body.slug));
    if (!newSlug) return jsonNoCache({ error: "not_found" }, 404);

    return jsonNoCache({ ok: true, slug: newSlug });
  } catch (e: any) {
    console.error("POST /api/trash (restore) failed:", e);
    return jsonNoCache({ error: "restore_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

export async function DELETE(req: Request) {
  // delete forever
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({} as any));
    if (!body?.slug) return jsonNoCache({ error: "bad_request" }, 400);

    const ok = await trash.remove(userId, String(body.slug));
    return jsonNoCache({ ok });
  } catch (e: any) {
    console.error("DELETE /api/trash failed:", e);
    return jsonNoCache({ error: "trash_delete_failed", detail: e?.stack ?? String(e) }, 500);
  }
}