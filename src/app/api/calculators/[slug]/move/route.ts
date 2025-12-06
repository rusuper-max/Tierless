import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as db from "@/lib/db";
import { findCalcBySlug, requireTeamMember } from "@/lib/permissions";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    let body = await req.json().catch(() => ({}));
    const { teamId } = body;

    // Use explicit null for personal workspace, or string for team ID
    // If teamId is undefined in body, it's an error. 
    // If teamId === null, we are moving to personal.

    if (teamId === undefined) {
        return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    // 1. Verify Ownership / Source Permission
    const ownership = await findCalcBySlug(slug);
    if (!ownership) {
        return NextResponse.json({ error: "Calculator not found" }, { status: 404 });
    }

    // Only the OWNER can move a calculator (for now).
    // Even team admins shouldn't move pages they don't own unless we define that logic clearly.
    // Let's restrict to Owner for safety.
    if (ownership.userId !== userId) {
        return NextResponse.json({ error: "Only the owner can move a page." }, { status: 403 });
    }

    // 2. Verify Target Permission
    if (teamId) {
        // Moving TO a team -> Need to be at least Editor
        const perm = await requireTeamMember(userId, teamId, "editor");
        if (!perm.allowed) {
            return NextResponse.json({ error: "You don't have permission to create pages in this team." }, { status: 403 });
        }
    } else {
        // Moving TO Personal -> Always allowed for the owner (since they are moving it back to themselves)
        // No extra check needed.
    }

    // 3. Execute Move
    try {
        await db.assignCalculatorToTeam(userId, slug, teamId || null);
        return NextResponse.json({ success: true, teamId });
    } catch (e) {
        console.error("Move failed:", e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
