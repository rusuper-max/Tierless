import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { safeUserId } from "@/lib/safeUserId";
import { calcFromMetaConfig } from "@/lib/calc-init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJson(file: string) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return undefined; }
}

async function listUserDirs(root: string) {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {
    return [];
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ slug?: string }> }) {
  const { slug } = await ctx.params;              // ← AWAIT params
  if (!slug) return NextResponse.json({ ok:false, error:"bad_slug" }, { status: 400 });

  const url = new URL(req.url);
  const owner = url.searchParams.get("u"); // npr. "dev:ru@example.com"
  const USERS_ROOT = path.join(process.cwd(), "data", "users");

  // 1) Ako znamo vlasnika → direktno probaj FULL
  if (owner) {
    const uid = safeUserId(owner);
    const fullFile = path.join(USERS_ROOT, uid, "full", `${slug}.json`);
    const fullData = await readJson(fullFile);
    if (fullData) return NextResponse.json({ ok:true, data: { ...fullData, meta:{ ...fullData.meta, slug } } });
  }

  // 2) Fallback: FULL bilo kog usera (scan)
  for (const uid of await listUserDirs(USERS_ROOT)) {
    const fullFile = path.join(USERS_ROOT, uid, "full", `${slug}.json`);
    const fullData = await readJson(fullFile);
    if (fullData) return NextResponse.json({ ok:true, data: { ...fullData, meta:{ ...fullData.meta, slug } } });
  }

  // 3) Fallback: MINI seed (iz calculators.json)
  for (const uid of await listUserDirs(USERS_ROOT)) {
    const miniFile = path.join(USERS_ROOT, uid, "calculators.json");
    const arr = await readJson(miniFile);
    if (Array.isArray(arr)) {
      const row = arr.find((r: any) => r?.meta?.slug === slug);
      if (row) {
        const seeded = calcFromMetaConfig(row);
        return NextResponse.json({ ok:true, data: { ...seeded, meta:{ ...seeded.meta, slug } } });
      }
    }
  }

  return NextResponse.json({ ok:false, error:"not_found", slug }, { status: 404 });
}