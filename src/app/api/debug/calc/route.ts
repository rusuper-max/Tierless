// src/app/api/debug/calc/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as fullStore from "@/lib/fullStore";
import * as calcsStore from "@/lib/calcsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  
  if (!slug) {
    return NextResponse.json({ error: "Missing slug param" }, { status: 400 });
  }

  const calcsData = await calcsStore.get(userId, slug);
  const fullData = await fullStore.getFull(userId, slug);

  return NextResponse.json({
    userId,
    slug,
    calcsStore: {
      found: !!calcsData,
      meta: calcsData?.meta || null,
    },
    fullStore: {
      found: !!fullData,
      meta: fullData?.meta ? {
        slug: fullData.meta.slug,
        id: fullData.meta.id,
        name: fullData.meta.name,
        simpleAddCheckout: fullData.meta.simpleAddCheckout,
        simpleSections: fullData.meta.simpleSections?.length || 0,
        contact: fullData.meta.contact,
        published: fullData.meta.published,
        contactOverride: fullData.meta.contactOverride,
      } : null,
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}


