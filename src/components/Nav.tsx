// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import MistToggle from "@/components/MistToggle";

type MeUser = { id: string; isDev?: boolean; name?: string; title?: string };
type MeResp = { user?: MeUser };
type WhoAmI = { userId?: string };

type NavProps = {
  brandHref?: string;
  showThemeToggle?: boolean;
  showMistToggle?: boolean;
};

export default function Nav({
  brandHref = "/",
  showThemeToggle = true,
  showMistToggle = true,
}: NavProps) {
  const [me, setMe] = useState<MeUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (r.ok) {
          const json = (await r.json()) as MeResp;
          if (alive && json?.user) { setMe(json.user); return; }
        }
      } catch {}
      try {
        const r2 = await fetch("/api/whoami", { credentials: "same-origin", cache: "no-store" });
        if (r2.ok) {
          const j2 = (await r2.json()) as WhoAmI;
          if (alive && j2?.userId) setMe({ id: j2.userId });
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

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

  async function logout() {
    try {
      const r = await fetch("/api/dev-logout", { method: "POST", credentials: "same-origin", cache: "no-store" });
      if (!r.ok) throw new Error();
    } catch {
      try { await fetch("/api/logout", { method: "POST", credentials: "same-origin" }); } catch {}
    }
    window.location.href = "/signin";
  }

  const signedIn = !!me?.id && !me.id.startsWith("anon:");
  const greeting = (() => {
    if (!signedIn) return null;
    if (me?.isDev) {
      return (
        <>
          Hello <b>{me.name || "Dev user"}</b>
          {me.title ? <> , {me.title}</> : null}
        </>
      );
    }
    const label =
      me?.name
        ? me.name
        : me?.id?.startsWith("dev:")
          ? (me.id.slice(4).split("@")[0] || me.id.slice(4))
          : "user";
    return <>Hi, {label}</>;
  })();

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
            {showMistToggle ? <MistToggle /> : null}

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
                      {me?.name ? me.name : me?.id}
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