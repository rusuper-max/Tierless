import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const root = path.join(process.cwd(), "data", "users");
  const result: any = { slug, cwd: process.cwd(), usersRoot: root, users: [], hits: { full: [], mini: [] } };

  try {
    const ents = await fs.readdir(root, { withFileTypes: true });
    for (const e of ents) {
      if (!e.isDirectory()) continue;
      const uid = e.name;
      const fullFile = path.join(root, uid, "full", `${slug}.json`);
      const miniFile = path.join(root, uid, "calculators.json");

      const userRow: any = { uid, fullExists: false, miniHas: false };
      try { await fs.access(fullFile); userRow.fullExists = true; result.hits.full.push({ uid, file: fullFile }); } catch {}
      try {
        const txt = await fs.readFile(miniFile, "utf8").catch(() => "");
        if (txt) {
          const arr = JSON.parse(txt);
          if (Array.isArray(arr) && arr.some((r: any) => r?.meta?.slug === slug)) {
            userRow.miniHas = true;
            result.hits.mini.push({ uid, file: miniFile });
          }
        }
      } catch {}
      result.users.push(userRow);
    }
  } catch (e: any) {
    result.error = String(e?.message ?? e);
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}