"use client";

import { useState } from "react";
import { inviteMember } from "@/actions/teams";
import type { TeamRole } from "@/lib/db";
import { Button } from "@/components/ui/Button";

export function InviteMemberForm({ teamId }: { teamId: string }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<TeamRole>("viewer");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        const res = await inviteMember(teamId, email, role);
        setLoading(false);

        if (res.error) {
            setMsg({ type: "error", text: res.error });
        } else {
            setMsg({ type: "success", text: "Invitation sent!" });
            setEmail("");
            setRole("viewer");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                </label>
                <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    className="field w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                </label>
                <select
                    className="field bg-white dark:bg-slate-800"
                    value={role}
                    onChange={(e) => setRole(e.target.value as TeamRole)}
                >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={loading}
                isLoading={loading}
            >
                Invite
            </Button>
            {msg && (
                <div className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                    {msg.text}
                </div>
            )}
        </form>
    );
}
