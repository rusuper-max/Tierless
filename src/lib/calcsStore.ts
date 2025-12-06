// src/lib/calcsStore.ts
import { getPool } from "@/lib/db";
import { syncPublicationState } from "@/lib/publishSync";
import * as fullStore from "@/lib/fullStore";
import { calcBlank, calcFromMetaConfig } from "@/lib/calc-init";
import { randomBytes } from "crypto";
import type { PoolClient } from "pg";

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
    teamId?: string; // Team ownership
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

  // Team support migration
  try {
    await pool.query(`
      ALTER TABLE calculators ADD COLUMN IF NOT EXISTS team_id TEXT;
    `);
    // Add foreign key constraint if teams table exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'calculators_team_id_fkey'
        ) THEN
          ALTER TABLE calculators 
          ADD CONSTRAINT calculators_team_id_fkey 
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
        END IF;
      EXCEPTION
        WHEN undefined_table THEN NULL; -- teams table doesn't exist yet
      END $$;
    `);
  } catch (e) {
    console.warn("Team migration failed (ignoring):", e);
  }

  // Indexes for efficient queries
  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calculators_user ON calculators(user_id);
      CREATE INDEX IF NOT EXISTS idx_calculators_user_published ON calculators(user_id, published);
      CREATE INDEX IF NOT EXISTS idx_calculators_rating ON calculators(avg_rating DESC, ratings_count DESC);
      CREATE INDEX IF NOT EXISTS idx_calculators_user_example ON calculators(user_id, is_example);
      CREATE INDEX IF NOT EXISTS idx_calculators_example_published ON calculators(is_example, published) WHERE is_example = TRUE;
      CREATE INDEX IF NOT EXISTS idx_calculators_team ON calculators(team_id) WHERE team_id IS NOT NULL;
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
      teamId: r.team_id || undefined,
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
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 ORDER BY "order" ASC, created_at ASC`,
    [userId]
  );
  return rows.map(rowToCalc);
}

export async function listWithTeams(userId: string): Promise<(Calc & { teamName?: string })[]> {
  const { rows } = await pool.query(
    `SELECT c.*, t.name as team_name
     FROM calculators c
     LEFT JOIN teams t ON c.team_id = t.id
     WHERE c.user_id = $1
     ORDER BY c."order" ASC, c.created_at ASC`,
    [userId]
  );
  return rows.map((r) => ({
    ...rowToCalc(r),
    teamName: r.team_name || undefined,
  }));
}

export async function get(userId: string, slug: string): Promise<Calc | undefined> {
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
    [userId, slug]
  );
  return rows[0] ? rowToCalc(rows[0]) : undefined;
}

