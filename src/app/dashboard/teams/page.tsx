
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, getUserPlan } from "@/lib/auth";
import { t } from "@/i18n";
import { getUserTeams, ensureTeamsTables, canUserCreateTeam, getInvitesForEmail } from "@/lib/db";
import { getLimit } from "@/lib/entitlements";
import { Users, Mail, ArrowRight } from "lucide-react";
import { CreateTeamModal } from "./CreateTeamModal";
import { Button } from "@/components/ui/Button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] mb-6">
                        <Users className="h-8 w-8 text-[var(--muted)]" />
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <Link
                            key={team.id}
                            href={`/dashboard/t/${team.id}`}
                            className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:bg-[var(--surface)] hover:shadow-md transition-all duration-200 block"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-[var(--text)] text-lg mb-1 transition-colors">{team.name}</h3>
                                    <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${team.role === "owner"
                                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            }`}>
                                            {team.role}
                                        </span>
                                        <span>•</span>
                                        <span>Joined {new Date(team.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] opacity-10 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                                    <span className="text-[var(--brand-1)] font-bold text-lg">{team.name.substring(0, 1).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
                                <span>View Dashboard</span>
                                <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 transform duration-200" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
