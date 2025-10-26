"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";

export default function Nav() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMe(j))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    window.location.href = "/signin";
  }

  return (
    <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
      <div className="flex items-center gap-3 -ml-2 sm:-ml-3">
        <Link href="/" className="brand-link" aria-label="Tierless — home">
  {/* logo levo */}
  <img src="/brand/tierless-icon.png" alt="" className="brand-logo" />
  {/* tekst skriven dok ne hover-uješ; pojavi se s leva */}
  <span className="brand-label text-xl">Tierless</span>
</Link>
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:underline">Pages</Link>
        <Link href="/templates" className="text-sm text-neutral-400 hover:underline">Templates</Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {me?.user ? (
          <>
            <span className="text-xs text-neutral-500">Hi, {me.user.name ?? "user"}</span>
            <button onClick={logout} className="btn">Sign out</button>
          </>
        ) : (
          <Link href="/signin" className="btn">Sign in</Link>
        )}
      </div>
    </nav>
  );
}