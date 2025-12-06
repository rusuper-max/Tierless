import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getTeamById } from "@/lib/db";
import { requireTeamMember } from "@/lib/permissions";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { teamId } = await params;
    if (!teamId) {
        return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    // Verify user has access to this team
    const perm = await requireTeamMember(userId, teamId, "viewer");
    if (!perm.allowed) {
        return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team });
}
