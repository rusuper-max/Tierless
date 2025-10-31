// src/lib/auth.ts — JWT auth (HS256), bez cookies().get/set
import { SignJWT, jwtVerify } from "jose";

export type SessionUser = { email: string };

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "tl_sess";
const SECRET =
  process.env.SESSION_SECRET || "dev_secret_min_32_chars_000000000000000";
const secretKey = new TextEncoder().encode(SECRET);

export const COOKIE_BASE = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/" as const,
};

function readCookieFromHeader(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  const parts = header.split(/; */);
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    if (k === name) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

async function userFromToken(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const u = payload.user as SessionUser | undefined;
    return u?.email ? u : null;
  } catch {
    return null;
  }
}

export async function signSession(user: SessionUser, days = 30): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey);
}

/** Server-side čitanje user-a iz cookie-ja (Next 16: headers() je async). */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  // 1) API/route handler: čitaj direktno iz req.headers
  let cookieHeader: string | null = req?.headers?.get("cookie") ?? null;

  // 2) Server component fallback (Next 16): await headers()
  if (!cookieHeader) {
    try {
      const { headers } = await import("next/headers");
      const h = await headers();                 // ⬅️ bitno: await headers()
      cookieHeader = h.get("cookie");
    } catch {
      cookieHeader = null;
    }
  }

  const token = readCookieFromHeader(cookieHeader, SESSION_COOKIE);
  return userFromToken(token);
}

/** Helper: email ili null; koristi se u API rutama. */
export async function getUserIdFromRequest(req?: Request): Promise<string | null> {
  const u = await getSessionUser(req);
  return u?.email ?? null;
}