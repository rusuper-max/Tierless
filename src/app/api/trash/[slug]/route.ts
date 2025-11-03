// src/app/api/trash/[slug]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as mini from "@/lib/data/calcs";
import * as trash from "@/lib/data/trash";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

/** Minimalni cookie parser (bez oslanjanja na next/headers) */
function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function normalizePlan(p?: string): PlanId {
  switch ((p || "").toLowerCase()) {
    case "starter":  return "starter";
    case "growth":   return "growth";
    case "pro":      return "pro";
    case "tierless": return "tierless";
    case "free":
    default:         return "free";
  }
}

function pagesLimit(plan: PlanId): number | "unlimited" {
  const lim = ENTITLEMENTS?.[plan]?.limits?.pages;
  return typeof lim === "number" ? lim : "unlimited";
}

export async function POST(req: Request, ctx: { params: { slug?: string } }) {
  // RESTORE
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);
  const slug = ctx?.params?.slug || "";

  try {
    const plan = normalizePlan(getCookie(req, "tl_plan"));
    const limit = pagesLimit(plan);
    const act = await mini.list(userId);
    if (typeof limit === "number" && act.length >= limit) {
      return jsonNoCache({ error: "limit_reached", limit }, 403);
    }

    const newSlug = await trash.restore(userId, slug);
    if (!newSlug) return jsonNoCache({ error: "not_found" }, 404);
    return jsonNoCache({ ok: true, slug: newSlug });
  } catch (e: any) {
    console.error("RESTORE /api/trash/[slug]:", e);
    return jsonNoCache({ error: "restore_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

export async function DELETE(req: Request, ctx: { params: { slug?: string } }) {
  // PERMANENT DELETE
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);
  const slug = ctx?.params?.slug || "";

  try {
    const ok = await trash.remove(userId, slug);
    return jsonNoCache({ ok });
  } catch (e: any) {
    console.error("DELETE /api/trash/[slug]:", e);
    return jsonNoCache({ error: "trash_delete_failed", detail: e?.stack ?? String(e) }, 500);
  }
}