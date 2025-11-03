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
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{t("Settings")}</h1>
        <p className="text-xs text-neutral-500">
          {t("Workspace preferences (stub).")}
        </p>
      </header>

      <div className="card p-6">
        <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
          <li>{t("Default currency")}</li>
          <li>{t("Default page template")}</li>
          <li>{t("Time zone & locale")}</li>
        </ul>
      </div>
    </main>
  );
}