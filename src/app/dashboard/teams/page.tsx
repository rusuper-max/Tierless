
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, getUserPlan } from "@/lib/auth";
import { t } from "@/i18n/server";
import { getUserTeams, ensureTeamsTables, canUserCreateTeam, getInvitesForEmail } from "@/lib/db";
import { getLimit } from "@/lib/entitlements";
import { Users, Mail, ArrowRight, Crown, Shield, Pencil, Eye } from "lucide-react";
import { CreateTeamModal } from "./CreateTeamModal";
import { Button } from "@/components/ui/Button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleConfig = {
    owner: {
        label: "Owner",
        icon: Crown,
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
    },
    admin: {
        label: "Admin",
        icon: Shield,
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-300",
        border: "border-indigo-200 dark:border-indigo-800",
    },
    editor: {
        label: "Editor",
        icon: Pencil,
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-800",
    },
    viewer: {
        label: "Viewer",
        icon: Eye,
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-200 dark:border-slate-700",
    },
};

// Generate consistent color from team name
function getTeamGradient(name: string): string {
    const gradients = [
        "from-indigo-500 to-purple-500",
        "from-cyan-500 to-blue-500",
        "from-emerald-500 to-teal-500",
        "from-orange-500 to-red-500",
        "from-pink-500 to-rose-500",
        "from-violet-500 to-indigo-500",
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
}

export default async function TeamsPage() {
    const user = await getSessionUser();
    if (!user) redirect("/signin?next=/dashboard/teams");

    // Ensure tables exist before trying to fetch
    await ensureTeamsTables();

    const [teams, plan, invites] = await Promise.all([
        getUserTeams(user.email),
        getUserPlan(user.email),
        getInvitesForEmail(user.email)
    ]);

    // Check team creation limits
    const teamsOwnedLimit = getLimit(plan, "teamsOwned");
    const createCheck = await canUserCreateTeam(user.email, teamsOwnedLimit);

    const limitInfo = {
        canCreate: createCheck.allowed,
        current: createCheck.current,
        limit: createCheck.limit,
        requiredPlan: teamsOwnedLimit === 0 ? "starter" : "growth",
    };

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Pending Invites Banner */}
            {invites.length > 0 && (
                <Link
                    href="/dashboard/invites"
                    className="group flex items-center justify-between gap-4 rounded-xl p-4 text-white transition-all duration-200 hover:scale-[1.01]"
                    style={{
                        background: "linear-gradient(90deg, var(--brand-1, #4F46E5), var(--brand-2, #22D3EE))"
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold">
                                {invites.length === 1
                                    ? t("You have 1 pending team invitation")
                                    : t("You have {{count}} pending team invitations", { count: invites.length })
                                }
                            </p>
                            <p className="text-sm text-white/80">{t("Click to view and respond")}</p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
            )}

            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">{t("Teams")}</h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        {t("Manage your teams and collaborate on calculators.")}
                    </p>
                </div>

                <CreateTeamModal limitInfo={limitInfo} />
            </header>

            {teams.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center flex flex-col items-center justify-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 dark:from-indigo-900/30 dark:to-cyan-900/30 mb-6">
                        <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{t("No teams yet")}</h3>
                    <p className="text-sm text-[var(--muted)] max-w-sm mx-auto mb-8 leading-relaxed">
                        {t("Teams allow you to organize calculators and invite members to collaborate. Create your first team to get started.")}
                    </p>
                    <CreateTeamModal
                        limitInfo={limitInfo}
                        trigger={
                            <Button size="md" variant="brand">
                                Create your first team
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {teams.map((team) => {
                        const role = roleConfig[team.role];
                        const RoleIcon = role.icon;
                        const gradient = getTeamGradient(team.name);

                        return (
                            <Link
                                key={team.id}
                                href={`/dashboard/t/${team.id}`}
                                className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--brand-1)] hover:shadow-lg transition-all duration-200 block overflow-hidden"
                            >
                                {/* Gradient accent line at top */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

                                <div className="flex items-start gap-4">
                                    {/* Team Avatar */}
                                    <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                                        <span className="text-white font-bold text-lg">
                                            {team.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Team Name */}
                                        <h3 className="font-semibold text-[var(--text)] text-lg truncate group-hover:text-[var(--brand-1)] transition-colors">
                                            {team.name}
                                        </h3>

                                        {/* Role Badge */}
                                        <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.bg} ${role.text} border ${role.border}`}>
                                            <RoleIcon className="w-3 h-3" />
                                            {role.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            <span>{team.member_count} {team.member_count === 1 ? 'member' : 'members'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Open</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
