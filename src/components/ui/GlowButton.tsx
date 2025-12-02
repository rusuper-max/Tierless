"use client";

import Link from "next/link";
import { ReactNode } from "react";

type Props = {
    href?: string;
    children: ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    className?: string;
    onClick?: () => void;
};

/**
 * GlowButton - Premium button with glow + shine sweep effect
 * 
 * Variants:
 * - primary: Gradient background with glow
 * - secondary: White/outline with subtle glow
 * - ghost: Text only with background on hover
 */
export default function GlowButton({
    href,
    children,
    variant = "primary",
    className = "",
    onClick,
}: Props) {
    const baseStyles = `
        relative inline-flex items-center justify-center gap-2
        font-semibold text-lg
        transition-all duration-300 ease-out
        overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2
    `;

    const variants = {
        primary: `
            h-14 px-8 rounded-full
            bg-gradient-to-r from-indigo-600 to-cyan-500
            text-white
            shadow-lg shadow-indigo-500/25
            hover:shadow-xl hover:shadow-cyan-500/40
            hover:scale-[1.03]
            active:scale-[0.98]
        `,
        secondary: `
            h-14 px-8 rounded-full
            bg-white border border-slate-200
            text-slate-700
            shadow-sm
            hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10
            hover:text-slate-900
            hover:scale-[1.02]
            active:scale-[0.98]
        `,
        ghost: `
            h-12 px-6 rounded-full
            text-slate-500
            hover:text-slate-700 hover:bg-slate-100
            active:bg-slate-200
        `,
    };

    const content = (
        <>
            {/* Shine sweep effect - only for primary */}
            {variant === "primary" && (
                <span 
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    aria-hidden="true"
                />
            )}
            
            {/* Glow ring on hover - for primary and secondary */}
            {(variant === "primary" || variant === "secondary") && (
                <span 
                    className={`
                        absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        ${variant === "primary" 
                            ? "bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 blur-xl scale-110" 
                            : "bg-cyan-400/10 blur-lg scale-105"
                        }
                    `}
                    aria-hidden="true"
                />
            )}
            
            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </>
    );

    const combinedClassName = `group ${baseStyles} ${variants[variant]} ${className}`.trim();

    if (href) {
        return (
            <Link href={href} className={combinedClassName}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={combinedClassName}>
            {content}
        </button>
    );
}


