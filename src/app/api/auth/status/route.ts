export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  return NextResponse.json(
    { authenticated: !!user, user: user ? { email: user.email } : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}