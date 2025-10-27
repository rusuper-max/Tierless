import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getUserIdFromRequest } from "../../../lib/auth";

export const runtime = "nodejs";

function safe(s: string){ return (s||"anon").toLowerCase().replace(/[^a-z0-9]+/g,"_").slice(0,120); }

export async function GET(req: Request) {
  try {
    const uid = safe(getUserIdFromRequest(req));
    const dir = path.join(process.cwd(), "data", "users", uid);
    const file = path.join(dir, "__fs_test.json");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify({ ok: true, t: Date.now() }, null, 2), "utf8");
    const txt = await fs.readFile(file, "utf8");
    return NextResponse.json({ ok: true, dir, file, txt });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}