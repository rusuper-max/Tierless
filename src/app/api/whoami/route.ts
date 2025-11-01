import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  return NextResponse.json({ userId });
}