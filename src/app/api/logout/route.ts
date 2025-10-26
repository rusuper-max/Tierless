import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const res = NextResponse.json({ ok: true });
    const session = await getSessionOnRoute(req, res);
    await session.destroy();       // Set-Cookie za brisanje
    return res;
  } catch {
    return NextResponse.json({ error: "logout_failed" }, { status: 500 });
  }
}