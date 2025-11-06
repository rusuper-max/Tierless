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

      {/* Plan controls (client-side fetch, no full page reload) */}
      <div className="card p-6 space-y-3 text-sm" id="tl-plan-card">
        <div className="flex items-center justify-between gap-3">
          <b>{t("Plan")}</b>
          <span id="tl-plan-status" className="text-xs text-neutral-500" />
        </div>
        <div id="tl-plan-controls" className="flex flex-wrap gap-2">
          <button data-plan="starter" className="btn btn-sm">Starter</button>
          <button data-plan="growth"  className="btn btn-sm">Growth</button>
          <button data-plan="pro"     className="btn btn-sm">Pro</button>
        </div>
      </div>

      {/* Inline script to wire up plan change without converting the page to a client component */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
            const root = document.getElementById('tl-plan-controls');
            const statusEl = document.getElementById('tl-plan-status');
            if (!root) return;
            const setStatus = (msg, ok=true) => {
              if (!statusEl) return;
              statusEl.textContent = msg || '';
              statusEl.style.color = ok ? 'inherit' : '#ef4444';
            };
            root.addEventListener('click', async (e) => {
              const el = e.target && (e.target as HTMLElement).closest('[data-plan]');
              if (!el) return;
              e.preventDefault();
              const plan = (el as HTMLElement).getAttribute('data-plan');
              if (!plan) return;
              try {
                setStatus('Saving…');
                const res = await fetch('/api/me/plan', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ plan })
                });
                const txt = await res.text();
                if (!res.ok) {
                  setStatus('Error: ' + txt, false);
                  return;
                }
                // Notify the app (useAccount listens for this) and show success
                try { window.dispatchEvent(new Event('TL_AUTH_CHANGED')); } catch {}
                setStatus('Saved');
                // Optional: clear status after a moment
                setTimeout(() => setStatus(''), 1200);
              } catch (err) {
                setStatus('Network error', false);
              }
            });
          })();`
        }}
      />
    </main>
  );
}