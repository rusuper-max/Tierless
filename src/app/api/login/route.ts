// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, COOKIE_BASE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SameSite = "lax" | "strict" | "none";
type Opts = {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
  domain?: string;
  maxAge?: number;
};

function serializeCookie(name: string, value: string, opts: Opts = {}): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (typeof opts.maxAge === "number") parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  if (opts.sameSite) {
    const map = { lax: "Lax", strict: "Strict", none: "None" } as const;
    parts.push(`SameSite=${map[opts.sameSite]}`);
  }
  if (opts.secure) parts.push("Secure");
  if (opts.httpOnly) parts.push("HttpOnly");
  return parts.join("; ");
}

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let email = "";
  let next = "/dashboard";

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    email = String(body?.email || "");
    if (body?.next) next = String(body.next);
  } else {
    const form = await req.formData().catch(() => null);
    if (form) {
      email = String(form.get("email") || "");
      next = String(form.get("next") || next);
    }
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const token = await signSession({ email });

  // Vraćamo HTML koji postavlja cookie + radi momentalni redirect (JS + <meta> fallback)
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Cache-Control" content="no-store" />
  <meta http-equiv="refresh" content="0;url=${next}" />
  <title>Redirecting…</title>
</head>
<body>
  <noscript>
    <p>Redirecting to <a href="${next}">${next}</a>…</p>
  </noscript>
  <script>
    try { window.location.replace(${JSON.stringify(next)}); }
    catch { window.location.href = ${JSON.stringify(next)}; }
  </script>
</body>
</html>`;

  const res = new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });

  res.headers.append(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, token, {
      path: COOKIE_BASE.path,
      httpOnly: COOKIE_BASE.httpOnly,
      sameSite: COOKIE_BASE.sameSite,
      secure: COOKIE_BASE.secure,
      maxAge: 30 * 24 * 60 * 60,
    })
  );

  return res;
}