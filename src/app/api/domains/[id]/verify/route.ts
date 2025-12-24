/**
 * Domain Verification API
 * 
 * POST - Verify domain DNS record and mark as verified
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import {
    getDomainById,
    verifyDomainDns,
    markDomainVerified,
} from "@/lib/domains";

interface Params {
    params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/domains/[id]/verify - Verify domain DNS record
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Get the domain
        const domain = await getDomainById(id, userId);
        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        // Already verified?
        if (domain.verified) {
            return NextResponse.json({
                verified: true,
                message: "Domain is already verified",
            });
        }

        // Check DNS
        const isVerified = await verifyDomainDns(domain.domain, domain.verificationToken);

        if (isVerified) {
            await markDomainVerified(id, userId);
            return NextResponse.json({
                verified: true,
                message: "Domain verified successfully! Your custom domain is now active.",
            });
        }

        return NextResponse.json({
            verified: false,
            message: "TXT record not found. Please add the record and wait a few minutes for DNS propagation.",
            expectedRecord: {
                name: `_tierless.${domain.domain}`,
                value: `tierless-verify=${domain.verificationToken}`,
                type: "TXT",
            },
        });
    } catch (err) {
        console.error("[API] POST /api/domains/[id]/verify error:", err);
        return NextResponse.json(
            { error: "Failed to verify domain" },
            { status: 500 }
        );
    }
}
