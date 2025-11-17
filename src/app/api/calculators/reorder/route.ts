// src/app/api/calculators/reorder/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const order: string[] = Array.isArray(body?.order) ? body.order : [];
  if (order.length === 0) {
    return NextResponse.json({ error: "bad_order" }, { status: 400 });
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cleaned = order
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => !!s);

  if (!cleaned.length) {
    return NextResponse.json({ error: "bad_order" }, { status: 400 });
  }

  await calcsStore.setOrder(userId, cleaned);

  return NextResponse.json(
    { ok: true, count: cleaned.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}
