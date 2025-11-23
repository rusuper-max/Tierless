// src/components/editor/HelpModeIntro.tsx
"use client";

import { useState } from "react";
import { X, HelpCircle, MousePointer } from "lucide-react";
import { t } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

type Props = {
    onClose: () => void;
    onDontShowAgain: () => void;
};

export default function HelpModeIntro({ onClose, onDontShowAgain }: Props) {
    const [dontShow, setDontShow] = useState(false);

    const handleGotIt = () => {
        if (dontShow) {
            onDontShowAgain();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header with gradient */}
                <div className="relative p-6 pb-4">
                    <div className="absolute inset-0 opacity-5" style={{ background: BRAND_GRADIENT }} />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--surface)] text-[var(--muted)] transition-colors z-10"
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
                                {t("Your cursor is now a question mark")}
                            </h3>
                            <p className="text-xs text-[var(--muted)]">
                                {t("Click on any button or element to see what it does. Try clicking Save, Add Item, or Theme buttons!")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg)]/50 border border-[var(--border)]">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white font-bold text-lg">
                            ?
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-[var(--text)] mb-1">
                                {t("Exit anytime")}
                            </h3>
                            <p className="text-xs text-[var(--muted)]">
                                {t("Press ESC or click the Guide button again to exit Help Mode.")}
                            </p>
                        </div>
                    </div>

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
