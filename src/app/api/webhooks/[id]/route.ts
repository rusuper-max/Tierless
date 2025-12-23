// src/app/api/webhooks/[id]/route.ts
// API routes for getting, updating, and deleting a webhook endpoint

import { NextResponse } from "next/server";
import { getUserIdFromRequest, getUserPlan } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import {
    getWebhookEndpoint,
    updateWebhookEndpoint,
    deleteWebhookEndpoint,
    getWebhookLogs,
    regenerateWebhookSecret,
    type WebhookEvent,
} from "@/lib/webhooks";

export const runtime = "nodejs";

const VALID_EVENTS: WebhookEvent[] = ["page_view", "rating"];

type Context = { params: Promise<{ id: string }> };

// GET /api/webhooks/[id] - Get endpoint details with logs
export async function GET(req: Request, ctx: Context) {
    const { id } = await ctx.params;

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(userId);
    if (!hasFeature(plan, "webhooks")) {
        return NextResponse.json({ error: "Webhooks require Pro plan or higher" }, { status: 403 });
    }

    try {
        const endpoint = await getWebhookEndpoint(id);

        if (!endpoint) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        // Verify ownership
        if (endpoint.userId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Get recent logs
        const logs = await getWebhookLogs(id, 50);

        return NextResponse.json({
            ok: true,
            endpoint: {
                ...endpoint,
                secretPreview: endpoint.secret.slice(0, 8) + "...",
                secret: undefined, // Don't expose full secret
            },
            logs,
        });
    } catch (error) {
        console.error("[webhooks] Get error:", error);
        return NextResponse.json({ error: "Failed to get webhook" }, { status: 500 });
    }
}

// PUT /api/webhooks/[id] - Update endpoint
export async function PUT(req: Request, ctx: Context) {
    const { id } = await ctx.params;

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(userId);
    if (!hasFeature(plan, "webhooks")) {
        return NextResponse.json({ error: "Webhooks require Pro plan or higher" }, { status: 403 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    try {
        const endpoint = await getWebhookEndpoint(id);

        if (!endpoint) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        if (endpoint.userId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const updates: {
            name?: string;
            url?: string;
            events?: WebhookEvent[];
            enabled?: boolean;
        } = {};

        // Validate and apply updates
        if (body.name !== undefined) {
            if (typeof body.name !== "string" || body.name.length > 100) {
                return NextResponse.json({ error: "Name must be string (max 100 chars)" }, { status: 400 });
            }
            updates.name = body.name;
        }

        if (body.url !== undefined) {
            try {
                const parsedUrl = new URL(body.url);
                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    throw new Error("Invalid protocol");
                }
                updates.url = body.url;
            } catch {
                return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
            }
        }

        if (body.events !== undefined) {
            if (!Array.isArray(body.events) || body.events.length === 0) {
                return NextResponse.json({ error: "At least one event required" }, { status: 400 });
            }
            const validEvents = body.events.filter((e: string) => VALID_EVENTS.includes(e as WebhookEvent));
            if (validEvents.length === 0) {
                return NextResponse.json({ error: "No valid events provided" }, { status: 400 });
            }
            updates.events = validEvents;
        }

        if (body.enabled !== undefined) {
            updates.enabled = Boolean(body.enabled);
        }

        // Handle secret regeneration separately
        if (body.regenerateSecret === true) {
            const newSecret = await regenerateWebhookSecret(id);
            if (!newSecret) {
                return NextResponse.json({ error: "Failed to regenerate secret" }, { status: 500 });
            }
            // Return the new secret immediately (only time it's shown)
            return NextResponse.json({
                ok: true,
                secret: newSecret,
                message: "Secret regenerated. Save it now - it won't be shown again.",
            });
        }

        const updated = await updateWebhookEndpoint(id, updates);

        return NextResponse.json({
            ok: true,
            endpoint: {
                ...updated,
                secret: undefined,
                secretPreview: updated?.secret?.slice(0, 8) + "...",
            },
        });
    } catch (error) {
        console.error("[webhooks] Update error:", error);
        return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
    }
}

// DELETE /api/webhooks/[id] - Delete endpoint
export async function DELETE(req: Request, ctx: Context) {
    const { id } = await ctx.params;

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(userId);
    if (!hasFeature(plan, "webhooks")) {
        return NextResponse.json({ error: "Webhooks require Pro plan or higher" }, { status: 403 });
    }

    try {
        const endpoint = await getWebhookEndpoint(id);

        if (!endpoint) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        if (endpoint.userId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        await deleteWebhookEndpoint(id);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[webhooks] Delete error:", error);
        return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
    }
}
