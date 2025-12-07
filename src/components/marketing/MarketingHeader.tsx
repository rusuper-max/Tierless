"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import TierlessLogo from "@/components/marketing/TierlessLogo";
import ShinyButton from "@/components/marketing/ShinyButton";
import { useT } from "@/i18n";
import { useLocale, type Locale } from "@/i18n/LanguageProvider";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sr", label: "Srpski", flag: "🇷🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{currentLang.label}</span>
        <span className="sm:hidden">{currentLang.flag}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-40 bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {locale === lang.code && <Check size={14} className="text-indigo-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MarketingHeader() {
  const { authenticated } = useAuthStatus();
  const t = useT();

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

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md transition-all duration-300"
      aria-label={t("a11y.mainHeader")}
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

        {/* --- NAVIGATION (visible on all screens) --- */}
        <nav className="flex items-center gap-1 sm:gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {!authenticated ? (
            <Link
              href="/signin"
              className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium text-slate-300 border border-white/10 hover:border-white/30 hover:text-white hover:bg-white/5 transition-all"
            >
              {t("nav.signin")}
            </Link>
          ) : (
            <div className="origin-right">
              <ShinyButton
                href="/dashboard"
                className="!h-10 !px-5 !text-sm !font-medium"
              >
                {t("nav.dashboard")}
              </ShinyButton>
            </div>
          )}
        </nav>
      </div>

      {/* Scroll Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
          style={{ width: `${Math.round(progress * 100)}%`, transition: "width 0.12s linear" }}
        />
      </div>
    </header>
  );
}
