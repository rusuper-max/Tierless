// src/app/dashboard/domains/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft, Plus, Trash2, RefreshCw, Check, X,
    Globe, ExternalLink, Copy, AlertTriangle, Loader2, Shield
} from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { getLimit, coercePlan } from "@/lib/entitlements";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CustomDomain {
    id: string;
    domain: string;
    slug: string;
    verified: boolean;
    verifiedAt: string | null;
    sslStatus: "pending" | "active" | "failed";
    createdAt: string;
    verification: {
        name: string;
        value: string;
        type: "TXT";
    } | null;
}

interface UserPage {
    slug: string;
    name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DomainsPage() {
    const { plan } = useAccount();
    const planId = coercePlan(plan);

    // State
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [userPages, setUserPages] = useState<UserPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [formDomain, setFormDomain] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Verification state
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // ─────────────────────────────────────────────────────────────────────────────
    // Check entitlement
    // ─────────────────────────────────────────────────────────────────────────────

    const maxDomains = getLimit(planId, "customDomains");
    const canAddDomain = maxDomains === "unlimited" || domains.length < (maxDomains as number);
    const hasAccess = maxDomains !== 0;

    // ─────────────────────────────────────────────────────────────────────────────
    // Fetch data
    // ─────────────────────────────────────────────────────────────────────────────

    const fetchDomains = useCallback(async () => {
        try {
            const res = await fetch("/api/domains");
            if (!res.ok) throw new Error("Failed to fetch domains");
            const data = await res.json();
            setDomains(data.domains || []);
        } catch (err) {
            setError("Failed to load domains");
        }
    }, []);

    const fetchPages = useCallback(async () => {
        try {
            const res = await fetch("/api/calculators");
            if (!res.ok) return;
            const data = await res.json();
            setUserPages(
                (data.calculators || []).map((c: any) => ({
                    slug: c.meta?.slug,
                    name: c.meta?.name || c.meta?.slug,
                }))
            );
        } catch {
            // Ignore - pages are optional
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchDomains(), fetchPages()]).finally(() => setLoading(false));
    }, [fetchDomains, fetchPages]);

    // ─────────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────────

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);

        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: formDomain, slug: formSlug }),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.message || data.error || "Failed to add domain");
                return;
            }

            setDomains((prev) => [data.domain, ...prev]);
            setShowAddModal(false);
            setFormDomain("");
            setFormSlug("");
        } catch {
            setFormError("Failed to add domain");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async (id: string) => {
        setVerifyingId(id);
        try {
            const res = await fetch(`/api/domains/${id}/verify`, { method: "POST" });
            const data = await res.json();

            if (data.verified) {
                // Update local state
                setDomains((prev) =>
                    prev.map((d) =>
                        d.id === id
                            ? { ...d, verified: true, verifiedAt: new Date().toISOString(), verification: null }
                            : d
                    )
                );
            } else {
                // Show feedback
                alert(data.message || "Verification pending");
            }
        } catch {
            alert("Verification failed");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this domain?")) return;

        try {
            const res = await fetch(`/api/domains/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setDomains((prev) => prev.filter((d) => d.id !== id));
        } catch {
            alert("Failed to remove domain");
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Render: No access
    // ─────────────────────────────────────────────────────────────────────────────

    if (!hasAccess) {
        return (
            <div className="container-page py-8">
                <Link
                    href="/dashboard/integrations"
                    className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] mb-6"
                >
                    <ArrowLeft size={16} /> Back to Integrations
                </Link>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
                        <Globe className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
                        Custom Domains (Pro+)
                    </h2>
                    <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
                        Connect your own domain (e.g., menu.yourbusiness.com) to your pricing pages.
                        This feature is available on Pro and higher plans.
                    </p>
                    <Link
                        href="/start"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 font-medium transition-all"
                    >
                        Upgrade to Pro
                    </Link>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Render: Main
    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <div className="container-page py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link
                        href="/dashboard/integrations"
                        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] mb-2"
                    >
                        <ArrowLeft size={16} /> Back to Integrations
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Custom Domains</h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        Connect your own domains to pricing pages • {domains.length} / {maxDomains === "unlimited" ? "∞" : maxDomains}
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    disabled={!canAddDomain}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                >
                    <Plus size={18} /> Add Domain
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 mb-6 text-rose-300">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--muted)]" />
                </div>
            ) : domains.length === 0 ? (
                /* Empty state */
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
                    <Globe className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No domains yet</h3>
                    <p className="text-[var(--muted)] mb-4">
                        Add your first custom domain to brand your pricing pages.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                    >
                        <Plus size={16} /> Add Domain
                    </button>
                </div>
            ) : (
                /* Domain list */
                <div className="space-y-4">
                    {domains.map((domain) => (
                        <div
                            key={domain.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${domain.verified
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-amber-500/20 text-amber-400"
                                            }`}
                                    >
                                        {domain.verified ? <Check size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[var(--text)]">{domain.domain}</span>
                                            <a
                                                href={`https://${domain.domain}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--muted)] hover:text-[var(--text)]"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                        <div className="text-sm text-[var(--muted)]">
                                            → {domain.slug}
                                            {domain.verified && (
                                                <span className="ml-2 text-emerald-400">✓ Verified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!domain.verified && (
                                        <button
                                            onClick={() => handleVerify(domain.id)}
                                            disabled={verifyingId === domain.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                                        >
                                            {verifyingId === domain.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <RefreshCw size={14} />
                                            )}
                                            Verify
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(domain.id)}
                                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        title="Remove domain"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Verification instructions */}
                            {!domain.verified && domain.verification && (
                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <p className="text-sm text-[var(--muted)] mb-3">
                                        Add this TXT record to your DNS settings:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-[var(--surface)] p-3">
                                            <div className="text-xs text-[var(--muted)] mb-1">Name / Host</div>
                                            <div className="flex items-center justify-between">
                                                <code className="text-sm text-[var(--text)] break-all">
                                                    {domain.verification.name}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(domain.verification!.name, `name-${domain.id}`)}
                                                    className="p-1 text-[var(--muted)] hover:text-[var(--text)]"
                                                >
                                                    {copiedField === `name-${domain.id}` ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-[var(--surface)] p-3">
                                            <div className="text-xs text-[var(--muted)] mb-1">Value</div>
                                            <div className="flex items-center justify-between">
                                                <code className="text-sm text-[var(--text)] break-all">
                                                    {domain.verification.value}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(domain.verification!.value, `value-${domain.id}`)}
                                                    className="p-1 text-[var(--muted)] hover:text-[var(--text)]"
                                                >
                                                    {copiedField === `value-${domain.id}` ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[var(--muted)] mt-3">
                                        DNS changes can take up to 24 hours to propagate. Click "Verify" after adding the record.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setShowAddModal(false)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Add Custom Domain</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                                    Domain
                                </label>
                                <input
                                    type="text"
                                    value={formDomain}
                                    onChange={(e) => setFormDomain(e.target.value)}
                                    placeholder="menu.yourbusiness.com"
                                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    required
                                />
                                <p className="text-xs text-[var(--muted)] mt-1">
                                    Enter your subdomain (e.g., menu.yourbusiness.com)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                                    Link to Page
                                </label>
                                <select
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    required
                                >
                                    <option value="">Select a page...</option>
                                    {userPages.map((page) => (
                                        <option key={page.slug} value={page.slug}>
                                            {page.name} ({page.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formError && (
                                <div className="text-sm text-rose-400 bg-rose-500/10 rounded-lg p-3">
                                    {formError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !formDomain || !formSlug}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 font-medium transition-all"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Add Domain
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
