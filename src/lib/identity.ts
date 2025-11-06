import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export async function getIdentity(req?: Request): Promise<{ id: string|null; email: string|null }> {
  // 1) CF Access header (radi i sa req i bez req)
  try {
    const h: Headers =
      (req?.headers as unknown as Headers) ??
      ((await headers()) as unknown as Headers);
    const cf =
      h.get?.("CF-Access-Authenticated-User-Email") ??
      h.get?.("cf-access-authenticated-user-email") ??
      null;

    if (cf && cf.includes("@")) {
      const email = cf.toLowerCase();
      return { id: email, email };
    }
  } catch {
    // ignore
  }

  // 2) Fallback: app session (JWT)
  const u = await getSessionUser(req);
  if (u?.email) {
    const email = String(u.email).toLowerCase();
    const id = (u as any).id ? String((u as any).id) : email;
    return { id, email };
  }

  return { id: null, email: null };
}