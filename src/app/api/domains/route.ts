/**
 * Custom Domains API
 * 
 * GET  - List user's domains
 * POST - Add a new domain
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserPlan } from "@/lib/auth";
import { getLimit } from "@/lib/entitlements";
import {
    getUserDomains,
    addDomain,
    countUserDomains,
    getVerificationRecord,
} from "@/lib/domains";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/domains - List user's domains
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const domains = await getUserDomains(userId);
        return NextResponse.json({
            domains: domains.map((d) => ({
                id: d.id,
                domain: d.domain,
                slug: d.slug,
                verified: d.verified,
                verifiedAt: d.verifiedAt?.toISOString() || null,
                sslStatus: d.sslStatus,
                createdAt: d.createdAt.toISOString(),
                // Include verification record for unverified domains
                verification: !d.verified
                    ? getVerificationRecord(d.domain, d.verificationToken)
                    : null,
            })),
        });
    } catch (err) {
        console.error("[API] GET /api/domains error:", err);
        return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/domains - Add a new domain
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { domain, slug } = body;

        if (!domain || typeof domain !== "string") {
            return NextResponse.json({ error: "Domain is required" }, { status: 400 });
        }

        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        // Check entitlement
        const plan = await getUserPlan(userId);
        const maxDomains = getLimit(plan, "customDomains");
        const currentCount = await countUserDomains(userId);

        if (maxDomains !== "unlimited" && currentCount >= maxDomains) {
            return NextResponse.json(
                {
                    error: "Domain limit reached",
                    message: `Your ${plan} plan allows ${maxDomains} custom domain(s). Upgrade to add more.`,
                },
                { status: 403 }
            );
        }

        // Add the domain
        const newDomain = await addDomain(userId, domain, slug);

        return NextResponse.json({
            domain: {
                id: newDomain.id,
                domain: newDomain.domain,
                slug: newDomain.slug,
                verified: newDomain.verified,
                createdAt: newDomain.createdAt.toISOString(),
                verification: getVerificationRecord(newDomain.domain, newDomain.verificationToken),
            },
        });
    } catch (err: any) {
        console.error("[API] POST /api/domains error:", err);

        // Handle unique constraint violation
        if (err.code === "23505") {
            return NextResponse.json(
                { error: "Domain already registered" },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
    }
}
