"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/nav/ThemeToggle";
import { MoreVertical, HelpCircle, CreditCard, LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

// ⬇️ lako menjaš destinaciju: "/signin" ili "/" (marketing)
const LOGOUT_REDIRECT = "/signin";

export default function Nav() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    }
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 overflow-visible tl-nav text-[var(--text)]"
      aria-label="Top navigation"
    >
      <div className="mx-auto max-w-[1536px] px-4 sm:px-5 lg:px-10 min-h-[56px] py-2 flex flex-row items-center justify-between gap-2">
        {/* Logo → marketing site */}
        <div className="flex items-center gap-2 select-none">
          <Link
            href="/"
            aria-label="Go to marketing site"
            className="cursor-pointer"
          >
            <span
              className="text-base sm:text-lg font-bold tracking-[-0.01em] leading-none"
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

        {/* --- DESKTOP NAVIGATION - All buttons visible --- */}
        <nav className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap justify-end text-[color:var(--text)]">
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

        {/* --- MOBILE NAVIGATION - Dropdown menu --- */}
        <nav className="flex sm:hidden items-center gap-2 relative">
          <ThemeToggle />

          {/* Mobile dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-[var(--surface)] rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <MoreVertical className="size-5" />
            </button>

            {/* Dropdown menu */}
            {mobileMenuOpen && (
              <>
                {/* Backdrop to close */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMobileMenuOpen(false)}
                />

                {/* Menu panel */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <Link
                    href="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--surface)] transition-colors"
                  >
                    <HelpCircle className="size-4" />
                    <span>FAQ</span>
                  </Link>

                  <Link
                    href="/start"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--surface)] transition-colors"
                  >
                    <CreditCard className="size-4" />
                    <span>View Plans</span>
                  </Link>

                  <div className="h-px bg-[var(--border)] my-2" />

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    disabled={loggingOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--surface)] transition-colors text-red-600 dark:text-red-400 w-full text-left"
                  >
                    <LogOut className="size-4" />
                    <span>{loggingOut ? "Signing out…" : "Logout"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
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
