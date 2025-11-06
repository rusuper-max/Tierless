import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  return NextResponse.json({ userId });
}