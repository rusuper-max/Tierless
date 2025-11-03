// src/app/dashboard/account/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/account");

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{t("Account")}</h1>
        <p className="text-xs text-neutral-500">
          {t("Profile, billing and security (stub).")}
        </p>
      </header>

      <div className="card p-6 space-y-3 text-sm">
        <div><b>{t("Email")}:</b> {user.email}</div>
        <div className="text-neutral-500">{t("More account settings coming soon.")}</div>
      </div>
    </main>
  );
}