"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftRight, Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { getUserTeams, type Team } from "@/lib/db";
import { createPortal } from "react-dom";

export function TeamSwitcher({
    teams: initialTeams = [],
}: {
    teams?: Team[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const anchorRef = useRef<HTMLButtonElement>(null);

    // Determine active context
    const isPersonal = !pathname.includes("/dashboard/t/");
    const activeTeamId = !isPersonal
        ? pathname.split("/dashboard/t/")[1]?.split("/")[0]
        : null;

    const activeTeam = teams.find((t) => t.id === activeTeamId);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (anchorRef.current && anchorRef.current.contains(e.target as any)) return;
            // Also check if click is inside the portal (simple check: if closest .team-switcher-popover)
            if ((e.target as HTMLElement).closest(".team-switcher-popover")) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    // Fetch teams client-side if needed (or we can rely on props)
    // For now, let's just use what we have, but maybe fetch once on mount to be sure
    useEffect(() => {
        // We could invoke a server action here to refresh teams list
        // async function refresh() {
        //   const list = await getUserTeams(userEmail); 
        //   setTeams(list);
        // }
        // refresh();
    }, []);

    const handleSwitch = (teamId: string | null) => {
        setOpen(false);
        if (!teamId) {
            router.push("/dashboard");
        } else {
            router.push(`/dashboard/t/${teamId}`);
        }
    };

    const Popup = () => {
        if (!open || !anchorRef.current) return null;
        const rect = anchorRef.current.getBoundingClientRect();

        return createPortal(
            <div
                className="team-switcher-popover fixed z-[100] w-[240px] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
                style={{
                    top: rect.bottom + 6,
                    left: rect.left,
                }}
            >
                <div className="px-2 py-1.5 text-xs font-semibold text-[var(--muted)]">Personal Account</div>
                <button
                    onClick={() => handleSwitch(null)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${isPersonal ? "bg-[var(--accent)] text-[var(--text)]" : "text-[var(--text)] hover:bg-[var(--accent)]/50"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600">
                            <User size={12} />
                        </div>
                        <span>Personal</span>
                    </div>
                    {isPersonal && <Check size={14} />}
                </button>

                <div className="my-1 border-t border-[var(--border)]" />

                <div className="px-2 py-1.5 text-xs font-semibold text-[var(--muted)]">Teams</div>
                {teams.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-[var(--muted)] italic text-center">
                        No teams yet
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {teams.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleSwitch(t.id)}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${activeTeamId === t.id
                                        ? "bg-[var(--accent)] text-[var(--text)]"
                                        : "text-[var(--text)] hover:bg-[var(--accent)]/50"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded bg-indigo-100 text-indigo-600 uppercase text-[10px] font-bold">
                                        {t.name.substring(0, 1)}
                                    </div>
                                    <span className="truncate max-w-[140px]">{t.name}</span>
                                </div>
                                {activeTeamId === t.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                )}

                <div className="my-1 border-t border-[var(--border)]" />

                <button
                    onClick={() => {
                        setOpen(false);
                        router.push("/dashboard/teams");
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-[var(--text)] hover:bg-[var(--accent)]/50 transition-colors"
                >
                    <div className="flex items-center justify-center w-5 h-5 rounded border border-[var(--border)]">
                        <Plus size={12} />
                    </div>
                    <span>Create Team</span>
                </button>
            </div>,
            document.body
        );
    };

    return (
        <>
            <button
                ref={anchorRef}
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full h-10 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)]/50 transition-all text-sm group"
            >
                <div className="flex items-center gap-2">
                    {activeTeam ? (
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-indigo-100 text-indigo-600 uppercase text-[10px] font-bold">
                            {activeTeam.name.substring(0, 1)}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600">
                            <User size={12} />
                        </div>
                    )}
                    <span className="font-medium text-[var(--text)] max-w-[100px] truncate">
                        {activeTeam ? activeTeam.name : "Personal"}
                    </span>
                </div>
                <ChevronsUpDown size={14} className="text-[var(--muted)] group-hover:text-[var(--text)]" />
            </button>

            <Popup />
        </>
    );
}
