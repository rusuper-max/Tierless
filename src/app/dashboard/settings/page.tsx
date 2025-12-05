// src/app/dashboard/settings/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/settings");

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t("Settings")}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {t("Workspace preferences (stub).")}
        </p>
      </header>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--text)] mb-4">{t("Coming Soon")}</h2>
        <ul className="list-disc pl-5 text-sm text-[var(--muted)] space-y-2">
          <li>{t("Default currency")}</li>
          <li>{t("Default page template")}</li>
          <li>{t("Time zone & locale")}</li>
        </ul>
      </div>
    </main>
  );
}