import { NextResponse } from "next/server";
import { CALC_TEMPLATES } from "@/data/calcTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Samo listamo pricing templejte (nema page.tsx u /api!)
export async function GET() {
  const list = CALC_TEMPLATES.map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    defaultName: t.defaultName,
    mode: t.mode,
  }));
  return NextResponse.json(list, { status: 200 });
}