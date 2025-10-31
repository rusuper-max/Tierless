// src/lib/session.ts  (iron-session v8 — App Router friendly)
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions, type IronSession } from "iron-session";

export type SessionData = { user?: { email: string } };

// U PROD obavezno kroz .env (min 32 char)
const DEV_FALLBACK_PASSWORD = "dev_password_please_change_me_0123456789_ABCDEFGH_xyz";

export const sessionOptions: SessionOptions = {
  password:
    (process.env.IRON_SESSION_PASSWORD && process.env.IRON_SESSION_PASSWORD.length >= 32)
      ? process.env.IRON_SESSION_PASSWORD
      : DEV_FALLBACK_PASSWORD,
  cookieName: process.env.IRON_SESSION_COOKIE_NAME || "calckit_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

// SERVER usage (server component / GET route): koristi next/headers cookies() STORE
export async function getServerSession(): Promise<IronSession<SessionData>> {
  // ključno: POZIV cookies(), ne referenca na funkciju
  const store = cookies() as unknown as any;
  return getIronSession<SessionData>(store, sessionOptions);
}

// Route handlers (login/logout) → req/res varijanta
export async function getSessionOnRoute(req: Request, res: Response): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

// Alias (ako negde importuješ getSession)
export async function getSession() {
  return getServerSession();
}