// src/app/dashboard/account/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { t } from "@/i18n";
import { Button } from "@/components/ui/Button";

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
          <Button variant="neutral" size="xs" data-plan="starter">Starter</Button>
          <Button variant="neutral" size="xs" data-plan="growth">Growth</Button>
          <Button variant="neutral" size="xs" data-plan="pro">Pro</Button>
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

  function setStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.style.color = ok ? 'inherit' : '#ef4444';
  }

  root.addEventListener('click', async function (e) {
    const target = e && e.target ? e.target : null;
    const el = target && typeof target.closest === 'function' ? target.closest('[data-plan]') : null;
    if (!el) return;
    e.preventDefault();

    const plan = el.getAttribute('data-plan');
    if (!plan) return;

    try {
      setStatus('Saving…');
      const res = await fetch('/api/me/plan', {
        method: 'PUT',
        credentials: 'same-origin', // ensure cookies are sent
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });

      const txt = await res.text();
      if (!res.ok) {
        setStatus('Error: ' + txt, false);
        return;
      }

      try { window.dispatchEvent(new Event('TL_AUTH_CHANGED')); } catch {}
      setStatus('Saved');
      setTimeout(() => setStatus(''), 1200);
    } catch (_err) {
      setStatus('Network error', false);
    }
  });
})();`
        }}
      />
    </main>
  );
}