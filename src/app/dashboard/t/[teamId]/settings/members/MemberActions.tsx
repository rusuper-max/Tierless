"use client";

import { useState, useTransition } from "react";
import { updateMemberRole } from "@/actions/teams";

type RoleDropdownProps = {
    teamId: string;
    userId: string;
    currentRole: string;
};

export function RoleDropdown({ teamId, userId, currentRole }: RoleDropdownProps) {
    const [role, setRole] = useState(currentRole);
    const [isPending, startTransition] = useTransition();

    const handleChange = (newRole: string) => {
        if (newRole === role) return;

        startTransition(async () => {
            const result = await updateMemberRole(teamId, userId, newRole as "viewer" | "editor" | "admin");
            if (result.success) {
                setRole(newRole);
            } else {
                // Reset on error
                alert(result.error || "Failed to update role");
            }
        });
    };

    return (
        <select
            value={role}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isPending}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 cursor-pointer"
        >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
        </select>
    );
}
