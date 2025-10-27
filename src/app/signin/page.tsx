"use client";

import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setErr("Unesi validan email.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: value }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || "Login failed");
      }
      window.location.href = "/dashboard";
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page max-w-md">
      <h1 className="text-xl font-semibold mb-3">Sign in (dev)</h1>
      <p className="text-sm text-neutral-500 mb-4">
        Ovo je razvojni login: svaki email <span aria-hidden>→</span> posebni korisnik (cookies).
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          Email
          <input
            className="field mt-1 w-full"
            type="email"
            placeholder="npr. ru@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </label>
        {err && <div className="text-sm text-red-500">{err}</div>}
        <div className="flex gap-2">
          <button className="btn btn-brand" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <a href="/" className="btn btn-plain">Cancel</a>
        </div>
      </form>
    </main>
  );
}