import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getInvitesForEmailWithDetails } from "@/lib/db";
import { t } from "@/i18n";
import { Mail, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { acceptInviteAction, declineInviteAction } from "@/actions/teams";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InvitesPage() {
    const user = await getSessionUser();
    if (!user) redirect("/signin?next=/dashboard/invites");

    const invites = await getInvitesForEmailWithDetails(user.email);

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <header>
                <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-2">
                    <Link href="/dashboard/teams" className="hover:text-[var(--brand-1)] transition-colors">
                        {t("Teams")}
                    </Link>
                    <span>/</span>
                    <span>{t("Invites")}</span>
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)]">{t("Team Invitations")}</h1>
                <p className="text-sm text-[var(--muted)] mt-1">
                    {t("Accept or decline invitations to join teams.")}
                </p>
            </header>

            {invites.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center flex flex-col items-center justify-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] mb-6">
                        <Mail className="h-8 w-8 text-[var(--muted)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{t("No pending invitations")}</h3>
                    <p className="text-sm text-[var(--muted)] max-w-sm mx-auto mb-8 leading-relaxed">
                        {t("When someone invites you to join their team, you'll see the invitation here.")}
                    </p>
                    <Link
                        href="/dashboard/teams"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-1)] hover:underline"
                    >
                        <Users className="h-4 w-4" />
                        {t("View your teams")}
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {invites.map((invite) => {
                        const daysUntilExpiry = Math.ceil((invite.expires_at - Date.now()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysUntilExpiry <= 2;

                        return (
                            <div
                                key={invite.id}
                                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--brand-1)] transition-all duration-200"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">
                                                    {invite.team_name.substring(0, 1).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[var(--text)] text-lg">
                                                    {invite.team_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                                                        invite.role === "admin"
                                                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                                            : invite.role === "editor"
                                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                    }`}>
                                                        {invite.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-[var(--muted)] mt-3">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {t("Invited by")} {invite.invited_by}
                                            </span>
                                            <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-amber-600 dark:text-amber-400" : ""}`}>
                                                <Clock className="h-3 w-3" />
                                                {daysUntilExpiry <= 0
                                                    ? t("Expires today")
                                                    : daysUntilExpiry === 1
                                                    ? t("Expires tomorrow")
                                                    : t("Expires in {{days}} days", { days: daysUntilExpiry })
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <form action={async () => {
                                            "use server";
                                            await declineInviteAction(invite.id);
                                            revalidatePath("/dashboard/invites");
                                        }}>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--card)] hover:border-red-300 hover:text-red-600 transition-all duration-200"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                {t("Decline")}
                                            </button>
                                        </form>
                                        <form action={async () => {
                                            "use server";
                                            const result = await acceptInviteAction(invite.id);
                                            if (result.success) {
                                                revalidatePath("/dashboard/invites");
                                                revalidatePath("/dashboard/teams");
                                            }
                                        }}>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-all duration-200"
                                                style={{
                                                    background: "linear-gradient(90deg, var(--brand-1, #4F46E5), var(--brand-2, #22D3EE))"
                                                }}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                {t("Accept")}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
