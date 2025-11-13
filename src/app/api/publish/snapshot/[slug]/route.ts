// src/app/api/publish/snapshot/[slug]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as fullStore from "@/lib/fullStore";
import { putPublic } from "@/lib/publicStore";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

async function extractSlug(req: Request, ctx: any) {
  try {
    const params = typeof ctx?.params?.then === "function" ? await ctx.params : ctx.params;
    return params?.slug ?? "";
  } catch {
    return "";
  }
}

export async function POST(req: Request, ctx: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ ok: false, error: "unauthorized" }, 401);

  const slug = await extractSlug(req, ctx);
  if (!slug) return jsonNoCache({ ok: false, error: "bad_slug" }, 400);

  try {
    const full = await fullStore.getFull(userId, slug);
    if (!full) return jsonNoCache({ ok: false, error: "full_not_found" }, 404);

    const id = full?.meta?.id;
    if (!id) return jsonNoCache({ ok: false, error: "missing_id" }, 400);

    await putPublic(slug, full);
    await putPublic(id, full);

    return jsonNoCache({
      ok: true,
      slug,
      id,
      packages: Array.isArray(full?.packages) ? full.packages.length : 0,
    });
  } catch (err) {
    console.error("PUBLISH SNAPSHOT ERROR", err);
    return jsonNoCache({ ok: false, error: "snapshot_failed" }, 500);
  }
}