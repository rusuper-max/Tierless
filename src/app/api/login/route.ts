import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: string };
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    const session = await getSessionOnRoute(req, res);
    session.user = { email };
    await session.save();          // VAŽNO: snimi pre return
    return res;                    // sadrži Set-Cookie
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "session_setup_failed" }, { status: 500 });
  }
}