// src/lib/calcsStore.ts
import { getPool } from "@/lib/db";
import { syncPublicationState } from "@/lib/publishSync";
import * as fullStore from "@/lib/fullStore";
import { calcBlank, calcFromMetaConfig } from "@/lib/calc-init";
import { randomBytes } from "crypto";

export type Calc = {
  meta: {
    name: string;
    slug: string;
    published?: boolean;
    online?: boolean; // legacy alias
    favorite?: boolean;
    order?: number;
    createdAt?: number;
    updatedAt?: number;
    views7d?: number;
    avgRating?: number;
    ratingsCount?: number;
    isExample?: boolean; // For examples/showcase filtering
  };
  template?: string;
  config?: any;
};

const pool = getPool();

export async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS calculators (
      user_id     TEXT NOT NULL,
      slug        TEXT NOT NULL,
      name        TEXT NOT NULL,
      template    TEXT,
      config      JSONB,
      published   BOOLEAN DEFAULT FALSE,
      favorite    BOOLEAN DEFAULT FALSE,
      "order"     INTEGER DEFAULT 0,
      views7d     INTEGER DEFAULT 0,
      created_at  BIGINT NOT NULL,
      updated_at  BIGINT NOT NULL,
      avg_rating  DECIMAL(3,2) DEFAULT 0,
      ratings_count INTEGER DEFAULT 0,
      is_example  BOOLEAN DEFAULT FALSE,
      PRIMARY KEY (user_id, slug)
    );
  `);

  // Migrations for new columns
  try {
    await pool.query(`
      ALTER TABLE calculators ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
      ALTER TABLE calculators ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;
      ALTER TABLE calculators ADD COLUMN IF NOT EXISTS is_example BOOLEAN DEFAULT FALSE;
    `);
  } catch (e) {
    console.warn("Migration add columns failed (ignoring):", e);
  }

  // Indexes for efficient queries
  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calculators_user ON calculators(user_id);
      CREATE INDEX IF NOT EXISTS idx_calculators_user_published ON calculators(user_id, published);
      CREATE INDEX IF NOT EXISTS idx_calculators_rating ON calculators(avg_rating DESC, ratings_count DESC);
      CREATE INDEX IF NOT EXISTS idx_calculators_user_example ON calculators(user_id, is_example);
      CREATE INDEX IF NOT EXISTS idx_calculators_example_published ON calculators(is_example, published) WHERE is_example = TRUE;
    `);
  } catch (e) {
    console.warn("Index creation failed (ignoring):", e);
  }
}

function rowToCalc(r: any): Calc {
  return {
    meta: {
      name: r.name,
      slug: r.slug,
      published: !!r.published,
      favorite: !!r.favorite,
      order: typeof r.order === "number" ? r.order : 0,
      createdAt: Number(r.created_at) || Date.now(),
      updatedAt: Number(r.updated_at) || Number(r.created_at) || Date.now(),
      views7d: typeof (r.views7d ?? r.views7d) === "number" ? (r.views7d ?? r.views7d) : 0,
      avgRating: Number(r.avg_rating || 0),
      ratingsCount: Number(r.ratings_count || 0),
      isExample: !!r.is_example,
    },
    template: r.template ?? undefined,
    config: r.config ?? {},
  };
}

const SLUG_MAX = 50;
const COPY_PREFIX = "Copy of ";

function slugBase(input: string) {
  const raw = (input || "page")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .trim();
  return raw ? raw.slice(0, SLUG_MAX) : "page";
}

function sanitizeCopyName(originalName: string) {
  const stripped = originalName
    .replace(new RegExp(`^${COPY_PREFIX}+`, "i"), "")
    .replace(/\(\d+\)$/g, "")
    .trim();
  return `${COPY_PREFIX}${stripped || "Untitled Page"}`.trim();
}

