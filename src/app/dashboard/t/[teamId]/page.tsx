
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
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

    // We could do a server-side permission check here too to avoid loading the client
    // if not allowed, but the API will handle it securely. 
    // For UX, the client component handles 403s nicely if needed, 
    // or we can let the API call fail and show empty state.

    return <DashboardPageClient teamId={teamId} />;
}
