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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t("Integrations")}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {t("Connect Stripe, analytics and webhooks (stub).")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="font-medium text-[var(--text)]">Stripe (Checkout)</div>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t("Accept payments via Stripe Connect (coming soon).")}
          </p>
          <div className="mt-4">
            <button className="px-4 py-2 rounded-lg bg-[var(--surface)] text-[var(--muted)] text-sm font-medium cursor-not-allowed opacity-60" disabled>
              {t("Connect")}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="font-medium text-[var(--text)]">Webhooks</div>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t("Receive events on your backend (coming soon).")}
          </p>
          <div className="mt-4">
            <button className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] text-sm font-medium cursor-not-allowed opacity-60" disabled>
              {t("Configure")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}