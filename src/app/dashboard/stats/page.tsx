// src/app/dashboard/stats/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StatsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/stats");

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{t("Stats")}</h1>
        <p className="text-xs text-neutral-500">
          {t("Traffic, conversions and orders overview (stub).")}
        </p>
      </header>

      <div className="card p-6">
        <p className="text-sm text-neutral-600">
          {t("This is a placeholder. We will add charts (visits, CTR, leads, checkouts) and filters (day/week/month).")}
        </p>
      </div>
    </main>
  );
}