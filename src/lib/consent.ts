// src/lib/consent.ts
// Cookie consent management

const CONSENT_KEY = "tierless_cookie_consent";

export type ConsentStatus = "accepted" | "declined" | "pending";

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return "pending";

  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted") return "accepted";
    if (consent === "declined") return "declined";
    return "pending";
  } catch {
    return "pending";
  }
}

export function setConsent(accepted: boolean): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");

    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent("consent-change", {
      detail: { accepted }
    }));
  } catch {
    // Storage not available
  }
}

export function hasConsent(): boolean {
  return getConsentStatus() === "accepted";
}
