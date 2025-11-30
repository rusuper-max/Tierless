// src/components/editor/HelpModeIntro.tsx
"use client";

import { useState } from "react";
import { X, HelpCircle, MousePointer, Sparkles } from "lucide-react";
import { t } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

type Props = {
    onClose: () => void;
    onDontShowAgain: () => void;
    onActivate?: () => void; // Called when user clicks "Got it" to activate help mode
    onStartTour?: () => void;
};

export default function HelpModeIntro({ onClose, onDontShowAgain, onActivate, onStartTour }: Props) {
    const [dontShow, setDontShow] = useState(false);
    const [closeHover, setCloseHover] = useState(false);

    const handleGotIt = () => {
        if (dontShow) {
            onDontShowAgain();
        } else {
            onClose();
        }
        // Activate help mode
        onActivate?.();
    };

    const handleStartTour = () => {
        if (dontShow) {
            onDontShowAgain();
        } else {
            onClose();
        }
        onStartTour?.();
    };

    const handleClose = () => {
        if (dontShow) {
            onDontShowAgain();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header with gradient */}
                <div className="relative p-6 pb-4">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: BRAND_GRADIENT }} />
                    <button
                        onClick={handleClose}
                        type="button"
                        onMouseEnter={() => setCloseHover(true)}
                        onMouseLeave={() => setCloseHover(false)}
                        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40"
                        style={{
                            background: closeHover ? BRAND_GRADIENT : "rgba(255,255,255,0.08)",
                            color: closeHover ? "#fff" : "var(--muted)",
                            boxShadow: closeHover ? "0 12px 24px rgba(79,70,229,0.35)" : "none",
                        }}
                        title={t("Close")}
                        aria-label={t("Close")}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: BRAND_GRADIENT }}>
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
                            {t("Welcome to Help Mode")}
                        </h2>
                        <p className="text-sm text-[var(--muted)]">
                            {t("Learn what everything does in just one click")}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg)]/50 border border-[var(--border)]">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BRAND_GRADIENT }}>
                            <MousePointer className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-[var(--text)] mb-1">
                                {t("Click to learn")}
                            </h3>
                            <p className="text-xs text-[var(--muted)]">
                                {t("Your cursor is now a question mark. Click on any button, field, or element to see what it does!")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg)]/50 border border-[var(--border)]">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white font-bold text-lg">
                            ✓
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-[var(--text)] mb-1">
                                {t("Exit anytime")}
                            </h3>
                            <p className="text-xs text-[var(--muted)]">
                                {t("Press ESC on your keyboard, click the Guide button in the navbar, or use the Exit button that appears on mobile.")}
                            </p>
                        </div>
                    </div>

                    {onStartTour && (
                        <div className="flex flex-col gap-4 p-4 rounded-xl bg-[var(--surface)]/80 border border-dashed border-[var(--border)]">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#4F46E5]/20 to-[#22D3EE]/20 text-[#4F46E5]">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-[var(--text)] mb-1">
                                        {t("Need the full walkthrough?")}
                                    </h3>
                                    <p className="text-xs text-[var(--muted)]">
                                        {t("Open the interactive onboarding tour to see each key feature step-by-step.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartTour}
                                type="button"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-transparent bg-white/80 text-[#0f172a] hover:bg-white transition-all shadow-sm"
                            >
                                <Sparkles className="w-4 h-4" />
                                {t("Start walkthrough")}
                            </button>
                        </div>
                    )}

                    {/* Don't show again checkbox */}
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface)] cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={dontShow}
                            onChange={(e) => setDontShow(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#4F46E5] cursor-pointer"
                        />
                        <span className="text-sm text-[var(--text)] select-none">
                            {t("Don't show this again")}
                        </span>
                    </label>

                    {/* Action button */}
                    <button
                        onClick={handleGotIt}
                        type="button"
                        className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                        style={{ background: BRAND_GRADIENT }}
                    >
                        {t("Got it, let's explore!")}
                    </button>
                </div>
            </div>
        </div>
    );
}
