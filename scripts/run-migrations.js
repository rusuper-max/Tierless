#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
/**
 * Database Migration Runner
 * 
 * Runs SQL migrations against PostgreSQL database.
 * Uses DATABASE_URL from environment variables.
 * 
 * Features:
 * - Transaction safety (rollback on error)
 * - Checksum validation (prevents history rewriting)
 * - Automatic schema updates
 * 
 * Usage:
 *   node scripts/run-migrations.js
 */

const { Pool } = require('pg'); // eslint-disable-line
const fs = require('fs'); // eslint-disable-line
const path = require('path'); // eslint-disable-line
const crypto = require('crypto'); // eslint-disable-line

const MIGRATIONS_DIR = path.join(__dirname, '..', 'data', 'migrations');

// Load .env.local if it exists (for local development)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+?)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2] || '';
        }
    });
}

function calculateChecksum(content) {
    // Normalize line endings to prevent OS differences affecting checksum
    const normalized = content.replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function runMigrations() {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERROR: DATABASE_URL environment variable is not set');
        console.error('   Please set DATABASE_URL in your .env.local file or environment');
        process.exit(1);
    }

    console.log('🗄️  Starting database migrations...');
    console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}`);

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        // Create migrations tracking table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                checksum TEXT,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Ensure checksum column exists (for existing tables)
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_migrations' AND column_name='checksum') THEN 
                    ALTER TABLE _migrations ADD COLUMN checksum TEXT; 
                END IF; 
            END $$;
        `);

        // Get list of applied migrations
        const { rows: applied } = await pool.query('SELECT name, checksum FROM _migrations ORDER BY name');
        const appliedMap = new Map(applied.map(r => [r.name, r.checksum]));

        // Get all migration files
        if (!fs.existsSync(MIGRATIONS_DIR)) {
            console.log('📁 Creating migrations directory...');
            fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
        }

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            console.log('ℹ️  No migration files found');
            return;
        }

        console.log(`📋 Found ${files.length} migration file(s)`);

        let appliedCount = 0;
        for (const file of files) {
            const filePath = path.join(MIGRATIONS_DIR, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            const checksum = calculateChecksum(sql);

            if (appliedMap.has(file)) {
                const storedChecksum = appliedMap.get(file);
                // Only verify checksum if one was stored (legacy migrations might be null)
                if (storedChecksum && storedChecksum !== checksum) {
                    console.error(`❌ CRITICAL ERROR: Checksum mismatch for ${file}`);
                    console.error(`   Stored: ${storedChecksum}`);
                    console.error(`   Calculated: ${checksum}`);
                    console.error(`   This means the migration file has been changed after being applied.`);
                    console.error(`   Do NOT modify applied migrations. Create a new migration instead.`);
                    process.exit(1);
                }
                console.log(`⏭️  Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`🔄 Applying ${file}...`);

            try {
                await pool.query('BEGIN');
                await pool.query(sql);
                await pool.query('INSERT INTO _migrations (name, checksum) VALUES ($1, $2)', [file, checksum]);
                await pool.query('COMMIT');
                console.log(`✅ Applied ${file}`);
                appliedCount++;
            } catch (err) {
                await pool.query('ROLLBACK');
                console.error(`❌ Failed to apply ${file}:`, err.message);
                throw err;
            }
        }

        if (appliedCount === 0) {
            console.log('✅ Database is up to date');
        } else {
            console.log(`✅ Applied ${appliedCount} migration(s)`);
        }

    } finally {
        await pool.end();
    }
}

runMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
