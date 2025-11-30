// src/components/editor/OnboardingIntro.tsx
"use client";

import { Zap, Sparkles, X } from "lucide-react";
import { t } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

type Props = {
    onStartTour: () => void;
    onSkip: () => void;
};

export default function OnboardingIntro({ onStartTour, onSkip }: Props) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header with gradient background */}
                <div className="relative p-8 pb-6" style={{ background: BRAND_GRADIENT }}>
                    <button
                        onClick={onSkip}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {t("Welcome to your Editor!")}
                        </h2>
                        <p className="text-base text-white/90 max-w-md">
                            {t("Let's get you started with a quick tour of the essential features.")}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Start Tour Option */}
                        <button
                            onClick={onStartTour}
                            className="group relative p-6 rounded-2xl border-2 border-[#4F46E5] bg-gradient-to-br from-[#4F46E5]/5 to-[#22D3EE]/5 hover:from-[#4F46E5]/10 hover:to-[#22D3EE]/10 transition-all hover:scale-105 active:scale-95 text-left"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BRAND_GRADIENT }}>
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                                        {t("Start Onboarding Tour")}
                                    </h3>
                                    <p className="text-sm text-[var(--muted)]">
                                        {t("Learn the basics with interactive tooltips")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-[var(--muted)] flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {t("Recommended for first-time users")}
                            </div>
                        </button>

                        {/* Skip Option */}
                        <button
                            onClick={onSkip}
                            className="group relative p-6 rounded-2xl border-2 border-[var(--border)] bg-[var(--bg)]/50 hover:bg-[var(--surface)] transition-all hover:scale-105 active:scale-95 text-left"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0 text-[var(--text)]">
                                    <span className="text-xl">👋</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                                        {t("I'll figure things out myself")}
                                    </h3>
                                    <p className="text-sm text-[var(--muted)]">
                                        {t("Jump straight into editing")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-[var(--muted)]">
                                {t("You can always access the Guide button later")}
                            </div>
                        </button>
                    </div>

                    {/* Info box */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg)]/50 border border-[var(--border)]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white font-bold">
                            💡
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-[var(--text)]">
                                {t("Look for the")} <span className="font-bold text-[#4F46E5]">{t("Guide")}</span> {t("button in the top navigation bar. Click it anytime to learn what each element does!")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
