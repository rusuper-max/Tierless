"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Lock } from "lucide-react";
import { createTeamAction } from "@/actions/teams";
import { Button } from "@/components/ui/Button";

type TeamLimitInfo = {
    canCreate: boolean;
    current: number;
    limit: number | "unlimited";
    requiredPlan?: string;
};

export function CreateTeamModal({
    trigger,
    limitInfo
}: {
    trigger?: React.ReactNode;
    limitInfo?: TeamLimitInfo;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const canCreate = limitInfo?.canCreate ?? true;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await createTeamAction(name);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else if (res?.success) {
            setOpen(false);
            setName("");
            // Redirect to the new team context
            router.push(`/dashboard/teams`); // Or directly to /dashboard/t/[id] if we had the ID. 
            // The action returns slug, but we usually route by ID or slug? 
            // Current routing is /dashboard/t/[teamId]. 
            // Wait, createTeamAction returns { slug }. Does it return ID? 
            // db.createTeam returns the whole team object. 
            // We should check createTeamAction and maybe return ID too.
            // For now, refreshing /teams is fine.
            router.refresh();
            setLoading(false);
        }
    }

    // If limit reached, show upsell instead
    if (!canCreate) {
        return (
            <div className="relative group">
                {trigger || (
                    <Button size="sm" variant="neutral" disabled className="opacity-60">
                        <Lock className="w-4 h-4 mr-1.5" />
                        Create Team
                    </Button>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {limitInfo?.limit === 0 
                        ? "Upgrade to Starter to create teams"
                        : `Team limit reached (${limitInfo?.current}/${limitInfo?.limit}). Upgrade to create more.`
                    }
                </div>
            </div>
        );
    }

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <Button size="sm" variant="brand">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create Team
                    </Button>
                )}
            </div>

            {open && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative z-[51] w-full max-w-md bg-[var(--card)] rounded-xl shadow-2xl border border-[var(--border)] p-6 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-[var(--text)] mb-2">Create New Team</h2>
                        <p className="text-sm text-[var(--muted)] mb-6">
                            Teams allow you to collaborate with others on shared calculators.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Acrobat Marketing"
                                    className="field w-full bg-[var(--surface)] text-[var(--text)]"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="danger"
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="brand"
                                    disabled={loading || !name.trim()}
                                >
                                    {loading ? "Creating..." : "Create Team"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
