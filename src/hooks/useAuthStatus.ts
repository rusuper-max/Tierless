"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAuthStatus() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status", {
        cache: "no-store",
        credentials: "include",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const data = await res.json().catch(() => ({}));
      if (!alive.current) return;
      setAuthenticated(!!data?.authenticated);
    } catch {
      if (!alive.current) return;
      setAuthenticated(false);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();

    const onChanged = () => refresh();
    const onFocus = () => refresh();
    const onVis = () => document.visibilityState === "visible" && refresh();

    window.addEventListener("TL_AUTH_CHANGED", onChanged as EventListener);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive.current = false;
      window.removeEventListener("TL_AUTH_CHANGED", onChanged as EventListener);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return { authenticated, loading, refresh, setAuthenticated };
}