// src/lib/mini.ts
import { promises as fs } from "fs";
import { join, dirname } from "path";

export type MiniRow = {
  meta: {
    slug: string;
    name?: string;
    published?: boolean;
    [k: string]: any;
  };
  [k: string]: any;
};

function userKey(userId: string) {
  return String(userId).replace(/[^a-z0-9]+/gi, "_").toLowerCase(); // npr. rusuper_gmail_com
}
function filePath(userId: string) {
  return join(process.cwd(), "data", "users", userKey(userId), "calculators.json");
}
async function ensureDir(p: string) {
  await fs.mkdir(dirname(p), { recursive: true });
}

async function readAll(userId: string): Promise<{
  rows: MiniRow[];
  wrap: "array" | "object";
  raw?: any;
  path: string;
}> {
  const p = filePath(userId);
  try {
    const buf = await fs.readFile(p, "utf8");
    const json = JSON.parse(buf);
    if (Array.isArray(json)) return { rows: json as MiniRow[], wrap: "array", raw: json, path: p };
    if (Array.isArray(json?.rows)) return { rows: json.rows as MiniRow[], wrap: "object", raw: json, path: p };
    return { rows: [], wrap: "array", raw: [], path: p };
  } catch {
    // fajl ne postoji – vratimo prazno
    return { rows: [], wrap: "array", raw: [], path: p };
  }
}

async function writeAll(userId: string, rows: MiniRow[], wrap: "array" | "object", raw?: any) {
  const p = filePath(userId);
  await ensureDir(p);
  const payload = wrap === "object" ? { ...(raw || {}), rows } : rows;
  await fs.writeFile(p, JSON.stringify(payload, null, 2), "utf8");
}

export const mini = {
  filePath, // opcionalno za debug

  async list(userId: string): Promise<MiniRow[]> {
    const { rows } = await readAll(userId);
    return rows;
  },

  async get(userId: string, slug: string): Promise<MiniRow | null> {
    const { rows } = await readAll(userId);
    return rows.find((r) => r?.meta?.slug === slug) || null;
  },

  async put(userId: string, slug: string, row: MiniRow): Promise<MiniRow> {
    const data = await readAll(userId);
    const idx = data.rows.findIndex((r) => r?.meta?.slug === slug);
    if (idx >= 0) data.rows[idx] = row;
    else data.rows.push(row);
    await writeAll(userId, data.rows, data.wrap, data.raw);
    return row;
  },

  async remove(userId: string, slug: string): Promise<boolean> {
    const data = await readAll(userId);
    const next = data.rows.filter((r) => r?.meta?.slug !== slug);
    const changed = next.length !== data.rows.length;
    if (changed) await writeAll(userId, next, data.wrap, data.raw);
    return changed;
  },

  // zgodno za rename/publish patcheve
  async patchMeta(userId: string, slug: string, patch: Record<string, any>): Promise<MiniRow | null> {
    const data = await readAll(userId);
    const idx = data.rows.findIndex((r) => r?.meta?.slug === slug);
    if (idx < 0) return null;
    const current = data.rows[idx];
    const next = { ...current, meta: { ...(current.meta || {}), ...patch } };
    data.rows[idx] = next;
    await writeAll(userId, data.rows, data.wrap, data.raw);
    return next;
  },
};