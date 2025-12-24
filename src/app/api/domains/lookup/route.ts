/**
 * Internal API for domain lookup
 * 
 * Called by middleware (Edge runtime) to look up custom domains.
 * This route runs in Node.js runtime and can access the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSlugFromDomain } from "@/lib/domains";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    // Only allow internal requests
    const isInternal = req.headers.get("x-internal") === "1";
    if (!isInternal) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const domain = req.nextUrl.searchParams.get("domain");
    if (!domain) {
        return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    try {
        const slug = await getSlugFromDomain(domain);
        if (!slug) {
            return NextResponse.json({ slug: null });
        }
        return NextResponse.json({ slug });
    } catch (err) {
        console.error("[API] Domain lookup error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
