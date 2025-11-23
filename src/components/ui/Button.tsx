"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "brand" | "danger" | "neutral" | "success" | "ghost";
type Size = "xs" | "sm" | "md" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    href?: string;
    icon?: React.ReactNode;
    external?: boolean;
    disabled?: boolean;
    pill?: boolean;
    title?: string;
    className?: string;
    isLoading?: boolean;
    hoverText?: string;
}

const SIZES = {
    xs: "h-7 px-3 text-xs",
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    icon: "h-9 w-9 p-0 flex items-center justify-center",
};

export function Button({
    children,
    variant = "neutral",
    size = "xs",
    href,
    icon,
    external,
    className,
    disabled,
    pill = true,
    title,
    isLoading,
    hoverText,
    onClick,
    ...props
}: ButtonProps) {

    const isDisabled = disabled || isLoading;
    const radiusClass = pill ? "rounded-full" : "rounded-xl";

    let variantClasses = "";
    let gradientBorderLayer = null;

    switch (variant) {
        case "brand":
            // --- HOLOGRAPHIC TECH BUTTON (Neutral Text + Gradient Border) ---
            variantClasses = `
        bg-transparent font-medium tracking-wide
        /* Neutral tekst (crn/bel) */
        text-slate-900 dark:text-white
        
        /* Hover: Ostaje neutralno */
        hover:text-slate-950 dark:hover:text-slate-50
        hover:-translate-y-[1px]
        /* Jači glow sa brand bojama */
        hover:shadow-[0_0_20px_-4px_rgba(79,70,229,0.4)] dark:hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.5)]
        active:translate-y-0 active:scale-95
      `;

            // Gradient border - Full Opacity
            gradientBorderLayer = (
                <div
                    className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        "opacity-100",
                        radiusClass
                    )}
                    style={{
                        border: '1.5px solid transparent',
                        background: 'linear-gradient(135deg, #4F46E5, #22D3EE) border-box',
                        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        pointerEvents: 'none'
                    }}
                />
            );
            break;

        case "neutral":
            // --- NEUTRAL (Boosted Contrast) ---
            variantClasses = `
        bg-transparent
        /* Light: Standardno sivo */
        border border-slate-300 text-slate-700
        /* Dark: Svetlije sivo (Slate-600 border, Slate-300 text) da ne bude "mrtvo" */
        dark:border-slate-600 dark:text-slate-300
        
        /* Hover: Brand boje */
        hover:border-[#22D3EE] hover:text-[#22D3EE] hover:bg-[#22D3EE]/5
        dark:hover:border-[#22D3EE] dark:hover:text-[#22D3EE] dark:hover:bg-[#22D3EE]/10
        
        active:scale-95
      `;
            break;

        case "danger":
            // --- DANGER (Clear Red) ---
            variantClasses = `
        bg-transparent 
        border border-rose-300 text-rose-600
        dark:border-rose-500/60 dark:text-rose-400
        
        hover:bg-rose-50 dark:hover:bg-rose-500/10 
        hover:border-rose-500 dark:hover:border-rose-400
        dark:hover:shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]
        
        active:scale-95
      `;
            break;

        case "success":
            // --- SUCCESS (Clear Green) ---
            variantClasses = `
        bg-transparent 
        border border-emerald-300 text-emerald-700
        dark:border-emerald-500/60 dark:text-emerald-400
        
        hover:bg-emerald-50 dark:hover:bg-emerald-500/10
        hover:border-emerald-500 dark:hover:border-emerald-400
      `;
            break;

        case "ghost":
            variantClasses = `
        border border-transparent 
        text-slate-500 hover:text-slate-900 hover:bg-slate-100
        dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5
      `;
            break;
    }

    const baseClasses = cn(
        "group relative isolate inline-flex items-center justify-center transition-all duration-300 ease-out select-none",
        radiusClass,
        SIZES[size],
        isDisabled ? "opacity-50 cursor-not-allowed grayscale pointer-events-none" : "cursor-pointer",
        variantClasses,
        className
    );

    const content = (
        <>
            {gradientBorderLayer}

            <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

                <span className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    hoverText && !isLoading ? "group-hover:opacity-0 group-hover:-translate-y-2 absolute" : ""
                )}>
                    {!isLoading && icon && <span className="shrink-0 flex items-center">{icon}</span>}
                    {children}
                </span>

                {hoverText && !isLoading && (
                    <span className="flex items-center justify-center gap-2 opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 font-bold">
                        {hoverText}
                    </span>
                )}
            </span>
        </>
    );

    if (href && !isDisabled) {
        return (
            <Link
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className={baseClasses}
                title={title}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            disabled={isDisabled}
            onClick={onClick}
            className={baseClasses}
            title={title}
            type="button"
            {...props}
        >
            {content}
        </button>
    );
}