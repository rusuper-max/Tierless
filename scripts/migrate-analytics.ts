/**
 * Migration script: Move analytics from JSON files to PostgreSQL
 * 
 * Run with: npx tsx scripts/migrate-analytics.ts
 */

import { Pool } from "pg";
import { promises as fs } from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function migrate() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const eventsDir = path.join(process.cwd(), "data", "events");

  console.log("🚀 Starting analytics migration to PostgreSQL...\n");

  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGSERIAL PRIMARY KEY,
        page_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        session_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        ts BIGINT NOT NULL,
        props JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_page_ts ON analytics_events(page_id, ts DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id, page_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    `);

    console.log("✅ Database table and indexes created\n");

    // Check if events directory exists
    try {
      await fs.access(eventsDir);
    } catch {
      console.log("ℹ️  No events directory found at:", eventsDir);
      console.log("   Nothing to migrate.\n");
      return;
    }

    // Read all JSON files
    const files = await fs.readdir(eventsDir);
    const jsonFiles = files.filter(f => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
      console.log("ℹ️  No JSON event files found.\n");
      return;
    }

    console.log(`📁 Found ${jsonFiles.length} event files to migrate\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(eventsDir, file);
      console.log(`📄 Processing ${file}...`);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const events = JSON.parse(content);

        if (!Array.isArray(events) || events.length === 0) {
          console.log(`   ⏭️  Empty or invalid file, skipping\n`);
          continue;
        }

        let migrated = 0;
        let skipped = 0;

        for (const event of events) {
          try {
            // Check if event already exists (avoid duplicates)
            const existing = await pool.query(
              `SELECT 1 FROM analytics_events 
               WHERE page_id = $1 AND session_id = $2 AND ts = $3 AND event_type = $4
               LIMIT 1`,
              [event.pageId, event.sessionId, event.ts, event.type]
            );

            if (existing.rows.length > 0) {
              skipped++;
              continue;
            }

            // Insert event
            await pool.query(
              `INSERT INTO analytics_events (page_id, event_type, session_id, client_id, ts, props)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                event.pageId,
                event.type,
                event.sessionId,
                event.clientId,
                event.ts,
                JSON.stringify(event.props || {})
              ]
            );
            migrated++;
          } catch (err) {
            console.error(`   ⚠️  Error inserting event:`, err);
          }
        }

        console.log(`   ✅ Migrated ${migrated} events, skipped ${skipped} duplicates\n`);
        totalMigrated += migrated;
        totalSkipped += skipped;
      } catch (err) {
        console.error(`   ❌ Error processing file:`, err);
      }
    }

    console.log("═".repeat(50));
    console.log(`\n🎉 Migration complete!`);
    console.log(`   Total migrated: ${totalMigrated}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    console.log(`\n💡 You can now safely delete the data/events folder.\n`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

