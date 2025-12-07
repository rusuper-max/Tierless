// src/app/dashboard/integrations/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n/server";

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
          {t("Connect your calculator to third-party services and workflows.")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--brand-1)]">
          <div className="font-medium text-[var(--text)] flex items-center gap-2">
            Stripe Checkout
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-1)] bg-[var(--brand-1)]/10 px-1.5 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            {t("Accept payments directly from your calculators via Stripe Connect. Perfect for selling services or digital products.")}
          </p>
          <div className="mt-4">
            <button className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] text-sm font-medium cursor-not-allowed opacity-60" disabled>
              {t("Join Waitlist")}
            </button>
          </div>
        </div>

        <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--brand-1)]">
          <div className="font-medium text-[var(--text)] flex items-center gap-2">
            Webhooks
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-1)] bg-[var(--brand-1)]/10 px-1.5 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            {t("Send calculation data to your backend or automation tools like Zapier and Make.com in real-time.")}
          </p>
          <div className="mt-4">
            <button className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] text-sm font-medium cursor-not-allowed opacity-60" disabled>
              {t("Join Waitlist")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
