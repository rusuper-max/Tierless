import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSlugFromDomain } from "@/lib/domains";

// JWT verification setup - must match auth.ts
const SESSION_SECRET = process.env.SESSION_SECRET;
const secretKey = SESSION_SECRET ? new TextEncoder().encode(SESSION_SECRET) : null;

/**
 * Verify JWT token from cookie.
 * Returns true if valid, false otherwise.
 */
async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token || !secretKey) return false;
  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "tl_sess";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tierless.net";

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname (e.g. "tierless.net", "menu.bistro.com", "localhost:3000")
  let hostname = req.headers.get("host")!.replace(".localhost:3000", `.${ROOT_DOMAIN}`);

  // Special case for Vercel preview URLs
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${ROOT_DOMAIN}`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  // Get the path (e.g. "/dashboard", "/")
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // 1. App Domain (tierless.net, app.tierless.net, localhost:3000)
  // If we are on the main domain, we run the standard auth check logic
  if (hostname === "localhost:3000" || hostname === ROOT_DOMAIN || hostname === `app.${ROOT_DOMAIN}`) {
    const isPrivate =
      url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/account") ||
      url.pathname.startsWith("/billing") ||
      url.pathname.startsWith("/editor");

    if (isPrivate) {
      const sessionCookie = req.cookies.get(SESSION_COOKIE);
      const isValidSession = await verifyToken(sessionCookie?.value);
      if (!isValidSession) {
        // Clear invalid/expired cookie if present
        const to = new URL("/signin", req.url);
        to.searchParams.set("next", path);
        const response = NextResponse.redirect(to);
        if (sessionCookie) {
          // Delete the invalid cookie
          response.cookies.delete(SESSION_COOKIE);
        }
        return response;
      }
    }
    // For main domain, we just let Next.js handle the routing normally
    return NextResponse.next();
  }

  // 2. Custom Domain (e.g. menu.bistro.com)
  // We rewrite to /p/[slug] based on the domain
  const slug = await getSlugFromDomain(hostname);

  if (slug) {
    // Rewrite to the public pricing page
    // We keep the path if it's just "/" or handle subpaths if needed
    // For now, we assume the root of the custom domain maps to the calculator
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL(`/p/${slug}${path === "/" ? "" : path}`, req.url));
    }
    // If they try to access other paths on custom domain (e.g. /about), we might want to 404 or handle differently
    // For now, let's rewrite everything to the slug, or maybe just 404?
    // Let's assume they might want deep links later, but for now, just rewrite root.
    return NextResponse.rewrite(new URL(`/p/${slug}`, req.url));
  }

  // If domain not found, 404
  return NextResponse.next();
}
