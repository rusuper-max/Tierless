// src/lib/calcsStore.ts
import { getPool } from "@/lib/db";
import { syncPublicationState } from "@/lib/publishSync";

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
  };
  template?: string;
  config?: any;
};

const pool = getPool();

async function ensureTable() {
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
      PRIMARY KEY (user_id, slug)
    );
    CREATE INDEX IF NOT EXISTS idx_calculators_user ON calculators(user_id);
    CREATE INDEX IF NOT EXISTS idx_calculators_user_published ON calculators(user_id, published);
  `);
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
    },
    template: r.template ?? undefined,
    config: r.config ?? {},
  };
}

async function uniqueSlug(userId: string, baseName: string): Promise<string> {
  const base = (baseName || "page")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 60) || "page";

  let slug = base;
  let i = 1;
  // proveravaj u bazi dok ne nađeš slobodan
  for (;;) {
    const { rows } = await pool.query(
      `SELECT 1 FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
      [userId, slug]
    );
    if (rows.length === 0) return slug;
    slug = `${base}-${++i}`;
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
  let slug = desiredSlug || (await uniqueSlug(userId, name || "page"));
  // ako zauzet — dodaj -restored-#
  const { rows: exist } = await pool.query(
    `SELECT 1 FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
    [userId, slug]
  );
  if (exist.length) {
    const base = (desiredSlug || "restored").replace(/-restored-\d+$/, "");
    let i = 1;
    for (;;) {
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
  const slug = await uniqueSlug(userId, newName);
  const now = Date.now();
  await pool.query(
    `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,0,0,$6,$6)`,
    [userId, slug, newName, src.template ?? null, src.config ?? {}, now]
  );
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

// =============== Meta helpers (publish/favorite/order/etc) ===============

export async function setPublished(userId: string, slug: string, next: boolean): Promise<boolean> {
  await ensureTable();
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET published=$1, updated_at=$2 WHERE user_id=$3 AND slug=$4`,
    [!!next, now, userId, slug]
  );
  const ok = (res.rowCount ?? 0) > 0;
  if (ok) {
    await syncPublicationState(userId, slug, !!next);
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
