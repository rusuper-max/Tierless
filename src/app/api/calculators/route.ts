import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import path from "path";
import * as mini from "@/lib/data/calcs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}
function debugFile(userId: string) {
  const uid = safeUserId(userId);
  return path.join(process.cwd(), "data", "users", uid, "calculators.json");
}
function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);
  try {
    const rows = await mini.list(userId);
    return jsonNoCache({ rows, __debug: { userId, file: debugFile(userId) } });
  } catch (e: any) {
    console.error("LIST /api/calculators failed:", e);
    return jsonNoCache({ error: "list_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);
  try {
    const body = await req.json().catch(() => ({} as any));

    if (body?.from && body?.name) {
      const slug = await mini.duplicate(userId, body.from, body.name);
      if (!slug) return jsonNoCache({ error: "not_found" }, 404);
      return jsonNoCache({ slug, __debug: { userId, file: debugFile(userId) } });
    }

    const name = (body?.name ?? "Untitled Page") as string;
    const row = await mini.create(userId, name);
    return jsonNoCache({ slug: row.meta.slug, __debug: { userId, file: debugFile(userId) } });
  } catch (e: any) {
    console.error("CREATE /api/calculators failed:", e);
    return jsonNoCache({ error: "create_failed", detail: e?.stack ?? String(e) }, 500);
  }
}