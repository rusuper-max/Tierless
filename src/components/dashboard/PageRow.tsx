"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Share2, Edit, Copy, Trash, ExternalLink, GripVertical, ArrowRightLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import AnimatedCheckbox from "@/components/ui/AnimatedCheckbox";
import { FavoriteStar } from "./DashboardUI";
import { useT } from "@/i18n/client";

const fmtDateTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

type MiniCalc = {
    meta: {
        name: string;
        slug: string;
        published?: boolean;
        online?: boolean;
        favorite?: boolean;
        order?: number;
        createdAt?: number;
        teamId?: string;
    };
    teamName?: string;
};

type PageRowProps = {
    row: MiniCalc;
    index: number;
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
    isDragging: boolean;
    onPointerDragStart: (slug: string, e: React.MouseEvent<HTMLButtonElement>) => void;
    publishedCount: number;
    publishedLimit: number;
    onMove: (slug: string) => void;
};

export default function PageRow({
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
    isDragging,
    onPointerDragStart,
    publishedCount,
    publishedLimit,
    onMove,
}: PageRowProps) {
    const t = useT();
    const { slug, name, favorite, createdAt } = row.meta;
    const published = !!(row.meta.published ?? row.meta.online);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        const onScroll = () => setMenuOpen(false);
        window.addEventListener("keydown", onKey);
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onScroll);
        };
    }, [menuOpen]);

    const toggleDisabled = busySlug === slug || (!published && Number.isFinite(publishedLimit) && publishedCount >= publishedLimit);

    return (
        <tr className={`align-middle border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${isDragging ? "tl-row--dragging" : ""}`} data-slug={slug}>
            <td className="py-2">
                <AnimatedCheckbox
                    checked={isSelected ?? false}
                    onChange={() => onSelectToggle(slug)}
                    aria-label="Select"
                />
            </td>

            <td className="font-medium py-3">
                <div className="flex items-center gap-3">
                    <button
                        className="p-1 rounded-md hover:bg-[var(--surface)] cursor-pointer transition-colors text-[var(--muted)] hover:text-[var(--text)]"
                        title={favorite ? "Unpin" : "Pin"}
                        onClick={() => onToggleFavorite(slug, !favorite)}
                    >
                        <FavoriteStar active={!!favorite} />
                    </button>
                    <div className="flex flex-col">
                        <span
                            className={`cursor-text truncate max-w-[200px] sm:max-w-[300px] block font-semibold ${published ? "text-[var(--text)]" : "text-[var(--muted)]"
                                }`}
                            onDoubleClick={() => onRenameStart(slug, name)}
                            title="Double-click to rename"
                        >
                            {name}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] opacity-70">
                            {published ? t("dashboard.status.liveOnWeb") : t("dashboard.status.draft")}
                        </span>
                    </div>
                </div>
            </td>

            {/* Team Column */}
            <td className="text-center hidden md:table-cell py-3">
                {row.teamName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface)] text-[var(--muted)]">
                        <Users className="size-3" />
                        <span className="truncate max-w-[100px]" title={row.teamName}>{row.teamName}</span>
                    </span>
                ) : (
                    <span className="text-xs text-[var(--muted)] opacity-50">—</span>
                )}
            </td>

            <td className="text-[var(--muted)] text-center hidden sm:table-cell py-3">
                <Button variant="neutral" size="xs" onClick={() => onShare(slug)} title="Share">
                    <Share2 className="size-4" />
                </Button>
            </td>

            <td className="text-[var(--muted)] text-center hidden md:table-cell text-xs py-3">
                {fmtDateTime(createdAt)}
            </td>

            <td className="text-center py-3">
                <Button
                    variant={published ? "success" : "neutral"}
                    size="xs"
                    onClick={() => onToggleOnline(slug, !published)}
                    disabled={toggleDisabled}
                    className="min-w-[80px]"
                >
                    <span className="block group-hover:hidden">{published ? t("dashboard.status.online") : t("dashboard.status.offline")}</span>
                    <span className="hidden group-hover:block font-medium">{published ? t("dashboard.actions.stop") : t("dashboard.actions.publish")}</span>
                </Button>
            </td>

            {/* ACTIONS COLUMN */}
            <td className="align-middle py-3">
                <div className="w-full flex justify-center">
                    <div className="flex items-center justify-center gap-3 relative">

                        <Button
                            variant="brand"
                            size="xs"
                            onClick={() => onEdit(slug)}
                        >
                            {t("dashboard.actions.edit")}
                        </Button>

                        {/* Public Link Button */}
                        {published ? (
                            // ONLINE: Normalno dugme
                            <Button
                                variant="neutral"
                                size="xs"
                                title="Open Public Page"
                                onClick={() => onOpenPublic(row)}
                            >
                                <ExternalLink className="size-4" />
                            </Button>
                        ) : (
                            // OFFLINE: Crveno dugme (Danger Style)
                            <Button
                                variant="danger"
                                size="xs"
                                disabled
                                title="Page is offline"
                            >
                                <ExternalLink className="size-4" />
                            </Button>
                        )}

                        {/* Meatball Menu with Portal */}
                        <div className="relative">
                            <Button
                                variant="neutral"
                                size="xs"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    if (menuOpen) { setMenuOpen(false); return; }

                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

                                    let top = rect.bottom + scrollY + 8;
                                    let left = rect.right - 192; // 192px = w-48

                                    if (typeof window !== 'undefined' && rect.bottom + 200 > window.innerHeight) {
                                        top = rect.top + scrollY - 8 - 160; // Flip up
                                    }

                                    setMenuPos({ top, left });
                                    setMenuOpen(true);
                                }}
                                title="More actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>

                            {menuOpen && typeof document !== 'undefined' && createPortal(
                                <>
                                    <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />
                                    <div
                                        className="fixed w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[9999] p-1 flex flex-col animate-in fade-in zoom-in-95 duration-100"
                                        style={{ top: menuPos.top, left: menuPos.left, position: 'absolute' }}
                                    >
                                        <button onClick={() => { onShare(slug); setMenuOpen(false); }} disabled={!published} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left disabled:opacity-50 cursor-pointer transition-colors">
                                            <Share2 className="size-4" /> {t("dashboard.actions.share")}
                                        </button>
                                        <button onClick={() => { onRenameStart(slug, name); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer transition-colors">
                                            <Edit className="size-4" /> {t("dashboard.actions.rename")}
                                        </button>
                                        <button onClick={() => { onDuplicate(slug, name); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer transition-colors">
                                            <Copy className="size-4" /> {t("dashboard.actions.duplicate")}
                                        </button>
                                        <button onClick={() => { onMove(slug); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer transition-colors">
                                            <ArrowRightLeft className="size-4" /> {t("dashboard.actions.moveToTeam")}
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                        <button onClick={() => { onDelete(slug, name); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-left cursor-pointer transition-colors">
                                            <Trash className="size-4" /> {t("dashboard.actions.delete")}
                                        </button>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>

                    </div>
                </div>
            </td>

            <td className="text-center hidden lg:table-cell py-3">
                <Button
                    variant="neutral"
                    size="xs"
                    className="w-8 h-8 p-0 rounded-lg cursor-grab active:cursor-grabbing hover:bg-[var(--surface)]"
                    onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => onPointerDragStart(slug, e)}
                >
                    <GripVertical className="size-4" />
                </Button>
            </td>
        </tr>
    );
}