async function uniqueSlug(
  userId: string,
  raw: string,
  opts?: { ignoreSlug?: string }
): Promise<string> {
  const base = slugBase(raw || "page");
  let slug = base;
  let i = 1;
  // proveravaj u bazi dok ne nađeš slobodan
  for (; ;) {
    if (opts?.ignoreSlug && slug === opts.ignoreSlug) return slug;
    const { rows } = await pool.query(
      `SELECT 1 FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
      [userId, slug]
    );
    if (rows.length === 0) return slug;
    const suffix = `-${++i}`;
    const trimmed = base.slice(0, Math.max(1, SLUG_MAX - suffix.length));
    slug = `${trimmed}${suffix}`;
  }
}

async function seedBlankFull(userId: string, slug: string, name: string) {
  try {
    const blank = calcBlank(slug, name);
    await fullStore.putFull(userId, slug, blank);
  } catch (err) {
    console.error("seedBlankFull failed", { userId, slug, err });
  }
}

async function seedFullFromSource(
  userId: string,
  slug: string,
  sourceFull: any,
  fallback: { meta: any; config: any }
) {
  try {
    const payload =
      sourceFull ??
      calcFromMetaConfig({
        meta: fallback.meta,
        config: fallback.config,
      });
    await fullStore.putFull(userId, slug, payload);
  } catch (err) {
    console.error("seedFullFromSource failed", { userId, slug, err });
  }
}

// =============== Public API (list/get/basic CRUD) ==================

export async function list(userId: string): Promise<Calc[]> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 ORDER BY "order" ASC, created_at ASC`,
    [userId]
  );
  return rows.map(rowToCalc);
}

export async function get(userId: string, slug: string): Promise<Calc | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
    [userId, slug]
  );
  return rows[0] ? rowToCalc(rows[0]) : undefined;
}

export async function create(userId: string, name = "Untitled Page"): Promise<Calc> {
  await ensureTable();
  const slug = await uniqueSlug(userId, name);
  const now = Date.now();
  await pool.query(
    `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at)
     VALUES ($1,$2,$3,NULL,'{}',FALSE,FALSE,0,0,$4,$4)`,
    [userId, slug, name, now]
  );
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2`,
    [userId, slug]
  );
  await seedBlankFull(userId, slug, name);
  return rowToCalc(rows[0]);
}

export async function createWithSlug(
  userId: string,
  desiredSlug: string,
  name: string,
  cfg?: any,
  template?: string
): Promise<Calc> {
  await ensureTable();
  let slug = desiredSlug
    ? slugBase(desiredSlug)
    : await uniqueSlug(userId, name || "page");
  // ako zauzet — dodaj -restored-#
  const { rows: exist } = await pool.query(
    `SELECT 1 FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
    [userId, slug]
  );
  if (exist.length) {
    const baseRaw = slugBase(desiredSlug || "restored");
    const base = baseRaw.replace(/-restored-\d+$/, "");
    let i = 1;
    for (; ;) {
      const candidate = `${base}-restored-${i++}`;
      const { rows } = await pool.query(
        `SELECT 1 FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
        [userId, candidate]
      );
      if (!rows.length) { slug = candidate; break; }
    }
  }
  const now = Date.now();
  await pool.query(
    `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,0,0,$6,$6)`,
    [userId, slug, name || "Restored Page", template ?? null, cfg ?? {}, now]
  );
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2`,
    [userId, slug]
  );
  await seedFullFromSource(userId, slug, null, {
    meta: { name: name || "Restored Page", slug },
    config: cfg ?? {},
  });
  return rowToCalc(rows[0]);
}

