// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeUser = { id: string; name?: string };
type MeResp  = { user?: MeUser | null; authenticated?: boolean };
type StatusResp = { authenticated?: boolean; user?: { email?: string } | null };

type NavProps = {
  brandHref?: string;
  showThemeToggle?: boolean; // zadržano radi kompatibilnosti
};

export default function Nav({ brandHref = "/", showThemeToggle = true }: NavProps) {
  const [me, setMe] = useState<MeUser | null>(null);

  // učitaj auth (status → fallback /api/me)
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/auth/status", { credentials: "same-origin", cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as StatusResp;
          if (j?.authenticated && j.user?.email) {
            const email = j.user.email;
            if (alive) setMe({ id: email, name: email.split("@")[0] || email });
            return;
          }
        }
      } catch {}
      try {
        const r2 = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (r2.ok) {
          const j2 = (await r2.json()) as MeResp;
          if (alive && j2?.user?.id) {
            const id = j2.user.id;
            const name = j2.user.name || id.split("@")[0] || id;
            setMe({ id, name });
            return;
          }
        }
      } catch {}
      if (alive) setMe(null);
    }
    load();
    const t1 = setTimeout(load, 250);
    const t2 = setTimeout(load, 1000);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const signedIn = !!me?.id;

  return (
    <div className="sticky top-0 z-[80]">
      <div className="border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 -ml-2 sm:-ml-3">
            {/* Brand: samo slovo T */}
            <Link href={brandHref} className="brand-link inline-flex items-center gap-2" aria-label="Tierless — home">
              <span
                className="inline-block select-none"
                style={{ fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1, fontSize: "24px", color: "var(--brand-1,#4F46E5)" }}
              >
                T
              </span>
              <span className="sr-only">Tierless</span>
            </Link>

            {/* Primarne rute — držimo samo Pages (Templates ostaje u headeru stranice) */}
            <Link href="/dashboard" className="btn btn-nav btn-plain">Pages</Link>
          </div>

          <div className="flex items-center gap-2">
            {!signedIn ? (
              <Link href="/signin" className="btn btn-nav btn-plain">Sign in</Link>
            ) : null}
          </div>
        </nav>
      </div>
    </div>
  );
}