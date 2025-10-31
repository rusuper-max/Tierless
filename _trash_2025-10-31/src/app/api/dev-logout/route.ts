import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const res = new Response();
  const session = await getSessionOnRoute(req, res);
  await session.destroy();

  // počisti i pomoćne dev kolačiće ako su korišćeni
  res.headers.append("Set-Cookie", "x-dev-email=; Path=/; Max-Age=0; SameSite=Lax");
  res.headers.append("Set-Cookie", "tl_authed=; Path=/; Max-Age=0; SameSite=Lax");

  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: res.headers,
  });
}