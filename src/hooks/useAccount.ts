// src/hooks/useAccount.ts
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { entitlementsFor, type Plan } from "@/lib/entitlements.adapter";

export type AccountSnapshot = {
  loading: boolean;
  authenticated: boolean;
  email: string | null;
  plan: Plan;
  entitlements: string[];
  renewsOn: string | null;
  cancelAtPeriodEnd: boolean;
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
    }

    state = {
      loading: false,
      authenticated,
      email,
      plan,
      entitlements: entitlementsFor(plan),
      renewsOn,
      cancelAtPeriodEnd,
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
    };
    notify();
  }
}
