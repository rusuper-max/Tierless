import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

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