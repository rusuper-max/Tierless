// src/components/editor/GuidedTour.tsx
"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useT } from "@/i18n";

const BRAND_GRADIENT = "linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)";

const getCenteredPosition = () => {
    if (typeof window === "undefined") {
        return { top: 0, left: 0 };
    }
    return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
};

export type TourStep = {
    target: string; // CSS selector or data-tour attribute
    title: string;
    content: string;
    placement?: "top" | "bottom" | "left" | "right";
};

type Placement = NonNullable<TourStep["placement"]>;

type Props = {
    steps: TourStep[];
    onComplete: () => void;
    onSkip: () => void;
};

export default function GuidedTour({ steps, onComplete, onSkip }: Props) {
    const t = useT();
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState(getCenteredPosition);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [currentPlacement, setCurrentPlacement] = useState<Placement>("bottom");
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const maskId = useId();
    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const updateViewport = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
        };
        updateViewport();
        window.addEventListener("resize", updateViewport);
        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    const updatePosition = useCallback(() => {
        if (!step || typeof document === "undefined") return;

        const targetElement = document.querySelector(step.target) as HTMLElement | null;
        if (!targetElement) {
            console.warn(`Tour target not found: ${step.target}`);
            setTargetRect(null);
            setTooltipPosition(getCenteredPosition());
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const placement = step.placement || "bottom";

        let top = 0;
        let left = 0;

        switch (placement) {
            case "top":
                top = rect.top - 16;
                left = rect.left + rect.width / 2;
                break;
            case "left":
                top = rect.top + rect.height / 2;
                left = rect.left - 24;
                break;
            case "right":
                top = rect.top + rect.height / 2;
                left = rect.right + 24;
                break;
            case "bottom":
            default:
                top = rect.bottom + 16;
                left = rect.left + rect.width / 2;
                break;
        }

        setCurrentPlacement(placement);
        setTooltipPosition({ top, left });
        setTargetRect(rect);
    }, [step]);

    // Recalculate placement whenever viewport or step changes
    useEffect(() => {
        if (typeof window === "undefined") return;

        updatePosition();
        const handle = () => updatePosition();
        window.addEventListener("resize", handle);
        window.addEventListener("scroll", handle, true);
        return () => {
            window.removeEventListener("resize", handle);
            window.removeEventListener("scroll", handle, true);
        };
    }, [updatePosition]);

    // Scroll element into view when the step changes
    useEffect(() => {
        if (!step || typeof document === "undefined") return;
        const targetElement = document.querySelector(step.target) as HTMLElement | null;
        targetElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [step]);

    // Allow ESC to exit the tour
    useEffect(() => {
        if (typeof window === "undefined") return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onSkip();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onSkip]);

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStep((prev) => Math.max(prev - 1, 0));
        }
    };

    if (!step) return null;

    const transforms: Record<Placement, string> = {
        bottom: "translate(-50%, 0)",
        top: "translate(-50%, -100%)",
        left: "translate(-100%, -50%)",
        right: "translate(0, -50%)",
    };

    const highlightPadding = 12;
    const highlightRect = targetRect
        ? {
            x: Math.max(0, targetRect.left - highlightPadding),
            y: Math.max(0, targetRect.top - highlightPadding),
            width: targetRect.width + highlightPadding * 2,
            height: targetRect.height + highlightPadding * 2,
        }
        : null;

    const viewBox =
        viewport.width > 0 && viewport.height > 0
            ? `0 0 ${viewport.width} ${viewport.height}`
            : undefined;

    return (
        <>
            {/* Overlay with spotlight effect */}
            {viewBox && (
                <svg
                    className="fixed inset-0 z-[200] pointer-events-auto"
                    width={viewport.width}
                    height={viewport.height}
                    viewBox={viewBox}
                >
                    <defs>
                        <mask id={maskId}>
                            <rect width="100%" height="100%" fill="white" />
                            {highlightRect && (
                                <rect
                                    x={highlightRect.x}
                                    y={highlightRect.y}
                                    width={highlightRect.width}
                                    height={highlightRect.height}
                                    rx={16}
                                    ry={16}
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.75)"
                        mask={`url(#${maskId})`}
                    />
                    {highlightRect && (
                        <rect
                            x={highlightRect.x}
                            y={highlightRect.y}
                            width={highlightRect.width}
                            height={highlightRect.height}
                            rx={16}
                            ry={16}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth={2}
                            style={{
                                filter: "drop-shadow(0 0 18px rgba(34, 211, 238, 0.45))",
                            }}
                        />
                    )}
                </svg>
            )}

            {/* Tooltip */}
            <div
                className="fixed z-[201] pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300"
                style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                    transform: transforms[currentPlacement] || transforms.bottom,
                    maxWidth: "400px",
                }}
            >
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="relative p-4 pb-3" style={{ background: BRAND_GRADIENT }}>
                        <button
                            onClick={onSkip}
                            type="button"
                            className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 transition-all pointer-events-auto"
                            aria-label={t("Close")}
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-white" />
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                                {t("Step")} {currentStep + 1} / {steps.length}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-white pr-8">
                            {step.title}
                        </h3>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <p className="text-sm text-[var(--text)] leading-relaxed mb-4">
                            {step.content}
                        </p>

                        {/* Navigation */}
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={onSkip}
                                type="button"
                                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                            >
                                {t("Skip Tour")}
                            </button>

                            <div className="flex items-center gap-2">
                                {!isFirstStep && (
                                    <button
                                        onClick={handleBack}
                                        type="button"
                                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {t("Back")}
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    type="button"
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    style={{ background: BRAND_GRADIENT }}
                                >
                                    {isLastStep ? t("Finish") : t("Next")}
                                    {!isLastStep && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
