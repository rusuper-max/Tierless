// src/hooks/useAccount.ts
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { entitlementsFor, type Plan } from "@/lib/entitlements.adapter";

// --- DEV PLAN OVERRIDE ---
const DEV_PLAN_KEY = "tierless_dev_plan_override";

// Whitelist of emails with Dev access (works in both localhost AND production)
const DEV_EMAILS = [
  "rusuper@gmail.com",
  "jstevanoviic@gmail.com",
  "stevanovic.jelena55@gmail.com",
];

// Check if currently on localhost (for UI indicators)
function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
}

// Check if plan override is enabled (now works in production for dev users)
function getDevPlanOverride(): Plan | null {
  // Plan override works everywhere - server-side limits still enforced
  if (typeof window === "undefined") return null;
  const override = localStorage.getItem(DEV_PLAN_KEY);
  if (override && ["free", "starter", "growth", "pro", "agency", "tierless"].includes(override)) {
    return override as Plan;
  }
  return null;
}

export function setDevPlanOverride(plan: Plan | null) {
  // Works in production too - this only affects client-side UI
  // Server-side entitlement checks still use real plan from DB
  if (typeof window === "undefined") return;
  if (plan) {
    localStorage.setItem(DEV_PLAN_KEY, plan);
  } else {
    localStorage.removeItem(DEV_PLAN_KEY);
  }
  // Trigger refresh
  window.dispatchEvent(new CustomEvent("TL_DEV_PLAN_CHANGED"));
}

/**
 * Check if user is a dev user (whitelisted email).
 * Dev users can access dev controls in BOTH localhost AND production.
 * This is safe because plan override only affects client-side UI,
 * not server-side entitlement enforcement.
 */
export function isDevUser(email: string | null): boolean {
  if (!email) return false;
  return DEV_EMAILS.includes(email.toLowerCase());
}

/** Check if we're in production (for UI indicators) */
export function isProductionEnv(): boolean {
  return !isLocalhost();
}

export type AccountSnapshot = {
  loading: boolean;
  authenticated: boolean;
  email: string | null;
  plan: Plan;
  entitlements: string[];
  renewsOn: string | null;
  cancelAtPeriodEnd: boolean;
  orderDestination: string;
  whatsappNumber: string;
};

// ------- Lightweight store (bez React setState u efektima) -------
let started = false;
const subs = new Set<() => void>();

const notify = () => subs.forEach((fn) => fn());

let state: AccountSnapshot = {
  loading: true,
  authenticated: false,
  email: null,
  plan: "free",
  entitlements: entitlementsFor("free"),
  renewsOn: null,
  cancelAtPeriodEnd: false,
  orderDestination: "email",
  whatsappNumber: "",
};

async function fetchStatusAndMe() {
  state = { ...state, loading: true };
  notify();

  try {
    const sRes = await fetch("/api/auth/status", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "x-no-cache": String(Date.now()) },
    });

    const sJson = (await sRes.json().catch(() => ({}))) as {
      authenticated?: boolean;
      user?: { email?: string | null };
    };

    const authenticated = !!sJson?.authenticated;
    const email = authenticated ? (sJson?.user?.email || null) : null;

    let plan: Plan = "free";
    let renewsOn: string | null = null;
    let cancelAtPeriodEnd = false;
    let orderDestination = "email";
    let whatsappNumber = "";

    if (authenticated) {
      const mRes = await fetch("/api/me/plan", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const mJson = (await mRes.json().catch(() => ({}))) as {
        plan?: Plan;
        renewsOn?: string | null;
        cancelAtPeriodEnd?: boolean;
      };
      plan = (mJson?.plan ?? "free") as Plan;
      renewsOn = typeof mJson?.renewsOn === "string" ? mJson.renewsOn : null;
      cancelAtPeriodEnd = !!mJson?.cancelAtPeriodEnd;

      // Fetch whoami for order_destination
      const whoamiRes = await fetch("/api/whoami", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const whoamiJson = (await whoamiRes.json().catch(() => ({}))) as {
        orderDestination?: string;
        whatsappNumber?: string;
      };
      orderDestination = whoamiJson?.orderDestination || "email";
      whatsappNumber = whoamiJson?.whatsappNumber || "";
    }

    // Check for dev plan override (localhost only)
    const devOverride = getDevPlanOverride();
    const effectivePlan = devOverride ?? plan;

    state = {
      loading: false,
      authenticated,
      email,
      plan: effectivePlan,
      entitlements: entitlementsFor(effectivePlan),
      renewsOn,
      cancelAtPeriodEnd,
      orderDestination,
      whatsappNumber,
    };
    notify();
  } catch {
    state = {
      loading: false,
      authenticated: false,
      email: null,
      plan: "free",
      entitlements: entitlementsFor("free"),
      renewsOn: null,
      cancelAtPeriodEnd: false,
      orderDestination: "email",
      whatsappNumber: "",
    };
    notify();
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  fetchStatusAndMe();

  const onAuth = () => fetchStatusAndMe();
  const onFocus = () => fetchStatusAndMe();
  const onVis = () => {
    if (document.visibilityState === "visible") fetchStatusAndMe();
  };

  window.addEventListener("TL_AUTH_CHANGED", onAuth as EventListener);
  window.addEventListener("TL_DEV_PLAN_CHANGED", onAuth as EventListener);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVis);
}

export function useAccount(): AccountSnapshot {
  useEffect(() => {
    start();
  }, []);

  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state,
    () => state
  );
}

// === SSR hydration =========================================
export function injectInitialAccountSnapshot(s: AccountSnapshot) {
  // prihvati samo ako je legitimno i bolje od trenutnog
  if (!s) return;
  // ne dopuštamo downgrade sa plaćenog na "free" ako je authenticated=true
  const stronger =
    s.authenticated && (s.plan !== "free" || state.plan === "free");

  if (stronger || state.loading) {
    state = {
      loading: false,
      authenticated: !!s.authenticated,
      email: s.email ?? null,
      plan: s.plan,
      entitlements: Array.isArray(s.entitlements) ? s.entitlements : entitlementsFor(s.plan),
      renewsOn: s.renewsOn ?? null,
      cancelAtPeriodEnd: !!s.cancelAtPeriodEnd,
      orderDestination: s.orderDestination || "email",
      whatsappNumber: s.whatsappNumber || "",
    };
    notify();
  }
}
