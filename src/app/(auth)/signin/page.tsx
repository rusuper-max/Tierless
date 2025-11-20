"use client";

import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  // --- EKRAN USPEHA (PROVERI MAIL) ---
  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Check your email</h1>
          <p className="text-slate-500 dark:text-slate-400">
            We sent a magic login link to <br/>
            <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
          </p>
          <p className="text-xs text-slate-400">
            Didn't receive it? Check your spam folder or try again.
          </p>
          <button 
            onClick={() => setStatus("idle")}
            className="text-sm text-indigo-500 hover:underline mt-4"
          >
            Try another email
          </button>
        </div>
      </div>
    );
  }

  // --- FORMA ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your email to continue to Tierless
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-lg border border-slate-300 bg-transparent px-3 py-3 text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:text-white dark:placeholder-slate-400 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="group relative flex w-full justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {status === "loading" ? "Sending link..." : "Send Magic Link"}
          </button>
          
          {status === "error" && (
            <p className="text-center text-sm text-red-500">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}