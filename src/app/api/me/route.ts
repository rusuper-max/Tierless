// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(res: NextResponse) {
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

export async function GET(req: Request) {
  const u = await getSessionUser(req);
  if (!u) return noStore(NextResponse.json({ user: null, authenticated: false }));
  const email = u.email;
  const name = email.split("@")[0] || email;
  return noStore(NextResponse.json({
    user: { id: email, name },
    authenticated: true,
  }));
}