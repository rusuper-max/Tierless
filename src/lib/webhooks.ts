// src/lib/webhooks.ts
// User-configurable webhooks for Pro+ users

import { getPool } from "@/lib/db";
import crypto from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export type WebhookEvent = "page_view" | "rating";

export interface WebhookEndpoint {
    id: string;
    userId: string;
    name: string;
    url: string;
    secret: string;
    events: WebhookEvent[];
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface WebhookLog {
    id: number;
    endpointId: string;
    eventType: WebhookEvent;
    payload: Record<string, any>;
    responseStatus: number | null;
    responseBody: string | null;
    success: boolean;
    attempts: number;
    createdAt: number;
}

// ============================================================================
// TABLE SETUP
// ============================================================================

export async function ensureWebhookTables(): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
        // Webhook endpoints table
        await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        secret TEXT NOT NULL,
        events TEXT[] NOT NULL DEFAULT '{}',
        enabled BOOLEAN DEFAULT true,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);

        // Webhook logs table
        await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        response_status INT,
        response_body TEXT,
        success BOOLEAN DEFAULT false,
        attempts INT DEFAULT 1,
        created_at BIGINT NOT NULL
      );
    `);

        // Indexes
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user ON webhook_endpoints(user_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint ON webhook_logs(endpoint_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
    `);

        console.log("✅ Webhook tables ensured successfully");
    } catch (e) {
        console.error("❌ Failed to ensure webhook tables:", e);
        throw e;
    } finally {
        client.release();
    }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Generate a secure random secret for webhook signing
 */
function generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * List all webhook endpoints for a user
 */
export async function listWebhookEndpoints(userId: string): Promise<WebhookEndpoint[]> {
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT * FROM webhook_endpoints WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return rows.map(rowToEndpoint);
}

/**
 * Get a single webhook endpoint by ID
 */
export async function getWebhookEndpoint(id: string): Promise<WebhookEndpoint | null> {
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT * FROM webhook_endpoints WHERE id = $1`,
        [id]
    );
    return rows[0] ? rowToEndpoint(rows[0]) : null;
}

/**
 * Create a new webhook endpoint
 */
export async function createWebhookEndpoint(
    userId: string,
    name: string,
    url: string,
    events: WebhookEvent[]
): Promise<WebhookEndpoint> {
    const pool = getPool();
    const id = crypto.randomUUID();
    const secret = generateSecret();
    const now = Date.now();

    await pool.query(
        `INSERT INTO webhook_endpoints (id, user_id, name, url, secret, events, enabled, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
        [id, userId, name, url, secret, events, now, now]
    );

    return {
        id,
        userId,
        name,
        url,
        secret,
        events,
        enabled: true,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Update a webhook endpoint
 */
export async function updateWebhookEndpoint(
    id: string,
    updates: {
        name?: string;
        url?: string;
        events?: WebhookEvent[];
        enabled?: boolean;
    }
): Promise<WebhookEndpoint | null> {
    const pool = getPool();
    const now = Date.now();

    const setClauses: string[] = ["updated_at = $2"];
    const values: any[] = [id, now];
    let paramIndex = 3;

    if (updates.name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(updates.name);
    }
    if (updates.url !== undefined) {
        setClauses.push(`url = $${paramIndex++}`);
        values.push(updates.url);
    }
    if (updates.events !== undefined) {
        setClauses.push(`events = $${paramIndex++}`);
        values.push(updates.events);
    }
    if (updates.enabled !== undefined) {
        setClauses.push(`enabled = $${paramIndex++}`);
        values.push(updates.enabled);
    }

    const { rows } = await pool.query(
        `UPDATE webhook_endpoints SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
        values
    );

    return rows[0] ? rowToEndpoint(rows[0]) : null;
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
        `DELETE FROM webhook_endpoints WHERE id = $1`,
        [id]
    );
    return (result.rowCount ?? 0) > 0;
}

/**
 * Regenerate the secret for a webhook endpoint
 */
export async function regenerateWebhookSecret(id: string): Promise<string | null> {
    const pool = getPool();
    const newSecret = generateSecret();
    const now = Date.now();

    const { rows } = await pool.query(
        `UPDATE webhook_endpoints SET secret = $1, updated_at = $2 WHERE id = $3 RETURNING secret`,
        [newSecret, now, id]
    );

    return rows[0]?.secret ?? null;
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log a webhook delivery attempt
 */
export async function logWebhookDelivery(
    endpointId: string,
    eventType: WebhookEvent,
    payload: Record<string, any>,
    responseStatus: number | null,
    responseBody: string | null,
    success: boolean
): Promise<void> {
    const pool = getPool();
    const now = Date.now();

    await pool.query(
        `INSERT INTO webhook_logs (endpoint_id, event_type, payload, response_status, response_body, success, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [endpointId, eventType, JSON.stringify(payload), responseStatus, responseBody, success, now]
    );
}

/**
 * Get recent webhook logs for an endpoint
 */
export async function getWebhookLogs(
    endpointId: string,
    limit = 50
): Promise<WebhookLog[]> {
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT * FROM webhook_logs WHERE endpoint_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [endpointId, limit]
    );
    return rows.map(rowToLog);
}

/**
 * Get recent webhook logs for a user (across all endpoints)
 */
export async function getUserWebhookLogs(
    userId: string,
    limit = 100
): Promise<(WebhookLog & { endpointName: string })[]> {
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT wl.*, we.name as endpoint_name
     FROM webhook_logs wl
     JOIN webhook_endpoints we ON wl.endpoint_id = we.id
     WHERE we.user_id = $1
     ORDER BY wl.created_at DESC
     LIMIT $2`,
        [userId, limit]
    );
    return rows.map((r) => ({
        ...rowToLog(r),
        endpointName: r.endpoint_name,
    }));
}

/**
 * Cleanup old webhook logs (older than 30 days)
 */
export async function cleanupOldWebhookLogs(daysToKeep = 30): Promise<number> {
    const pool = getPool();
    const threshold = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const result = await pool.query(
        `DELETE FROM webhook_logs WHERE created_at < $1`,
        [threshold]
    );
    return result.rowCount ?? 0;
}

// ============================================================================
// FETCH ENDPOINTS FOR EVENT
// ============================================================================

/**
 * Get all enabled endpoints for a user that subscribe to a specific event
 */
export async function getEndpointsForEvent(
    userId: string,
    eventType: WebhookEvent
): Promise<WebhookEndpoint[]> {
    const pool = getPool();
    const { rows } = await pool.query(
        `SELECT * FROM webhook_endpoints 
     WHERE user_id = $1 AND enabled = true AND $2 = ANY(events)`,
        [userId, eventType]
    );
    return rows.map(rowToEndpoint);
}

// ============================================================================
// HELPERS
// ============================================================================

function rowToEndpoint(r: any): WebhookEndpoint {
    return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        url: r.url,
        secret: r.secret,
        events: r.events || [],
        enabled: r.enabled,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at),
    };
}

function rowToLog(r: any): WebhookLog {
    return {
        id: r.id,
        endpointId: r.endpoint_id,
        eventType: r.event_type as WebhookEvent,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
        responseStatus: r.response_status,
        responseBody: r.response_body,
        success: r.success,
        attempts: r.attempts || 1,
        createdAt: Number(r.created_at),
    };
}
