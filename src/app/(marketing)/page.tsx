"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Zap,
    BarChart3,
    Layers,
    Calculator,
    Code2,
    Scissors,
    Camera,
    Coffee,
    Rocket,
    Globe,
    Smartphone,
    QrCode,
} from "lucide-react";
import ParticlesBackgroundLight from "@/components/landing/ParticlesBackgroundLight";
import InteractiveGridPattern from "@/components/landing/InteractiveGridPattern";
import GlowingGrid from "@/components/landing/GlowingGrid";
import TiltCard from "@/components/landing/TiltCard";
import StartHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";
import GlowButton from "@/components/ui/GlowButton";
import { useT } from "@/i18n/t";

// --- UTIL ---
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

// --- COMPONENTS ---

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur-sm", className)}>
        {children}
    </div>
);

// --- ROTATING TEXT ---
const RotatingText = () => {
    const t = useT();
    const words = [
        { text: t("landing.hero.rotating_salon"), color: "text-pink-500", icon: Scissors },
        { text: t("landing.hero.rotating_cafe"), color: "text-amber-600", icon: Coffee },
        { text: t("landing.hero.rotating_agency"), color: "text-indigo-500", icon: Camera },
        { text: t("landing.hero.rotating_startup"), color: "text-cyan-500", icon: Rocket },
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [words.length]);

    const CurrentIcon = words[index].icon;

    return (
        <span className="inline-flex items-center">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 25, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -25, opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={cn("inline-flex items-center gap-2 md:gap-3", words[index].color)}
                >
                    {words[index].text}
                    <CurrentIcon className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-90" />
                </motion.span>
            </AnimatePresence>
        </span>
    );
};

// --- HERO CALCULATOR - Service Price List Demo ---
const HeroCalculator = () => {
    const t = useT();
    const [selectedServices, setSelectedServices] = useState<string[]>(["haircut"]);

    const services = [
        { id: "haircut", name: t("landing.calculator.service_haircut"), price: 45 },
        { id: "color", name: t("landing.calculator.service_color"), price: 85 },
        { id: "treatment", name: t("landing.calculator.service_treatment"), price: 35 },
        { id: "blowout", name: t("landing.calculator.service_blowout"), price: 30 },
    ];

    const toggleService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const total = services
        .filter(s => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0);

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Subtle gradient blobs */}
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-cyan-300 rounded-full blur-[60px] opacity-30" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-indigo-400 rounded-full blur-[60px] opacity-20" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50"
            >
                {/* Header */}
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t("landing.calculator.live_preview")}</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{t("landing.calculator.title")}</h3>
                    <p className="text-xs text-slate-500">{t("landing.calculator.subtitle")}</p>
                </div>

                {/* Services List */}
                <div className="p-5 space-y-3">
                    {services.map((service) => (
                        <button
                            key={service.id}
                            onClick={() => toggleService(service.id)}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                                selectedServices.includes(service.id)
                                    ? "border-teal-500 bg-teal-50/50"
                                    : "border-slate-100 hover:border-slate-200 bg-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedServices.includes(service.id)
                                        ? "border-teal-500 bg-teal-500"
                                        : "border-slate-300"
                                )}>
                                    {selectedServices.includes(service.id) && (
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span className="font-medium text-slate-700">{service.name}</span>
                            </div>
                            <span className="font-bold text-slate-800">${service.price}</span>
                        </button>
                    ))}

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-medium">{t("landing.calculator.total")}</span>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={total}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500"
                                >
                                    ${total}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* CTA - Demo only, not clickable */}
                    <div className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-sm text-center cursor-default select-none">
                        {t("landing.calculator.cta")} <span className="opacity-70 text-xs ml-1">(Demo)</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN PAGE ---

