
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { requireTeamMember } from "@/lib/permissions";
import { getUserTeams, getTeamMembers } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { deleteTeam, removeMember } from "@/actions/teams";
import { AlertTriangle, Trash2 } from "lucide-react";
import { RenameTeamForm } from "./RenameTeamForm";
import Link from "next/link";

export default async function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
    const user = await getSessionUser();
    if (!user) redirect("/signin");

    const { teamId } = await params;

    // Permissions
    const perm = await requireTeamMember(user.email, teamId, "viewer");
    if (!perm.allowed) redirect("/dashboard");

    const teams = await getUserTeams(user.email);
    const thisTeam = teams.find(t => t.id === teamId);
    if (!thisTeam) redirect("/dashboard");

    const role = thisTeam.role;
    const canManage = role === "owner" || role === "admin";
    const isOwner = role === "owner";

    async function handleDelete() {
        "use server";
        await deleteTeam(teamId);
        redirect("/dashboard/teams");
    }

    async function handleLeave() {
        "use server";
        if (user) {
            await removeMember(teamId, user.email);
            redirect("/dashboard/teams");
        }
    }

    return (
        <div className="container-page max-w-4xl space-y-12 py-8">
            <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage your team&apos;s preferences and danger zone.
                </p>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-slate-200 dark:border-slate-700">
                    <Link
                        href={`/dashboard/t/${teamId}/settings`}
                        className="pb-3 px-1 text-sm font-medium border-b-2 border-cyan-600 text-cyan-600"
                    >
                        General
                    </Link>
                    <Link
                        href={`/dashboard/t/${teamId}/settings/members`}
                        className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        Members
                    </Link>
                </div>
            </header>

            {/* General Settings */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">General</h2>
                        <p className="text-sm text-slate-500">Basic team information.</p>
                    </div>
                </div>

                <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl">
                    <RenameTeamForm teamId={teamId} currentName={thisTeam.name} canManage={canManage} />
                </div>
            </section>

            {/* Danger Zone */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Danger Zone
                    </h2>
                    <p className="text-sm text-slate-500">Irreversible actions.</p>
                </div>

                <div className="card border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-xl overflow-hidden divide-y divide-red-200 dark:divide-red-900/30">

                    {/* Leave Team */}
                    {!isOwner && (
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Leave Team</h3>
                                <p className="text-sm text-slate-500">Revoke your access to this team. You will need to be invited again to rejoin.</p>
                            </div>
                            <form action={handleLeave}>
                                <Button variant="danger" size="sm">Leave Team</Button>
                            </form>
                        </div>
                    )}

                    {/* Delete Team */}
                    {isOwner ? (
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Team</h3>
                                <p className="text-sm text-slate-500">Permanently delete this team and all its calculators. This cannot be undone.</p>
                            </div>
                            <form action={handleDelete}>
                                <Button variant="danger" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Team
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-6 opacity-60 cursor-not-allowed">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Delete Team</h3>
                            <p className="text-sm text-slate-500">Only the team owner can delete this team.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
