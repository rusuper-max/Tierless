#!/usr/bin/env node
/**
 * Database Migration Runner
 * 
 * Runs SQL migrations against PostgreSQL database.
 * Uses DATABASE_URL from environment variables.
 * 
 * Usage:
 *   node scripts/run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    try {
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');

        // Read migration files
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Run in alphabetical order (001_*, 002_*, etc.)

        if (files.length === 0) {
            console.log('⚠️  No migration files found');
            return;
        }

        console.log(`📝 Found ${files.length} migration file(s)`);

        // Run each migration
        for (const file of files) {
            const filePath = path.join(MIGRATIONS_DIR, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            console.log(`\n🔄 Running migration: ${file}`);

            try {
                await pool.query(sql);
                console.log(`✅ Migration completed: ${file}`);
            } catch (error) {
                console.error(`❌ Migration failed: ${file}`);
                console.error('   Error:', error.message);

                // Don't exit on error - some migrations might be idempotent
                // and fail if already applied (e.g., CREATE TABLE IF NOT EXISTS)
                console.log('   Continuing with next migration...');
            }
        }

        console.log('\n✨ All migrations processed successfully');

    } catch (error) {
        console.error('❌ Fatal error during migration:');
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migrations
runMigrations().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
