import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: "x-dev-email", value: "", path: "/", maxAge: 0 });
  return res;
}