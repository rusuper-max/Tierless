"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Phase1Snap — prvi 'wheel down' (ili potez na touch-u) dok si u Phase 1
 * odmah glatko skroluje do #phase2. Ne oslanja se na i18n, niti na “fullyInView”.
 */
export default function Phase1Snap({
  prevRefSelector = `section[data-phase="1"]`,
  targetSelector = `#phase2`,
  duration = 0.6,
  enabled = true,
}: {
  prevRefSelector?: string;
  targetSelector?: string;
  duration?: number;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const prev = document.querySelector<HTMLElement>(prevRefSelector);
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!prev || !target) return;

    // Header visina (ako header.marketing postoji)
    const header = document.querySelector<HTMLElement>("header.marketing");
    const headerH = header ? header.offsetHeight : 0;

    let lenis: any = (window as any).__lenis || null;
    let createdLocal = false;
    let rafId: number | null = null;

    if (!lenis) {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
      });
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      createdLocal = true;
    }

    const scrollToPhase2 = () => {
      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY - headerH;
      lenis.scrollTo(absoluteTop, { duration });
    };

    let snapped = false;

    const wheel = (e: WheelEvent) => {
      if (snapped) return;
      // Trigeruj snap čim user krene naniže, ali samo dok smo praktično na vrhu
      if (e.deltaY > 0 && window.scrollY < 6) {
        e.preventDefault();
        e.stopPropagation();
        snapped = true;
        scrollToPhase2();
      }
    };

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (snapped) return;
      const dy = startY - e.touches[0].clientY;
      if (dy > 6 && window.scrollY < 6) {
        e.preventDefault();
        e.stopPropagation();
        snapped = true;
        scrollToPhase2();
      }
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (createdLocal) {
        if (rafId) cancelAnimationFrame(rafId);
        try { lenis.stop?.(); } catch {}
        try { lenis.destroy?.(); } catch {}
      }
    };
  }, [prevRefSelector, targetSelector, duration, enabled]);

  return null;
}