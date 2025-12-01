#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
/**
 * Database Migration Runner
 * 
 * Runs SQL migrations against PostgreSQL database.
 * Uses DATABASE_URL from environment variables.
 * 
 * Usage:
 *   node scripts/run-migrations.js
 */

const { Pool } = require('pg'); // eslint-disable-line
const fs = require('fs'); // eslint-disable-line
const path = require('path'); // eslint-disable-line

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
                applied_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Get list of applied migrations
        const { rows: applied } = await pool.query('SELECT name FROM _migrations ORDER BY name');
        const appliedSet = new Set(applied.map(r => r.name));

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
            if (appliedSet.has(file)) {
                console.log(`⏭️  Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`🔄 Applying ${file}...`);
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

            try {
                await pool.query('BEGIN');
                await pool.query(sql);
                await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
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
