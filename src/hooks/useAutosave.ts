// src/hooks/useAutosave.ts
"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "./useEditorStore";

/**
 * Autosave hook
 * - Triggers a PUT to /api/calculators/[slug] after `delayMs` of idleness
 * - Subscribes to store.isDirty via Zustand's subscribe(selector, listener)
 * - Never leaves a dangling subscription when `enabled` toggles off
 * - Coalesces concurrent saves; avoids loops by only arming when dirty flips to true
 */
export function useAutosave(delayMs = 2000, enabled = true) {
  const getState = useEditorStore.getState;
  const setState = useEditorStore.setState;

  const unsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);

  useEffect(() => {
    // Always cleanup previous subscription/timer when deps change
    if (unsubRef.current) {
      try { unsubRef.current(); } catch {}
      unsubRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If autosave is disabled, nothing else to do (but we DID clean up above)
    if (!enabled) return;

    const arm = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (inflightRef.current) return;
        inflightRef.current = true;

        try {
          const st = getState();
          const calc = st.calc;
          const slug = calc?.meta?.slug || st.slug || "";
          if (!slug || !calc) return;

          setState({ isSaving: true });

          const res = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(calc),
            cache: "no-store",
            credentials: "same-origin",
          });

          if (res.ok) {
            const saved = await res.json();
            useEditorStore.setState({
              calc: saved,
              isDirty: false,
              isSaving: false,
              lastSaved: Date.now(),
            });
          } else {
            useEditorStore.setState({ isSaving: false });
          }
        } catch {
          useEditorStore.setState({ isSaving: false });
        } finally {
          inflightRef.current = false;
        }
      }, delayMs);
    };

    // Subscribe to the whole state and detect the isDirty edge (prev -> next)
    type ES = ReturnType<typeof useEditorStore.getState>;
    unsubRef.current = useEditorStore.subscribe(
      (state: ES, prev: ES) => {
        if (state.isDirty && !prev.isDirty) arm();
      }
    );

    // On mount, if current state is already dirty, arm once
    if (getState().isDirty) arm();

    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, delayMs]);
}