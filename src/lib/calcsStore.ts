// src/lib/calcsStore.ts
import fs from "fs/promises";
import path from "path";

export type Calc = {
  meta: {
    name: string;
    slug: string;
    /** published/online status (server canonical) */
    published?: boolean;
    online?: boolean; // legacy alias, normalize to published
    favorite?: boolean;
    order?: number;
    createdAt?: number;
    updatedAt?: number;
    views7d?: number;
  };
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
    const arr = Array.isArray(json) ? (json as Calc[]) : [];
    // normalize legacy `online` -> `published`
    return arr.map((r) => {
      const pub = typeof r?.meta?.published === "boolean"
        ? r.meta.published
        : (r?.meta?.online ? true : false);
      return {
        ...r,
        meta: {
          ...r.meta,
          published: !!pub,
        },
      };
    });
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

// =============== Public API (list/get/basic CRUD) ==================

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
  const now = Date.now();
  const row: Calc = {
    meta: {
      name,
      slug,
      published: false,
      createdAt: now,
      updatedAt: now,
    },
    config: {},
  };
  rows.push(row);
  await writeAll(userId, rows);
  return row;
}

/** Kreiraj zapis sa željenim slug-om (ako je zauzet, dodaje sufiks -restored-#) */
export async function createWithSlug(
  userId: string,
  desiredSlug: string,
  name: string,
  cfg?: any,
  template?: string
): Promise<Calc> {
  const rows = await readAll(userId);
  let slug = desiredSlug || slugify(name || "page");
  if (rows.some(r => r.meta.slug === slug)) {
    const base = (desiredSlug || "restored").replace(/-restored-\d+$/, "");
    let i = 1;
    let candidate = `${base}-restored-${i}`;
    while (rows.some(r => r.meta.slug === candidate)) {
      i++;
      candidate = `${base}-restored-${i}`;
    }
    slug = candidate;
  }
  const now = Date.now();
  const row: Calc = {
    meta: { name: name || "Restored Page", slug, published: false, createdAt: now, updatedAt: now },
    template,
    config: cfg ?? {},
  };
  rows.push(row);
  await writeAll(userId, rows);
  return row;
}

export async function createFromTemplate(userId: string, templateSlug: string, name?: string) {
  const rows = await readAll(userId);
  const baseName = name?.trim() || templateSlug || "New Page";
  const slug = uniqueSlug(rows, baseName);
  const now = Date.now();
  const row: Calc = {
    meta: { name: baseName, slug, published: false, createdAt: now, updatedAt: now },
    template: templateSlug,
    config: {},
  };
  rows.push(row);
  await writeAll(userId, rows);
  return row;
}

export async function duplicate(userId: string, fromSlug: string, newName: string) {
  const rows = await readAll(userId);
  const src = rows.find((r) => r.meta.slug === fromSlug);
  if (!src) return undefined;
  const slug = uniqueSlug(rows, newName);
  const now = Date.now();
  const row: Calc = {
    meta: { name: newName, slug, published: false, createdAt: now, updatedAt: now },
    template: src.template,
    config: src.config ?? {},
  };
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
    row.meta.updatedAt = Date.now();
    await writeAll(userId, rows);
  }
  return true;
}

// =============== Meta helpers (publish/favorite/order/etc) ===============

export async function setPublished(userId: string, slug: string, next: boolean): Promise<boolean> {
  const rows = await readAll(userId);
  const row = rows.find((r) => r.meta.slug === slug);
  if (!row) return false;
  const desired = !!next;
  const current = !!row.meta.published;
  if (current !== desired) {
    row.meta.published = desired;
    row.meta.updatedAt = Date.now();
    await writeAll(userId, rows);
  }
  return true;
}

export async function setFavorite(userId: string, slug: string, next: boolean): Promise<boolean> {
  const rows = await readAll(userId);
  const row = rows.find((r) => r.meta.slug === slug);
  if (!row) return false;
  const desired = !!next;
  if (!!row.meta.favorite !== desired) {
    row.meta.favorite = desired;
    row.meta.updatedAt = Date.now();
    await writeAll(userId, rows);
  }
  return true;
}

export async function setOrder(userId: string, slugsInOrder: string[]): Promise<void> {
  const rows = await readAll(userId);
  const indexBySlug = new Map<string, number>();
  slugsInOrder.forEach((s, i) => indexBySlug.set(s, i));
  for (const r of rows) {
    if (indexBySlug.has(r.meta.slug)) {
      r.meta.order = indexBySlug.get(r.meta.slug)!;
    }
  }
  await writeAll(userId, rows);
}

// =============== Counting & batch unpublish ======================

export async function countAll(userId: string): Promise<number> {
  const rows = await readAll(userId);
  return rows.length;
}

export async function countPublished(userId: string): Promise<number> {
  const rows = await readAll(userId);
  return rows.reduce((acc, r) => (r.meta.published ? acc + 1 : acc), 0);
}

/**
 * Unpublish sve preko limita. Zadržava NAJNOVIJE (po updatedAt, fallback createdAt)
 * online do `keep` komada, ostale gasi.
 * @returns broj stranica koje su ugašene
 */
export async function bulkUnpublishAboveLimit(userId: string, keep: number): Promise<number> {
  if (!Number.isFinite(keep) || keep < 0) keep = 0;

  const rows = await readAll(userId);

  // Filtriraj trenutno online
  const online = rows.filter((r) => !!r.meta.published);

  if (online.length <= keep) return 0;

  // Sortiraj online po "novine"
  const byRecency = [...online].sort((a, b) => {
    const ax = a.meta.updatedAt ?? a.meta.createdAt ?? 0;
    const bx = b.meta.updatedAt ?? b.meta.createdAt ?? 0;
    return bx - ax; // newer first
  });

  const survivors = new Set(byRecency.slice(0, keep).map((r) => r.meta.slug));

  let changed = 0;
  const now = Date.now();
  for (const r of rows) {
    if (r.meta.published && !survivors.has(r.meta.slug)) {
      r.meta.published = false;
      r.meta.updatedAt = now;
      changed++;
    }
  }

  if (changed > 0) await writeAll(userId, rows);
  return changed;
}

// =============== Cross-user finder (ostaje isto) =================

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