export async function createFromTemplate(userId: string, templateSlug: string, name?: string) {
  await ensureTable();
  const baseName = (name?.trim() || templateSlug || "New Page");
  const slug = await uniqueSlug(userId, baseName);
  const now = Date.now();
  await pool.query(
    `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at)
     VALUES ($1,$2,$3,$4,'{}',FALSE,FALSE,0,0,$5,$5)`,
    [userId, slug, baseName, templateSlug, now]
  );
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2`,
    [userId, slug]
  );
  await seedBlankFull(userId, slug, baseName);
  return rowToCalc(rows[0]);
}

export async function duplicate(userId: string, fromSlug: string, newName: string) {
  await ensureTable();
  const { rows: srcRows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
    [userId, fromSlug]
  );
  if (!srcRows[0]) return undefined;
  const src = srcRows[0];
  const friendlyName = sanitizeCopyName(newName || src.name || "Untitled Page");
  const slug = await uniqueSlug(userId, friendlyName);
  const now = Date.now();
  await pool.query(
    `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,0,0,$6,$6)`,
    [userId, slug, friendlyName, src.template ?? null, src.config ?? {}, now]
  );
  try {
    let sourceFull = await fullStore.getFull(userId, fromSlug);
    if (sourceFull) {
      sourceFull = {
        ...sourceFull,
        meta: { ...(sourceFull.meta || {}), name: friendlyName },
      };
    }
    await seedFullFromSource(
      userId,
      slug,
      sourceFull,
      {
        meta: { name: friendlyName, slug },
        config: src.config ?? {},
      }
    );
  } catch (err) {
    console.error("duplicate seed full failed", { userId, fromSlug, slug, err });
  }
  return slug;
}

export async function remove(userId: string, slug: string) {
  await ensureTable();
  const res = await pool.query(
    `DELETE FROM calculators WHERE user_id=$1 AND slug=$2`,
    [userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function updateName(userId: string, slug: string, newName: string) {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET name=$1, updated_at=$2 WHERE user_id=$3 AND slug=$4`,
    [newName, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function renameWithSlug(
  userId: string,
  slug: string,
  newName: string
): Promise<{ slug: string } | null> {
  await ensureTable();
  const existing = await get(userId, slug);
  if (!existing) return null;
  const nextSlug = await uniqueSlug(userId, newName || "page", {
    ignoreSlug: slug,
  });
  const now = Date.now();
  await pool.query(
    `UPDATE calculators SET name=$1, slug=$2, updated_at=$3 WHERE user_id=$4 AND slug=$5`,
    [newName, nextSlug, now, userId, slug]
  );

  let full: any | null = null;
  try {
    full = await fullStore.getFull(userId, slug);
  } catch { }

  if (full) {
    const patched = {
      ...full,
      meta: { ...(full.meta || {}), name: newName, slug: nextSlug },
    };
    await fullStore.putFull(userId, nextSlug, patched);
    if (nextSlug !== slug) {
      try {
        await fullStore.deleteFull(userId, slug);
      } catch { }
    }
  } else {
    await seedFullFromSource(
      userId,
      nextSlug,
      null,
      {
        meta: { ...existing.meta, name: newName, slug: nextSlug },
        config: existing.config ?? {},
      }
    );
  }

  return { slug: nextSlug };
}

// =============== Meta helpers (publish/favorite/order/etc) ===============

function genPublicId(): string {
  return randomBytes(9).toString("base64url");
}

function attachMetaIds(full: any, slug: string) {
  const id =
    typeof full?.meta?.id === "string" && full.meta.id.length > 0
      ? full.meta.id
      : genPublicId();
  return {
    ...full,
    meta: { ...(full?.meta || {}), id, slug },
  };
}

export async function setPublished(
  userId: string,
  slug: string,
  next: boolean
): Promise<boolean> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET published=$1, updated_at=$2 WHERE user_id=$3 AND slug=$4`,
    [!!next, now, userId, slug]
  );
  const ok = (res.rowCount ?? 0) > 0;
  if (ok) {
    let override: any | undefined;
    if (next) {
      override = await fullStore.getFull(userId, slug);
      if (!override) {
        const row = await get(userId, slug);
        if (row) {
          const seeded = calcFromMetaConfig({
            meta: row.meta,
            config: row.config,
          });
          override = attachMetaIds(seeded, row.meta.slug);
          await fullStore.putFull(userId, slug, override);
        }
      }
    }
    await syncPublicationState(userId, slug, !!next, override);
  }
  return ok;
}

export async function setFavorite(userId: string, slug: string, next: boolean): Promise<boolean> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET favorite=$1, updated_at=$2 WHERE user_id=$3 AND slug=$4`,
    [!!next, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function setOrder(userId: string, slugsInOrder: string[]): Promise<void> {
  await ensureTable();
  if (!slugsInOrder || slugsInOrder.length === 0) return;

  // Build VALUES table for (slug, order)
  const values = slugsInOrder.map((slug, i) => `('${slug.replace(/'/g, "''")}', ${i})`).join(", ");
  // Update using a derived table for better performance and fewer roundtrips
  const sql = `
    UPDATE calculators AS c
    SET "order" = v.ordinal
    FROM (VALUES ${values}) AS v(slug, ordinal)
    WHERE c.user_id = $1 AND c.slug = v.slug
  `;
  await pool.query(sql, [userId]);
}

// =============== Counting & batch unpublish ======================

export async function countAll(userId: string): Promise<number> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM calculators WHERE user_id=$1`,
    [userId]
  );
  return Number(rows[0]?.n || 0);
}

export async function countPublished(userId: string): Promise<number> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM calculators WHERE user_id=$1 AND published=TRUE`,
    [userId]
  );
  return Number(rows[0]?.n || 0);
}

