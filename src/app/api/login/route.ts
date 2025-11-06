import { NextResponse } from "next/server";
import { signSession, getSessionUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/account-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isSafeNext(next: unknown): next is string {
  return typeof next === "string" && next.startsWith("/");
}

export async function POST(req: Request) {
  // 1) Parsiranje (form ili JSON)
  let email = "";
  let next = "/dashboard";

  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    email = String(fd.get("email") || "").trim();
    const nx = fd.get("next");
    if (isSafeNext(nx)) next = nx;
  } else if (ctype.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    email = String(body?.email || "").trim();
    if (isSafeNext(body?.next)) next = body.next;
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      email = String(fd.get("email") || "").trim();
      const nx = fd.get("next");
      if (isSafeNext(nx)) next = nx;
    }
  }

  if (!email) {
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  }

  // 2) Učitaj server-side plan za ovog korisnika (source of truth)
  const plan = await getUserPlan(email);

  // 3) Zapiši sesiju sa planom
  const cookie = await signSession({ email, plan });

  // 4) Redirect + postavi cookie
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.headers.set("Set-Cookie", cookie);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "Cookie");
  return res;
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}