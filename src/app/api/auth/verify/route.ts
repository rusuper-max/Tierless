import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeToken } from "@/lib/db";
import { getUserPlan, signSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  try {
    const email = await verifyAndConsumeToken(token);
    if (!email) {
      return NextResponse.json(
        { error: "invalid_or_expired_token" },
        { status: 401 }
      );
    }

    const plan = await getUserPlan(email);
    const cookie = await signSession({ email, plan });

    const res = NextResponse.redirect(new URL("/dashboard", req.url), {
      status: 303,
    });
    res.headers.set("Set-Cookie", cookie);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Vary", "Cookie");
    return res;
  } catch (error) {
    console.error("[auth.verify] failed", error);
    return NextResponse.json({ error: "verification_failed" }, { status: 500 });
  }
}
