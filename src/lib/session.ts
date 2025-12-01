// src/lib/session.ts  (iron-session v8 – jedan entrypoint)
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = { user?: { email: string } };

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Get password from environment
const IRON_SESSION_PASSWORD = process.env.IRON_SESSION_PASSWORD;

// SECURITY: In production, IRON_SESSION_PASSWORD must be set
if (IS_PRODUCTION && (!IRON_SESSION_PASSWORD || IRON_SESSION_PASSWORD.length < 32)) {
  throw new Error(
    "FATAL: IRON_SESSION_PASSWORD must be at least 32 characters in production! " +
    "Set this in your Vercel Environment Variables."
  );
}

// In development, use a fallback (this will never run in production due to check above)
const sessionPassword = IRON_SESSION_PASSWORD || "dev_password_please_change_me_0123456789_ABCDEFGH_xyz";

// Cookie name (can be customized via env)
export const SESSION_COOKIE_NAME = process.env.IRON_SESSION_COOKIE_NAME || "calckit_session";

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
  },
};

// 1) Za server komponente / obične API read-ove
export async function getSession() {
  // cookies() store radi u App Router API/Server kontekstu
  const store = await cookies() as unknown as any;
  return getIronSession<SessionData>(store, sessionOptions);
}

// 2) Za route handlere gde setuješ/destroy (login/logout)
export async function getSessionOnRoute(req: Request, res: Response) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}