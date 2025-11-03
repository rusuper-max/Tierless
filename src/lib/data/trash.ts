// src/lib/data/trash.ts
import fs from "fs/promises";
import path from "path";

export type Calc = {
  meta: { name: string; slug: string };
  template?: string;
  config?: any;
};

export type TrashItem = Calc & {
  deletedAt: number;
};

const USERS_ROOT = path.join(process.cwd(), "data", "users");
const TRASH_TTL_DAYS = 30;

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}

function calcsFile(userId: string) {
  const uid = safeUserId(userId);
  return path.join(USERS_ROOT, uid, "calculators.json");
}

function trashFile(userId: string) {
  const uid = safeUserId(userId);
  return path.join(USERS_ROOT, uid, "trash.json");
}

async function readCalcs(userId: string): Promise<Calc[]> {
  try {
    const s = await fs.readFile(calcsFile(userId), "utf8");
    const json = JSON.parse(s);
    return Array.isArray(json) ? (json as Calc[]) : [];
  } catch {
    return [];
  }
}

async function writeCalcs(userId: string, rows: Calc[]) {
  const file = calcsFile(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

async function readTrash(userId: string): Promise<TrashItem[]> {
  try {
    const s = await fs.readFile(trashFile(userId), "utf8");
    const json = JSON.parse(s);
    return Array.isArray(json) ? (json as TrashItem[]) : [];
  } catch {
    return [];
  }
}

async function writeTrash(userId: string, rows: TrashItem[]) {
  const file = trashFile(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/--+/g, "-")
      .slice(0, 60) || "page"
  );
}

function uniqueSlug(rows: Calc[], baseName: string) {
  const base = slugify(baseName);
  let slug = base;
  let i = 1;
  while (rows.some((r) => r.meta.slug === slug)) slug = `${base}-${++i}`;
  return slug;
}

/** Ubaci u Trash (soft delete). */
export async function push(userId: string, row: Calc) {
  const items = await readTrash(userId);
  const item: TrashItem = { ...row, deletedAt: Date.now() };
  items.push(item);
  await writeTrash(userId, items);
}

/** Lista Trash (najnovije prvo). */
export async function list(userId: string): Promise<TrashItem[]> {
  const items = await readTrash(userId);
  return items.sort((a, b) => b.deletedAt - a.deletedAt);
}

/** Broj u Trash. */
export async function count(userId: string): Promise<number> {
  const items = await readTrash(userId);
  return items.length;
}

/** Restore iz Trash u active; vraća novi (unikatan) slug. */
export async function restore(userId: string, slug: string): Promise<string | undefined> {
  const trashItems = await readTrash(userId);
  const idx = trashItems.findIndex((x) => x?.meta?.slug === slug);
  if (idx < 0) return undefined;

  const item = trashItems[idx];

  // skini iz trash
  trashItems.splice(idx, 1);
  await writeTrash(userId, trashItems);

  // ubaci u calcs sa unikatom
  const calcs = await readCalcs(userId);
  const newSlug = uniqueSlug(calcs, item.meta.name || "Restored Page");
  const restored: Calc = {
    meta: { name: item.meta.name, slug: newSlug },
    template: item.template,
    config: item.config ?? {},
  };
  calcs.push(restored);
  await writeCalcs(userId, calcs);

  return newSlug;
}

/** Trajno obriši 1 iz Trash. */
export async function remove(userId: string, slug: string): Promise<boolean> {
  const items = await readTrash(userId);
  const next = items.filter((x) => x?.meta?.slug !== slug);
  const changed = next.length !== items.length;
  if (changed) await writeTrash(userId, next);
  return changed;
}

/** Garbage collector — briše sve starije od TTL. */
export async function gc(userId: string, days = TRASH_TTL_DAYS): Promise<number> {
  const items = await readTrash(userId);
  const now = Date.now();
  const ttlMs = days * 24 * 60 * 60 * 1000;
  const next = items.filter((x) => now - (x.deletedAt || 0) < ttlMs);
  const removed = items.length - next.length;
  if (removed > 0) await writeTrash(userId, next);
  return removed;
}

// TTL za Trash u danima (fallback ako nema config sistema)
export async function ttlDays(): Promise<number> {
  return 30;
}