// src/app/dashboard/integrations/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IntegrationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/integrations");

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{t("Integrations")}</h1>
        <p className="text-xs text-neutral-500">
          {t("Connect Stripe, analytics and webhooks (stub).")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="font-medium">Stripe (Checkout)</div>
          <p className="text-xs text-neutral-500 mt-1">
            {t("Accept payments via Stripe Connect (coming soon).")}
          </p>
          <div className="mt-3">
            <button className="btn" disabled>{t("Connect")}</button>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-medium">Webhooks</div>
          <p className="text-xs text-neutral-500 mt-1">
            {t("Receive events on your backend (coming soon).")}
          </p>
          <div className="mt-3">
            <button className="btn btn-plain" disabled>{t("Configure")}</button>
          </div>
        </div>
      </div>
    </main>
  );
}