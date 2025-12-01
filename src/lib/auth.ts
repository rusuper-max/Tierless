// src/lib/auth.ts — JWT auth (HS256), bez cookies().get/set
import { SignJWT, jwtVerify } from "jose";
import { getPool } from "@/lib/db";
import { 
  SESSION_SECRET, 
  SESSION_COOKIE_NAME, 
  IS_PRODUCTION,
  IS_DEV 
} from "@/lib/env";

// === Plan types ===
export type Plan = "free" | "starter" | "growth" | "pro" | "tierless";

export type SessionUser = {
  email: string;
  plan?: Plan;
};

// Cookie/JWT setup - using centralized env config
export const SESSION_COOKIE = SESSION_COOKIE_NAME;

// Secret key for JWT signing
// SECURITY: env.ts validates SESSION_SECRET exists in production
// In development, use a fallback that will never work in production
const SECRET = SESSION_SECRET || (IS_DEV ? "dev_secret_min_32_chars_000000000000000" : (() => {
  throw new Error("FATAL: SESSION_SECRET is required!");
})());
const secretKey = new TextEncoder().encode(SECRET);

export const COOKIE_BASE = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: IS_PRODUCTION,
  path: "/" as const,
};

// ---------- Plan helpers (validacija/normalizacija) ----------
export function isPlan(x: unknown): x is Plan {
  return x === "free" || x === "starter" || x === "growth" || x === "pro" || x === "tierless";
}
export function coercePlan(x: unknown): Plan {
  return isPlan(x) ? x : "free";
}

// ---------- DB helpers for user plan ----------
async function ensureUserPlansTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL
    )
  `);
}

/** Authoritative plan lookup from DB (fallback to "free"). */
export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    const plan = rows?.[0]?.plan;
    return coercePlan(plan);
  } catch {
    // On any DB error, never block: default to free
    return "free";
  }
}

// ---------- Interne cookie util funkcije ----------
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
    if (!u?.email) return null;
    return { email: u.email, plan: coercePlan(u.plan) };
  } catch {
    return null;
  }
}

// ---------- Public API ----------
export async function signSession(user: SessionUser, days = 30): Promise<string> {
  // Uvek normalizuj plan pre potpisivanja
  const token = await new SignJWT({ user: { email: user.email, plan: coercePlan(user.plan) } })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey);

  const attrs: string[] = [];
  attrs.push(`${SESSION_COOKIE}=${encodeURIComponent(token)}`);
  attrs.push(`Path=${COOKIE_BASE.path}`);
  if (COOKIE_BASE.httpOnly) attrs.push(`HttpOnly`);
  attrs.push(`SameSite=${COOKIE_BASE.sameSite.charAt(0).toUpperCase() + COOKIE_BASE.sameSite.slice(1)}`);
  if (COOKIE_BASE.secure) attrs.push(`Secure`);
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  attrs.push(`Max-Age=${maxAge}`);

  return attrs.join("; ");
}

/** Server-side čitanje user-a iz cookie-ja (Next 16: headers() je async). */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  // 1) API route: čitaj direktno iz req.headers
  let cookieHeader: string | null = req?.headers?.get("cookie") ?? null;

  // 2) Server component fallback (Next 16): await headers()
  if (!cookieHeader) {
    try {
      const { headers } = await import("next/headers");
      const h = await headers();
      cookieHeader = h.get("cookie");
    } catch {
      cookieHeader = null;
    }
  }

  const token = readCookieFromHeader(cookieHeader, SESSION_COOKIE);
  return userFromToken(token);
}

/** Unified helper: always return same identity + authoritative plan. */
export async function getUserAndPlan(req?: Request): Promise<{ id: string | null; plan: Plan }> {
  const id = await getUserIdFromRequest(req);
  if (!id) {
    return { id: null, plan: "free" };
  }
  const plan = await getUserPlan(id);
  return { id, plan };
}

/** Helper: email ili null; koristi se u API rutama. */
export async function getUserIdFromRequest(req?: Request): Promise<string | null> {
  // 1) Pokušaj Cloudflare Access header (radi i kad nema app session-a)
  try {
    // Nabavi Headers (iz req-a ili preko next/headers)
    const hdrs: Headers =
      (req?.headers as unknown as Headers) ||
      ((await (await import("next/headers")).headers()) as unknown as Headers);

    const cfEmail =
      hdrs.get?.("CF-Access-Authenticated-User-Email") ??
      hdrs.get?.("cf-access-authenticated-user-email") ??
      null;

    if (cfEmail && cfEmail.includes("@")) {
      return cfEmail.toLowerCase();
    }
  } catch {
    // ignore i nastavi na session
  }

  // 2) Fallback: JWT session iz cookie-ja (postojeće ponašanje)
  const u = await getSessionUser(req);
  return u?.email ?? null;
}