"use server";

import { revalidatePath } from "next/cache";
import { getUserIdFromRequest, getUserPlan } from "@/lib/auth";
import { headers } from "next/headers";
import * as db from "@/lib/db";
import { requireTeamMember } from "@/lib/permissions";
import { getSessionUser } from "@/lib/auth";
import { getLimit } from "@/lib/entitlements";
import { sendTeamInviteEmail } from "@/lib/email";

async function getUser() {
    const user = await getSessionUser();
    return user?.email;
}

export async function getMyTeams() {
    const userId = await getUser();
    if (!userId) return [];
    return await db.getUserTeams(userId);
}

export async function createTeamAction(name: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    // Check plan limits FIRST (server-side enforcement)
    const plan = await getUserPlan(userId);
    const teamsOwnedLimit = getLimit(plan, "teamsOwned");
    const canCreate = await db.canUserCreateTeam(userId, teamsOwnedLimit);
    
    if (!canCreate.allowed) {
        if (teamsOwnedLimit === 0) {
            return { error: "Upgrade to Starter plan to create teams." };
        }
        return { error: `Team limit reached (${canCreate.current}/${canCreate.limit}). Upgrade your plan to create more teams.` };
    }

    if (!name || name.length < 3) {
        return { error: "Team name must be at least 3 characters" };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (slug.length < 3) {
        return { error: "Generated slug is too short. Try a different name." };
    }

    try {
        await db.createTeam(name, slug, userId);
        revalidatePath("/dashboard/teams");
        return { success: true, slug };
    } catch (e: any) {
        console.error("createTeam error:", e);
        if (e.code === '23505') { // Unique violation
            return { error: "Team with this identifier already exists." };
        }
        return { error: "Failed to create team" };
    }
}

export async function inviteMember(teamId: string, email: string, role: db.TeamRole) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    // Permission check: Need admin or owner
    const perm = await requireTeamMember(userId, teamId, "admin");
    if (!perm.allowed) return { error: perm.reason };

    // Check team exists
    const team = await db.getTeamById(teamId);
    if (!team) return { error: "Team not found" };

    // Check if user is already a member
    const members = await db.getTeamMembers(teamId);
    const existingMember = members.find(m => m.user_id.toLowerCase() === email.toLowerCase());
    if (existingMember) {
        return { error: "This user is already a team member" };
    }

    // Check if there's already a pending invite for this email
    const pendingInvites = await db.getInvitesForTeam(teamId);
    const existingInvite = pendingInvites.find(i => i.email.toLowerCase() === email.toLowerCase());
    if (existingInvite) {
        return { error: "An invitation has already been sent to this email" };
    }

    // Check team seat limit before inviting
    const ownerPlan = await getUserPlan(team.owner_id);
    const seatLimit = getLimit(ownerPlan, "teamSeats");

    if (seatLimit !== "unlimited") {
        const currentSeats = members.length + pendingInvites.length;

        if (currentSeats >= seatLimit) {
            return {
                error: `Team seat limit reached (${currentSeats}/${seatLimit}). The team owner needs to upgrade their plan to add more members.`
            };
        }
    }

    try {
        await db.createTeamInvite(teamId, email, role, userId);

        // Send invite email (non-blocking - don't fail invite if email fails)
        sendTeamInviteEmail({
            toEmail: email,
            teamName: team.name,
            role,
            inviterEmail: userId,
        }).catch((err) => {
            console.error("[inviteMember] Failed to send invite email:", err);
        });

        revalidatePath(`/dashboard/t/${teamId}/settings/members`);
        return { success: true };
    } catch (e) {
        console.error("inviteMember error:", e);
        return { error: "Failed to invite member" };
    }
}

