"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function logoutClient(router?: AppRouterInstance) {
  try {
    await fetch("/api/logout", { method: "POST", cache: "no-store", credentials: "same-origin" });
  } finally {
    // Global signal za sve hook-ove/komponente
    window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
    if (router) {
      router.replace("/");
      router.refresh();
      setTimeout(() => {
        document.querySelector<HTMLElement>("[data-guest-cta='true']")?.focus();
      }, 60);
    }
  }
}