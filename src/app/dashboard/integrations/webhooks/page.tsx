// src/app/dashboard/integrations/webhooks/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft, Plus, Trash2, RefreshCw, Check, X,
    ExternalLink, Clock, AlertTriangle, Eye, EyeOff,
    Send, ToggleLeft, ToggleRight
} from "lucide-react";
import { useAccount } from "@/hooks/useAccount";

interface WebhookEndpoint {
    id: string;
    name: string;
    url: string;
    secretPreview: string;
    events: string[];
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

interface WebhookLog {
    id: number;
    eventType: string;
    payload: Record<string, any>;
    responseStatus: number | null;
    success: boolean;
    createdAt: number;
}

export default function WebhooksPage() {
    const { plan, entitlements, loading: accountLoading } = useAccount();
    const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formUrl, setFormUrl] = useState("");
    const [formEvents, setFormEvents] = useState<string[]>(["page_view"]);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // New secret display (only shown after creation)
    const [newSecret, setNewSecret] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);

    const hasWebhooks = entitlements?.includes("feature:webhooks");

    const fetchEndpoints = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/webhooks");
            const data = await res.json();
            if (data.ok) {
                setEndpoints(data.endpoints || []);
                setError(null);
            } else {
                setError(data.error || "Failed to load webhooks");
            }
        } catch (e) {
            setError("Failed to load webhooks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!accountLoading && hasWebhooks) {
            fetchEndpoints();
        }
    }, [accountLoading, hasWebhooks, fetchEndpoints]);

    const fetchLogs = async (endpointId: string) => {
        setLogsLoading(true);
        try {
            const res = await fetch(`/api/webhooks/${endpointId}`);
            const data = await res.json();
            if (data.ok) {
                setLogs(data.logs || []);
            }
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSubmitting(true);

        try {
            const url = editingId ? `/api/webhooks/${editingId}` : "/api/webhooks";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: formName, url: formUrl, events: formEvents }),
            });

            const data = await res.json();

            if (data.ok) {
                if (!editingId && data.endpoint?.secret) {
                    setNewSecret(data.endpoint.secret);
                }
                setShowModal(false);
                setEditingId(null);
                resetForm();
                fetchEndpoints();
            } else {
                setFormError(data.error || "Failed to save webhook");
            }
        } catch (e) {
            setFormError("Failed to save webhook");
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this webhook? This cannot be undone.")) return;

        try {
            await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
            fetchEndpoints();
            if (selectedEndpoint?.id === id) {
                setSelectedEndpoint(null);
                setLogs([]);
            }
        } catch (e) {
            console.error("Failed to delete:", e);
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await fetch(`/api/webhooks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !enabled }),
            });
            fetchEndpoints();
        } catch (e) {
            console.error("Failed to toggle:", e);
        }
    };

    const handleTest = async (id: string) => {
        try {
            const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
            const data = await res.json();
            alert(data.message || (data.ok ? "Test sent!" : "Test failed"));
            if (selectedEndpoint?.id === id) {
                fetchLogs(id);
            }
        } catch (e) {
            alert("Failed to send test");
        }
    };

    const resetForm = () => {
        setFormName("");
        setFormUrl("");
        setFormEvents(["page_view"]);
        setFormError(null);
    };

    const openEditModal = (endpoint: WebhookEndpoint) => {
        setEditingId(endpoint.id);
        setFormName(endpoint.name);
        setFormUrl(endpoint.url);
        setFormEvents(endpoint.events);
        setShowModal(true);
    };

    // Check entitlement
    if (!accountLoading && !hasWebhooks) {
        return (
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/dashboard/integrations" className="text-sm text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Integrations
                </Link>
                <div className="text-center py-16">
                    <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Webhooks</h1>
                    <p className="text-[var(--muted)] mb-6">Webhooks are available on Pro plan and higher.</p>
                    <Link href="/start" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-cyan-600 transition-all">
                        Upgrade to Pro <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Link href="/dashboard/integrations" className="text-sm text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Integrations
            </Link>

            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">Webhooks</h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        Receive HTTP notifications when visitors view your pages or leave ratings.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Webhook
                </button>
            </header>

            {/* Secret Display (only after creation) */}
            {newSecret && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-emerald-400">Webhook Created!</p>
                            <p className="text-sm text-[var(--muted)] mt-1">Save this secret - it won't be shown again:</p>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="flex-1 px-3 py-2 rounded bg-[var(--surface)] text-sm font-mono text-[var(--text)] overflow-x-auto">
                                    {showSecret ? newSecret : "••••••••••••••••••••••••••••••••"}
                                </code>
                                <button onClick={() => setShowSecret(!showSecret)} className="p-2 hover:bg-[var(--surface)] rounded">
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(newSecret); alert("Copied!"); }}
                                    className="px-3 py-2 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600"
                                >
                                    Copy
                                </button>
                            </div>
                            <button onClick={() => setNewSecret(null)} className="text-sm text-[var(--muted)] mt-2 hover:underline">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-8 text-[var(--muted)]">Loading...</div>
            )}

            {/* Endpoints List */}
            {!loading && endpoints.length === 0 && (
                <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-xl">
                    <p className="text-[var(--muted)]">No webhooks configured yet.</p>
                    <p className="text-sm text-[var(--muted)] mt-1">Click "Add Webhook" to get started.</p>
                </div>
            )}

            {!loading && endpoints.length > 0 && (
                <div className="space-y-4">
                    {endpoints.map((ep) => (
                        <div
                            key={ep.id}
                            className={`p-4 rounded-xl border transition-colors ${selectedEndpoint?.id === ep.id
                                ? "border-indigo-500 bg-indigo-500/5"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--brand-1)]"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggle(ep.id, ep.enabled)}
                                        className="text-[var(--muted)] hover:text-[var(--text)]"
                                    >
                                        {ep.enabled ? (
                                            <ToggleRight className="w-6 h-6 text-emerald-500" />
                                        ) : (
                                            <ToggleLeft className="w-6 h-6" />
                                        )}
                                    </button>
                                    <div>
                                        <p className="font-medium text-[var(--text)]">{ep.name}</p>
                                        <p className="text-xs text-[var(--muted)] font-mono">{ep.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--muted)] px-2 py-1 rounded bg-[var(--surface)]">
                                        {ep.events.join(", ")}
                                    </span>
                                    <button
                                        onClick={() => handleTest(ep.id)}
                                        className="p-2 hover:bg-[var(--surface)] rounded text-[var(--muted)] hover:text-[var(--text)]"
                                        title="Send test"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedEndpoint(ep); fetchLogs(ep.id); }}
                                        className="p-2 hover:bg-[var(--surface)] rounded text-[var(--muted)] hover:text-[var(--text)]"
                                        title="View logs"
                                    >
                                        <Clock className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(ep)}
                                        className="p-2 hover:bg-[var(--surface)] rounded text-[var(--muted)] hover:text-[var(--text)]"
                                        title="Edit"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ep.id)}
                                        className="p-2 hover:bg-red-500/10 rounded text-red-400"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Logs Panel */}
            {selectedEndpoint && (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
                        <h3 className="font-medium text-[var(--text)]">
                            Recent Deliveries: {selectedEndpoint.name}
                        </h3>
                        <button onClick={() => setSelectedEndpoint(null)} className="text-[var(--muted)] hover:text-[var(--text)]">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {logsLoading && <div className="p-4 text-center text-[var(--muted)]">Loading...</div>}
                        {!logsLoading && logs.length === 0 && (
                            <div className="p-4 text-center text-[var(--muted)]">No deliveries yet.</div>
                        )}
                        {!logsLoading && logs.map((log) => (
                            <div key={log.id} className="px-4 py-3 border-b border-[var(--border)] last:border-b-0 flex items-center gap-3">
                                {log.success ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                )}
                                <div className="flex-1">
                                    <span className="text-sm text-[var(--text)]">{log.eventType}</span>
                                    <span className="text-xs text-[var(--muted)] ml-2">
                                        {log.responseStatus ? `Status: ${log.responseStatus}` : "No response"}
                                    </span>
                                </div>
                                <span className="text-xs text-[var(--muted)]">
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md mx-4 border border-[var(--border)]">
                        <div className="px-6 py-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--text)]">
                                {editingId ? "Edit Webhook" : "Add Webhook"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{formError}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="My Webhook"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">URL</label>
                                <input
                                    type="url"
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    placeholder="https://example.com/webhook"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">Events</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                                        <input
                                            type="checkbox"
                                            checked={formEvents.includes("page_view")}
                                            onChange={(e) => {
                                                if (e.target.checked) setFormEvents([...formEvents, "page_view"]);
                                                else setFormEvents(formEvents.filter(ev => ev !== "page_view"));
                                            }}
                                            className="rounded"
                                        />
                                        Page View
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                                        <input
                                            type="checkbox"
                                            checked={formEvents.includes("rating")}
                                            onChange={(e) => {
                                                if (e.target.checked) setFormEvents([...formEvents, "rating"]);
                                                else setFormEvents(formEvents.filter(ev => ev !== "rating"));
                                            }}
                                            className="rounded"
                                        />
                                        Rating
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting || formEvents.length === 0}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50"
                                >
                                    {formSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
