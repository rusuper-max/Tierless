import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

// ČITANJE sesije preko req/res storage-a (stabilno u Next 16)
export async function GET(req: Request) {
  try {
    const tmp = NextResponse.json({}); // privremeni response da prosledimo iron-session-u
    const s = await getSessionOnRoute(req, tmp);
    // vratimo novi JSON, ali prenesemo eventualne Set-Cookie iz tmp
    return new NextResponse(JSON.stringify({ user: s.user ?? null }), {
      status: 200,
      headers: { "content-type": "application/json", "set-cookie": tmp.headers.get("set-cookie") ?? "" },
    });
  } catch (e) {
    // ako je kolačić loš/korumpiran, očisti ga i vrati null
    const res = NextResponse.json({ user: null, note: "session_cookie_cleared" });
    res.headers.append(
      "Set-Cookie",
      `${process.env.IRON_SESSION_COOKIE_NAME || "calckit_session"}=; Max-Age=0; Path=/; SameSite=Lax`
    );
    return res;
  }
}

// UPIS sesije — OBAVEZNO vratiti baš 'res' da Set-Cookie ode ka klijentu
export async function POST(req: Request) {
  const res = NextResponse.json({ set: true });
  const s = await getSessionOnRoute(req, res);
  s.user = { email: "test@example.com" };
  await s.save();
  return res; // ovo nosi Set-Cookie
}