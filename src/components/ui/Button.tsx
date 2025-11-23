"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
}

// --- DIMENZIJE ---
const SIZES = {
    xs: "px-3 py-1 text-xs h-7",
    sm: "px-4 py-1.5 text-sm h-9",
    md: "px-6 py-2.5 text-base h-11",
    icon: "w-8 h-8 p-0 flex items-center justify-center", // Kvadratno za ikonice
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
    pill = true, // Default na pill (zaokruženo)
    title,
    onClick,
    ...props
}: ButtonProps) {

    /* --- STILOVI --- */
    let variantClasses = "";

    switch (variant) {
        case "brand":
            // EDIT DUGME: Cyan Border, Cyan Text, Transparent BG
            // Na hover: Cyan Glow
            variantClasses = `
        bg-transparent border border-[#22D3EE] text-[#22D3EE]
        hover:bg-[#22D3EE]/10 
        hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.6)]
        active:scale-95
      `;
            break;

        case "neutral":
            // SHARE / MENU: Sivi border, Sivi tekst
            // Na hover: Beli border, Beli tekst
            variantClasses = `
        bg-transparent border border-slate-700 text-slate-400
        hover:border-slate-300 hover:text-slate-100 hover:bg-white/5
        active:scale-95
      `;
            break;

        case "danger":
            // LOGOUT / DELETE: Crveni border, Crveni tekst
            // Na hover: Crveni Glow
            variantClasses = `
        bg-transparent border border-rose-600 text-rose-500
        hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-400
        hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]
        active:scale-95
      `;
            break;

        case "success":
            // ONLINE: Zeleni border, Zeleni tekst
            // Bez jakog glow-a, samo clean status
            variantClasses = `
        bg-transparent border border-emerald-500/50 text-emerald-500
        hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400
      `;
            break;

        case "ghost":
            // LINKOVI: Nema bordera
            variantClasses = `
        border border-transparent text-slate-400 
        hover:text-white hover:bg-white/5
      `;
            break;
    }

    const baseClasses = cn(
        // Base layout
        "relative inline-flex items-center justify-center font-semibold transition-all duration-200 select-none",
        // Cursor & State
        disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer",
        // Shape
        pill ? "rounded-full" : "rounded-xl",
        // Size
        SIZES[size],
        // Colors
        variantClasses,
        className
    );

    const content = (
        <>
            {icon && <span className={children ? "mr-2 shrink-0 flex items-center" : "flex items-center justify-center"}>{icon}</span>}
            {children}
        </>
    );

    if (href && !disabled) {
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
            disabled={disabled}
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