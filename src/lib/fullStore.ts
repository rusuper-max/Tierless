// src/lib/fullStore.ts
import { getPool } from "@/lib/db";
import { randomBytes } from "crypto";
import type { PoolClient } from "pg";

const pool = getPool();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS calc_full (
      user_id    TEXT   NOT NULL,
      slug       TEXT   NOT NULL,
      calc       JSONB  NOT NULL,
      updated_at BIGINT NOT NULL,
      version    INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, slug)
    );
    CREATE INDEX IF NOT EXISTS idx_calc_full_slug ON calc_full(slug);
    CREATE INDEX IF NOT EXISTS idx_calc_full_meta_id ON calc_full((calc->'meta'->>'id'));
  `);
  
  // Migration: add version column if it doesn't exist
  try {
    await pool.query(`
      ALTER TABLE calc_full ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
    `);
  } catch (e) {
    console.warn("Migration (version column) failed:", e);
  }
  
  // Add team_id column for future Teams support
  try {
    await pool.query(`
      ALTER TABLE calc_full ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_calc_full_team ON calc_full(team_id) WHERE team_id IS NOT NULL;
    `);
  } catch {
    // Ignore - teams table might not exist yet
  }
}

export type FullRecord = {
  calc: any;
  version: number;
  updated_at: number;
};

/**
 * Vrati FULL kalkulator za datog usera i slug, ili undefined ako ne postoji.
 */
export async function getFull(userId: string, slug: string): Promise<any | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT calc FROM calc_full WHERE user_id = $1 AND slug = $2 LIMIT 1`,
    [userId, slug]
  );
  return rows[0]?.calc ?? undefined;
}

/**
 * Get full record WITH version for optimistic locking.
 */
export async function getFullWithVersion(userId: string, slug: string): Promise<FullRecord | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT calc, version, updated_at FROM calc_full WHERE user_id = $1 AND slug = $2 LIMIT 1`,
    [userId, slug]
  );
  if (!rows[0]) return undefined;
  return {
    calc: rows[0].calc,
    version: Number(rows[0].version) || 1,
    updated_at: Number(rows[0].updated_at) || Date.now(),
  };
}

/**
 * Snimi / upsert-uj FULL kalkulator.
 */
function withMetaIds(calc: any, slug: string) {
  const meta = { ...(calc?.meta || {}) };
  meta.slug = slug;
  if (typeof meta.id !== "string" || meta.id.length === 0) {
    meta.id = randomBytes(9).toString("base64url");
  }
  return { ...(calc || {}), meta };
}

export type PutFullResult = 
  | { success: true; newVersion: number }
  | { success: false; error: "VERSION_CONFLICT"; currentVersion: number };

/**
 * Put full calculator data.
 * If expectedVersion is provided, performs optimistic locking check.
 * Returns VERSION_CONFLICT if the current version doesn't match.
 */
export async function putFull(
  userId: string,
  slug: string,
  calc: any,
  expectedVersion?: number
): Promise<void> {
  await ensureTable();
  const now = Date.now();
  const normalized = withMetaIds(calc, slug);
  
  if (expectedVersion !== undefined) {
    // Optimistic locking: only update if version matches
    const result = await pool.query(
      `
      UPDATE calc_full 
      SET calc = $3, updated_at = $4, version = version + 1
      WHERE user_id = $1 AND slug = $2 AND version = $5
      RETURNING version
      `,
      [userId, slug, normalized, now, expectedVersion]
    );
    
    if (result.rowCount === 0) {
      // Check if record exists with different version
      const existing = await pool.query(
        `SELECT version FROM calc_full WHERE user_id = $1 AND slug = $2`,
        [userId, slug]
      );
      
      if (existing.rows[0]) {
        const currentVersion = Number(existing.rows[0].version);
        throw new VersionConflictError(expectedVersion, currentVersion);
      }
      
      // Record doesn't exist, create it
      await pool.query(
        `
        INSERT INTO calc_full (user_id, slug, calc, updated_at, version)
        VALUES ($1, $2, $3, $4, 1)
        `,
        [userId, slug, normalized, now]
      );
    }
  } else {
    // No version check - simple upsert (legacy behavior)
    await pool.query(
      `
      INSERT INTO calc_full (user_id, slug, calc, updated_at, version)
      VALUES ($1, $2, $3, $4, 1)
      ON CONFLICT (user_id, slug)
      DO UPDATE SET
        calc = EXCLUDED.calc,
        updated_at = EXCLUDED.updated_at,
        version = calc_full.version + 1
      `,
      [userId, slug, normalized, now]
    );
  }
}

/**
 * Put full with transaction support (for atomic operations with calcsStore).
 */
export async function putFullWithClient(
  client: PoolClient,
  userId: string,
  slug: string,
  calc: any
): Promise<number> {
  const now = Date.now();
  const normalized = withMetaIds(calc, slug);
  
  const result = await client.query(
    `
    INSERT INTO calc_full (user_id, slug, calc, updated_at, version)
    VALUES ($1, $2, $3, $4, 1)
    ON CONFLICT (user_id, slug)
    DO UPDATE SET
      calc = EXCLUDED.calc,
      updated_at = EXCLUDED.updated_at,
      version = calc_full.version + 1
    RETURNING version
    `,
    [userId, slug, normalized, now]
  );
  
  return Number(result.rows[0]?.version) || 1;
}

/**
 * Custom error for version conflicts (optimistic locking)
 */
export class VersionConflictError extends Error {
  public readonly expectedVersion: number;
  public readonly currentVersion: number;
  
  constructor(expected: number, current: number) {
    super(`Version conflict: expected ${expected}, but current is ${current}`);
    this.name = "VersionConflictError";
    this.expectedVersion = expected;
    this.currentVersion = current;
  }
}

/**
 * Obriši FULL zapis za datog usera i slug (ako postoji).
 */
export async function deleteFull(userId: string, slug: string): Promise<void> {
  await ensureTable();
  await pool.query(
    `DELETE FROM calc_full WHERE user_id = $1 AND slug = $2`,
    [userId, slug]
  );
}

/**
 * Cross-user finder: prvi FULL kalkulator sa datim slug-om.
 * (Za public /p/ linkove, ako ti tako treba.)
 */
export async function findFullBySlug(slug: string): Promise<any | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT calc FROM calc_full WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0]?.calc ?? undefined;
}

/**
 * Cross-user finder: prvi FULL kalkulator sa datim public ID-jem.
 */
export async function findFullById(id: string): Promise<any | undefined> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT calc FROM calc_full WHERE calc->'meta'->>'id' = $1 LIMIT 1`,
    [id]
  );
  return rows[0]?.calc ?? undefined;
}
