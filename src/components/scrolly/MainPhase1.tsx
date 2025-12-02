"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Coffee, Camera, Scissors, Rocket } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import ShinyButton from "@/components/marketing/ShinyButton";

/**
 * MainPhase1 — Hero
 * Clean dark mode with floating prices in background
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

          {/* BACKGROUND: Floating prices */}
          <div className="absolute inset-0 z-0">
            <ParticlesBackground />
          </div>

          {/* GRADIENT OVERLAY */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#020617]/50 via-[#020617]/30 to-[#020617]" />

          {/* CONTENT */}
          <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center sm:px-6">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2"
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-medium text-slate-300">
                {t("phase1.badge")}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-4xl text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1]"
            >
              <span className="block">{t("phase1.title1")}</span>
              <span className="block">{t("phase1.title2")}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400">
                {t("phase1.title3")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 sm:mt-8 max-w-xl text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed"
            >
              {t("phase1.subtitle")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              {/* PRIMARY */}
              <ShinyButton href="/signup">
                {t("phase1.ctaPrimary")}
              </ShinyButton>

              {/* SECONDARY */}
              <Link
                href="/examples"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full border border-slate-700 bg-slate-900/50 text-white font-medium text-lg transition-all hover:bg-slate-800 hover:border-slate-600"
              >
                {t("phase1.ctaSecondary")}
              </Link>
            </motion.div>

            {/* Use Cases - Real value, no fake social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12 sm:mt-16"
            >
              <p className="text-xs text-slate-600 uppercase tracking-widest font-medium mb-4">
                {t("phase1.perfectFor")}
              </p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-slate-500 text-sm">
                <span className="flex items-center gap-2">
                  <Scissors size={16} className="text-pink-400/70" />
                  {t("phase1.useCases.salons")}
                </span>
                <span className="flex items-center gap-2">
                  <Camera size={16} className="text-indigo-400/70" />
                  {t("phase1.useCases.freelancers")}
                </span>
                <span className="flex items-center gap-2">
                  <Coffee size={16} className="text-amber-400/70" />
                  {t("phase1.useCases.cafes")}
                </span>
                <span className="flex items-center gap-2">
                  <Rocket size={16} className="text-emerald-400/70" />
                  {t("phase1.useCases.startups")}
                </span>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
