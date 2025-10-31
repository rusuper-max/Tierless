import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const res = new Response();
  const session = await getSessionOnRoute(req, res);
  session.user = { email };
  await session.save();

  // (dev) dodatni vidljivi cookie kao pomoćni signal — opciono
  if (process.env.NODE_ENV !== "production") {
    res.headers.append("Set-Cookie", `tl_authed=1; Path=/; Max-Age=${60*60*24*7}; SameSite=Lax`);
  }

  return new NextResponse(JSON.stringify({ ok: true, email }), {
    status: 200,
    headers: res.headers,
  });
}