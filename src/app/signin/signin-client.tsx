"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Signing in…");
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error || "Login failed");
      return;
    }
    setMsg("OK, redirecting…");
    window.location.href = redirectTo;
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border bg-transparent px-3 py-2"
          placeholder="you@example.com"
        />
        <button className="rounded-xl border px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900">
          Continue
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-2">{msg}</p>
    </main>
  );
}