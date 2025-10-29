// src/components/scrolly/Phase2Snap.tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Phase2Snap — čim skrol prođe ~kraj P2 track-a, nežno skroluje na početak P3.
 * - Radi sa Lenis instancom iz LenisRoot (window.__lenis) ili kreira lokalnu fallback.
 */
export default function Phase2Snap({
  prevRefSelector,
  targetSelector,
  gate = 0.500,     // kada raw >= gate => snap
  duration = 0.2,   // trajanje skrola do P3
}: {
  prevRefSelector: string;  // npr '#phase2 section[aria-label="Scroll storytelling pricing intro"]'
  targetSelector: string;   // npr '#phase3'
  gate?: number;
  duration?: number;
}) {
  useEffect(() => {
    const prev = document.querySelector<HTMLElement>(prevRefSelector);
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!prev || !target) return;

    // Uzmi global Lenis ili napravi lokalni
    let lenis: any = (window as any).__lenis;
    let createdLocal = false;
    let rafId = 0;

    if (!lenis) {
      lenis = new (Lenis as any)({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1, normalizeWheel: true });
      const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
      rafId = requestAnimationFrame(raf);
      createdLocal = true;
    }

    let locked = false;
    const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

    const onScroll = () => {
      if (locked) return;
      const rect = prev.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vh); // sticky track visina
      const raw = clamp((vh - rect.top) / travel, 0, 1);
      if (raw >= gate) {
        locked = true;
        const top = target.getBoundingClientRect().top + window.scrollY;
        lenis.scrollTo(top, {
          duration,
          // lagani easing (isto kao P1→P2)
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
        });
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (createdLocal && rafId) cancelAnimationFrame(rafId);
    };
  }, [prevRefSelector, targetSelector, gate, duration]);

  return null;
}