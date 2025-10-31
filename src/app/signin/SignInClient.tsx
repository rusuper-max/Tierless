// src/app/signin/SignInClient.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error(`Login failed (${r.status})`);

      // KLJUČNO: hard reload → SSR sigurno vidi cookie
      window.location.replace(next);
    } catch (e: any) {
      setErr(e?.message || "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="container-page max-w-md">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-neutral-500">Enter your email to continue.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="field w-full"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
        <button className="btn btn-brand" disabled={busy}>
          {busy ? "Signing in…" : "Continue"}
        </button>
        {err && <p className="text-sm text-red-500">{err}</p>}
      </form>
    </main>
  );
}