export async function removeMember(teamId: string, targetUserId: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    // Permission check: Need admin or owner
    const perm = await requireTeamMember(userId, teamId, "admin");
    if (!perm.allowed) return { error: perm.reason };

    // Self-removal guard (optional, but good UX)
    // if (userId === targetUserId) ... allow leaving? 
    // For now, let's allow it, but maybe owner specific check?
    // Owners cannot be removed unless ownership transferred.

    const targetRole = await db.getUserTeamRole(targetUserId, teamId);
    if (targetRole === 'owner') {
        return { error: "Cannot remove the team owner. Transfer ownership first." };
    }

    try {
        await db.removeTeamMember(teamId, targetUserId);
        revalidatePath(`/dashboard/t/${teamId}/settings/members`);
        return { success: true };
    } catch (e) {
        console.error("removeMember error:", e);
        return { error: "Failed to remove member" };
    }
}

export async function deleteTeam(teamId: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    const perm = await requireTeamMember(userId, teamId, "owner");
    if (!perm.allowed) return { error: "Only the owner can delete a team." };

    try {
        await db.deleteTeam(teamId);
        revalidatePath("/dashboard/teams");
        return { success: true };
    } catch (e) {
        console.error("deleteTeam error:", e);
        return { error: "Failed to delete team" };
    }
}

export async function renameTeam(teamId: string, newName: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    const perm = await requireTeamMember(userId, teamId, "admin");
    if (!perm.allowed) return { error: "Insufficient permissions" };

    if (!newName || newName.length < 3) return { error: "Name too short" };

    try {
        await db.updateTeamName(teamId, newName);
        revalidatePath(`/dashboard/t/${teamId}/settings`);
        revalidatePath("/dashboard/teams");
        return { success: true };
    } catch (e) {
        console.error("renameTeam error:", e);
        return { error: "Failed to rename team" };
    }
}

export async function updateMemberRole(teamId: string, targetUserId: string, newRole: db.TeamRole) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    // Permission check: Need admin or owner
    const perm = await requireTeamMember(userId, teamId, "admin");
    if (!perm.allowed) return { error: perm.reason };

    // Cannot change owner role directly
    const targetCurrentRole = await db.getUserTeamRole(targetUserId, teamId);
    if (targetCurrentRole === 'owner') {
        return { error: "Cannot change role of the team owner." };
    }

    try {
        await db.updateTeamMemberRole(teamId, targetUserId, newRole);
        revalidatePath(`/dashboard/t/${teamId}/settings/members`);
        return { success: true };
    } catch (e) {
        console.error("updateMemberRole error:", e);
        return { error: "Failed to update role" };
    }
}

export async function acceptInviteAction(inviteId: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    // Check membership limits before accepting
    const plan = await getUserPlan(userId);
    const teamsMemberLimit = getLimit(plan, "teamsMember");
    const canJoin = await db.canUserJoinTeam(userId, teamsMemberLimit);
    
    if (!canJoin.allowed) {
        return { 
            error: `You've reached your team membership limit (${canJoin.current}/${canJoin.limit}). Upgrade your plan to join more teams.` 
        };
    }

    try {
        const success = await db.acceptTeamInvite(inviteId, userId);
        if (!success) {
            return { error: "Invite not found or expired" };
        }
        revalidatePath("/dashboard/teams");
        return { success: true };
    } catch (e) {
        console.error("acceptInvite error:", e);
        return { error: "Failed to accept invite" };
    }
}

export async function declineInviteAction(inviteId: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    try {
        const pool = (await import("@/lib/db")).getPool();
        await pool.query(
            `DELETE FROM team_invites WHERE id = $1`,
            [inviteId]
        );
        return { success: true };
    } catch (e) {
        console.error("declineInvite error:", e);
        return { error: "Failed to decline invite" };
    }
}

export async function cancelInviteAction(teamId: string, inviteId: string) {
    const userId = await getUser();
    if (!userId) return { error: "Not authenticated" };

    // Permission check: Need admin or owner to cancel invites
    const perm = await requireTeamMember(userId, teamId, "admin");
    if (!perm.allowed) return { error: perm.reason };

    try {
        const pool = db.getPool();
        await pool.query(
            `DELETE FROM team_invites WHERE id = $1 AND team_id = $2`,
            [inviteId, teamId]
        );
        revalidatePath(`/dashboard/t/${teamId}/settings/members`);
        return { success: true };
    } catch (e) {
        console.error("cancelInvite error:", e);
        return { error: "Failed to cancel invite" };
    }
}
