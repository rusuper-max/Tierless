import fs from "fs/promises";
import path from "path";

export type Calc = {
  meta: { name: string; slug: string };
  template?: string;
  config?: any;
};

const USERS_ROOT = path.join(process.cwd(), "data", "users");

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}

function fileFor(userId: string) {
  const uid = safeUserId(userId);
  return path.join(USERS_ROOT, uid, "calculators.json");
}

async function readAll(userId: string): Promise<Calc[]> {
  const file = fileFor(userId);
  try {
    const s = await fs.readFile(file, "utf8");
    const json = JSON.parse(s);
    return Array.isArray(json) ? (json as Calc[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(userId: string, rows: Calc[]) {
  const file = fileFor(userId);
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

export async function list(userId: string): Promise<Calc[]> {
  return readAll(userId);
}

export async function get(userId: string, slug: string): Promise<Calc | undefined> {
  const rows = await readAll(userId);
  return rows.find((r) => r.meta.slug === slug);
}

export async function create(userId: string, name = "Untitled Page"): Promise<Calc> {
  const rows = await readAll(userId);
  const slug = uniqueSlug(rows, name);
  const row: Calc = { meta: { name, slug }, config: {} };
  rows.push(row);
  await writeAll(userId, rows);
  return row;
}

export async function createFromTemplate(userId: string, templateSlug: string, name?: string) {
  const rows = await readAll(userId);
  const baseName = name?.trim() || templateSlug || "New Page";
  const slug = uniqueSlug(rows, baseName);
  const row: Calc = { meta: { name: baseName, slug }, template: templateSlug, config: {} };
  rows.push(row);
  await writeAll(userId, rows);
  return row;
}

export async function duplicate(userId: string, fromSlug: string, newName: string) {
  const rows = await readAll(userId);
  const src = rows.find((r) => r.meta.slug === fromSlug);
  if (!src) return undefined;
  const slug = uniqueSlug(rows, newName);
  const row: Calc = { meta: { name: newName, slug }, template: src.template, config: src.config ?? {} };
  rows.push(row);
  await writeAll(userId, rows);
  return slug;
}

export async function remove(userId: string, slug: string) {
  const rows = await readAll(userId);
  const next = rows.filter((r) => r.meta.slug !== slug);
  const changed = next.length !== rows.length;
  if (changed) await writeAll(userId, next);
  return changed;
}

export async function updateName(userId: string, slug: string, newName: string) {
  const rows = await readAll(userId);
  const row = rows.find((r) => r.meta.slug === slug);
  if (!row) return false;
  if (row.meta.name !== newName) {
    row.meta.name = newName;
    await writeAll(userId, rows);
  }
  return true;
}

export async function findMiniInAllUsers(slug: string): Promise<Calc | undefined> {
  try {
    const ents = await fs.readdir(USERS_ROOT, { withFileTypes: true });
    const dirs = ents.filter(e => e.isDirectory()).map(e => e.name);
    for (const uid of dirs) {
      const file = path.join(USERS_ROOT, uid, "calculators.json");
      try {
        const txt = await fs.readFile(file, "utf8");
        const arr = JSON.parse(txt);
        if (Array.isArray(arr)) {
          const row = arr.find((r: any) => r?.meta?.slug === slug);
          if (row) return row as Calc;
        }
      } catch {}
    }
  } catch {}
  return undefined;
}