
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserTeams } from "@/lib/db";
import DashboardPageClient from "../../page.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ teamId: string }>;
};

export default async function TeamDashboardPage({ params }: Props) {
    const user = await getSessionUser();
    if (!user) redirect("/signin?next=/dashboard");

    const { teamId } = await params;

    // Get team info to pass to client
    const teams = await getUserTeams(user.email);
    const team = teams.find(t => t.id === teamId);

    if (!team) {
        redirect("/dashboard");
    }

    return (
        <DashboardPageClient
            teamId={teamId}
            teamName={team.name}
            teamRole={team.role}
        />
    );
}
