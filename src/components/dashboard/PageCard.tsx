"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FavoriteStar } from "./DashboardUI";

type MiniCalc = {
    meta: {
        name: string;
        slug: string;
        published?: boolean;
        online?: boolean;
        favorite?: boolean;
        createdAt?: number;
    };
};

// Props mirroring the row
type PageCardProps = {
    row: MiniCalc;
    isSelected: boolean;
    onSelectToggle: (slug: string) => void;
    onShare: (slug: string) => void;
    onOpenPublic: (row: MiniCalc) => void;
    onEdit: (slug: string) => void;
    onRenameStart: (slug: string, name: string) => void;
    onDuplicate: (slug: string, name: string) => void;
    onDelete: (slug: string, name: string) => void;
    onToggleOnline: (slug: string, next: boolean) => void;
    onToggleFavorite: (slug: string, next: boolean) => void;
    busySlug: string | null;
    publishedCount: number;
    publishedLimit: number;
    moveBy: (slug: string, dir: -1 | 1) => void;
    onMove: (slug: string) => void;
};

export default function PageCard({
    row,
    isSelected,
    onSelectToggle,
    onShare,
    onOpenPublic,
    onEdit,
    onRenameStart,
    onDuplicate,
    onDelete,
    onToggleOnline,
    onToggleFavorite,
    busySlug,
    publishedCount,
    publishedLimit,
    moveBy,
    onMove,
}: PageCardProps) {
    const { slug, name, favorite, createdAt } = row.meta;
    const published = !!(row.meta.published ?? row.meta.online);
    const dateStr = createdAt ? new Date(createdAt).toLocaleDateString() : "—";
    const statusBase =
        "inline-flex items-center justify-center rounded-full border px-3.5 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer min-w-[96px]";
    const onlineClasses =
        "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-400/20 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/30";
    const offlineClasses =
        "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-400/20 dark:border-rose-400/50 dark:text-rose-200 dark:hover:bg-rose-400/30";
    const toggleDisabled =
        busySlug === slug || (!published && Number.isFinite(publishedLimit) && publishedCount >= publishedLimit);

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => onSelectToggle(slug)} aria-label="Select" className="accent-[var(--brand-1,#4F46E5)]" />
                    <div>
                        <button className="p-1 rounded-md hover:bg-[var(--surface)]" onClick={() => onToggleFavorite(slug, !favorite)}>
                            <FavoriteStar active={!!favorite} />
                        </button>
                        <div className="font-semibold text-[var(--text)]">{name}</div>
                        <p className="text-xs text-[var(--muted)]">{dateStr}</p>
                    </div>
                </div>
                <Button variant="neutral" size="xs" onClick={() => onShare(slug)} disabled={!published}>
                    <Share2 className="size-4" />
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant={published ? "success" : "neutral"}
                    size="xs"
                    onClick={() => onToggleOnline(slug, !published)}
                    disabled={toggleDisabled}
                    className="min-w-[96px]"
                >
                    <span className="block group-hover:hidden">{published ? "Online" : "Offline"}</span>
                    <span className="hidden group-hover:block font-medium">{published ? "Stop" : "Publish"}</span>
                </Button>

                <Button title="Edit" onClick={() => onEdit(slug)} variant="brand" size="xs">Edit</Button>

                {/* Simplified mobile actions - others can be added if needed */}
                {published && <Button title="Public" onClick={() => onOpenPublic(row)} variant="neutral" size="xs">Public</Button>}
                <Button title="Delete" onClick={() => onDelete(slug, name)} disabled={busySlug === slug} variant="danger" size="xs">Delete</Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Button variant="neutral" size="xs" onClick={() => moveBy(slug, -1)} className="w-9 h-9 p-0 rounded-full">‹</Button>
                <Button variant="neutral" size="xs" onClick={() => moveBy(slug, 1)} className="w-9 h-9 p-0 rounded-full">›</Button>
                <span>Reorder</span>
            </div>
        </div>
    );
}
