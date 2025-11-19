// src/lib/fullStore.ts
import { getPool } from "@/lib/db";

const pool = getPool();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS calc_full (
      user_id    TEXT   NOT NULL,
      slug       TEXT   NOT NULL,
      calc       JSONB  NOT NULL,
      updated_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, slug)
    );
    CREATE INDEX IF NOT EXISTS idx_calc_full_slug ON calc_full(slug);
    CREATE INDEX IF NOT EXISTS idx_calc_full_meta_id ON calc_full((calc->'meta'->>'id'));
  `);
}

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
 * Snimi / upsert-uj FULL kalkulator.
 */
export async function putFull(userId: string, slug: string, calc: any): Promise<void> {
  await ensureTable();
  const now = Date.now();
  await pool.query(
    `
    INSERT INTO calc_full (user_id, slug, calc, updated_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, slug)
    DO UPDATE SET
      calc = EXCLUDED.calc,
      updated_at = EXCLUDED.updated_at
    `,
    [userId, slug, calc, now]
  );
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
