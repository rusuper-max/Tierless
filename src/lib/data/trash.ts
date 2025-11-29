// src/lib/data/trash.ts
// PG implementacija (nema više pisanja po FS-u)

import { getPool } from "@/lib/db";
import * as calcsStore from "@/lib/calcsStore";

export type Calc = {
  meta: {
    name: string;
    slug: string;
    originalSlug?: string;
    published?: boolean;
    favorite?: boolean;
    order?: number;
    createdAt?: number;
    updatedAt?: number;
    views7d?: number;
  };
  template?: string;
  config?: any;
};

export type TrashItem = Calc & {
  deletedAt: number;
};

const pool = getPool();
const DEFAULT_TTL_DAYS = 30;
const SLUG_SUFFIX = "-trash";

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trash_items (
      user_id     TEXT NOT NULL,
      slug        TEXT NOT NULL,         -- stari slug (iz aktivne tabele)
      original_slug TEXT,
      name        TEXT NOT NULL,
      template    TEXT,
      config      JSONB,
      deleted_at  BIGINT NOT NULL,
      PRIMARY KEY (user_id, slug)
    );
  `);

  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_trash_user ON trash_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_trash_user_deleted ON trash_items(user_id, deleted_at DESC);
    `);
  } catch (e) {
    console.warn("Trash index creation failed:", e);
  }

  try {
    await pool.query(`
      ALTER TABLE trash_items ADD COLUMN IF NOT EXISTS original_slug TEXT;
    `);
  } catch (e) {
    console.warn("Trash migration (original_slug) failed:", e);
  }
}

function normalizeSlug(s: string | undefined) {
  return (
    (s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/--+/g, "-")
      .slice(0, 60) || "deleted"
  );
}

async function uniqueTrashSlug(userId: string, base: string): Promise<string> {
  const cleanBase = normalizeSlug(base);
  let candidate = cleanBase;
  let i = 1;
  for (; ;) {
    const { rows } = await pool.query(
      `SELECT 1 FROM trash_items WHERE user_id=$1 AND slug=$2 LIMIT 1`,
      [userId, candidate]
    );
    if (!rows.length) return candidate;
    candidate = `${cleanBase}${SLUG_SUFFIX}-${i++}`;
  }
}

function rowToItem(r: any): TrashItem {
  return {
    meta: {
      name: r.name,
      slug: r.slug,
      originalSlug: r.original_slug ?? undefined,
      // trash ne drži published/favorite/order – nisu bitni u otpadu
      createdAt: undefined,
      updatedAt: undefined,
      views7d: undefined,
    },
    template: r.template ?? undefined,
    config: r.config ?? {},
    deletedAt: Number(r.deleted_at) || Date.now(),
  };
}

/** Ubaci u Trash (soft delete). */
export async function push(userId: string, row: Calc) {
  await ensureTable();
  const now = Date.now();
  const desiredSlug = row.meta.slug || "deleted";
  const uniqueSlug = await uniqueTrashSlug(userId, desiredSlug);
  await pool.query(
    `INSERT INTO trash_items (user_id, slug, original_slug, name, template, config, deleted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      userId,
      uniqueSlug,
      row.meta.slug ?? null,
      row.meta.name || "Untitled Page",
      row.template ?? null,
      row.config ?? {},
      now,
    ]
  );
}

/** Lista Trash (najnovije prvo). */
export async function list(userId: string): Promise<TrashItem[]> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM trash_items WHERE user_id=$1 ORDER BY deleted_at DESC`,
    [userId]
  );
  return rows.map(rowToItem);
}

/** Broj u Trash. */
export async function count(userId: string): Promise<number> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM trash_items WHERE user_id=$1`,
    [userId]
  );
  return Number(rows[0]?.n || 0);
}

/**
 * Restore iz Trash u active; vraća NOVI (unikatan) slug.
 * Pravila: zadržava name/template/config; published=false.
 */
export async function restore(userId: string, slug: string): Promise<string | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM trash_items WHERE user_id=$1 AND slug=$2 LIMIT 1`,
    [userId, slug]
  );
  if (!rows[0]) return undefined;

  const item = rowToItem(rows[0]);
  // Ubaci u calculators sa unikat slug-om (koristimo postojeći calcsStore PG)
  const restored = await calcsStore.createWithSlug(
    userId,
    item.meta.originalSlug || item.meta.slug, // željeni (može biti zauzet – helper rešava)
    item.meta.name || "Restored Page",
    item.config ?? {},
    item.template ?? undefined
  );

  // skloni iz trash-a
  await pool.query(
    `DELETE FROM trash_items WHERE user_id=$1 AND slug=$2`,
    [userId, slug]
  );

  return restored.meta.slug;
}

/** Trajno obriši 1 iz Trash. */
export async function remove(userId: string, slug: string): Promise<boolean> {
  await ensureTable();
  const res = await pool.query(
    `DELETE FROM trash_items WHERE user_id=$1 AND slug=$2`,
    [userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

/** Garbage collector — briše sve starije od TTL dana. */
export async function gc(userId: string, days = DEFAULT_TTL_DAYS): Promise<number> {
  await ensureTable();
  const ttlMs = Math.max(0, days) * 24 * 60 * 60 * 1000;
  const threshold = Date.now() - ttlMs;
  const res = await pool.query(
    `DELETE FROM trash_items WHERE user_id=$1 AND deleted_at < $2`,
    [userId, threshold]
  );
  return Number(res.rowCount ?? 0);
}

/** TTL za Trash u danima (fallback ako nema configs). */
export async function ttlDays(): Promise<number> {
  return DEFAULT_TTL_DAYS;
}
