import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Edge-safe: do NOT import server-only modules here
const SESSION_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || "tl_sess";

export function middleware(req: NextRequest) {
  const isPrivate =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/account") ||
    req.nextUrl.pathname.startsWith("/billing");

  if (!isPrivate) return NextResponse.next();

  const has = !!req.cookies.get(SESSION_COOKIE);
  if (!has) {
    const to = new URL("/signin", req.nextUrl.origin);
    to.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/billing/:path*"],
};