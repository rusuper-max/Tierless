import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { calcFromMetaConfig } from "@/lib/calc-init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/** Robustan extract: prvo ctx.params, pa iz URL path-a (Next 16 ume da zbuni ctx) */
function extractSlug(req: Request, ctx: any): string {
  const fromCtx = ctx?.params?.slug;
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["api","public","slug"]
  const fromPath = parts[parts.length - 1];
  const slug = decodeURIComponent(fromCtx || fromPath || "");
  return slug;
}

export async function GET(req: Request, ctx: { params?: { slug?: string } }) {
  const slug = extractSlug(req, ctx);
  if (!slug || slug === "public") {
    return NextResponse.json({ ok: false, error: "bad_slug" }, { status: 400 });
  }

  const url = new URL(req.url);
  const owner = url.searchParams.get("u") || "";
  const wantDebug = url.searchParams.get("debug") === "1";

  const USERS_ROOT = path.join(process.cwd(), "data", "users");
  const PUBLIC_ROOT = path.join(process.cwd(), "data", "public");
  const attempts: string[] = [];

  // 0) PUBLIC COPY
  {
    const publicFile = path.join(PUBLIC_ROOT, `${slug}.json`);
    attempts.push(`public:${publicFile}`);
    const data = await readJson(publicFile);
    if (data) {
      return NextResponse.json(
        { ok: true, data: { ...data, meta: { ...data.meta, slug } }, attempts: wantDebug ? attempts : undefined },
        { headers: { "cache-control": "no-store" } }
      );
    }
  }

  // 1) FULL za konkretnog owner-a (ako je prosleđen ?u=)
  if (owner) {
    const uid = safeUserId(owner);
    const file = path.join(USERS_ROOT, uid, "full", `${slug}.json`);
    attempts.push(`full_owner:${file}`);
    const data = await readJson(file);
    if (data) {
      return NextResponse.json(
        { ok: true, data: { ...data, meta: { ...data.meta, slug } }, attempts: wantDebug ? attempts : undefined },
        { headers: { "cache-control": "no-store" } }
      );
    }
  }

  // 2) FULL scan kroz sve korisnike
  for (const uid of await listUserDirs(USERS_ROOT)) {
    const file = path.join(USERS_ROOT, uid, "full", `${slug}.json`);
    attempts.push(`full_scan:${file}`);
    const data = await readJson(file);
    if (data) {
      return NextResponse.json(
        { ok: true, data: { ...data, meta: { ...data.meta, slug } }, attempts: wantDebug ? attempts : undefined },
        { headers: { "cache-control": "no-store" } }
      );
    }
  }

  // 3) MINI seed (calculators.json)
  for (const uid of await listUserDirs(USERS_ROOT)) {
    const file = path.join(USERS_ROOT, uid, "calculators.json");
    attempts.push(`mini_scan:${file}`);
    const arr = await readJson(file);
    if (Array.isArray(arr)) {
      const row = arr.find((r: any) => r?.meta?.slug === slug);
      if (row) {
        const seeded = calcFromMetaConfig(row);
        return NextResponse.json(
          { ok: true, data: { ...seeded, meta: { ...seeded.meta, slug } }, attempts: wantDebug ? attempts : undefined },
          { headers: { "cache-control": "no-store" } }
        );
      }
    }
  }

  return NextResponse.json(
    { ok: false, error: "not_found", slug, attempts: wantDebug ? attempts : undefined },
    { status: 404, headers: { "cache-control": "no-store" } }
  );
}