"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import TierlessLogo from "@/components/marketing/TierlessLogo";
import ShinyButton from "@/components/marketing/ShinyButton";
import { Menu, X } from "lucide-react";
import { t } from "@/i18n/t";

export default function MarketingHeader() {
  const { authenticated } = useAuthStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- SCROLL PROGRESS BAR ---
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const y = window.scrollY || 0;
      setProgress(Math.min(1, Math.max(0, y / max)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", onEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md transition-all duration-300"
      aria-label={t("Main header")}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">

        {/* --- LOGO & BRAND NAME --- */}
        <Link
          href="/"
          aria-label="Tierless Home"
          className="flex items-center gap-2 sm:gap-3 group select-none"
        >
          <div className="relative transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-105">
            <TierlessLogo className="w-7 h-7 sm:w-9 sm:h-9" />
            <div className="absolute inset-0 bg-indigo-500/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-lg sm:text-2xl font-bold tracking-tight text-white font-sans">
            Tierless
          </span>
        </Link>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden sm:flex items-center gap-3 sm:gap-4">
          {!authenticated ? (
            <Link
              href="/signin"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium text-slate-300 border border-white/10 hover:border-white/30 hover:text-white hover:bg-white/5 transition-all"
            >
              {t("Log in")}
            </Link>
          ) : (
            <div className="scale-90 sm:scale-100 origin-right">
              <ShinyButton href="/dashboard">
                {t("Dashboard")}
              </ShinyButton>
            </div>
          )}
        </nav>

        {/* --- MOBILE MENU BUTTON --- */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="sm:hidden p-2 text-white hover:text-indigo-400 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* Scroll Progress Line */}
      <div
        className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"
        style={{ width: `${Math.round(progress * 100)}%`, transition: "width 0.1s linear" }}
      />

      {/* --- MOBILE MENU DRAWER --- */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-64 bg-slate-900 z-50 sm:hidden flex flex-col shadow-2xl border-l border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 flex flex-col gap-2 p-4">
              {!authenticated ? (
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  {t("Log in")}
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-400 hover:opacity-90 transition-all"
                >
                  {t("Dashboard")}
                </Link>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-slate-500 text-center">
                © 2024 Tierless
              </p>
            </div>
          </div>
        </>
      )}
    </header>
  );
}