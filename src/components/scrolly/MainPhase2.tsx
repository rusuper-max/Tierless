"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  Palette,
  Zap,
  Box,
  Utensils,
  Scissors,
  Stethoscope,
  Search,
  Plus
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

export default function MainPhase2() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);

  // --- USE CASES (Podaci) ---
  const USE_CASES = useMemo(() => [
    {
      id: "restaurant",
      themeColor: "#f97316", // Orange
      accentColor: "text-orange-400",
      bgGradient: "from-orange-500/20 to-transparent",
      title: t("phase2.cases.restaurant.title"),
      subtitle: t("phase2.cases.restaurant.subtitle"),
      icon: Utensils,
      info: ["08:00 - 23:00", "Free WiFi", "069/555-333"],
      categories: [
        t("phase2.cases.restaurant.categories.0"),
        t("phase2.cases.restaurant.categories.1"),
        t("phase2.cases.restaurant.categories.2")
      ],
      config: { type: "menu", layout: "list", style: "bistro" },
      items: [
        { name: t("phase2.cases.restaurant.items.0.name"), desc: t("phase2.cases.restaurant.items.0.desc"), price: "$18.00" },
        { name: t("phase2.cases.restaurant.items.1.name"), desc: t("phase2.cases.restaurant.items.1.desc"), price: "$12.50" },
      ]
    },
    {
      id: "salon",
      themeColor: "#ec4899", // Pink
      accentColor: "text-pink-400",
      bgGradient: "from-pink-500/20 to-transparent",
      title: t("phase2.cases.salon.title"),
      subtitle: t("phase2.cases.salon.subtitle"),
      icon: Scissors,
      info: ["09:00 - 20:00", "Parking", "Book Online"],
      categories: [
        t("phase2.cases.salon.categories.0"),
        t("phase2.cases.salon.categories.1"),
        t("phase2.cases.salon.categories.2")
      ],
      config: { type: "service_list", layout: "card", style: "elegant" },
      items: [
        { name: t("phase2.cases.salon.items.0.name"), desc: t("phase2.cases.salon.items.0.desc"), price: "$65.00" },
        { name: t("phase2.cases.salon.items.1.name"), desc: t("phase2.cases.salon.items.1.desc"), price: "$35.00" },
      ]
    },
    {
      id: "dentist",
      themeColor: "#06b6d4", // Cyan
      accentColor: "text-cyan-400",
      bgGradient: "from-cyan-500/20 to-transparent",
      title: t("phase2.cases.dentist.title"),
      subtitle: t("phase2.cases.dentist.subtitle"),
      icon: Stethoscope,
      info: ["Mon-Fri", "Emergency", "Insurance"],
      categories: [
        t("phase2.cases.dentist.categories.0"),
        t("phase2.cases.dentist.categories.1"),
        t("phase2.cases.dentist.categories.2")
      ],
      config: { type: "medical", layout: "clean", style: "trust" },
      items: [
        { name: t("phase2.cases.dentist.items.0.name"), desc: t("phase2.cases.dentist.items.0.desc"), price: "$90.00" },
        { name: t("phase2.cases.dentist.items.1.name"), desc: t("phase2.cases.dentist.items.1.desc"), price: "$250.00" },
      ]
    }
  ], [t]);

  // Scroll logika
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });

  // Animacije kontrolisane skrolom
  const opacityText1 = useTransform(smooth, [0, 0.2, 0.3], [0, 1, 0]);
  const opacityText2 = useTransform(smooth, [0.35, 0.5, 0.65], [0, 1, 0]);
  const opacityText3 = useTransform(smooth, [0.7, 0.85, 1], [0, 1, 1]); // Ostaje vidljivo na kraju

  // Phone transformacije
  const phoneScale = useTransform(smooth, [0, 1], [0.9, 1]);
  const phoneY = useTransform(smooth, [0, 1], ["5%", "-5%"]);

  // Progress Bar za auto-cycle
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-Cycle Logic (Simulira "Recompiling")
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveCaseIndex((prev) => (prev + 1) % USE_CASES.length);
      setProgress(0); // Reset progress
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgress((old) => (old < 100 ? old + 1 : 100));
    }, 40); // 4000ms / 100 = 40ms update rate

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isInView, USE_CASES.length]);

  const activeCase = USE_CASES[activeCaseIndex];
  const ActiveIcon = activeCase.icon;

  return (
    <section
      ref={containerRef}
      className="relative h-[300vh] bg-[#020617] text-slate-200"
      style={{
        '--tl-brand-1': '#22d3ee',
        '--tl-brand-2': '#6366f1'
      } as React.CSSProperties}
    >

      {/* BACKGROUND ELEMENTS (Matching Phase 1) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]" />
      </div>

      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

        {/* GLAVNI GRID: LEVO TEKST, DESNO TELEFON */}
        <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-12 z-10">

          {/* --- LEVA STRANA: TEKSTUALNI NARATIV --- */}
          <div className="flex flex-col justify-center h-full relative order-2 lg:order-1">

            {/* SCROLL TEXT CONTAINERS (Absolutno pozicionirani jedni preko drugih) */}
            <div className="relative min-h-[240px] sm:h-56 lg:h-64 w-full">

              {/* STEP 1: STRUCTURE */}
              <motion.div style={{ opacity: opacityText1 }} className="absolute inset-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Box size={16} className="text-slate-400 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <span className="font-mono text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">{t("phase2.step1.label")}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                  {t("phase2.step1.title")}<br />
                  <span className="text-slate-500">{t("phase2.step1.subtitle")}</span>
                </h2>
                <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-md">
                  {t("phase2.step1.desc")}
                </p>
              </motion.div>

              <motion.div style={{ opacity: opacityText2 }} className="absolute inset-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                    <Palette size={16} className="text-indigo-400 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <span className="font-mono text-[10px] sm:text-xs text-indigo-400 uppercase tracking-widest">{t("phase2.step2.label")}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                  {t("phase2.step2.title")}<br />
                  <span className="text-indigo-400/60">{t("phase2.step2.subtitle")}</span>
                </h2>
                <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-md">
                  {t("phase2.step2.desc")}
                </p>
              </motion.div>

              {/* STEP 3: LIVE */}
              <motion.div style={{ opacity: opacityText3 }} className="absolute inset-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-emerald-900/30 rounded-lg border border-emerald-500/30">
                    <Zap size={16} className="text-emerald-400 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <span className="font-mono text-[10px] sm:text-xs text-emerald-400 uppercase tracking-widest">{t("phase2.step3.label")}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                  {t("phase2.step3.title")}<br />
                  <span className="text-emerald-400/60">{t("phase2.step3.subtitle")}</span>
                </h2>
                <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-md">
                  {t("phase2.step3.desc")}
                </p>
                <div className="mt-3 sm:mt-6 flex items-center gap-3 sm:gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-[9px] sm:text-[10px]">☕️</div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-[9px] sm:text-[10px]">💅</div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-[9px] sm:text-[10px]">🦷</div>
                  </div>
                  <span className="text-[10px] sm:text-sm text-slate-500">{t("phase2.step3.trusted")}</span>
                </div>
              </motion.div>

            </div>
          </div>

          {/* --- DESNA STRANA: THE "ASSEMBLER" (PHONE) --- */}
          <div className="flex items-center justify-center relative order-1 lg:order-2">

            {/* Glowing Backdrop (Holographic Effect) */}
            <motion.div
              animate={{
                background: `radial-gradient(circle, ${activeCase.themeColor}33 0%, transparent 70%)`,
              }}
              className="absolute inset-0 z-0 blur-[100px] opacity-40 transition-colors duration-1000"
            />

            <motion.div
              style={{ scale: phoneScale, y: phoneY }}
              className="relative z-10 w-[280px] sm:w-[320px] h-[560px] sm:h-[640px] perspective-1000"
            >
              {/* Phone Frame - Scaled down 12.5% on mobile */}
              <div className="w-full h-full bg-[#020617] rounded-[40px] sm:rounded-[48px] border-[5px] sm:border-[6px] border-slate-800 shadow-2xl overflow-hidden relative ring-1 ring-white/10">

                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-center gap-2 px-3">
                  <div className="w-2 h-2 bg-[#1e293b] rounded-full" />
                  <div className="w-1 h-1 bg-[#0f172a] rounded-full" />
                </div>

                {/* --- PHONE CONTENT --- */}
                <div className="w-full h-full bg-slate-50 flex flex-col relative overflow-hidden">

                  {/* Header Image Area */}
                  <motion.div
                    key={`${activeCase.id}-header`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-32 w-full relative overflow-hidden"
                    style={{ backgroundColor: activeCase.themeColor }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="font-bold text-xl leading-none"
                      >
                        {activeCase.title}
                      </motion.h3>
                      <p className="text-[10px] opacity-90">{activeCase.subtitle}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white">
                      <ActiveIcon size={14} />
                    </div>
                  </motion.div>

                  {/* Content Area */}
                  <div className="flex-1 p-4 space-y-4 overflow-hidden relative">

                    {/* Info Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {activeCase.info.map((info, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-medium text-slate-600 whitespace-nowrap shadow-sm"
                        >
                          {info}
                        </motion.span>
                      ))}
                    </div>

                    {/* Search Bar Skeleton */}
                    <div className="h-10 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center px-3 gap-2">
                      <Search size={14} className="text-slate-300" />
                      <div className="h-2 w-20 bg-slate-100 rounded-full" />
                    </div>

                    {/* Menu Items (Animated List) */}
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {activeCase.items.map((item, i) => (
                          <motion.div
                            key={`${activeCase.id}-item-${i}`}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex gap-3 items-start group"
                          >
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="text-xs font-bold text-slate-800">{item.name}</span>
                                <span className={`text-xs font-bold ${activeCase.accentColor}`}>{item.price}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mt-1">
                              <Plus size={10} className="text-slate-400" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Ghost Item (to fill space) */}
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 flex gap-3 h-20 opacity-50"></div>
                    </div>

                  </div>

                  {/* Floating FAB / Action Button */}
                  <motion.div
                    key={`${activeCase.id}-fab`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: activeCase.themeColor }}
                  >
                    <Zap size={20} fill="currentColor" />
                  </motion.div>

                </div>

                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-[48px]" />
              </div>

              {/* Progress Indicator (Branded Timer Bar) */}
              <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 lg:w-40 h-[3px] bg-slate-800/50 rounded-full overflow-hidden"
                initial={{ opacity: 1 }}
                animate={{ opacity: progress === 0 ? [1, 0, 1] : 1 }}
                transition={{ duration: 0.08, times: [0, 0.5, 1] }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Use case transition progress"
              >
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, var(--tl-brand-1), var(--tl-brand-2))',
                    boxShadow: '0 0 18px -6px var(--tl-brand-1)'
                  }}
                  animate={!prefersReducedMotion ? {
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  {/* Shimmer overlay */}
                  {!prefersReducedMotion && (
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite'
                      }}
                    />
                  )}
                </motion.div>
              </motion.div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}