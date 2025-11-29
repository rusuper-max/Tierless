import { getPool } from "@/lib/db";
import { ensureTable as ensureCalcsTable } from "@/lib/calcsStore";

const pool = getPool();

export async function ensureRatingsTables() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id BIGSERIAL PRIMARY KEY,
      page_id TEXT NOT NULL,
      voter_key TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
      ip_hash TEXT NOT NULL,
      user_id TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE (page_id, voter_key)
    );
    CREATE INDEX IF NOT EXISTS idx_ratings_page ON ratings(page_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_voter ON ratings(voter_key);

    CREATE TABLE IF NOT EXISTS rating_events (
      id BIGSERIAL PRIMARY KEY,
      page_id TEXT NOT NULL,
      voter_key TEXT NOT NULL,
      score INTEGER NOT NULL,
      ip_hash TEXT NOT NULL,
      user_id TEXT,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rating_events_page ON rating_events(page_id);
  `);
}

export type RatingResult = {
    avg: number;
    count: number;
    userScore: number;
};

export async function upsertRating(
    pageId: string,
    voterKey: string,
    score: number,
    ipHash: string,
    userId: string | null
): Promise<RatingResult> {
    await ensureRatingsTables();
    await ensureCalcsTable();
    const now = Date.now();

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Upsert rating
        await client.query(
            `INSERT INTO ratings (page_id, voter_key, score, ip_hash, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (page_id, voter_key)
       DO UPDATE SET score = EXCLUDED.score, ip_hash = EXCLUDED.ip_hash, user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at`,
            [pageId, voterKey, score, ipHash, userId, now]
        );

        // 2. Insert event (audit log)
        await client.query(
            `INSERT INTO rating_events (page_id, voter_key, score, ip_hash, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [pageId, voterKey, score, ipHash, userId, now]
        );

        // 3. Calculate new stats
        const { rows: stats } = await client.query(
            `SELECT COUNT(*)::int as count, AVG(score)::numeric(3,2) as avg
       FROM ratings
       WHERE page_id = $1`,
            [pageId]
        );
        const count = stats[0]?.count || 0;
        const avg = Number(stats[0]?.avg || 0);

        // 4. Update denormalized columns in calculators table
        // Note: We assume the column exists. We'll ensure it in calcsStore.
        await client.query(
            `UPDATE calculators
       SET avg_rating = $1, ratings_count = $2
       WHERE slug = $3`,
            [avg, count, pageId]

        );

        await client.query("COMMIT");
        return { avg, count, userScore: score };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}

export async function getRatingStatus(pageId: string, voterKey: string): Promise<RatingResult> {
    await ensureRatingsTables();
    const client = await pool.connect();
    try {
        // Get user score
        const { rows: userRows } = await client.query(
            `SELECT score FROM ratings WHERE page_id = $1 AND voter_key = $2`,
            [pageId, voterKey]
        );
        const userScore = userRows[0]?.score || 0;

        // Get global stats (could be cached in calculators table, but for now query directly or fallback)
        // We will try to fetch from calculators table if possible, but here we only have pageId.
        // If pageId is slug, we can't easily query calculators table without user_id unless we assume unique slug.
        // Let's just query ratings table for now for correctness.
        const { rows: stats } = await client.query(
            `SELECT COUNT(*)::int as count, AVG(score)::numeric(3,2) as avg
       FROM ratings
       WHERE page_id = $1`,
            [pageId]
        );

        return {
            avg: Number(stats[0]?.avg || 0),
            count: stats[0]?.count || 0,
            userScore,
        };
    } finally {
        client.release();
    }
}
