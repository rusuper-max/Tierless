// src/app/api/public/[idOrSlug]/route.ts
import { NextResponse } from "next/server";
import * as fullStore from "@/lib/fullStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  return res;
}

/* ---------------- smarter id/slug parse ---------------- */
const reB64Url = /^[A-Za-z0-9_-]+$/;
const PUBLIC_ID_LENGTH = 12;

function parseIdOrSlug(key: string): { id: string; slug: string } {
  if (!key) return { id: "", slug: "" };
  if (
    key.length > PUBLIC_ID_LENGTH &&
    key[PUBLIC_ID_LENGTH] === "-" &&
    reB64Url.test(key.slice(0, PUBLIC_ID_LENGTH))
  ) {
    return {
      id: key.slice(0, PUBLIC_ID_LENGTH),
      slug: key.slice(PUBLIC_ID_LENGTH + 1),
    };
  }
  if (key.length === PUBLIC_ID_LENGTH && reB64Url.test(key)) {
    return { id: key, slug: "" };
  }
  return { id: "", slug: key };
}

async function extractKey(
  req: Request,
  ctx?: {
    params?:
      | { idOrSlug?: string; slug?: string }
      | Promise<{ idOrSlug?: string; slug?: string }>;
  }
): Promise<string> {
  let fromCtx: string | undefined;
  try {
    const p = (ctx as any)?.params;
    const got = typeof p?.then === "function" ? await p : p;
    fromCtx = got?.idOrSlug ?? got?.slug;
  } catch {}
  if (fromCtx && fromCtx !== "undefined" && fromCtx !== "null") {
    return decodeURIComponent(String(fromCtx));
  }
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const fromPath = parts[parts.length - 1];
    if (fromPath && fromPath !== "public") {
      return decodeURIComponent(fromPath);
    }
  } catch {}
  return "";
}

function isPublished(meta: any): boolean {
  if (typeof meta?.published === "boolean") return meta.published;
  if (typeof meta?.online === "boolean") return meta.online;
  return false;
}

export async function GET(
  req: Request,
  ctx: { params?: { idOrSlug?: string } }
) {
  const key = await extractKey(req, ctx);
  if (!key || key === "public") {
    return jsonNoCache({ ok: false, error: "bad_key" }, 400);
  }

  const { id, slug } = parseIdOrSlug(key);
  const url = new URL(req.url);
  const owner = url.searchParams.get("u") || "";

  let calc: any | undefined;

  if (owner && slug) {
    try {
      calc = await fullStore.getFull(owner, slug);
    } catch {
      calc = undefined;
    }
  }
  if (!calc && id) {
    calc = await fullStore.findFullById(id);
  }
  if (!calc && slug) {
    calc = await fullStore.findFullBySlug(slug);
  }
  if (!calc && !slug && id) {
    // fallback: treat the entire key as slug if id lookup failed
    calc = await fullStore.findFullBySlug(key);
  }

  if (!calc) {
    return jsonNoCache({ ok: false, error: "not_found", key }, 404);
  }

  const meta = {
    ...(calc.meta || {}),
    slug: (calc.meta?.slug as string) || slug || key,
    id: (calc.meta?.id as string) || id || "",
  };

  if (!isPublished(meta)) {
    return jsonNoCache({ ok: false, error: "not_published" }, 404);
  }

  return jsonNoCache(
    {
      ok: true,
      data: {
        ...calc,
        meta,
      },
    },
    200
  );
}
