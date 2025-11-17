// src/app/dashboard/layout.tsx
import "@/app/overrides.css";
import type { ReactNode } from "react";
import Nav from "@/components/dashboard/Nav";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import AccountHydrator from "@/components/providers/AccountHydrator";
import { entitlementsFor, type Plan } from "@/lib/entitlements.adapter";

export const metadata = { title: "Tierless — Dashboard" };

async function loadAccountSSR() {
  try {
    // 1) auth status
    const sRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/status`, {
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => fetch("/api/auth/status", { cache: "no-store", credentials: "same-origin" }));
    const sJson = (await sRes?.json().catch(() => ({}))) as {
      authenticated?: boolean;
      user?: { email?: string | null };
    };

    const authenticated = !!sJson?.authenticated;
    const email = authenticated ? (sJson?.user?.email || null) : null;

    // 2) plan (ako je auth)
    let plan: Plan = "free";
    if (authenticated) {
      const mRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/me`, {
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => fetch("/api/me", { cache: "no-store", credentials: "same-origin" }));
      const mJson = (await mRes?.json().catch(() => ({}))) as { user?: { plan?: Plan }; plan?: Plan };
      plan = (mJson?.user?.plan || mJson?.plan || "free") as Plan;
    }

    return {
      loading: false,
      authenticated,
      email,
      plan,
      entitlements: entitlementsFor(plan),
    };
  } catch {
    return {
      loading: false,
      authenticated: false,
      email: null,
      plan: "free" as Plan,
      entitlements: entitlementsFor("free"),
    };
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const initialAccount = await loadAccountSSR();

  return (
    <>
      {/* Nav (client, sticky) */}
      <Nav />

      {/* Seed-ujemo client store pre bilo kakvog rendera (ne menja UI) */}
      <AccountHydrator initial={initialAccount} />

      {/* Mobile nav tabs */}
      <div className="md:hidden border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60">
        <DashboardTabs />
      </div>

      {/* Sve dashboard varijable i stilovi pod .tl-dashboard */}
      <div className="tl-dashboard min-h-screen w-full flex flex-col md:flex-row">
        <Sidebar />

        <div
          aria-hidden
          className="hidden md:block w-[2px] shrink-0"
          style={{ backgroundImage: "linear-gradient(180deg, var(--brand-1,#4F46E5), var(--brand-2,#22D3EE))" }}
        />

        <div className="flex-1 min-w-0 w-full md:w-auto">{children}</div>
      </div>
    </>
  );
}
