// src/lib/session.ts  (iron-session v8 – jedan entrypoint)
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = { user?: { email: string } };

// >=32 char fallback u dev; u produkciji OBAVEZNO .env
const DEV_FALLBACK_PASSWORD = "dev_password_please_change_me_0123456789_ABCDEFGH_xyz";

// Izdvoji cookie name da ga koriste i drugi delovi app-a (npr. /api/_probe)
export const SESSION_COOKIE_NAME = process.env.IRON_SESSION_COOKIE_NAME || "calckit_session";

export const sessionOptions: SessionOptions = {
  password:
    (process.env.IRON_SESSION_PASSWORD && process.env.IRON_SESSION_PASSWORD.length >= 32)
      ? process.env.IRON_SESSION_PASSWORD
      : DEV_FALLBACK_PASSWORD,
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

// 1) Za server komponente / obične API read-ove
export async function getSession() {
  // cookies() store radi u App Router API/Server kontekstu
  const store = cookies() as unknown as any;
  return getIronSession<SessionData>(store, sessionOptions);
}

// 2) Za route handlere gde setuješ/destroy (login/logout)
export async function getSessionOnRoute(req: Request, res: Response) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}