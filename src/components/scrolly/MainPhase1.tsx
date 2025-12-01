"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Coffee, Camera, Scissors, Rocket } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
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
  const { t } = useTranslation();

  return (
    <section
      id="phase1"
      data-phase="1"
      aria-label={t("a11y.heroPhase")}
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
          <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center sm:px-6 pt-8 sm:pt-12">

            {/* 1. Badge: Jasno stavljamo do znanja da sajt nije potreban */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-4 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 sm:px-4 sm:py-1.5 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-indigo-100 tracking-wide uppercase">
                {t("phase1.badge")}
              </span>
            </motion.div>

            {/* 2. Headline: Direktno u glavu */}
            <motion.h1
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="max-w-5xl text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1]"
            >
              <span className="block text-white drop-shadow-2xl">
                {t("phase1.title1")}
              </span>
              <span className="block text-white drop-shadow-2xl">
                {t("phase1.title2")}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 animate-gradient bg-[length:200%_auto]">
                {t("phase1.title3")}
              </span>
            </motion.h1>

            {/* 3. Subtitle: Objašnjava "Šta Tierless radi" */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-4 sm:mt-8 max-w-2xl text-sm sm:text-base md:text-xl text-slate-300 leading-relaxed font-medium"
            >
              {t("phase1.subtitle")}
            </motion.p>

            {/* 4. CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="mt-6 sm:mt-10 flex flex-col w-full sm:w-auto sm:flex-row gap-3 sm:gap-5 justify-center items-center"
            >
              {/* PRIMARY: Shiny Cosmic Button (Tvoj novi brand stil) */}
              <ShinyButton href="/start" className="w-full sm:w-auto">
                {t("phase1.ctaPrimary")}
              </ShinyButton>

              {/* SECONDARY: Glass Outline - SADA VODI NA /examples */}
              <Link
                href="/examples"
                className="inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-900/40 backdrop-blur-sm px-8 py-3 sm:py-3.5 text-base sm:text-lg font-medium text-slate-200 transition-all hover:bg-slate-800/60 hover:border-slate-400 hover:text-white w-full sm:w-auto"
              >
                {t("phase1.ctaSecondary")}
              </Link>
            </motion.div>

            {/* 5. Use Cases (Social Proof) */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-8 sm:mt-16 text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold"
            >
              {t("phase1.perfectFor")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-slate-400 text-xs sm:text-sm font-medium"
            >
              <span className="flex items-center gap-2"><Scissors size={16} className="text-pink-400" /> {t("phase1.useCases.salons")}</span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800 self-center" />
              <span className="flex items-center gap-2"><Camera size={16} className="text-indigo-400" /> {t("phase1.useCases.freelancers")}</span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800 self-center" />
              <span className="flex items-center gap-2"><Coffee size={16} className="text-cyan-400" /> {t("phase1.useCases.cafes")}</span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800 self-center" />
              <span className="flex items-center gap-2"><Rocket size={16} className="text-emerald-400" /> {t("phase1.useCases.startups")}</span>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
