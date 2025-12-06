// src/app/dashboard/settings/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";
import { getPool } from "@/lib/db";
import SettingsForm from "@/components/dashboard/SettingsForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/settings");

  // Fetch user profile
  const pool = getPool();
  // Using email as user_id for now as per auth system conventions observed
  const { rows } = await pool.query(
    "SELECT business_name, website, currency FROM user_profiles WHERE user_id = $1",
    [user.email]
  );

  const profile = rows[0] || { businessName: null, website: null, currency: "USD" };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t("Settings")}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {t("Manage your workspace preferences.")}
        </p>
      </header>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <SettingsForm initialProfile={{ ...profile, email: user.email }} />
      </div>
    </main>
  );
}