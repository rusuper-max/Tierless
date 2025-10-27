// src/lib/auth.ts

/** Parse "Cookie" header -> { name: value } */
function parseCookieHeader(cookieHeader: string | null | undefined) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.split("=");
    const key = (k || "").trim();
    if (!key) continue;
    out[key] = decodeURIComponent(v.join("=").trim() || "");
  }
  return out;
}

/** Izvuci userId iz *ovog requesta* (bez next/headers.cookies()) */
export function getUserIdFromRequest(req: Request) {
  const jar = parseCookieHeader(req.headers.get("cookie"));
  const devEmail = jar["x-dev-email"];
  if (devEmail) return "dev:" + devEmail.toLowerCase();
  const anonToken = jar["x-anon"] || jar["next-auth.csrf-token"] || "guest";
  return `anon:${anonToken}`;
}

/** Alias zbog starog koda (očekuje getUserId) — i dalje traži req */
export const getUserId = getUserIdFromRequest;