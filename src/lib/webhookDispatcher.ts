// src/lib/webhookDispatcher.ts
// Async webhook delivery system with HMAC signing

import crypto from "crypto";
import {
    type WebhookEvent,
    type WebhookEndpoint,
    getEndpointsForEvent,
    logWebhookDelivery,
} from "@/lib/webhooks";

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: number;
    data: Record<string, any>;
}

// ============================================================================
// SIGNATURE
// ============================================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function signPayload(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ============================================================================
// DISPATCHER
// ============================================================================

/**
 * Dispatch webhooks for a specific event to all subscribed endpoints.
 * This is fire-and-forget - errors are logged but don't block the caller.
 * 
 * @param userId - The user whose webhooks to trigger
 * @param eventType - The type of event (e.g., 'page_view', 'rating')
 * @param data - The event data to send
 */
export async function dispatchWebhooks(
    userId: string,
    eventType: WebhookEvent,
    data: Record<string, any>
): Promise<void> {
    try {
        // Fetch all enabled endpoints for this event
        const endpoints = await getEndpointsForEvent(userId, eventType);

        if (endpoints.length === 0) {
            return; // No endpoints to dispatch to
        }

        // Prepare the payload
        const payload: WebhookPayload = {
            event: eventType,
            timestamp: Date.now(),
            data,
        };

        // Dispatch to all endpoints in parallel (fire-and-forget)
        await Promise.allSettled(
            endpoints.map((endpoint) => deliverToEndpoint(endpoint, payload))
        );
    } catch (error) {
        // Log but don't throw - webhooks should never block the main flow
        console.error(`[webhooks] Failed to dispatch ${eventType}:`, error);
    }
}

/**
 * Deliver a webhook to a single endpoint
 */
async function deliverToEndpoint(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload
): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = signPayload(body, endpoint.secret);

    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": payload.event,
                "X-Webhook-Timestamp": String(payload.timestamp),
                "User-Agent": "Tierless-Webhooks/1.0",
            },
            body,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        responseStatus = response.status;

        // Try to read response body (limit to 1KB)
        try {
            const text = await response.text();
            responseBody = text.slice(0, 1024);
        } catch {
            responseBody = null;
        }

        // Success = 2xx status code
        success = response.status >= 200 && response.status < 300;

        if (!success) {
            console.warn(
                `[webhooks] Delivery failed to ${endpoint.url}: ${response.status}`
            );
        }
    } catch (error: any) {
        // Network error, timeout, etc.
        responseBody = error?.message || "Unknown error";
        console.error(`[webhooks] Error delivering to ${endpoint.url}:`, error);
    }

    // Log the delivery attempt
    try {
        await logWebhookDelivery(
            endpoint.id,
            payload.event,
            payload.data,
            responseStatus,
            responseBody,
            success
        );
    } catch (logError) {
        console.error("[webhooks] Failed to log delivery:", logError);
    }
}

/**
 * Send a test webhook to verify endpoint configuration
 */
export async function sendTestWebhook(
    endpoint: WebhookEndpoint
): Promise<{ success: boolean; status: number | null; body: string | null }> {
    const payload: WebhookPayload = {
        event: "page_view", // Use page_view as test event
        timestamp: Date.now(),
        data: {
            test: true,
            message: "This is a test webhook from Tierless",
            endpointId: endpoint.id,
            endpointName: endpoint.name,
        },
    };

    const body = JSON.stringify(payload);
    const signature = signPayload(body, endpoint.secret);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": "test",
                "X-Webhook-Timestamp": String(payload.timestamp),
                "User-Agent": "Tierless-Webhooks/1.0",
            },
            body,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        let responseBody: string | null = null;
        try {
            responseBody = (await response.text()).slice(0, 1024);
        } catch {
            responseBody = null;
        }

        const success = response.status >= 200 && response.status < 300;

        // Log test delivery
        await logWebhookDelivery(
            endpoint.id,
            "page_view",
            { test: true },
            response.status,
            responseBody,
            success
        ).catch(() => { });

        return { success, status: response.status, body: responseBody };
    } catch (error: any) {
        const errorMessage = error?.message || "Connection failed";

        // Log failed test
        await logWebhookDelivery(
            endpoint.id,
            "page_view",
            { test: true },
            null,
            errorMessage,
            false
        ).catch(() => { });

        return { success: false, status: null, body: errorMessage };
    }
}