/**
 * Unpublish sve preko limita. Zadržava NAJNOVIJE (po updatedAt/createdAt)
 * online do `keep` komada, ostale gasi.
 * @returns broj stranica koje su ugašene
 */
export async function bulkUnpublishAboveLimit(userId: string, keep: number): Promise<number> {
  await ensureTable();
  if (!Number.isFinite(keep) || keep < 0) keep = 0;

  // Nađi sve online, sort po novini
  const { rows } = await pool.query(
    `SELECT slug, updated_at, created_at
     FROM calculators
     WHERE user_id=$1 AND published=TRUE
     ORDER BY GREATEST(updated_at, created_at) DESC`,
    [userId]
  );

  if (rows.length <= keep) return 0;

  const survivors = new Set(
    rows.slice(0, keep).map((r: any) => r.slug as string)
  );
  const victims = rows.slice(keep).map((r: any) => r.slug as string);

  let changed = 0;
  const now = Date.now();
  for (const slug of victims) {
    const res = await pool.query(
      `UPDATE calculators SET published=FALSE, updated_at=$1 WHERE user_id=$2 AND slug=$3`,
      [now, userId, slug]
    );
    if ((res.rowCount ?? 0) > 0) {
      try {
        await syncPublicationState(userId, slug, false);
      } catch (err) {
        console.error("syncPublicationState failed for", slug, err);
      }
      changed++;
    }
  }
  return changed;
}

// =============== Cross-user finder (koristi PG) =================

export async function findMiniInAllUsers(slug: string): Promise<Calc | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE slug=$1 LIMIT 1`,
    [slug]
  );
  return rows[0] ? rowToCalc(rows[0]) : undefined;
}

// =============== Examples listing =================

/**
 * List examples for the showcase page.
 * Uses the is_example column for efficient indexed query.
 */
export async function listExamples(limit = 50): Promise<Calc[]> {
  await ensureTable();
  
  // Use the indexed is_example column for fast filtering
  const { rows } = await pool.query(
    `SELECT * FROM calculators 
     WHERE published = TRUE AND is_example = TRUE
     ORDER BY avg_rating DESC, ratings_count DESC, updated_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map(rowToCalc);
}

/**
 * List user's calculators excluding examples.
 * For dashboard - user doesn't need to see demo content.
 */
export async function listUserCalcs(userId: string, excludeExamples = true): Promise<Calc[]> {
  await ensureTable();
  
  const query = excludeExamples
    ? `SELECT * FROM calculators WHERE user_id = $1 AND is_example = FALSE ORDER BY "order" ASC, created_at ASC`
    : `SELECT * FROM calculators WHERE user_id = $1 ORDER BY "order" ASC, created_at ASC`;
  
  const { rows } = await pool.query(query, [userId]);
  return rows.map(rowToCalc);
}

/**
 * Set is_example flag for a calculator.
 */
export async function setIsExample(userId: string, slug: string, isExample: boolean): Promise<boolean> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET is_example = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
    [isExample, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}
