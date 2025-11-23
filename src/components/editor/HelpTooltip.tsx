// src/components/editor/HelpTooltip.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Info } from "lucide-react";
import { t } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

type Props = {
    content: string;
    targetElement: HTMLElement;
    onClose: () => void;
};

export default function HelpTooltip({ content, targetElement, onClose }: Props) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!tooltipRef.current || !targetElement) return;

        const updatePosition = () => {
            const targetRect = targetElement.getBoundingClientRect();
            const tooltipRect = tooltipRef.current!.getBoundingClientRect();
            const padding = 12;

            let top = targetRect.bottom + padding;
            let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;

            // Keep within viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Adjust horizontal position
            if (left < padding) left = padding;
            if (left + tooltipRect.width > viewportWidth - padding) {
                left = viewportWidth - tooltipRect.width - padding;
            }

            // If no space below, show above
            if (top + tooltipRect.height > viewportHeight - padding) {
                top = targetRect.top - tooltipRect.height - padding;
            }

            setPosition({ top, left });
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition);
        };
    }, [targetElement]);

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
                className="fixed inset-0 z-[90]"
                onClick={onClose}
            />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="fixed z-[95] w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                style={{ top: position.top, left: position.left }}
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

                {/* Arrow pointing to element */}
                <div
                    className="absolute w-3 h-3 rotate-45 border-l border-t border-[var(--border)] bg-[var(--card)]"
                    style={{
                        top: -6,
                        left: "50%",
                        transform: "translateX(-50%) rotate(45deg)",
                    }}
                />
            </div>
        </>
    );
}
