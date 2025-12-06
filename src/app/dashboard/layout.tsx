// src/app/dashboard/layout.tsx
import type { ReactNode } from "react";
import Nav from "@/components/dashboard/Nav";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import AccountHydrator from "@/components/providers/AccountHydrator";
import { entitlementsFor, type Plan } from "@/lib/entitlements.adapter";
import { getUserTeams, getInvitesForEmail } from "@/lib/db";

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
    let renewsOn: string | null = null;
    let cancelAtPeriodEnd = false;
    let orderDestination = "email";
    let whatsappNumber = "";

    if (authenticated) {
      const mRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/me/plan`, {
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => fetch("/api/me/plan", { cache: "no-store", credentials: "same-origin" }));
      const mJson = (await mRes?.json().catch(() => ({}))) as {
        plan?: Plan;
        renewsOn?: string | null;
        cancelAtPeriodEnd?: boolean;
      };
      plan = (mJson?.plan || "free") as Plan;
      renewsOn = typeof mJson?.renewsOn === "string" ? mJson.renewsOn : null;
      cancelAtPeriodEnd = !!mJson?.cancelAtPeriodEnd;

      // 3) whoami for order destination
      try {
        const wRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/whoami`, {
          cache: "no-store",
          credentials: "same-origin",
        }).catch(() => fetch("/api/whoami", { cache: "no-store", credentials: "same-origin" }));
        const wJson = (await wRes?.json().catch(() => ({}))) as {
          orderDestination?: string;
          whatsappNumber?: string;
        };
        orderDestination = wJson?.orderDestination || "email";
        whatsappNumber = wJson?.whatsappNumber || "";
      } catch { /* ignore */ }
    }

    return {
      loading: false,
      authenticated,
      email,
      plan,
      entitlements: entitlementsFor(plan),
      renewsOn,
      cancelAtPeriodEnd,
      orderDestination,
      whatsappNumber,
    };
  } catch {
    return {
      loading: false,
      authenticated: false,
      email: null,
      plan: "free" as Plan,
      entitlements: entitlementsFor("free"),
      renewsOn: null,
      cancelAtPeriodEnd: false,
      orderDestination: "email",
      whatsappNumber: "",
    };
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const initialAccount = await loadAccountSSR();

  // Fetch teams and invites for sidebar if user is authenticated
  const [userTeams, userInvites] = initialAccount.email
    ? await Promise.all([
        getUserTeams(initialAccount.email),
        getInvitesForEmail(initialAccount.email)
      ])
    : [[], []];

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
      <div className="tl-dashboard min-h-screen w-full flex flex-col md:flex-row bg-[var(--bg)]">
        <Sidebar teams={userTeams} pendingInviteCount={userInvites.length} />

        {/* Brand gradient separator line */}
        <div
          aria-hidden
          className="hidden md:block w-[2px] shrink-0"
          style={{ backgroundImage: "linear-gradient(180deg, var(--brand-1,#4F46E5), var(--brand-2,#22D3EE))" }}
        />

        <main className="flex-1 min-w-0 w-full md:w-auto bg-[var(--bg)] p-0">
          {children}
        </main>
      </div>
    </>
  );
}
