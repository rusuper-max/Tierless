// src/app/api/_session-selftest/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await getSession();
    return NextResponse.json({
      ok: true,
      hasUser: !!s.user,
      user: s.user ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}