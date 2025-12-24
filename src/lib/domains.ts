/**
 * Custom Domains - Database layer for Pro+ feature
 * 
 * Allows users to connect their own domains (e.g., menu.mybistro.com)
 * to their pricing pages.
 */

import { getPool } from "@/lib/db";

// Helper to generate random hex token using Web Crypto API (Edge-compatible)
function generateToken(length: number = 32): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomDomain {
    id: string;
    userId: string;
    domain: string;
    slug: string; // Which calculator page this domain points to
    verificationToken: string;
    verified: boolean;
    verifiedAt: Date | null;
    sslStatus: "pending" | "active" | "failed";
    createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Creation
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureDomainsTable(): Promise<void> {
    const pool = getPool();
    await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_domains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL,
      verification_token VARCHAR(64) NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      verified_at TIMESTAMPTZ,
      ssl_status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    // Create indexes if not exist
    await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_custom_domains_user ON custom_domains(user_id)
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain)
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Row Mapper
// ─────────────────────────────────────────────────────────────────────────────

function rowToDomain(row: any): CustomDomain {
    return {
        id: row.id,
        userId: row.user_id,
        domain: row.domain,
        slug: row.slug,
        verificationToken: row.verification_token,
        verified: row.verified,
        verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
        sslStatus: row.ssl_status || "pending",
        createdAt: new Date(row.created_at),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all domains for a user
 */
export async function getUserDomains(userId: string): Promise<CustomDomain[]> {
    await ensureDomainsTable();
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT * FROM custom_domains WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return rows.map(rowToDomain);
}

/**
 * Get a single domain by ID
 */
export async function getDomainById(id: string, userId: string): Promise<CustomDomain | null> {
    await ensureDomainsTable();
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT * FROM custom_domains WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [id, userId]
    );
    return rows[0] ? rowToDomain(rows[0]) : null;
}

/**
 * Add a new domain
 */
export async function addDomain(
    userId: string,
    domain: string,
    slug: string
): Promise<CustomDomain> {
    await ensureDomainsTable();
    const pool = getPool();

    // Normalize domain (lowercase, no protocol, no trailing slash)
    const normalizedDomain = domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .split("/")[0]; // Only keep hostname

    // Generate verification token using Web Crypto API
    const verificationToken = generateToken(32);

    const { rows } = await pool.query(
        `INSERT INTO custom_domains (user_id, domain, slug, verification_token)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [userId, normalizedDomain, slug, verificationToken]
    );

    return rowToDomain(rows[0]);
}

/**
 * Remove a domain
 */
export async function removeDomain(id: string, userId: string): Promise<boolean> {
    await ensureDomainsTable();
    const pool = getPool();
    const result = await pool.query(
        `DELETE FROM custom_domains WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
}

/**
 * Mark a domain as verified
 */
export async function markDomainVerified(id: string, userId: string): Promise<boolean> {
    await ensureDomainsTable();
    const pool = getPool();
    const result = await pool.query(
        `UPDATE custom_domains 
     SET verified = TRUE, verified_at = NOW(), ssl_status = 'active'
     WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
}

/**
 * Update SSL status
 */
export async function updateSslStatus(
    id: string,
    status: "pending" | "active" | "failed"
): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
        `UPDATE custom_domains SET ssl_status = $1 WHERE id = $2`,
        [status, id]
    );
    return (result.rowCount ?? 0) > 0;
}

/**
 * Count domains for a user (for entitlement checks)
 */
export async function countUserDomains(userId: string): Promise<number> {
    await ensureDomainsTable();
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT COUNT(*) as count FROM custom_domains WHERE user_id = $1`,
        [userId]
    );
    return parseInt(rows[0]?.count || "0", 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Helper (replaces mock data)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get slug for a custom domain (used by middleware for routing)
 * Only returns verified domains.
 */
export async function getSlugFromDomain(domain: string): Promise<string | null> {
    // Remove port if present (e.g. localhost:3000)
    const hostname = domain.split(":")[0].toLowerCase();

    try {
        await ensureDomainsTable();
        const pool = getPool();
        const { rows } = await pool.query(
            `SELECT slug FROM custom_domains 
       WHERE domain = $1 AND verified = TRUE 
       LIMIT 1`,
            [hostname]
        );
        return rows[0]?.slug || null;
    } catch (err) {
        // In middleware, we need to be resilient to DB errors
        console.error("[domains] getSlugFromDomain error:", err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the TXT record name and value for domain verification
 */
export function getVerificationRecord(domain: string, token: string): {
    name: string;
    value: string;
    type: "TXT";
} {
    return {
        name: `_tierless.${domain}`,
        value: `tierless-verify=${token}`,
        type: "TXT",
    };
}

/**
 * Verify a domain by checking its TXT record
 */
export async function verifyDomainDns(domain: string, expectedToken: string): Promise<boolean> {
    const { Resolver } = await import("dns").then(m => m.promises);
    const resolver = new Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]); // Use public DNS

    const txtName = `_tierless.${domain}`;
    const expectedValue = `tierless-verify=${expectedToken}`;

    try {
        const records = await resolver.resolveTxt(txtName);
        // Flatten TXT records (they can be chunked)
        const flatRecords = records.map(chunks => chunks.join(""));
        return flatRecords.includes(expectedValue);
    } catch (err: any) {
        // ENODATA or ENOTFOUND means record doesn't exist yet
        if (err.code === "ENODATA" || err.code === "ENOTFOUND") {
            return false;
        }
        console.error("[domains] DNS verification error:", err);
        return false;
    }
}
