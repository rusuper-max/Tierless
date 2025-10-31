// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

type MeUser = { id: string; isDev?: boolean; name?: string; title?: string };
type MeResp = { user?: MeUser | null; authenticated?: boolean };

type NavProps = {
  brandHref?: string;
  showThemeToggle?: boolean;
};

export default function Nav({ brandHref = "/", showThemeToggle = true }: NavProps) {
  const [me, setMe] = useState<MeUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // ——— učitaj auth (status → fallback na /api/me), bez keša
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        // 1) Prefer /api/auth/status (ako ga imaš)
        const r = await fetch("/api/auth/status", { credentials: "same-origin", cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as { authenticated?: boolean; user?: { email?: string } };
          if (alive && j?.authenticated && j.user?.email) {
            const email = j.user.email;
            setMe({ id: email, name: email.split("@")[0] || email });
            return;
          }
        }
      } catch {}
      try {
        // 2) Fallback: /api/me (format iz ove rute smo upravo standardizovali)
        const r2 = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (r2.ok) {
          const j2 = (await r2.json()) as MeResp;
          if (alive && j2?.user?.id) {
            setMe({ id: j2.user.id, name: j2.user.name });
            return;
          }
        }
      } catch {}
      if (alive) setMe(null);
    }

    load();

    // opciono: reaguj na globalni event ako ga emituješ posle login/logout-a
    const onAuthChange = () => load();
    window.addEventListener("TL_AUTH_CHANGED", onAuthChange as any);

    return () => {
      alive = false;
      window.removeEventListener("TL_AUTH_CHANGED", onAuthChange as any);
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

  // ——— čist logout (nema više dev-logout)
  async function logout() {
    try { await fetch("/api/logout", { method: "POST", credentials: "same-origin", cache: "no-store" }); } catch {}
    // hard nav da SSR odmah vidi prazan cookie
    window.location.replace("/signin");
  }

  const signedIn = !!me?.id; // sada je id = email, nema "anon:" heuritike

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
            <Link href={brandHref} className="brand-link" aria-label="Tierless — home">
              <img src="/brand/tierless-icon.png" alt="" className="brand-logo" />
              <span className="brand-label text-xl">Tierless</span>
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
                    <button onClick={logout} className="btn btn-danger w-full justify-start" role="menuitem">
                      Sign out
                    </button>
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