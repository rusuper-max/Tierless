// src/app/api/auth/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

export async function GET() {
  // Dev: tretiramo kao ulogovanog; prod kasnije vežemo na pravu sesiju
  return NextResponse.json({ authenticated: true });
}