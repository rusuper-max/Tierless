// src/app/api/webhooks/route.ts
// API routes for listing and creating webhook endpoints

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { getUserPlan } from "@/lib/auth";
import {
    listWebhookEndpoints,
    createWebhookEndpoint,
    ensureWebhookTables,
    type WebhookEvent,
} from "@/lib/webhooks";

export const runtime = "nodejs";

const VALID_EVENTS: WebhookEvent[] = ["page_view", "rating"];

// GET /api/webhooks - List all webhook endpoints for the user
export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check entitlement
    const plan = await getUserPlan(userId);
    if (!hasFeature(plan, "webhooks")) {
        return NextResponse.json(
            { error: "Webhooks require Pro plan or higher" },
            { status: 403 }
        );
    }

    try {
        await ensureWebhookTables();
        const endpoints = await listWebhookEndpoints(userId);

        // Don't expose secrets in list view
        const safeEndpoints = endpoints.map((e) => ({
            ...e,
            secret: undefined,
            secretPreview: e.secret.slice(0, 8) + "...",
        }));

        return NextResponse.json({ ok: true, endpoints: safeEndpoints });
    } catch (error) {
        console.error("[webhooks] List error:", error);
        return NextResponse.json({ error: "Failed to list webhooks" }, { status: 500 });
    }
}

// POST /api/webhooks - Create a new webhook endpoint
export async function POST(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check entitlement
    const plan = await getUserPlan(userId);
    if (!hasFeature(plan, "webhooks")) {
        return NextResponse.json(
            { error: "Webhooks require Pro plan or higher" },
            { status: 403 }
        );
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, url, events } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.length > 100) {
        return NextResponse.json({ error: "Name is required (max 100 chars)" }, { status: 400 });
    }

    // Validate URL
    if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Invalid protocol");
        }
    } catch {
        return NextResponse.json({ error: "Invalid URL - must be http or https" }, { status: 400 });
    }

    // Validate events
    if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: "At least one event is required" }, { status: 400 });
    }

    const validEvents = events.filter((e): e is WebhookEvent => VALID_EVENTS.includes(e));
    if (validEvents.length === 0) {
        return NextResponse.json(
            { error: `Invalid events. Valid: ${VALID_EVENTS.join(", ")}` },
            { status: 400 }
        );
    }

    try {
        await ensureWebhookTables();

        // Limit to 10 endpoints per user
        const existing = await listWebhookEndpoints(userId);
        if (existing.length >= 10) {
            return NextResponse.json(
                { error: "Maximum 10 webhook endpoints allowed" },
                { status: 400 }
            );
        }

        const endpoint = await createWebhookEndpoint(userId, name, url, validEvents);

        return NextResponse.json({
            ok: true,
            endpoint: {
                ...endpoint,
                // Only show secret on creation
            },
        });
    } catch (error) {
        console.error("[webhooks] Create error:", error);
        return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
    }
}
