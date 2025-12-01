"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Globe,
  Smartphone,
  RefreshCw,
  Share2,
  Calculator,
  Languages,
  Zap,
  CreditCard,
  Clock,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * MainPhase3Benefits — "Why Tierless?" Section
 * Clean grid of benefits with icons and simple descriptions
 * Inspired by digitalnimeni.me style
 */

const BENEFITS = [
  {
    key: "noWebsite",
    icon: Globe,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  {
    key: "anyPhone",
    icon: Smartphone,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    key: "updateAnytime",
    icon: RefreshCw,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    key: "shareEverywhere",
    icon: Share2,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  {
    key: "calculator",
    icon: Calculator,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    key: "multiLanguage",
    icon: Languages,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
];

const BOTTOM_FEATURES = [
  {
    key: "instant",
    icon: Zap,
    color: "text-yellow-400",
  },
  {
    key: "noCoding",
    icon: CreditCard,
    color: "text-slate-400",
  },
  {
    key: "freeStart",
    icon: Clock,
    color: "text-emerald-400",
  },
];

export default function MainPhase3Benefits() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-[#020617] py-24 sm:py-32 overflow-hidden"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617] to-[#020617]" />
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {t("phase3benefits.badge")}
          </motion.span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            {t("phase3benefits.title")}
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            {t("phase3benefits.subtitle")}
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.key}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                className={`
                  group relative p-6 rounded-2xl border backdrop-blur-sm
                  ${benefit.bgColor} ${benefit.borderColor}
                  hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
                  transition-all duration-300 cursor-default
                `}
              >
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-4
                  bg-slate-900/50 border border-slate-700/50
                  group-hover:scale-110 transition-transform duration-300
                `}>
                  <Icon className={`w-6 h-6 ${benefit.color}`} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t(`phase3benefits.benefits.${benefit.key}.title`)}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t(`phase3benefits.benefits.${benefit.key}.desc`)}
                </p>

                {/* Hover Glow Effect */}
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                  transition-opacity duration-300 pointer-events-none
                  bg-gradient-to-br ${benefit.bgColor}
                `} />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Features Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-10 py-8 border-t border-slate-800/50"
        >
          {BOTTOM_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="flex items-center gap-3 text-slate-400"
              >
                <Icon className={`w-5 h-5 ${feature.color}`} />
                <span className="text-sm font-medium">
                  {t(`phase3benefits.bottomFeatures.${feature.key}`)}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500 text-sm mb-4">
            {t("phase3benefits.cta.subtext")}
          </p>
        </motion.div>

      </div>
    </section>
  );
}