export default function LandingPage() {
    const t = useT();

    return (
        <>
            <StartHeader />
            <main
                id="main"
                role="main"
                className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden font-sans"
            >

                {/* 1. HERO SECTION */}
                <section className="relative min-h-screen flex items-center pt-20 pb-20 lg:pt-32 lg:pb-32 px-4 sm:px-6">

                    {/* Background with hover-reveal particles */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white">
                        <ParticlesBackgroundLight />
                    </div>

                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                    <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Left: Copy */}
                        <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Badge className="mb-6 mx-auto lg:mx-0">
                                    <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                                    {t("landing.hero.badge")}
                                </Badge>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                                    <span className="block mb-2">{t("landing.hero.title_run")}</span>
                                    <span className="block mb-3">
                                        <RotatingText />
                                    </span>
                                    <span className="block text-slate-600 text-[0.85em]">
                                        {t("landing.hero.title_suffix_prefix")}{" "}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-400">
                                            {t("landing.hero.title_suffix")}
                                        </span>
                                    </span>
                                </h1>

                                <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    {t("landing.hero.subtitle")}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                    <GlowButton href="/login" variant="primary">
                                        {t("landing.hero.cta_start")}
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </GlowButton>
                                    <GlowButton href="/examples" variant="secondary">
                                        {t("landing.hero.cta_examples")}
                                    </GlowButton>
                                    <GlowButton href="/start" variant="ghost">
                                        {t("landing.hero.cta_pricing")}
                                    </GlowButton>
                                </div>

                                {/* Trust indicators */}
                                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> {t("landing.hero.trust_no_coding")}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> {t("landing.hero.trust_free")}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> {t("landing.hero.trust_works")}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Calculator */}
                        <div className="relative z-10 w-full">
                            <HeroCalculator />
                        </div>

                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-slate-400"
                    >
                        <span className="text-xs font-medium uppercase tracking-wider">{t("landing.hero.scroll_hint")}</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        </motion.div>
                    </motion.div>
                </section>



                {/* 2. WHY TIERLESS - Clean Benefits */}
                <section className="relative py-24 px-4 sm:px-6 overflow-hidden bg-slate-50/30">

                    {/* Aurora Mesh Gradient Background (Restored) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-multiply" />
                        <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] mix-blend-multiply" />
                        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] mix-blend-multiply" />
                    </div>

                    <div className="relative z-10 max-w-6xl mx-auto">

                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                {t("landing.why.title")}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {t("landing.why.subtitle")}
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { icon: Globe, titleKey: "landing.why.no_website_title", descKey: "landing.why.no_website_desc", color: "text-indigo-600", bg: "bg-indigo-50" },
                                { icon: Smartphone, titleKey: "landing.why.mobile_title", descKey: "landing.why.mobile_desc", color: "text-cyan-600", bg: "bg-cyan-50" },
                                { icon: Zap, titleKey: "landing.why.update_title", descKey: "landing.why.update_desc", color: "text-amber-600", bg: "bg-amber-50" },
                                { icon: QrCode, titleKey: "landing.why.qr_title", descKey: "landing.why.qr_desc", color: "text-emerald-600", bg: "bg-emerald-50" },
                                { icon: Calculator, titleKey: "landing.why.calculator_title", descKey: "landing.why.calculator_desc", color: "text-teal-600", bg: "bg-teal-50" },
                                { icon: BarChart3, titleKey: "landing.why.analytics_title", descKey: "landing.why.analytics_desc", color: "text-slate-700", bg: "bg-slate-100" },
                            ].map((feature, i) => (
                                <TiltCard key={i} className="h-full">
                                    <div className="h-full p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", feature.bg)}>
                                            <feature.icon className={cn("w-6 h-6", feature.color)} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{t(feature.titleKey)}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">{t(feature.descKey)}</p>
                                    </div>
                                </TiltCard>
                            ))}
                        </div>

                    </div>
                </section>

                {/* 3. FEATURES SHOWCASE */}
                <section className="py-24 px-4 sm:px-6 bg-white">
                    <div className="max-w-6xl mx-auto">

                        <div className="grid md:grid-cols-2 gap-8">

                            {/* Left: Editor Showcase */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-3xl bg-slate-50 p-8 lg:p-10 border border-slate-100 relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-6">
                                        <Layers className="w-3 h-3" /> VISUAL EDITOR
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                                        Drag & drop simplicity
                                    </h3>
                                    <p className="text-slate-600 mb-6 text-lg">
                                        No code required. Just add your services and prices,
                                        pick a style, and you're live.
                                    </p>

                                    {/* Editor mockup */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <div className="flex gap-1.5 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-8 bg-slate-100 rounded w-3/4" />
                                            <div className="h-8 bg-indigo-100 rounded w-full" />
                                            <div className="h-8 bg-slate-100 rounded w-2/3" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right: Two cards stacked */}
                            <div className="flex flex-col gap-6">

                                {/* Embed Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="flex-1 rounded-3xl bg-white p-6 lg:p-8 border border-slate-200 flex items-center gap-6"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Easy embed</h3>
                                        <p className="text-slate-600">Works with WordPress, Webflow, Shopify, or any website.</p>
                                    </div>
                                    <div className="h-16 w-16 bg-cyan-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <Code2 className="w-8 h-8 text-cyan-600" />
                                    </div>
                                </motion.div>

                                {/* Brand Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="flex-1 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 p-6 lg:p-8 text-white relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold mb-2">100% your brand</h3>
                                        <p className="text-cyan-100">Customize colors, fonts, and style to match your business perfectly.</p>
                                    </div>
                                    <Sparkles className="absolute bottom-2 right-2 w-24 h-24 text-white opacity-10" />
                                </motion.div>

                            </div>

                        </div>
                    </div>
                </section>

                {/* 4. QR CODE DEMO SECTION */}
                <section className="py-24 px-4 sm:px-6 bg-white overflow-hidden">
                    <div className="max-w-6xl mx-auto">

                        {/* Header */}
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold mb-6 uppercase tracking-wider">
                                <QrCode className="w-3 h-3" /> How it works
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                Scan. View. Done.
                            </h2>
                            <p className="text-lg text-slate-600">
                                Your customers scan a QR code and instantly see your prices on their phone.
                            </p>
                        </div>

                        {/* 3-Step Flow */}
                        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">

                            {/* Step 1: QR Code */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="relative inline-block mb-6">
                                    <div className="w-40 h-40 mx-auto bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-lg">
                                        {/* QR Code SVG */}
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            <rect x="10" y="10" width="25" height="25" rx="2" fill="#0f172a" />
                                            <rect x="15" y="15" width="15" height="15" fill="white" />
                                            <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                                            <rect x="65" y="10" width="25" height="25" rx="2" fill="#0f172a" />
                                            <rect x="70" y="15" width="15" height="15" fill="white" />
                                            <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
                                            <rect x="10" y="65" width="25" height="25" rx="2" fill="#0f172a" />
                                            <rect x="15" y="70" width="15" height="15" fill="white" />
                                            <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
                                            <rect x="45" y="45" width="10" height="10" rx="2" fill="#06b6d4" />
                                            <rect x="40" y="12" width="6" height="6" rx="1" fill="#0f172a" />
                                            <rect x="50" y="20" width="6" height="6" rx="1" fill="#0f172a" />
                                            <rect x="42" y="65" width="6" height="6" rx="1" fill="#0f172a" />
                                            <rect x="65" y="42" width="6" height="6" rx="1" fill="#0f172a" />
                                            <rect x="80" y="65" width="6" height="6" rx="1" fill="#0f172a" />
                                            <rect x="65" y="80" width="6" height="6" rx="1" fill="#0f172a" />
                                            <rect x="80" y="80" width="6" height="6" rx="1" fill="#0f172a" />
                                        </svg>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Print your QR code</h3>
                                <p className="text-slate-600">Put it on your menu, flyer, business card, or storefront window.</p>
                            </motion.div>

                            {/* Step 2: Phone scanning */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-center"
                            >
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-56 mx-auto bg-slate-900 rounded-[24px] border-4 border-slate-800 shadow-xl overflow-hidden">
                                        {/* Phone screen - camera view */}
                                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                                            {/* Scanning animation */}
                                            <div className="absolute inset-4 border-2 border-cyan-400/50 rounded-lg">
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
                                            </div>
                                            <QrCode className="w-12 h-12 text-slate-500" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Customer scans</h3>
                                <p className="text-slate-600">They point their phone camera at the code. No app needed.</p>
                            </motion.div>

                            {/* Step 3: Price list appears */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="text-center"
                            >
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-56 mx-auto bg-slate-900 rounded-[24px] border-4 border-slate-800 shadow-xl overflow-hidden">
                                        {/* Phone screen - price list */}
                                        <div className="w-full h-full bg-white p-2 flex flex-col">
                                            <div className="text-[8px] font-bold text-slate-800 mb-1 text-center">Bella's Studio</div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-center bg-slate-50 rounded px-1.5 py-1">
                                                    <span className="text-[7px] text-slate-700">Haircut</span>
                                                    <span className="text-[7px] font-bold text-indigo-600">$45</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-50 rounded px-1.5 py-1">
                                                    <span className="text-[7px] text-slate-700">Coloring</span>
                                                    <span className="text-[7px] font-bold text-indigo-600">$85</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-50 rounded px-1.5 py-1">
                                                    <span className="text-[7px] text-slate-700">Treatment</span>
                                                    <span className="text-[7px] font-bold text-indigo-600">$35</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-50 rounded px-1.5 py-1">
                                                    <span className="text-[7px] text-slate-700">Blowout</span>
                                                    <span className="text-[7px] font-bold text-indigo-600">$30</span>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded text-[6px] text-white text-center py-1 font-medium">
                                                Book Now
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Prices appear instantly</h3>
                                <p className="text-slate-600">Your beautiful price page loads in their browser. Ready to book.</p>
                            </motion.div>

                        </div>

                    </div>
                </section>

                {/* 5. FINAL CTA */}
                <section className="py-24 lg:py-32 px-6 text-center bg-slate-50 relative overflow-hidden">
                    {/* Interactive Grid Background */}
                    <InteractiveGridPattern />

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                Ready to put your prices online?
                            </h2>
                            <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto">
                                Join businesses that use Tierless to share their services professionally.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <GlowButton href="/login" variant="primary">
                                    {t("landing.cta.button")}
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </GlowButton>
                                <GlowButton href="/examples" variant="secondary">
                                    {t("landing.hero.cta_examples")}
                                </GlowButton>
                            </div>

                            <p className="mt-6 text-sm font-medium text-slate-500">
                                Free to start • No credit card required
                            </p>
                        </motion.div>
                    </div>
                </section>

            </main>
            <Footer />
        </>
    );
}
