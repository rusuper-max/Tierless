"use client";

import Link from "next/link";
import { t } from "@/i18n";
import { track } from "@/lib/track";
import { ReactNode } from "react";

type Props = {
    slug: string;
    name: string;
    className?: string;
    children?: ReactNode;
    style?: React.CSSProperties;
};

export default function UseTemplateButton({ slug, name, className, children, style }: Props) {
    const href = `/editor/new?template=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`;

    return (
        <Link
            href={href}
            prefetch={false}
            onClick={() => track?.("template_use_clicked", { slug, name })}
            className={[
                "group relative inline-flex items-center justify-center overflow-hidden transition-all duration-300",
                className ?? "rounded-lg border px-3 py-1.5 text-sm font-medium",
            ].join(" ")}
            style={style}
            aria-label={t("Use template: {name}", { name })}
        >
            {/* Gradient Border (revealed on hover) */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* White Background (Always present, inset by 1px to show border on hover) */}
            <div className="absolute inset-[1px] bg-white rounded-[calc(0.5rem-1px)] z-10" />

            {/* Shine Effect - Gradient beam moving across */}
            <div className="absolute inset-0 z-20 overflow-hidden rounded-[inherit] pointer-events-none">
                <div className="absolute top-0 -left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -skew-x-[20deg] group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
            </div>

            {/* Content - Dark text for readability */}
            <span className="relative z-30 flex items-center gap-2 text-slate-700 group-hover:text-slate-900 transition-colors font-semibold">
                {children || t("Use template")}
            </span>
        </Link>
    );
}
