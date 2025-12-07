// src/components/editor/OnboardingIntro.tsx
"use client";

import { Zap, Sparkles, X } from "lucide-react";
import { useT } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

type Props = {
    onStartTour: () => void;
    onSkip: () => void;
};

export default function OnboardingIntro({ onStartTour, onSkip }: Props) {
    const t = useT();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden my-auto">

                {/* Header with gradient background - COMPACT ON MOBILE */}
                <div className="relative p-4 sm:p-8 pb-3 sm:pb-6" style={{ background: BRAND_GRADIENT }}>
                    <button
                        onClick={onSkip}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/90 hover:rotate-90 text-white hover:text-[#4F46E5] transition-all duration-300 z-10 shadow-lg hover:shadow-2xl cursor-pointer"
                        style={{ lineHeight: 0 }}
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} style={{ display: 'block' }} />
                    </button>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 sm:mb-4 shadow-lg">
                            <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                            {t("Welcome to your Editor!")}
                        </h2>
                        <p className="text-sm sm:text-base text-white/90 max-w-md px-2">
                            {t("Let's get you started with a quick tour of the essential features.")}
                        </p>
                    </div>
                </div>

                {/* Body - REDUCED SPACING ON MOBILE */}
                <div className="p-4 sm:p-8 space-y-3 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Start Tour Option - COMPACT ON MOBILE */}
                        <button
                            onClick={onStartTour}
                            className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#4F46E5] bg-gradient-to-br from-[#4F46E5]/5 to-[#22D3EE]/5 hover:from-[#4F46E5]/10 hover:to-[#22D3EE]/10 transition-all hover:scale-105 active:scale-95 text-left"
                        >
                            <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BRAND_GRADIENT }}>
                                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--text)] mb-0.5 sm:mb-1">
                                        {t("Start Onboarding Tour")}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[var(--muted)]">
                                        {t("Learn the basics with interactive tooltips")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-[10px] sm:text-xs text-[var(--muted)] flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="hidden sm:inline">{t("Recommended for first-time users")}</span>
                                <span className="sm:hidden">{t("Recommended")}</span>
                            </div>
                        </button>


                        {/* Skip Option - COMPACT ON MOBILE */}
                        <button
                            onClick={onSkip}
                            className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[var(--border)] bg-[var(--bg)]/50 hover:border-transparent transition-all hover:scale-105 active:scale-95 text-left overflow-hidden"
                        >
                            {/* Gradient border on hover */}
                            <span
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                style={{
                                    padding: 2,
                                    background: BRAND_GRADIENT,
                                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                    WebkitMaskComposite: "xor",
                                    maskComposite: "exclude",
                                }}
                            />
                            <div className="relative z-10">
                                <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--surface)] group-hover:bg-gradient-to-br group-hover:from-[#4F46E5]/10 group-hover:to-[#22D3EE]/10 flex items-center justify-center shrink-0 text-[var(--text)] transition-all">
                                        <span className="text-lg sm:text-xl">👋</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base sm:text-lg font-bold text-[var(--text)] mb-0.5 sm:mb-1">
                                            {t("I'll figure things out myself")}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-[var(--muted)]">
                                            {t("Jump straight into editing")}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-[10px] sm:text-xs text-[var(--muted)]">
                                    <span className="hidden sm:inline">{t("You can always access the Guide button later")}</span>
                                    <span className="sm:hidden">{t("Access Guide later")}</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Info box - COMPACT ON MOBILE */}
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--bg)]/50 border border-[var(--border)]">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white font-bold text-xs sm:text-base">
                            💡
                        </div>
                        <div className="flex-1">
                            <p className="text-xs sm:text-sm text-[var(--text)]">
                                {t("Look for the")} <span className="font-bold text-[#4F46E5]">{t("Guide")}</span> {t("button in the top navigation bar. Click it anytime to learn what each element does!")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
