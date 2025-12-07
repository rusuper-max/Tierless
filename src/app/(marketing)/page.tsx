"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Zap,
    Layers,
    Code2,
    Scissors,
    Camera,
    Coffee,
    Rocket,
    Smartphone,
    QrCode,
    ScanLine,
    FileText,
} from "lucide-react";
import ParticlesBackgroundLight from "@/components/landing/ParticlesBackgroundLight";
import MockEditor from "@/components/landing/MockEditor";
import UseCasesGrid from "@/components/landing/UseCasesGrid";
import StartHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";
import GlowButton from "@/components/ui/GlowButton";
import { useT } from "@/i18n";

// --- UTIL ---
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

// --- SECTION DIVIDERS ---

// Dramatic arrow/triangle divider (like jeton.com)
const ArrowDivider = ({ color = "fill-white", className = "" }: { color?: string; className?: string }) => (
    <div className={cn("absolute left-0 right-0 bottom-0 w-full overflow-hidden leading-[0]", className)}>
        <svg
            className={cn("relative block w-full h-[80px] md:h-[120px] lg:h-[150px]", color)}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
        >
            <path d="M0,0 L600,120 L1200,0 L1200,120 L0,120 Z" />
        </svg>
    </div>
);

// Inverted arrow (for top of sections)
const ArrowDividerTop = ({ color = "fill-white" }: { color?: string }) => (
    <div className="absolute left-0 right-0 top-0 w-full overflow-hidden leading-[0]">
        <svg
            className={cn("relative block w-full h-[80px] md:h-[120px] lg:h-[150px]", color)}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
        >
            <path d="M0,120 L600,0 L1200,120 L1200,0 L0,0 Z" />
        </svg>
    </div>
);

