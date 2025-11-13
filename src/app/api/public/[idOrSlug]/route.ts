// src/app/api/public/[idOrSlug]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { calcFromMetaConfig } from "@/lib/calc-init"; // NOTE: adjust if your path is "@/lib/calc-init" (see below)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}

async function readJson(file: string) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return undefined; }
}
async function listUserDirs(root: string) {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch { return []; }
}

/* ---------------- smarter id/slug parse ---------------- */
const reB64Url = /^[A-Za-z0-9_-]+$/;
const MIN_ID = 10;
const MAX_ID = 24;

function parseIdOrSlug(key: string): { id: string; slug: string } {
  if (!key) return { id: "", slug: "" };
  if (key.length >= MIN_ID && key.length <= MAX_ID && reB64Url.test(key)) {
    return { id: key, slug: "" };
  }
  let cut = -1;
  for (let i = 0; i < key.length; i++) {
    if (key[i] !== "-") continue;
    const prefix = key.slice(0, i);
    if (
      prefix.length >= MIN_ID &&
      prefix.length <= MAX_ID &&
      reB64Url.test(prefix)
    ) {
      cut = i; // najdesniji validan prefix
    }
  }
  if (cut !== -1 && cut + 1 < key.length) {
    return { id: key.slice(0, cut), slug: key.slice(cut + 1) };
  }
  return { id: "", slug: key };
}

/* ---------------- robust param extraction ---------------- */
async function extractKey(
  req: Request,
  ctx?: { params?: { idOrSlug?: string; slug?: string } } | { params: Promise<{ idOrSlug?: string; slug?: string }> } | any
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

/* ---------------- GET ---------------- */
export async function GET(req: Request, ctx: { params?: { idOrSlug?: string } }) {
  const key = await extractKey(req, ctx);
  if (!key || key === "public") {
    return jsonNoCache({ ok: false, error: "bad_key" }, 400);
  }

  const { id, slug } = parseIdOrSlug(key);
  const url = new URL(req.url);
  const owner = url.searchParams.get("u") || "";
  const wantDebug = url.searchParams.get("debug") === "1";

  const USERS_ROOT = path.join(process.cwd(), "data", "users");
  const PUBLIC_ROOT = path.join(process.cwd(), "data", "public");
  const attempts: string[] = [];

  // 0) PUBLIC BY ID (kanonski)
  if (id) {
    const publicFileById = path.join(PUBLIC_ROOT, `${id}.json`);
    attempts.push(`public_id:${publicFileById}`);
    const byId = await readJson(publicFileById);
    if (byId) {
      const currentSlug = (byId.meta?.slug ?? "") as string;
      const fixedSlug = slug || currentSlug;
      const needsFix = !fixedSlug || fixedSlug === id || currentSlug === id;
      const data = { ...byId, meta: { ...(byId.meta || {}), id, slug: fixedSlug } };
      if (needsFix && fixedSlug && fixedSlug !== id) {
        try {
          await fs.mkdir(PUBLIC_ROOT, { recursive: true });
          await fs.writeFile(publicFileById, JSON.stringify(data, null, 2), "utf8");
          await fs.writeFile(path.join(PUBLIC_ROOT, `${fixedSlug}.json`), JSON.stringify(data, null, 2), "utf8");
        } catch {}
      }
      return jsonNoCache({ ok: true, data, attempts: wantDebug ? attempts : undefined }, 200);
    }
  }

  // 1) PUBLIC BY SLUG
  if (slug) {
    const publicFileBySlug = path.join(PUBLIC_ROOT, `${slug}.json`);
    attempts.push(`public_slug:${publicFileBySlug}`);
    const bySlug = await readJson(publicFileBySlug);
    if (bySlug) {
      const data = { ...bySlug, meta: { ...((bySlug as any).meta || {}), slug, id: ((bySlug as any)?.meta?.id as string) || id || "" } };
      return jsonNoCache({ ok: true, data, attempts: wantDebug ? attempts : undefined }, 200);
    }
  } else {
    // fallback: ceo key kao slug
    const publicFileBySlug = path.join(PUBLIC_ROOT, `${key}.json`);
    attempts.push(`public_slug_fallback:${publicFileBySlug}`);
    const bySlug = await readJson(publicFileBySlug);
    if (bySlug) {
      const data = { ...bySlug, meta: { ...(bySlug.meta || {}), slug: key, id: bySlug.meta?.id || "" } };
      return jsonNoCache({ ok: true, data, attempts: wantDebug ? attempts : undefined }, 200);
    }
  }

  // 2) FULL by owner (?u=)
  if (owner) {
    const uid = safeUserId(owner);
    const s = slug || key;
    const file = path.join(USERS_ROOT, uid, "full", `${s}.json`);
    attempts.push(`full_owner:${file}`);
    const data = await readJson(file);
    if (data) {
      const merged = { ...data, meta: { ...((data as any).meta || {}), slug: s, id: ((data as any)?.meta?.id as string) || id || "" } };
      return jsonNoCache({ ok: true, data: merged, attempts: wantDebug ? attempts : undefined }, 200);
    }
  }

  // 3) FULL scan svih usera
  {
    const s = slug || key;
    for (const uid of await listUserDirs(USERS_ROOT)) {
      const file = path.join(USERS_ROOT, uid, "full", `${s}.json`);
      attempts.push(`full_scan:${file}`);
      const data = await readJson(file);
      if (data) {
        const merged = { ...data, meta: { ...((data as any).meta || {}), slug: s, id: ((data as any)?.meta?.id as string) || id || "" } };
        return jsonNoCache({ ok: true, data: merged, attempts: wantDebug ? attempts : undefined }, 200);
      }
    }
  }

  // 4) MINI seed
  {
    const s = slug || key;
    for (const uid of await listUserDirs(USERS_ROOT)) {
      const file = path.join(USERS_ROOT, uid, "calculators.json");
      attempts.push(`mini_scan:${file}`);
      const arr = await readJson(file);
      if (Array.isArray(arr)) {
        const row = arr.find((r: any) => r?.meta?.slug === s);
        if (row) {
          const seeded = calcFromMetaConfig(row);
          const merged = { ...seeded, meta: { ...((seeded as any).meta || {}), slug: s, id: ((seeded as any)?.meta?.id as string) || id || "" } };
          return jsonNoCache({ ok: true, data: merged, attempts: wantDebug ? attempts : undefined }, 200);
        }
      }
    }
  }

  return jsonNoCache({ ok: false, error: "not_found", key }, 404);
}