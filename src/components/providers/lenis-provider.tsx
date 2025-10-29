"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Global Lenis (bez 'lerp', bez 'autoRaf', bez 'syncTouch')
 * - koristi duration + easing + smoothWheel
 * - sopstveni rAF loop, radi u svim verzijama
 * - instancu izlaže na window.__lenis
 */
export function LenisProvider({
  children,
  options,
}: {
  children: React.ReactNode;
  options?: Partial<{
    duration: number;
    easing: (t: number) => number;
    smoothWheel: boolean;
    wheelMultiplier: number;
  }>;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("lenis", "lenis-smooth");

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      ...(options || {}),
    });

    lenisRef.current = lenis;
    (window as any).__lenis = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId.current = requestAnimationFrame(raf);
    };
    rafId.current = requestAnimationFrame(raf);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      try { (lenis as any).stop?.(); } catch {}
      try { (lenis as any).destroy?.(); } catch {}
      (window as any).__lenis = null;
      html.classList.remove("lenis", "lenis-smooth");
    };
  }, [options]);

  return <>{children}</>;
}