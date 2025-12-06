"use client";

import { useState } from "react";
import { renameTeam } from "@/actions/teams";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function RenameTeamForm({ teamId, currentName, canManage }: { teamId: string; currentName: string; canManage: boolean }) {
    const router = useRouter();
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setMsg({ type: "error", text: "Name cannot be empty" });
            return;
        }

        setLoading(true);
        setMsg(null);

        const res = await renameTeam(teamId, name.trim());
        setLoading(false);

        if (res?.error) {
            setMsg({ type: "error", text: res.error });
        } else {
            setMsg({ type: "success", text: "Team renamed successfully!" });
            // Refresh to show new name
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Team Name
                </label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!canManage || loading}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        maxLength={32}
                        placeholder="Enter team name"
                    />
                    {canManage && (
                        <Button type="submit" variant="brand" size="sm" disabled={loading} isLoading={loading}>
                            Save
                        </Button>
                    )}
                </div>
            </div>

            {!canManage && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Only admins and owners can rename the team.
                </p>
            )}

            {msg && (
                <div className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                    {msg.text}
                </div>
            )}
        </form>
    );
}