export async function create(userId: string, name = "Untitled Page", teamId?: string): Promise<Calc> {
  const slug = await uniqueSlug(userId, name);
  const now = Date.now();
  await pool.query(
    `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at, team_id)
     VALUES ($1,$2,$3,NULL,'{}',FALSE,FALSE,0,0,$4,$4,$5)`,
    [userId, slug, name, now, teamId || null]
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

export async function duplicate(userId: string, fromSlug: string, newName: string, teamId?: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get source
    const { rows: srcRows } = await client.query(
      `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
      [userId, fromSlug]
    );
    if (!srcRows[0]) {
      await client.query("ROLLBACK");
      return undefined;
    }
    const src = srcRows[0];

    const friendlyName = sanitizeCopyName(newName || src.name || "Untitled Page");
    const slug = await uniqueSlug(userId, friendlyName);
    const now = Date.now();

    // 2. Insert new calculator
    await client.query(
      `INSERT INTO calculators (user_id, slug, name, template, config, published, favorite, "order", views7d, created_at, updated_at, team_id)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,0,0,$6,$6,$7)`,
      [userId, slug, friendlyName, src.template ?? null, src.config ?? {}, now, teamId || null]
    );

    // 3. Handle full store
    let sourceFull;
    try {
      const { rows } = await client.query(
        `SELECT calc FROM calc_full WHERE user_id=$1 AND slug=$2`,
        [userId, fromSlug]
      );
      sourceFull = rows[0]?.calc;
    } catch { }

    if (sourceFull) {
      sourceFull = {
        ...sourceFull,
        meta: { ...(sourceFull.meta || {}), name: friendlyName },
      };
    }

    // Seed logic inline
    const payload = sourceFull ?? calcFromMetaConfig({
      meta: { name: friendlyName, slug },
      config: src.config ?? {},
    });

    // Ensure IDs
    const withIds = {
      ...payload,
      meta: { ...(payload.meta || {}), id: randomBytes(9).toString("base64url"), slug }
    };

    await fullStore.putFullWithClient(client, userId, slug, withIds);

    await client.query("COMMIT");
    return slug;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("duplicate failed", { userId, fromSlug, err });
    throw err;
  } finally {
    client.release();
  }
}

export async function remove(userId: string, slug: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete from calculators (meta)
    const res = await client.query(
      `DELETE FROM calculators WHERE user_id=$1 AND slug=$2`,
      [userId, slug]
    );

    // Delete from calc_full (content) - ensure cleanup
    if ((res.rowCount ?? 0) > 0) {
      await fullStore.deleteFullWithClient(client, userId, slug);
    }

    await client.query("COMMIT");
    return (res.rowCount ?? 0) > 0;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateName(userId: string, slug: string, newName: string) {
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get existing meta
    const { rows: existingRows } = await client.query(
      `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2 LIMIT 1`,
      [userId, slug]
    );
    const existing = existingRows[0] ? rowToCalc(existingRows[0]) : undefined;

    if (!existing) {
      await client.query("ROLLBACK");
      return null;
    }

    // 2. Calculate next slug
    // Note: uniqueSlug uses its own pool connection, which is fine for checking uniqueness
    // against committed data.
    const nextSlug = await uniqueSlug(userId, newName || "page", {
      ignoreSlug: slug,
    });

    const now = Date.now();

    // 3. Update calculators
    await client.query(
      `UPDATE calculators SET name=$1, slug=$2, updated_at=$3 WHERE user_id=$4 AND slug=$5`,
      [newName, nextSlug, now, userId, slug]
    );

    // 4. Update calc_full
    const { rows: fullRows } = await client.query(
      `SELECT calc FROM calc_full WHERE user_id = $1 AND slug = $2`,
      [userId, slug]
    );
    const full = fullRows[0]?.calc;

    if (full) {
      const patched = {
        ...full,
        meta: { ...(full.meta || {}), name: newName, slug: nextSlug },
      };
      await fullStore.putFullWithClient(client, userId, nextSlug, patched);

      if (nextSlug !== slug) {
        await fullStore.deleteFullWithClient(client, userId, slug);
      }
    } else {
      // Seed new if missing
      const seeded = calcFromMetaConfig({
        meta: { ...existing.meta, name: newName, slug: nextSlug },
        config: existing.config ?? {},
      });
      // Ensure IDs
      const withIds = {
        ...seeded,
        meta: { ...(seeded.meta || {}), id: randomBytes(9).toString("base64url"), slug: nextSlug }
      };
      await fullStore.putFullWithClient(client, userId, nextSlug, withIds);
    }

    await client.query("COMMIT");
    return { slug: nextSlug };

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const now = Date.now();

    // 1. Update calculators
    const res = await client.query(
      `UPDATE calculators SET published=$1, updated_at=$2 WHERE user_id=$3 AND slug=$4`,
      [!!next, now, userId, slug]
    );
    const ok = (res.rowCount ?? 0) > 0;

    if (ok) {
      // 2. Sync full store
      let full;
      const { rows } = await client.query(
        `SELECT calc FROM calc_full WHERE user_id=$1 AND slug=$2`,
        [userId, slug]
      );
      full = rows[0]?.calc;

      if (!full && next) {
        // If publishing and no full exists, try to seed from meta
        const { rows: metaRows } = await client.query(
          `SELECT * FROM calculators WHERE user_id=$1 AND slug=$2`,
          [userId, slug]
        );
        const row = metaRows[0] ? rowToCalc(metaRows[0]) : undefined;
        if (row) {
          const seeded = calcFromMetaConfig({
            meta: row.meta,
            config: row.config,
          });
          full = attachMetaIds(seeded, row.meta.slug);
        }
      }

      if (full) {
        const updated = {
          ...full,
          meta: { ...(full.meta || {}), slug: full.meta?.slug || slug, published: !!next },
        };
        await fullStore.putFullWithClient(client, userId, slug, updated);
      }
    }

    await client.query("COMMIT");
    return ok;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function setFavorite(userId: string, slug: string, next: boolean): Promise<boolean> {
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET favorite=$1, updated_at=$2 WHERE user_id=$3 AND slug=$4`,
    [!!next, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function setOrder(userId: string, slugsInOrder: string[]): Promise<void> {
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
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM calculators WHERE user_id=$1`,
    [userId]
  );
  return Number(rows[0]?.n || 0);
}

export async function countPublished(userId: string): Promise<number> {
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
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET is_example = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
    [isExample, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

/**
 * Assign a calculator to a team (or remove from team if teamId is null).
 */
export async function setTeam(userId: string, slug: string, teamId: string | null): Promise<boolean> {
  const now = Date.now();
  const res = await pool.query(
    `UPDATE calculators SET team_id = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
    [teamId, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

/**
 * List all calculators for a team (across all users).
 */
export async function listTeamCalcs(teamId: string): Promise<Calc[]> {
  const { rows } = await pool.query(
    `SELECT * FROM calculators WHERE team_id = $1 ORDER BY name ASC`,
    [teamId]
  );
  return rows.map(rowToCalc);
}

// ============================================================================
// TRANSACTION SUPPORT
// ============================================================================

/**
 * Update name in a transaction (for atomic operations with fullStore).
 */
export async function updateNameWithClient(
  client: PoolClient,
  userId: string,
  slug: string,
  newName: string
): Promise<boolean> {
  const now = Date.now();
  const res = await client.query(
    `UPDATE calculators SET name = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
    [newName, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

/**
 * Set published status in a transaction.
 */
export async function setPublishedWithClient(
  client: PoolClient,
  userId: string,
  slug: string,
  isPublished: boolean
): Promise<boolean> {
  const now = Date.now();
  const res = await client.query(
    `UPDATE calculators SET published = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
    [isPublished, now, userId, slug]
  );
  return (res.rowCount ?? 0) > 0;
}

// ============================================================================
// ATOMIC OPERATIONS (Meta + Full in one transaction)
// ============================================================================

export type SaveResult =
  | { success: true; version: number }
  | { success: false; error: "VERSION_CONFLICT"; currentVersion: number }
  | { success: false; error: "NOT_FOUND" };

/**
 * Atomically save both calculators meta AND calc_full in a single transaction.
 * This ensures data consistency between the two tables.
 * 
 * @param userId - User ID
 * @param slug - Calculator slug
 * @param fullCalc - Full calculator data (will be saved to calc_full)
 * @param metaUpdate - Optional meta updates for calculators table (name, etc.)
 * @param expectedVersion - For optimistic locking (optional)
 */
export async function saveAtomic(
  userId: string,
  slug: string,
  fullCalc: any,
  metaUpdate?: { name?: string },
  expectedVersion?: number
): Promise<SaveResult> {
  const client = await pool.connect();
  const now = Date.now();

  try {
    await client.query("BEGIN");

    // 1) If version check is required, verify it first
    if (expectedVersion !== undefined) {
      const versionCheck = await client.query(
        `SELECT version FROM calc_full WHERE user_id = $1 AND slug = $2`,
        [userId, slug]
      );

      if (versionCheck.rows[0]) {
        const currentVersion = Number(versionCheck.rows[0].version);
        if (currentVersion !== expectedVersion) {
          await client.query("ROLLBACK");
          return { success: false, error: "VERSION_CONFLICT", currentVersion };
        }
      }
    }

    // 2) Update calculators table (meta)
    if (metaUpdate?.name) {
      await client.query(
        `UPDATE calculators SET name = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
        [metaUpdate.name, now, userId, slug]
      );
    }

    // 3) Update calc_full table
    const newVersion = await fullStore.putFullWithClient(client, userId, slug, fullCalc);

    await client.query("COMMIT");

    return { success: true, version: newVersion };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Atomically publish/unpublish a calculator.
 * Updates both calculators.published and ensures calc_full is consistent.
 */
export async function publishAtomic(
  userId: string,
  slug: string,
  isPublished: boolean,
  contactInfo?: { type: string;[key: string]: any }
): Promise<boolean> {
  const client = await pool.connect();
  const now = Date.now();

  try {
    await client.query("BEGIN");

    // 1) Update calculators table
    const metaResult = await client.query(
      `UPDATE calculators SET published = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
      [isPublished, now, userId, slug]
    );

    if ((metaResult.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    // 2) If publishing and contact info provided, update calc_full
    if (isPublished && contactInfo) {
      const existing = await client.query(
        `SELECT calc FROM calc_full WHERE user_id = $1 AND slug = $2`,
        [userId, slug]
      );

      if (existing.rows[0]) {
        const calc = existing.rows[0].calc;
        const updated = {
          ...calc,
          meta: {
            ...(calc.meta || {}),
            contact: contactInfo,
            published: true,
          },
        };

        await client.query(
          `UPDATE calc_full SET calc = $1, updated_at = $2, version = version + 1 WHERE user_id = $3 AND slug = $4`,
          [updated, now, userId, slug]
        );
      }
    }

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get a database connection for manual transaction control.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}
