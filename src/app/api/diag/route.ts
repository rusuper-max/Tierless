import { NextResponse } from "next/server";
export const runtime = "nodejs";           // forsiramo Node
export const dynamic = "force-dynamic";    // bez cache-a u devu

export async function GET() {
  try {
    const info = {
      runtime: "nodejs",
      node: process.versions.node,
      cwd: process.cwd(),
      now: Date.now(),
    };
    return NextResponse.json({ ok: true, info });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}