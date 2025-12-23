"use client";

import Link from "next/link";
import { CSSProperties, useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { useT } from "@/i18n/client";

/* --- Styles --- */
export type BtnVariant = "brand" | "neutral" | "danger";
export type BtnSize = "xs" | "sm";

export function outlineStyle(variant: BtnVariant): CSSProperties {
    const grad =
        variant === "brand"
            ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
            : variant === "danger"
                ? "linear-gradient(90deg,#f97316,#ef4444)"
                : "linear-gradient(90deg,#e5e7eb,#d1d5db)";
    return {
        padding: 1.5,
        background: grad,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        borderRadius: "9999px",
        transition: "opacity .15s ease",
    } as any;
}

/* --- Components --- */

export function FavoriteStar({ active }: { active: boolean }) {
    if (!active) return <Star className="size-4 text-slate-400 dark:text-slate-600" />;
    return (
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
            <defs>
                <linearGradient id="tlStarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--brand-1,#4F46E5)" />
                    <stop offset="100%" stopColor="var(--brand-2,#22D3EE)" />
                </linearGradient>
            </defs>
            <path
                d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill="url(#tlStarGrad)"
                stroke="url(#tlStarGrad)"
                strokeWidth="1"
            />
        </svg>
    );
}

export function ActionButton({
    label,
    title,
    href,
    onClick,
    disabled,
    variant = "neutral",
    size = "xs",
}: {
    label: string;
    title?: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: BtnVariant;
    size?: BtnSize;
}) {
    const base =
        "relative z-0 inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--card,white)] text-sm font-medium transition select-none";
    const pad = size === "xs" ? "px-3 py-1.5" : "px-3.5 py-2";
    const text =
        variant === "danger"
            ? "text-rose-700 dark:text-rose-300"
            : "text-[var(--text,#111827)]";
    const state = disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:shadow-[0_10px_24px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";
    const inner =
        "relative inline-flex items-center gap-1 " + (size === "xs" ? "text-xs" : "text-sm");

    const content = (
        <span className={`${base} ${pad} ${text} ${state}`} title={title}>
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={outlineStyle(variant)} />
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
                style={{
                    boxShadow:
                        variant === "danger"
                            ? "0 0 10px 3px rgba(244,63,94,.22)"
                            : "0 0 12px 3px rgba(34,211,238,.20)",
                    transition: "opacity .2s ease",
                }}
            />
            <span className={inner}>{label}</span>
        </span>
    );

    if (href && !disabled) {
        return (
            <Link href={href} aria-disabled={disabled} className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                {content}
            </Link>
        );
    }
    return (
        <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex group ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
            {content}
        </button>
    );
}

export function IconButton({
    title,
    ariaLabel,
    onClick,
    disabled,
    children,
    variant = "neutral",
    className,
}: {
    title?: string;
    ariaLabel?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    variant?: BtnVariant;
    className?: string;
    children: React.ReactNode;
}) {
    const base =
        "relative z-0 inline-flex items-center justify-center rounded-xl bg-[var(--card,white)] w-8 h-8 transition";
    const pointer = disabled
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer hover:shadow-[0_8px_18px_rgba(2,6,23,.08)] hover:-translate-y-0.5 active:translate-y-0";
    const textColor =
        variant === "danger"
            ? "text-rose-600 dark:text-rose-300"
            : variant === "brand"
                ? "text-[var(--brand-1,#4F46E5)]"
                : "text-[var(--text,#111827)]";
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={ariaLabel || title}
            className={`${base} ${pointer} ${textColor} ${className ?? ""}`}
        >
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl" style={outlineStyle(variant)} />
            <span className="relative z-[1]">{children}</span>
        </button>
    );
}

export function FilterChip({
    active,
    label,
    onClick,
}: {
    active?: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            aria-pressed={!!active}
            className="cursor-pointer relative inline-flex items-center rounded-full text-sm bg-[var(--card)] px-3 py-1"
            title={label}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full z-0"
                style={outlineStyle(active ? "brand" : "neutral")}
            />
            <span className={`relative z-10 ${active ? "font-medium" : ""} text-[var(--text)]`}>
                {label}
            </span>
        </button>
    );
}

export type SortId = "created_desc" | "name_asc" | "status" | "manual";

export function SortDropdown({
    value,
    onChange,
}: {
    value: SortId;
    onChange: (next: SortId) => void;
}) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as any)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const sortOptions: { id: SortId; labelKey: string }[] = [
        { id: "created_desc", labelKey: "dashboard.sort.created" },
        { id: "name_asc", labelKey: "dashboard.sort.name" },
        { id: "status", labelKey: "dashboard.sort.status" },
        { id: "manual", labelKey: "dashboard.sort.manual" },
    ];

    const currentOption = sortOptions.find(opt => opt.id === value);
    const label = currentOption ? t(currentOption.labelKey) : t("dashboard.sort.created");

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="group cursor-pointer relative inline-flex items-center rounded-full bg-[var(--card)] px-3 py-1.5 text-sm"
            >
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-150"
                    style={{ ...outlineStyle("brand"), opacity: open ? 1 : 0 }}
                />
                <span className="relative z-[1] text-[var(--text)]">{label}</span>
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-white dark:bg-slate-900 text-black dark:text-slate-100 shadow-xl p-1 z-[100]">
                        {sortOptions.map((opt) => (
                            <button
                                key={opt.id}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                                onClick={() => { onChange(opt.id); setOpen(false); }}
                            >
                                {t(opt.labelKey)}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function ConfirmDeleteModal({
    open,
    name,
    onCancel,
    onConfirm,
    busy,
}: {
    open: boolean;
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
    busy?: boolean;
}) {
    const t = useT();
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative z-[101] card w-[92vw] max-w-md p-5 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-2xl">
                <div className="text-lg font-semibold text-[var(--text)]">{t("dashboard.messages.deleteConfirmTitle")}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">{t("dashboard.messages.deleteConfirmMessage")}</p>
                <div className="mt-5 flex items-center justify-end gap-2">
                    <ActionButton label={t("dashboard.actions.cancel")} onClick={onCancel} disabled={busy} variant="neutral" />
                    <ActionButton label={busy ? "..." : t("dashboard.actions.delete")} onClick={onConfirm} disabled={busy} variant="danger" />
                </div>
            </div>
        </div>
    );
}
