// src/app/api/calculators/[slug]/rename/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/calculators/[slug]/rename
 * Body: { name: string }
 * Res:  200 { ok: true }  | 4xx { error: "..." }
 */
export async function POST(
  req: Request,
  context: { params?: { slug?: string } }
) {
  // 1) Auth
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Slug (robusno: iz params ili iz URL-a)
  const url = new URL(req.url);
  const slug =
    context?.params?.slug ??
    decodeURIComponent(url.pathname.split("/").slice(-2, -1)[0] || "");
  if (!slug) {
    return NextResponse.json({ error: "bad_slug" }, { status: 400 });
  }

  // 3) Telo (tolerantno čitanje)
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const name = String(body?.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "bad_name" }, { status: 400 });
  }

  // 4) Mora da postoji postojeća strana
  const all = await calcsStore.list(userId);
  const row = all.find((r) => r?.meta?.slug === slug);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 5) Zabrani duplo ime (case-insensitive), osim ako je isti slug
  const nameLower = name.toLowerCase();
  const conflict = all.some(
    (r) =>
      r.meta.slug !== slug &&
      (r.meta.name || "").toString().trim().toLowerCase() === nameLower
  );
  if (conflict) {
    return NextResponse.json({ error: "name_exists" }, { status: 409 });
  }

  // 6) Upis imena preko calcsStore (setuje i updatedAt)
  const ok = await calcsStore.updateName(userId, slug, name);
  if (!ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // 7) Sve OK – odgovori formatom koji UI već koristi
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}