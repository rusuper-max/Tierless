// src/lib/track.ts
"use client";

type EventPayload = {
  name: string;
  ts: number;
  props?: Record<string, any>;
};

const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

function sendBeacon(url: string, data: any) {
  try {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    // @ts-ignore
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      // @ts-ignore
      return navigator.sendBeacon(url, blob);
    }
  } catch {}
  return false;
}

export function track(name: string, props?: Record<string, any>) {
  const payload: { events: EventPayload[] } = {
    events: [{ name, ts: Date.now(), props }],
  };

  // U DEV okruženju forsiramo fetch da bi se 100% videlo u server logu
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log("[track/dev]", name, props ?? {});
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(() => {});
    return;
  }

  // PROD: probaj prvo sendBeacon, pa fallback na fetch
  const ok = sendBeacon("/api/events", payload);
  if (!ok) {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}