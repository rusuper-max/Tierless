// src/app/api/dev/plan/route.ts
import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams.get("set") || "free";
  const res = NextResponse.json({ ok: true, plan: p });
  res.headers.append(
    "Set-Cookie",
    serialize("tl_plan", p, { path: "/", httpOnly: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 })
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}