// Simple wave for subtle transitions
const WaveDivider = ({ flip = false, color = "fill-white" }: { flip?: boolean; color?: string }) => (
    <div className={cn("absolute left-0 right-0 w-full overflow-hidden leading-[0]", flip ? "top-0 rotate-180" : "bottom-0")}>
        <svg
            className={cn("relative block w-full h-[40px] md:h-[60px]", color)}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
        >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
    </div>
);

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
                                        <span
                                            className="inline-block font-semibold"
                                            style={{
                                                background: "linear-gradient(90deg, #4f46e5 0%, #38bdf8 50%, #14b8a6 100%)",
                                                WebkitBackgroundClip: "text",
                                                backgroundClip: "text",
                                                color: "transparent",
                                            }}
                                        >
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



                {/* 2. USE CASES GRID - ClickUp Style */}
                <UseCasesGrid />

                {/* 3. FEATURES SHOWCASE */}
                <section className="relative py-24 px-4 sm:px-6 bg-white">
                    <div className="max-w-6xl mx-auto">

                        <div className="grid md:grid-cols-2 gap-8 items-start">

                            {/* Left: Editor Showcase */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-3xl bg-slate-50 p-8 lg:p-10 border border-slate-100 relative overflow-hidden flex flex-col"
                            >
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-bold self-start shadow-md shadow-indigo-500/30">
                                        <Layers className="w-3 h-3 text-white" /> {t("landing.showcase.editor_badge")}
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4 mb-2">
                                        {t("landing.showcase.editor_title")}
                                    </h3>
                                    <p className="text-slate-600 text-lg max-w-md mb-6">
                                        {t("landing.showcase.editor_desc")}
                                    </p>

                                    {/* Editor mockup */}
                                    <div className="relative max-w-sm flex-1 flex items-start">
                                        <MockEditor />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right: Two cards stacked */}
                            <div className="flex flex-col gap-4 pt-0 md:pt-32">

                                {/* Embed Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="rounded-2xl bg-white p-5 border border-slate-200 flex items-center gap-4"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1.5">{t("landing.showcase.embed_title")}</h3>
                                        <p className="text-slate-600 text-sm">{t("landing.showcase.easy_embed_desc")}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Code2 className="w-6 h-6 text-cyan-600" />
                                    </div>
                                </motion.div>

                                {/* Brand Card - Enhanced & Compact */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 p-5 text-white relative overflow-hidden"
                                >
                                    <div className="relative z-10 space-y-4">
                                        <div>
                                            <h3 className="text-lg font-bold mb-1.5">{t("landing.showcase.brand_title")}</h3>
                                            <p className="text-indigo-100 text-xs leading-relaxed">{t("landing.showcase.brand_desc")}</p>
                                        </div>

                                        {/* Color Palette Demo */}
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-md" />
                                            <div className="w-8 h-8 rounded-lg bg-indigo-300 shadow-md" />
                                            <div className="w-8 h-8 rounded-lg bg-cyan-400 shadow-md" />
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 shadow-md" />
                                            <Sparkles className="w-4 h-4 ml-1 text-cyan-200" />
                                        </div>

                                        {/* Font Preview */}
                                        <div className="space-y-0.5 border-l-2 border-white/30 pl-2.5">
                                            <div className="text-sm font-bold text-white">{t("landing.showcase.your_business_name")}</div>
                                            <div className="text-[11px] text-indigo-100">{t("landing.showcase.professional_modern")}</div>
                                        </div>
                                    </div>

                                    {/* Background decorations */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-cyan-400/20 rounded-full blur-2xl" />
                                    <Sparkles className="absolute bottom-3 right-3 w-12 h-12 text-white opacity-10" />
                                </motion.div>

                            </div>

                        </div>
                    </div>

                </section>


                {/* 4. AI SCAN SECTION - Photo to Digital */}
                <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-cyan-50/30 via-white to-white overflow-hidden">

                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#64748b_1px,transparent_1px),linear-gradient(to_bottom,#64748b_1px,transparent_1px)] bg-[size:40px_40px]" />

                    <div className="relative z-10 max-w-6xl mx-auto">

                        {/* Header */}
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-bold mb-6 uppercase tracking-wider shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                {t("landing.aiscan.badge")}
                            </div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                                <span>{t("landing.aiscan.title_prefix")} </span>
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                                    {t("landing.aiscan.title_highlight")}
                                </span>
                            </h2>

                            <p className="text-lg text-slate-600 leading-relaxed">
                                {t("landing.aiscan.subtitle")}
                            </p>
                        </div>

                        {/* Transformation Flow */}
                        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-6 items-center">

                            {/* LEFT: Physical Menu */}
                            <div className="relative">
                                <div className="text-center lg:text-right mb-4">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <Camera className="w-4 h-4" />
                                        {t("landing.aiscan.step1")}
                                    </span>
                                </div>

                                {/* Paper Menu Mockup */}
                                <div className="relative max-w-xs mx-auto lg:ml-auto lg:mr-0">
                                    <div className="relative bg-amber-50 rounded-lg shadow-lg border border-amber-200/50 p-6">
                                        {/* Menu Header */}
                                        <div className="relative text-center border-b-2 border-slate-800 pb-3 mb-4">
                                            <h4 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Menu</h4>
                                            <span className="text-[10px] text-slate-500 tracking-widest">RESTAURANT XYZ</span>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="relative space-y-3 font-serif text-sm">
                                            {[
                                                { name: "Caesar Salad", price: "9.50" },
                                                { name: "Pasta Carbonara", price: "12.00" },
                                                { name: "Grilled Steak", price: "24.00" },
                                                { name: "Tiramisu", price: "6.50" },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-1">
                                                    <span className="text-slate-700">{item.name}</span>
                                                    <span className="text-slate-800 font-medium">${item.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CENTER: AI Processing Arrow */}
                            <div className="flex flex-col items-center justify-center py-8 lg:py-0">
                                {/* Mobile: Vertical arrow */}
                                <div className="lg:hidden flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                        <ScanLine className="w-5 h-5 text-white" />
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
                                </div>

                                {/* Desktop: Horizontal with line */}
                                <div className="hidden lg:flex items-center gap-4">
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-slate-200 to-indigo-300" />
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                        <ScanLine className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-300 to-slate-200" />
                                </div>

                                <span className="mt-3 text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">
                                    {t("landing.aiscan.processing")}
                                </span>
                            </div>

                            {/* RIGHT: Digital Editor Result */}
                            <div className="relative">
                                <div className="text-center lg:text-left mb-4">
                                    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <Smartphone className="w-4 h-4" />
                                        {t("landing.aiscan.step2")}
                                    </span>
                                </div>

                                {/* Digital Editor Mockup */}
                                <div className="relative max-w-xs mx-auto lg:mr-auto lg:ml-0">
                                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                        {/* Editor Header */}
                                        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-400">Tierless Editor</span>
                                        </div>

                                        {/* Editor Content */}
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-slate-800 text-sm">Main Menu</h4>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 px-2 py-0.5 rounded-full border border-white/20 shadow-sm">
                                                    <Sparkles className="w-2.5 h-2.5 text-white" />
                                                    AI Extracted
                                                </span>
                                            </div>

                                            {/* Extracted Items */}
                                            <div className="space-y-2">
                                                {[
                                                    { name: "Caesar Salad", price: "$9.50" },
                                                    { name: "Pasta Carbonara", price: "$12.00" },
                                                    { name: "Grilled Steak", price: "$24.00" },
                                                    { name: "Tiramisu", price: "$6.50" },
                                                ].map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded bg-slate-200 flex items-center justify-center">
                                                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-cyan-600">
                                                            {item.price}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Item Placeholder */}
                                            <div className="mt-3 border-2 border-dashed border-slate-200 rounded-lg py-2 flex items-center justify-center gap-2 text-slate-400 text-xs">
                                                <span>+ {t("landing.qr.add_item")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Success checkmark */}
                                    <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Pills */}
                        <div className="mt-16 flex flex-wrap justify-center gap-4">
                            {[
                                { icon: Zap, text: t("landing.aiscan.feature1") },
                                { icon: CheckCircle2, text: t("landing.aiscan.feature2") },
                                { icon: Layers, text: t("landing.aiscan.feature3") },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
                                >
                                    <feature.icon className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Bottom wave */}
                    <WaveDivider color="fill-white" />
                </section>

                {/* 5. QR CODE DEMO SECTION */}
                <section className="relative py-24 px-4 sm:px-6 bg-white overflow-hidden">
                    <div className="max-w-6xl mx-auto">

                        {/* Header */}
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold mb-6 uppercase tracking-wider">
                                <QrCode className="w-3 h-3" /> {t("landing.qr.badge")}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                {t("landing.qr.title")}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {t("landing.qr.subtitle")}
                            </p>
                        </div>

                        {/* 3-Step Flow */}
                        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">

                            {/* Step 1: QR Code */}
                            <div className="text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="w-40 h-40 mx-auto bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-md">
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
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">1</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t("landing.qr.step1_title")}</h3>
                                <p className="text-slate-600">{t("landing.qr.step1_desc")}</p>
                            </div>

                            {/* Step 2: Phone scanning */}
                            <div className="text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-56 mx-auto bg-slate-900 rounded-[24px] border-4 border-slate-800 shadow-lg overflow-hidden">
                                        {/* Phone screen - camera view */}
                                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                                            <div className="absolute inset-4 border-2 border-cyan-400/50 rounded-lg" />
                                            <QrCode className="w-12 h-12 text-slate-500" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">2</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t("landing.qr.step2_title")}</h3>
                                <p className="text-slate-600">{t("landing.qr.step2_desc")}</p>
                            </div>

                            {/* Step 3: Price list appears */}
                            <div className="text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-56 mx-auto bg-slate-900 rounded-[24px] border-4 border-slate-800 shadow-lg overflow-hidden">
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
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">3</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t("landing.qr.step3_title")}</h3>
                                <p className="text-slate-600">{t("landing.qr.step3_desc")}</p>
                            </div>

                        </div>

                    </div>

                </section>

                {/* 6. FINAL CTA - With scroll-animated reveal */}
                <ScrollRevealCTA t={t} />
            </main>
            <Footer />
        </>
    );
}

// --- FLOATING PRICE COMPONENT ---
function FloatingPrice({
    price,
    scrollYProgress,
    index
}: {
    price: string;
    scrollYProgress: any;
    index: number;
}) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const baseX = 5 + col * 25;
    const baseY = 5 + row * 25;
    const speed = 150 + (index % 3) * 100;

    const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

    return (
        <motion.span
            className="absolute text-white/[0.08] font-bold text-3xl md:text-5xl lg:text-6xl select-none whitespace-nowrap"
            style={{
                left: `${baseX}%`,
                top: `${baseY}%`,
                y,
            }}
        >
            {price}
        </motion.span>
    );
}

// --- SIMPLE GRADIENT DIVIDER ---
function GradientDivider() {
    return (
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-400" />
    );
}

// --- SCROLL-ANIMATED CTA WITH FLYING PRICES ---
function ScrollRevealCTA({ t }: { t: (key: string) => string }) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const contentOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);
    const contentScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95]);

    const prices = [
        "$9.99", "€15", "£20", "$49",
        "€25", "$99", "Free", "/mo",
        "$29", "€12", "₹499", "$19",
        "€5", "100%", "$299", "€60"
    ];

    return (
        <section
            ref={containerRef}
            className="relative py-32 lg:py-40 px-6 text-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 overflow-hidden"
        >
            {/* Flying prices in background - parallax on scroll */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {prices.map((price, i) => (
                    <FloatingPrice
                        key={i}
                        price={price}
                        scrollYProgress={scrollYProgress}
                        index={i}
                    />
                ))}
            </div>

            {/* Main content with fade effect */}
            <motion.div
                className="relative z-10 max-w-3xl mx-auto"
                style={{
                    opacity: contentOpacity,
                    scale: contentScale,
                }}
            >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                    {t("landing.final_cta.title_part1")}<br />
                    <span className="text-cyan-300">
                        {t("landing.final_cta.title_part2")}
                    </span>
                </h2>
                <p className="text-xl text-indigo-100 mb-10 max-w-xl mx-auto">
                    {t("landing.final_cta.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-indigo-700 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
                    >
                        {t("landing.cta.button")}
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/examples"
                        className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white/10 text-white font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
                    >
                        {t("landing.hero.cta_examples")}
                    </Link>
                </div>

                <p className="mt-8 text-sm font-medium text-indigo-200">
                    {t("landing.final_cta.trust_free")} • {t("landing.final_cta.trust_no_card")} • <Link href="/faq" className="underline hover:text-white">{t("landing.final_cta.trust_questions")}</Link>
                </p>
            </motion.div>
        </section>
    );
}
