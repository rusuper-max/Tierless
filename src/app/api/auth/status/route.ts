import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  return NextResponse.json(
    { authenticated: !!user, user },
    { headers: { "Cache-Control": "no-store" } }
  );
}