// src/components/editor/HelpTooltip.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Info } from "lucide-react";
import { t } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

type Props = {
    content: string;
    onClose: () => void;
};

export default function HelpTooltip({ content, onClose }: Props) {
    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Centered Tooltip */}
            <div
                className="fixed z-[95] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="relative p-4 pb-3 border-b border-[var(--border)]">
                    <div className="absolute inset-0 opacity-5" style={{ background: BRAND_GRADIENT }} />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: BRAND_GRADIENT }}>
                            <Info className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text)] flex-1">
                            {t("Help")}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-[var(--surface)] text-[var(--muted)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-sm text-[var(--text)] leading-relaxed">
                        {content}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-lg text-xs font-bold text-white hover:scale-105 active:scale-95 transition-all"
                        style={{ background: BRAND_GRADIENT }}
                    >
                        {t("Got it")}
                    </button>
                </div>
            </div>
        </>
    );
}
