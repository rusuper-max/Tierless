// src/app/dashboard/integrations/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { Code, ExternalLink } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n/server";
import { hasFeature, coercePlan } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IntegrationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/integrations");

  const canEmbed = hasFeature(coercePlan(user.plan), "canEmbed");

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t("Integrations")}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {t("Connect your calculator to third-party services and workflows.")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Code Embed - Active */}
        <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--brand-1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 blur-2xl -z-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                <Code className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-[var(--text)] flex items-center gap-2">
                  {t("Code Embed")}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {t("Active")}
                  </span>
                  {!canEmbed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-400 px-1.5 py-0.5 rounded">
                      Growth+
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {t("Embed your price list or calculator on any website using an iframe or JavaScript widget. Customize theme, hide badge, and more.")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {canEmbed ? (
                <p className="text-xs text-[var(--muted)]">
                  {t("Open any calculator in the editor and click Share → Embed code to generate your embed.")}
                </p>
              ) : (
                <Link
                  href="/start"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                  {t("Upgrade to Growth")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stripe Checkout - Coming Soon */}
        <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--brand-1)]">
          <div className="font-medium text-[var(--text)] flex items-center gap-2">
            Stripe Checkout
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-1)] bg-[var(--brand-1)]/10 px-1.5 py-0.5 rounded">{t("Coming Soon")}</span>
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

        {/* Webhooks - Active (Pro+) */}
        <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--brand-1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 blur-2xl -z-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                <Code className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-[var(--text)] flex items-center gap-2">
                  Webhooks
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {t("Active")}
                  </span>
                  {!hasFeature(coercePlan(user.plan), "webhooks") && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-400 px-1.5 py-0.5 rounded">
                      Pro+
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {t("Send real-time notifications when visitors view your pages or leave ratings. Connect to Zapier, Make.com, or your own backend.")}
            </p>
            <div className="mt-4">
              {hasFeature(coercePlan(user.plan), "webhooks") ? (
                <Link
                  href="/dashboard/integrations/webhooks"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                  {t("Configure Webhooks")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/start"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                  {t("Upgrade to Pro")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
