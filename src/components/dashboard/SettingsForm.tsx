
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";
import { updateProfile } from "@/actions/profile"; // We need to create this action
import { useState } from "react";

type Profile = {
    businessName: string | null;
    website: string | null;
    currency: string | null;
    email: string | null;
};

export default function SettingsForm({ initialProfile }: { initialProfile: Profile }) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    async function onSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                await updateProfile(formData);
                setMessage({ text: t("Settings saved successfully"), type: 'success' });
            } catch (e) {
                setMessage({ text: t("Failed to save settings"), type: 'error' });
            }
        });
    }

    return (
        <form action={onSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text)]">{t("Business Name")}</label>
                    <input
                        type="text"
                        name="businessName"
                        defaultValue={initialProfile.businessName || ""}
                        placeholder="Acme Corp"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--brand-1)] transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text)]">{t("Website")}</label>
                    <input
                        type="url"
                        name="website"
                        defaultValue={initialProfile.website || ""}
                        placeholder="https://example.com"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--brand-1)] transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text)]">{t("Default Currency")}</label>
                    <select
                        name="currency"
                        defaultValue={initialProfile.currency || "USD"}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--brand-1)] transition-colors appearance-none"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                    </select>
                </div>
            </div>

            {message && (
                <div className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button type="submit" variant="brand" disabled={isPending}>
                    {isPending ? t("Saving...") : t("Save Changes")}
                </Button>
            </div>
        </form>
    );
}
