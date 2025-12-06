
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";
import { getUserTeams, ensureTeamsTables, createTeam } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Plus, Users } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
    const user = await getSessionUser();
    if (!user) redirect("/signin?next=/dashboard/teams");

    // Ensure tables exist before trying to fetch
    await ensureTeamsTables();

    const teams = await getUserTeams(user.email);

    // Server Action for creating a team (simple stub for now)
    async function handleCreateTeam(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        if (!name || !user) return;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await createTeam(name, slug, user.email);
        redirect("/dashboard/teams");
    }

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">{t("Teams")}</h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        {t("Collaborate with your team members.")}
                    </p>
                </div>

                {/* Simple Create Team Form (Temporary until modal/dedicated page) */}
                <form action={handleCreateTeam} className="flex gap-2">
                    <input
                        type="text"
                        name="name"
                        placeholder="New Team Name"
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--brand-1)]"
                        required
                    />
                    <Button size="sm" variant="brand">
                        <Plus className="w-4 h-4 mr-1.5" />
                        {t("Create Team")}
                    </Button>
                </form>
            </header>

            {teams.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] mb-4">
                        <Users className="h-6 w-6 text-[var(--muted)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text)]">{t("No teams yet")}</h3>
                    <p className="text-sm text-[var(--muted)] mt-1 max-w-sm mx-auto">
                        {t("Create a team to start sharing your calculators and collaborating with others.")}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <div key={team.id} className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--brand-1)] transition-colors">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-[var(--text)]">{team.name}</h3>
                                    <div className="text-xs text-[var(--muted)] mt-1">
                                        {team.role === "owner" ? "Owner" : "Member"} · {new Date(team.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] opacity-10 group-hover:opacity-20 transition-opacity" />
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs">
                                <span className="text-[var(--muted)]">0 members</span>
                                <Link href={`/dashboard/teams/${team.id}`} className="font-medium text-[var(--brand-1)] hover:underline">
                                    {t("Manage")} &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
