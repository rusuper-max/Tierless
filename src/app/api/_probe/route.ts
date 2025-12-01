// src/app/api/_probe/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ultra-simple health probe.
 * Ne zavisi od sesije, baze ili spoljnjih servisa, tako da uvek radi
 * i u CI i u produkciji.
 */
export async function GET() {
  const shape = {
    ok: true,
    env: process.env.NODE_ENV ?? "unknown",
  };

  return NextResponse.json(shape, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
