// src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";
import { checkRateLimit, getClientIP, rateLimitHeaders, SIGNUP_LIMIT } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, SIGNUP_LIMIT);

  if (!rateCheck.success) {
    return NextResponse.json(
      { ok: false, error: "Too many signup attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rateCheck) }
    );
  }

  const res = new Response();
  const session = await getSessionOnRoute(req, res);

  const { email, password } = await req.json().catch(() => ({} as any));

  // Email validation
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return NextResponse.json({ ok: false, error: "Invalid email format" }, { status: 400 });
  }

  // TODO: ovde ide upis u bazu (unique email, hash lozinke, itd.)

  // Auto-login nakon signup-a
  session.user = { email: trimmedEmail };
  await session.save();

  return new NextResponse(JSON.stringify({ ok: true, user: session.user }), {
    status: 200,
    headers: {
      ...Object.fromEntries(res.headers.entries()),
      ...rateLimitHeaders(rateCheck),
    },
  });
}