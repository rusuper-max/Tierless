"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/nav/ThemeToggle";

import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

// ⬇️ lako menjaš destinaciju: "/signin" ili "/" (marketing)
const LOGOUT_REDIRECT = "/signin";

export default function Nav() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    try {
      setLoggingOut(true);
      // očisti sesiju na serveru
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => { });
    } finally {
      // hard redirect da 100% pokupimo novi cookie state
      window.location.assign(LOGOUT_REDIRECT);
      // ili, ako više voliš SPA: router.replace(LOGOUT_REDIRECT);
    }
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 overflow-visible tl-nav text-[var(--text)]"
      aria-label="Top navigation"
    >
      <div className="mx-auto max-w-[1536px] px-5 sm:px-7 lg:px-10 min-h-[56px] py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Logo → marketing site */}
        <div className="flex items-center gap-2 select-none">
          <Link
            href="/"
            aria-label="Go to marketing site"
            className="cursor-pointer"
          >
            <span
              className="text-lg font-bold tracking-[-0.01em] leading-none"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tierless
            </span>
          </Link>
        </div>

        {/* Right actions */}
        <nav className="flex items-center gap-3 flex-wrap justify-end text-[color:var(--text)]">
          <ThemeToggle />
          <Button size="xs" variant="brand" href="/help" title="Open docs / FAQ">FAQ</Button>
          <Button size="xs" variant="brand" href="/start" title="Manage your plan">View Plans</Button>
          <Button
            size="xs"
            variant="danger"
            onClick={onLogout}
            disabled={loggingOut}
            title="Sign out"
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </Button>
        </nav>
      </div>

      {/* Brand hairline */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-[var(--brand-1,#4F46E5)] to-[var(--brand-2,#22D3EE)]"
      />
    </header>
  );
}
