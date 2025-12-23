import { NextRequest, NextResponse } from "next/server";
import { getVoterIdentity, ensureVoterCookie } from "@/lib/voter";
import { upsertRating } from "@/lib/ratingsStore";
import { findMiniInAllUsers } from "@/lib/calcsStore";
import * as fullStore from "@/lib/fullStore";
import { checkRateLimit, getClientIP, rateLimitHeaders, RATING_LIMIT } from "@/lib/rateLimit";
import { dispatchWebhooks } from "@/lib/webhookDispatcher";

export async function POST(req: NextRequest) {
    try {
        // Rate Limiting - 10 ratings per minute per IP
        const clientIP = getClientIP(req);
        const rateResult = checkRateLimit(clientIP, RATING_LIMIT);

        if (!rateResult.success) {
            return NextResponse.json(
                { error: "Too many rating requests. Please slow down." },
                { status: 429, headers: rateLimitHeaders(rateResult) }
            );
        }

        const body = await req.json();
        const { pageId, score } = body;

        if (!pageId || typeof pageId !== "string") {
            return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
        }
        if (typeof score !== "number" || score < 1 || score > 5) {
            return NextResponse.json({ error: "Invalid score (1-5)" }, { status: 400 });
        }

        // 1. Verify page exists
        const calc = await findMiniInAllUsers(pageId);
        if (!calc) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // 2. Get full calculator data to check allowRating
        // We need the user_id to fetch from fullStore, but findMiniInAllUsers doesn't return it
        // Let me fetch it directly from the calculators table
        const { getPool } = await import("@/lib/db");
        const pool = getPool();
        const { rows } = await pool.query(
            `SELECT user_id, slug, config FROM calculators WHERE slug = $1 LIMIT 1`,
            [pageId]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        const calcUserId = rows[0].user_id;
        const fullCalc = await fullStore.getFull(calcUserId, pageId);

        console.log("[Rating API] fullCalc?.meta:", fullCalc?.meta);
        console.log("[Rating API] fullCalc?.meta?.allowRating:", fullCalc?.meta?.allowRating);

        const allowRating = fullCalc?.meta?.allowRating === true;

        if (!allowRating) {
            return NextResponse.json({ error: "Rating not allowed" }, { status: 422 });
        }

        // 2. Get voter identity
        const { voterKey, userId, ipHash } = await getVoterIdentity(req);

        // 3. Rate limit (simple debounce check could go here, skipping for now as per "minimal" instruction, 
        // relying on upsert to handle duplicates/updates)

        // 4. Upsert rating
        const result = await upsertRating(pageId, voterKey, score, ipHash, userId);

        // 5. Dispatch webhook (fire-and-forget)
        dispatchWebhooks(calcUserId, "rating", {
            pageId,
            slug: pageId,
            score,
            voterKey,
            isUpdate: (result as any).updated ?? false,
            timestamp: Date.now(),
        }).catch((err) => {
            console.error("[webhooks] Rating dispatch error:", err);
        });

        // 6. Return response with cookie if needed
        const res = NextResponse.json({ ok: true, ...result });

        // If user is anonymous, ensure they get the cookie
        if (!userId) {
            ensureVoterCookie(res.headers, voterKey);
        }

        return res;
    } catch (err) {
        console.error("Rating POST error:", err);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
