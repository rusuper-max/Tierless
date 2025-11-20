import { Pool } from "pg";
import crypto from "crypto";

// --- DATABASE CONNECTION (Singleton Pattern) ---

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  _pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // Required for Neon
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return _pool;
}

// --- AUTHENTICATION (Magic Link Helpers) ---

/**
 * Kreira tabelu za tokene ako ne postoji.
 * Poziva se prilikom svakog slanja maila (lazy init), 
 * što je dobro rešenje kad nemaš migracije.
 */
export async function ensureAuthTables() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Tabela čuva token, email i vreme isteka (timestamp)
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at BIGINT NOT NULL
      );
    `);
  } finally {
    client.release();
  }
}

/**
 * Generiše novi token za dati email, čuva ga u bazi i vraća ga.
 * Token važi 15 minuta.
 */
export async function createAuthToken(email: string) {
  const pool = getPool();
  const token = crypto.randomUUID(); // Generiše siguran ID
  const expiresAt = Date.now() + 1000 * 60 * 15; // 15 minuta od sada

  const client = await pool.connect();
  try {
    // 1. Brišemo stare tokene za ovaj email da ne pravimo "đubre" u bazi
    await client.query('DELETE FROM auth_tokens WHERE email = $1', [email]);
    
    // 2. Upisujemo novi token
    await client.query(
      'INSERT INTO auth_tokens (token, email, expires_at) VALUES ($1, $2, $3)',
      [token, email, expiresAt]
    );
    return token;
  } finally {
    client.release();
  }
}

/**
 * Proverava da li token postoji i da li je validan.
 * Ako je validan, vraća email i BRIŠE token (One-time use).
 * Ako nije validan ili je istekao, vraća null.
 */
export async function verifyAndConsumeToken(token: string) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // 1. Pronađi token
    const res = await client.query(
      'SELECT email, expires_at FROM auth_tokens WHERE token = $1',
      [token]
    );

    if (res.rows.length === 0) {
      return null; // Token ne postoji
    }

    const { email, expires_at } = res.rows[0];

    // 2. ODMAH obriši token (da ne može da se iskoristi dva puta)
    await client.query('DELETE FROM auth_tokens WHERE token = $1', [token]);

    // 3. Proveri da li je istekao
    if (Date.now() > Number(expires_at)) {
      return null; // Token je istekao
    }

    // 4. Sve je ok, vraćamo email
    return email as string;
  } finally {
    client.release();
  }
}