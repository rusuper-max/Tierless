
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { requireTeamMember } from "@/lib/permissions";
import { getTeamMembersWithDetails, getInvitesForTeam } from "@/lib/db";
import Link from "next/link";
import { InviteMemberForm } from "./InviteMemberForm";
import { removeMember, cancelInviteAction } from "@/actions/teams";
import { RoleDropdown } from "./MemberActions";
import { Button } from "@/components/ui/Button";

export default async function TeamMembersPage({ params }: { params: Promise<{ teamId: string }> }) {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    const { teamId } = await params;

    // Verify access (admin required to MANAGE members, but maybe viewers can see list? Let's say admins only for now)
    const perm = await requireTeamMember(user.email, teamId, "viewer");
    if (!perm.allowed) redirect("/dashboard");

    // Fetch data
    const members = await getTeamMembersWithDetails(teamId);

    const invites = await getInvitesForTeam(teamId);
    const myRole = members.find(m => m.user_id === user.email)?.role;
    const canManage = myRole === "owner" || myRole === "admin";

    return (
        <div className="container-page max-w-4xl space-y-8 py-8">
            <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <Link href={`/dashboard/t/${teamId}`} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline mb-2 block">
                    &larr; Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage your team&apos;s preferences and members.
                </p>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-slate-200 dark:border-slate-700">
                    <Link
                        href={`/dashboard/t/${teamId}/settings`}
                        className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        General
                    </Link>
                    <Link
                        href={`/dashboard/t/${teamId}/settings/members`}
                        className="pb-3 px-1 text-sm font-medium border-b-2 border-cyan-600 text-cyan-600"
                    >
                        Members
                    </Link>
                </div>
            </header>

            {/* Invite Section */}
            {canManage && (
                <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Invite New Member</h2>
                    <InviteMemberForm teamId={teamId} />
                </div>
            )}

            {/* Members List */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Members ({members.length})</h2>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {members.map((member) => (
                        <div key={member.user_id} className="p-6 flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    {member.name || "Unknown Name"}
                                    <span className="text-slate-400 font-normal text-sm">({member.email || "No Email"})</span>
                                    {member.user_id === user.email && <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full">You</span>}
                                </div>
                                {member.role === 'owner' ? (
                                    <div className="text-sm text-slate-500 capitalize">{member.role}</div>
                                ) : canManage ? (
                                    <RoleDropdown
                                        teamId={teamId}
                                        userId={member.user_id}
                                        currentRole={member.role}
                                    />
                                ) : (
                                    <div className="text-sm text-slate-500 capitalize">{member.role}</div>
                                )}
                            </div>

                            {canManage && member.user_id !== user.email && member.role !== 'owner' && (
                                <form action={async () => {
                                    "use server";
                                    await removeMember(teamId, member.user_id);
                                }}>
                                    <button className="text-sm text-red-600 hover:underline">Remove</button>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pending Invites ({invites.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {invites.map((invite) => (
                            <div key={invite.id} className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">{invite.email}</div>
                                    <div className="text-sm text-slate-500 capitalize">Role: {invite.role} • Expires in {Math.ceil((invite.expires_at - Date.now()) / (1000 * 60 * 60 * 24))} days</div>
                                </div>
                                {canManage && (
                                    <form action={async () => {
                                        "use server";
                                        await cancelInviteAction(teamId, invite.id);
                                    }}>
                                        <Button type="submit" variant="danger" size="sm">Cancel</Button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
