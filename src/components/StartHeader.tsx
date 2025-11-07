"use client";

import { useEffect, useState } from "react";
import CTAButton from "@/components/marketing/CTAButton";
import { Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const update = () => setIsDark(html.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    try { localStorage.setItem("theme", html.classList.contains("dark") ? "dark" : "light"); } catch {}
    try { window.dispatchEvent(new Event("TL_THEME_TOGGLED")); } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
    >
      {isDark ? <Sun className="size-5 text-slate-200" /> : <Moon className="size-5 text-slate-700" />}
    </button>
  );
}

export default function StartHeader() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchAuth = async () => {
      try {
        const st = await fetch("/api/auth/status?ts=" + Date.now(), { credentials: "include", cache: "no-store" }).then(r => r.json());
        if (!cancelled) setAuthed(!!st?.authenticated);
      } catch {}
    };
    fetchAuth();

    // keep in sync if app dispatches auth changes
    const onChanged = () => fetchAuth();
    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);

    return () => {
      cancelled = true;
      window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
    };
  }, []);

  return (
    <div className="fixed top-4 left-0 w-full px-6 flex justify-between items-center z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <CTAButton
          href="/"
          variant="outline"
          size="md"
          pill
          hairlineOutline
          fx="none"
          label="Back to site"
          ariaLabel="Back to site"
        />
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <CTAButton
          href={authed ? "/dashboard" : "/signin"}
          variant="outline"
          size="md"
          pill
          hairlineOutline
          fx="none"
          label={authed ? "Dashboard" : "Sign in"}
          ariaLabel={authed ? "Open dashboard" : "Sign in"}
        />
        <ThemeToggle />
      </div>
      <style jsx global>{`
        /* Minimal CTA styles for pricing header (scoped globally but tiny) */
        .mkt-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;position:relative;z-index:0;isolation:isolate;text-decoration:none;user-select:none;-webkit-tap-highlight-color:transparent;border:1px solid transparent;border-radius:14px;padding:.5rem .8rem;font-weight:600;line-height:1;transition:transform .18s ease,filter .22s ease,box-shadow .22s ease,background .18s ease,color .18s ease}
        .mkt-btn--pill{border-radius:9999px}
        .mkt-btn--md{font-size:.9375rem;padding:.5rem .9rem}
        .mkt-btn--lg{font-size:1rem;padding:.7rem 1.05rem}
        .mkt-btn--sm{font-size:.875rem;padding:.35rem .65rem}
        .mkt-btn--outline{background:linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box;color:#0f172a}
        html.dark .mkt-btn--outline{background:linear-gradient(#0b0b0c,#0b0b0c) padding-box, var(--brand-gradient) border-box;color:#f8fafc}
        .mkt-btn:hover{transform:translateY(-1px)}
        .mkt-btn:active{transform:none}
        .mkt-btn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(99,102,241,.35),0 8px 24px rgba(56,189,248,.18)}
      `}</style>
    </div>
  );
}