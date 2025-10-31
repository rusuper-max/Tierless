"use client";

import { PropsWithChildren, useLayoutEffect, useRef, useState } from "react";

/**
 * Phase1LiftCut
 * - Automatski "uštuca" sledeću sekciju tako da NEMA gapa posle Phase 1.
 * - Radi preko negativnog margin-top = vh - visina_prethodnog_tracka * cutWindow
 * - Koristi stabilan selektor prevRefSelector (npr. section[data-phase="1"])
 */
export default function Phase1LiftCut({
  prevRefSelector = `section[data-phase="1"]`,
  className,
  cutWindow = 0.12, // 0–1: procenat ranog dela tracka koji "sečemo"
  liftVH = 60,      // koliko vučemo nagore sticky viewport (vh) – možeš 40–80
  children,
}: PropsWithChildren<{
  prevRefSelector?: string;
  className?: string;
  cutWindow?: number;
  liftVH?: number;
}>) {
  const [mt, setMt] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => {
    const prev = document.querySelector<HTMLElement>(prevRefSelector);
    if (!prev) return;

    const measure = () => {
      const vh = window.innerHeight;
      const h = prev.offsetHeight; // puna Track visina Phase1
      // negativni margin-top: pomeri sledeću sekciju naviše
      // kombinujemo “cut” dela tracka + liftVH u viewport jedinicama
      const cutPx = h * cutWindow;
      const liftPx = (liftVH / 100) * vh;
      setMt((vh - h) + cutPx + liftPx);
    };

    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    measure();

    roRef.current = new ResizeObserver(() => onResize());
    roRef.current.observe(prev);

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (roRef.current) {
        try { roRef.current.disconnect(); } catch {}
        roRef.current = null;
      }
    };
  }, [prevRefSelector, cutWindow, liftVH]);

  return (
    <section className={className} style={{ marginTop: mt }}>
      {children}
    </section>
  );
}