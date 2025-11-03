// src/app/api/calculators/reorder/route.ts
import { NextResponse } from "next/server";
import { mini } from "@/lib/mini";
import { getSessionOnRoute } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function emailToId(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function getCookieFromReq(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const p = part.trim();
    const i = p.indexOf("=");
    if (i === -1) continue;
    if (p.slice(0, i) === name) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const order: string[] = Array.isArray(body?.order) ? body.order : [];
  if (order.length === 0) return NextResponse.json({ error: "bad_order" }, { status: 400 });

  // resolve user
  let userId: string | null = null;
  try {
    // @ts-ignore
    const res = new Response();
    // @ts-ignore
    const session = await getSessionOnRoute(req, res);
    const email = session?.user?.email || req.headers.get("x-user-id") || getCookieFromReq(req, "tl_uid");
    if (email) userId = emailToId(email);
  } catch {}
  if (!userId) return NextResponse.json({ error: "no_user_id" }, { status: 401 });

  const rows = await mini.list(userId).catch(() => []);
  const bySlug = new Map<string, any>(rows.map((r: any) => [r?.meta?.slug, r]));

  const anyMini = mini as any;
  let idx = 0;
  for (const slug of order) {
    const row = bySlug.get(slug);
    if (!row) continue;
    const meta = { ...(row.meta || {}), order: idx++ };
    if (typeof anyMini.update === "function") await anyMini.update(userId, slug, { meta });
    else if (typeof anyMini.put === "function") await anyMini.put(userId, slug, { ...(row || {}), meta });
    else if (typeof anyMini.set === "function") await anyMini.set(userId, slug, { ...(row || {}), meta });
    else if (typeof anyMini.save === "function") await anyMini.save(userId, slug, { ...(row || {}), meta });
  }

  return NextResponse.json({ ok: true, count: order.length });
}