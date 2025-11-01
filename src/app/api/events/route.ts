// src/app/api/events/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "/api/events", method: "POST", body: { events: [{ name: "event_name", ts: Date.now(), props: {} }] } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    // DEV: log u konzolu (u produkciji šalješ u analitiku/datastore)
    if (events.length) {
      // eslint-disable-next-line no-console
      console.log("[telemetry]", events);
    }
    return NextResponse.json({ ok: true, received: events.length });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}