// src/app/api/webhooks/[id]/test/route.ts
// API route to send a test webhook

import { NextResponse } from "next/server";
import { getUserIdFromRequest, getUserPlan } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { getWebhookEndpoint } from "@/lib/webhooks";
import { sendTestWebhook } from "@/lib/webhookDispatcher";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

// POST /api/webhooks/[id]/test - Send a test webhook
export async function POST(req: Request, ctx: Context) {
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

        // Send test webhook
        const result = await sendTestWebhook(endpoint);

        return NextResponse.json({
            ok: result.success,
            status: result.status,
            response: result.body,
            message: result.success
                ? "Test webhook sent successfully!"
                : `Test failed: ${result.body || "No response"}`,
        });
    } catch (error) {
        console.error("[webhooks] Test error:", error);
        return NextResponse.json({ error: "Failed to send test webhook" }, { status: 500 });
    }
}
