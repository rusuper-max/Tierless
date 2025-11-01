// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

type MeUser = { id: string; isDev?: boolean; name?: string; title?: string };
type MeResp  = { user?: MeUser | null; authenticated?: boolean };
type StatusResp = { authenticated?: boolean; user?: { email?: string } | null };

type NavProps = {
  brandHref?: string;
  showThemeToggle?: boolean; // (nije u upotrebi, zadržano radi kompatibilnosti)
};

export default function Nav({ brandHref = "/", showThemeToggle = true }: NavProps) {
  const [me, setMe] = useState<MeUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef  = useRef<HTMLButtonElement | null>(null);

  // ——— učitaj auth (status → fallback na /api/me), bez keša
  useEffect(() => {
    let alive = true;

    async function load(reason: string) {
      try {
        // 1) Prefer /api/auth/status
        const r = await fetch("/api/auth/status", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { "x-no-cache": String(Date.now()) },
        });

        if (r.ok) {
          const j = (await r.json()) as StatusResp;
          if (j?.authenticated) {
            const email = j.user?.email;
            if (email) {
              if (alive) setMe({ id: email, name: email.split("@")[0] || email });
              return;
            }
            // nema email-a u statusu → fallback na /api/me
          }
        }
      } catch {
        // ignore
      }

      try {
        // 2) Fallback: /api/me
        const r2 = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (r2.ok) {
          const j2 = (await r2.json()) as MeResp;
          if (alive && j2?.user?.id) {
            const id = j2.user.id;
            const name = j2.user.name || id.split("@")[0] || id;
            setMe({ id, name, title: j2.user.title, isDev: j2.user.isDev });
            return;
          }
        }
      } catch {
        // ignore
      }

      if (alive) setMe(null);
    }

    // inicijalno + brzi retry da uhvati sveže kolačiće
    load("mount");
    const t1 = setTimeout(() => load("retry-250"), 250);
    const t2 = setTimeout(() => load("retry-1000"), 1000);

    // reaguj na globalne promene
    const onChanged = () => load("TL_AUTH_CHANGED");
    const onFocus   = () => load("window-focus");
    const onVis     = () => document.visibilityState === "visible" && load("visibility");

    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // ——— zatvaranje menija klikom van/ESC
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const signedIn = !!me?.id;

  const greeting = signedIn ? (
    <>
      Hi, <b>{me?.name || (me?.id?.split("@")[0] || "user")}</b>
      {me?.title ? <> , {me.title}</> : null}
    </>
  ) : null;

  return (
    <div className="sticky top-0 z-[80]">
      <div className="border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 -ml-2 sm:-ml-3">
            {/* Brand: samo slovo T, bez PNG-a */}
            <Link href={brandHref} className="brand-link inline-flex items-center gap-2" aria-label="Tierless — home">
              <span
                className="inline-block select-none"
                style={{
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                  fontSize: "24px",
                  color: "var(--brand-1, #4F46E5)",
                }}
              >
                T
              </span>
              <span className="sr-only">Tierless</span>
            </Link>

            <Link href="/dashboard" className="btn btn-nav btn-plain">Pages</Link>
            <Link href="/templates" className="btn btn-nav btn-plain">Templates</Link>
          </div>

          <div className="flex items-center gap-2 relative">
            {signedIn ? (
              <>
                <span className="text-xs text-neutral-500 hidden sm:flex items-center gap-1">
                  {greeting}
                </span>

                <button
                  ref={btnRef}
                  className="btn btn-nav btn-plain"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  Account
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 top-[calc(100%+8px)]
                               w-64 card p-2 shadow-ambient
                               bg-[var(--card)] border border-[var(--border)]
                               rounded-[var(--radius)]"
                  >
                    <div className="px-2 py-2 text-xs text-neutral-500">
                      {me?.name || me?.id}
                    </div>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <Link href="/account" className="btn btn-plain w-full justify-start" role="menuitem">
                      Profile
                    </Link>
                    <Link href="/billing" className="btn btn-plain w-full justify-start" role="menuitem">
                      Billing
                    </Link>
                    <div className="h-px bg-[var(--border)] my-1" />
                    {/* Logout ide kroz /logout rutu (standardizovano) */}
                    <Link href="/logout" className="btn btn-danger w-full justify-start" role="menuitem">
                      Sign out
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Link href="/signin" className="btn btn-nav btn-plain">Sign in</Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}