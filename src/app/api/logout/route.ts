export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SESSION_COOKIE, COOKIE_BASE } from "@/lib/auth";
import { serialize } from "cookie";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Cache-Control", "no-store");

  // Obriši naš sesijski JWT
  res.headers.append(
    "Set-Cookie",
    serialize(SESSION_COOKIE, "", { ...COOKIE_BASE, maxAge: 0, expires: new Date(0) })
  );

  // (Opcionalno) obriši dev cookie ako je postojao
  res.headers.append(
    "Set-Cookie",
    serialize("x-dev-email", "", { ...COOKIE_BASE, maxAge: 0, expires: new Date(0) })
  );

  return res;
}