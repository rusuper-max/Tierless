// src/lib/session-shared.ts
export type SessionData = { user?: { email: string } };

const DEV_FALLBACK_PASSWORD = "dev_password_please_change_me_0123456789_ABCDEFGH_xyz";

export function getSessionOptionsBase() {
  const envPwd = process.env.IRON_SESSION_PASSWORD;
  const password =
    envPwd && envPwd.length >= 32 ? envPwd : DEV_FALLBACK_PASSWORD;

  const cookieName = process.env.IRON_SESSION_COOKIE_NAME || "calckit_session";
  const secure = process.env.NODE_ENV === "production";

  return {
    password,
    cookieName,
    cookieOptions: { secure, sameSite: "lax" as const, path: "/" },
  };
}