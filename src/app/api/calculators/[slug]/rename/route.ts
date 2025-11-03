// src/app/api/calculators/[slug]/rename/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

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
function userCalcsFile(userId: string) {
  const uid = safeUserId(userId);
  return path.join(process.cwd(), "data", "users", uid, "calculators.json");
}
async function readRows(file: string) {
  try {
    const txt = await fs.readFile(file, "utf8");
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : json?.rows ?? [];
  } catch {
    return [];
  }
}
async function writeRows(file: string, rows: any[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

export async function POST(
  req: Request,
  ctx: { params: { slug: string } }
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  const paramSlug = decodeURIComponent((ctx?.params?.slug ?? "").toString());
  const slug = (paramSlug || body?.slug || "").trim();
  if (!slug) return NextResponse.json({ error: "bad_slug" }, { status: 400 });

  const name = (body?.name ?? "").toString().trim();
  if (!name) return NextResponse.json({ error: "bad_name" }, { status: 400 });

  const file = userCalcsFile(userId);
  const rows = await readRows(file);

  const idx = rows.findIndex((r: any) => r?.meta?.slug === slug);
  if (idx < 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // ❗ zabrana duplih imena (case-insensitive), osim ako je isti slug
  const exists = rows.some(
    (r: any) =>
      r?.meta?.slug !== slug &&
      (r?.meta?.name || "").toString().trim().toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    return NextResponse.json({ error: "name_exists" }, { status: 409 });
  }

  rows[idx] = {
    ...rows[idx],
    meta: { ...(rows[idx]?.meta || {}), name },
  };

  await writeRows(file, rows);
  return NextResponse.json({ ok: true });
}