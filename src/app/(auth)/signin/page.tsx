"use client";

import { useState } from "react";
import Link from "next/link";
import TierlessLogo from "@/components/marketing/TierlessLogo";

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

  // --- POZADINA (Ista kao landing) ---
  const Background = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
       {/* Gradient Glows */}
       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px]" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px]" />
    </div>
  );

  // --- EKRAN USPEHA ---
  if (status === "success") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-white">
        <Background />
        <div className="relative z-10 w-full max-w-md text-center space-y-6 p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-slate-400">
            We sent a magic login link to <br/>
            <span className="font-semibold text-white">{email}</span>
          </p>
          <button 
            onClick={() => setStatus("idle")}
            className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline mt-4 transition-colors"
          >
            Try another email
          </button>
        </div>
      </div>
    );
  }

  // --- FORMA ---
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-white">
      <Background />
      
      {/* Brand Header */}
      <div className="relative z-10 mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href="/" className="flex items-center gap-3 mb-4 group">
          <TierlessLogo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
          <span className="text-2xl font-bold tracking-tight">Tierless</span>
        </Link>
        <h1 className="text-3xl font-bold text-center">Welcome back</h1>
        <p className="mt-2 text-slate-400 text-center">Enter your email to access your dashboard</p>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-500 ml-1">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {status === "loading" ? "Sending link..." : "Send Magic Link"}
          </button>
          
          {status === "error" && (
            <p className="text-center text-sm text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              Something went wrong. Please try again.
            </p>
          )}
        </form>

        <p className="text-center text-xs text-slate-600">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}