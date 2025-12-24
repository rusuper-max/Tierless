/**
 * Custom Domain Detail API
 * 
 * GET    - Get domain details
 * DELETE - Remove domain
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getDomainById, removeDomain, getVerificationRecord } from "@/lib/domains";

interface Params {
    params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/domains/[id] - Get domain details
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const domain = await getDomainById(id, userId);
        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        return NextResponse.json({
            domain: {
                id: domain.id,
                domain: domain.domain,
                slug: domain.slug,
                verified: domain.verified,
                verifiedAt: domain.verifiedAt?.toISOString() || null,
                sslStatus: domain.sslStatus,
                createdAt: domain.createdAt.toISOString(),
                verification: !domain.verified
                    ? getVerificationRecord(domain.domain, domain.verificationToken)
                    : null,
            },
        });
    } catch (err) {
        console.error("[API] GET /api/domains/[id] error:", err);
        return NextResponse.json({ error: "Failed to get domain" }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/domains/[id] - Remove domain
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const removed = await removeDomain(id, userId);
        if (!removed) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[API] DELETE /api/domains/[id] error:", err);
        return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 });
    }
}
