"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { t } from "@/i18n";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import ShinyButton from "@/components/marketing/ShinyButton";

/**
 * MainPhase1 — Hero
 * Fokus: "Mini sajt za cene" za svakoga.
 * Stil: Deep Space / Dark Mode First
 */
const PIN_HEIGHT_SVH = 100;

export default function MainPhase1() {
  const wrapRef = (globalThis as any)._p1ref ??= { current: null as HTMLElement | null };

  return (
    <section
      id="phase1"
      data-phase="1"
      aria-label={t("Hero Phase")}
      className="relative w-full"
    >
      <div ref={wrapRef} style={{ height: `${PIN_HEIGHT_SVH}svh` }}>
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          
          {/* LAYER 0: BACKGROUND (Particles) */}
          <div className="absolute inset-0 z-0">
            <ParticlesBackground />
          </div>

          {/* LAYER 1: GRADIENT OVERLAY (Focus on text) */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-[#020617]/40 to-[#020617]" />

          {/* LAYER 2: CONTENT */}
          <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center sm:px-6 pt-12">
            
            {/* 1. Badge: Jasno stavljamo do znanja da sajt nije potreban */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-4 py-1.5 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              <span className="text-xs font-semibold text-indigo-100 tracking-wide uppercase">
                {t("No website required")}
              </span>
            </motion.div>

            {/* 2. Headline: Direktno u glavu */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="max-w-5xl text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl leading-[1.1]"
            >
              <span className="block text-white drop-shadow-2xl">
                {t("Your prices.")}
              </span>
              <span className="block text-white drop-shadow-2xl">
                {t("Online.")}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 animate-gradient bg-[length:200%_auto]">
                {t("Beautiful.")}
              </span>
            </motion.h1>

            {/* 3. Subtitle: Objašnjava "Šta Tierless radi" */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-8 max-w-2xl text-lg text-slate-300 sm:text-xl leading-relaxed font-medium"
            >
              {t("Create menus, rate cards, and price calculators in minutes. Share via Link or QR code. Update anytime, instantly.")}
            </motion.p>

            {/* 4. CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="mt-10 flex flex-col w-full sm:w-auto sm:flex-row gap-5 justify-center items-center"
            >
              {/* PRIMARY: Shiny Cosmic Button (Tvoj novi brand stil) */}
              <ShinyButton href="/start" className="w-full sm:w-auto">
                {t("Create My Page Free")}
              </ShinyButton>

              {/* SECONDARY: Glass Outline */}
              <Link
                href="/templates"
                className="inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-900/40 backdrop-blur-sm px-8 py-3.5 text-lg font-medium text-slate-200 transition-all hover:bg-slate-800/60 hover:border-slate-400 hover:text-white w-full sm:w-auto"
              >
                {t("See Examples")}
              </Link>
            </motion.div>

            {/* 5. Use Cases (Social Proof) */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="mt-16 text-xs text-slate-500 uppercase tracking-widest font-semibold"
            >
                {t("Perfect for")}
            </motion.p>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-slate-400 text-sm font-medium"
            >
                <span className="flex items-center gap-2">☕️ {t("Cafes & Menus")}</span>
                <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800 self-center" />
                <span className="flex items-center gap-2">📸 {t("Freelancers")}</span>
                <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800 self-center" />
                <span className="flex items-center gap-2">💇‍♀️ {t("Salons")}</span>
                <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800 self-center" />
                <span className="flex items-center gap-2">🚀 {t("Startups")}</span>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}