// src/app/api/calculators/[slug]/meta/route.ts
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

export async function POST(req: Request, ctx: { params: { slug: string } }) {
  const slug = ctx.params?.slug;
  if (!slug) return NextResponse.json({ error: "bad_slug" }, { status: 400 });

  // resolve user
  let userId: string | null = null;
  try {
    // iron-session
    // @ts-ignore
    const res = new Response();
    // @ts-ignore
    const session = await getSessionOnRoute(req, res);
    const email = session?.user?.email || req.headers.get("x-user-id") || getCookieFromReq(req, "tl_uid");
    if (email) userId = emailToId(email);
  } catch {}
  if (!userId) return NextResponse.json({ error: "no_user_id" }, { status: 401 });

  // body
  let body: any = {};
  try { body = await req.json(); } catch {}
  const metaPatch = body?.meta && typeof body.meta === "object" ? body.meta : {};
  const row = await mini.get(userId, slug).catch(() => null);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const merged = { ...(row || {}), meta: { ...(row?.meta || {}), ...metaPatch } };

  const anyMini = mini as any;
  if (typeof anyMini.update === "function") await anyMini.update(userId, slug, { meta: merged.meta });
  else if (typeof anyMini.put === "function") await anyMini.put(userId, slug, merged);
  else if (typeof anyMini.set === "function") await anyMini.set(userId, slug, merged);
  else if (typeof anyMini.save === "function") await anyMini.save(userId, slug, merged);
  else return NextResponse.json({ error: "mini_missing" }, { status: 500 });

  return NextResponse.json({ ok: true, meta: merged.meta });
}