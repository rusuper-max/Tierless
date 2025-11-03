// src/app/api/calculators/[slug]/publish/route.ts
import { NextResponse } from "next/server";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";
import { getSession } from "@/lib/session";
import { mini } from "@/lib/mini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublishPayload = { publish?: boolean; published?: boolean; slug?: string };

async function safeJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

function getCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") || "";
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const p = part.trim();
    const i = p.indexOf("=");
    if (i === -1) continue;
    if (p.slice(0, i) === name) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

function getPlanFromReq(req: Request): PlanId {
  const hdr = (req.headers.get("x-plan") || "").toLowerCase() as PlanId;
  if (hdr && ENTITLEMENTS[hdr]) return hdr;
  const c = (getCookie(req, "tl_plan") || "").toLowerCase() as PlanId;
  if (c && ENTITLEMENTS[c]) return c;
  return "free";
}

function extractSlugFromUrl(url: string): string | null {
  try {
    const m = new URL(url).pathname.match(/\/api\/calculators\/([^/]+)\/publish/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

const isValidSlug = (s: string) => /^[a-z0-9-]{3,120}$/i.test(s);

export async function POST(req: Request, ctx: { params?: { slug?: string } }) {
  const body = (await safeJson<PublishPayload>(req)) ?? {};
  const raw =
    ctx?.params?.slug ||
    body.slug ||
    extractSlugFromUrl(req.url) ||
    "";
  const slug = raw ? decodeURIComponent(raw) : "";

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "bad_slug" }, { status: 400 });
  }

  // 1) pokušaj iron-session (cookies() u App Routeru)
  //    tvoj SessionData ima samo user?.email
  const session = await getSession().catch(() => null as any);
  const emailFromSession = (session?.user?.email || "").trim();

  // 2) fallback-ovi (ako sess nije setovan)
  const fallbackCookie = (getCookie(req, "tl_uid") || "").trim();
  const fallbackHeader = (req.headers.get("x-user-id") || "").trim();

  const userId = emailFromSession || fallbackCookie || fallbackHeader;
  if (!userId) {
    return NextResponse.json({ error: "no_user_id" }, { status: 401 });
  }

  const row = await mini.get(userId, slug).catch(() => null);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const wantPublish = body.publish ?? body.published ?? false;

  // limit (koristimo limits.online ili limits.published, u nedostatku unlimited)
  if (wantPublish) {
    const plan = getPlanFromReq(req);
    const limits: any = ENTITLEMENTS[plan]?.limits || {};
    const cap: number | "unlimited" =
      typeof limits.online === "number"
        ? limits.online
        : typeof limits.published === "number"
        ? limits.published
        : "unlimited";

    if (cap !== "unlimited") {
      const list = await mini.list(userId).catch(() => []);
      // broj trenutno online, ne računamo ovaj slug ako je već online
      const current = list.filter(
        (r: any) => r?.meta?.online === true && r?.meta?.slug !== slug
      ).length;
      const already = !!row?.meta?.online;
      if (!already && current >= cap) {
        return NextResponse.json(
          { error: "publish_limit_reached", limit: cap },
          { status: 409 }
        );
      }
    }
  }

  const nextMeta = { ...(row.meta || {}), online: wantPublish };

  // tolerantno prema različitim mini implementacijama
  const anyMini = mini as any;
  if (typeof anyMini.update === "function") {
    await anyMini.update(userId, slug, { meta: nextMeta });
  } else if (typeof anyMini.put === "function") {
    await anyMini.put(userId, slug, { ...row, meta: nextMeta });
  } else if (typeof anyMini.set === "function") {
    await anyMini.set(userId, slug, { ...row, meta: nextMeta });
  } else if (typeof anyMini.save === "function") {
    await anyMini.save(userId, slug, { ...row, meta: nextMeta });
  } else {
    return NextResponse.json(
      { error: "storage_not_supported" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, online: wantPublish });
}