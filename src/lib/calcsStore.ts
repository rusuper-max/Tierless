import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "calculators.json");

export type MiniCalc = {
  meta: { name: string; slug: string };
  template?: string;
  config?: any;
};

async function readAll(): Promise<MiniCalc[]> {
  try {
    const buf = await fs.readFile(DB_PATH, "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? (json as MiniCalc[]) : [];
  } catch {
    return [];
  }
}
async function writeAll(rows: MiniCalc[]) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(rows, null, 2), "utf8");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 60) || "page";
}

export async function listCalcs(): Promise<MiniCalc[]> {
  return await readAll();
}

export async function getCalc(slug: string): Promise<MiniCalc | undefined> {
  const rows = await readAll();
  return rows.find((r) => r.meta?.slug === slug);
}

export async function createCalc(name = "Untitled Page"): Promise<MiniCalc> {
  const rows = await readAll();
  let base = slugify(name);
  let slug = base;
  let i = 1;
  while (rows.some((r) => r.meta.slug === slug)) {
    slug = `${base}-${++i}`;
  }
  const row: MiniCalc = { meta: { name, slug }, config: {} };
  rows.push(row);
  await writeAll(rows);
  return row;
}

export async function createCalcFromTemplate(templateSlug: string, name?: string): Promise<MiniCalc> {
  const rows = await readAll();
  const baseName = name?.trim() || templateSlug || "New Page";
  let base = slugify(baseName);
  let slug = base;
  let i = 1;
  while (rows.some((r) => r.meta.slug === slug)) {
    slug = `${base}-${++i}`;
  }
  const row: MiniCalc = { meta: { name: baseName, slug }, template: templateSlug, config: {} };
  rows.push(row);
  await writeAll(rows);
  return row;
}

export async function deleteCalc(slug: string): Promise<boolean> {
  const rows = await readAll();
  const next = rows.filter((r) => r.meta.slug !== slug);
  const changed = next.length !== rows.length;
  if (changed) await writeAll(next);
  return changed;
}

/** NOVO: ažuriraj "name" u mini listingu (dashboard prikaz) */
export async function updateCalcName(slug: string, newName: string): Promise<boolean> {
  const rows = await readAll();
  const row = rows.find((r) => r.meta.slug === slug);
  if (!row) return false;
  if (row.meta.name === newName) return true;
  row.meta.name = newName;
  await writeAll(rows);
  return true;
}