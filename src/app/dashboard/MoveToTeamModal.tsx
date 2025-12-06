"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getMyTeams } from "@/actions/teams";
import { ActionButton } from "@/components/dashboard/DashboardUI";

type Team = { id: string; name: string };

export function MoveToTeamModal({
    slug,
    currentTeamId,
    open,
    onClose,
    onSuccess,
}: {
    slug: string | null;
    currentTeamId?: string;
    open: boolean;
    onClose: () => void;
    onSuccess: (newTeamId: string | null) => void;
}) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [moving, setMoving] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getMyTeams().then((res) => {
                setTeams(res);
                setLoading(false);
            });
        }
    }, [open]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!open || !slug || !mounted || typeof document === "undefined") return null;

    async function handleMove() {
        setMoving(true);
        const targetTeamId = selectedTeam === "personal" ? null : selectedTeam;

        try {
            const res = await fetch(`/api/calculators/${encodeURIComponent(slug!)}/move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId: targetTeamId }), // null for personal
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                alert(json.error || "Failed to move calculator");
            } else {
                onSuccess(targetTeamId);
                onClose();
            }
        } catch (e) {
            alert("An error occurred");
        } finally {
            setMoving(false);
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4" style={{ isolation: "isolate" }}>
            <div className="absolute inset-0 z-[12000] bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative z-[12001] card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Move to Team</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Choose a destination workspace for this calculator.
                </p>

                {loading ? (
                    <div className="py-8 text-center text-slate-500">Loading teams...</div>
                ) : (
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="radio"
                                name="targetTeam"
                                value="personal"
                                checked={selectedTeam === "personal"}
                                onChange={() => setSelectedTeam("personal")}
                                disabled={!currentTeamId}
                            />
                            <div>
                                <div className="font-medium text-slate-900 dark:text-white">Personal Workspace</div>
                                <div className="text-xs text-slate-500">Your private calculators</div>
                            </div>
                        </label>

                        {teams.map(t => (
                            <label key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <input
                                    type="radio"
                                    name="targetTeam"
                                    value={t.id}
                                    checked={selectedTeam === t.id}
                                    onChange={() => setSelectedTeam(t.id)}
                                    disabled={currentTeamId === t.id}
                                />
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">{t.name}</div>
                                    <div className="text-xs text-slate-500">Team Workspace</div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <ActionButton
                        label="Cancel"
                        onClick={onClose}
                        disabled={moving}
                        variant="danger"
                    />
                    <ActionButton
                        label={moving ? "Moving..." : "Move"}
                        onClick={handleMove}
                        disabled={moving || !selectedTeam || (selectedTeam === "personal" && !currentTeamId) || (selectedTeam === currentTeamId)}
                        variant="brand"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
