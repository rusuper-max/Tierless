// src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const res = new Response();
  const session = await getSessionOnRoute(req, res);

  const { email, password } = await req.json().catch(() => ({} as any));

  // TODO: ovde ide upis u bazu (unique email, hash lozinke, itd.)
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  // Auto-login nakon signup-a
  session.user = { email };
  await session.save();

  return new NextResponse(JSON.stringify({ ok: true, user: session.user }), {
    status: 200,
    headers: res.headers,
  });
}