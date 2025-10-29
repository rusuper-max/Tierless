"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Phase2LiftCut
 * - Izmeri visinu prethodnog TRACK WRAPPERA (prevRefSelector) i postavi margin-top
 *   tako da sledeća sekcija krene bez gapa.
 * - mt = window.innerHeight - prevHeight + adjust
 *   (ako je prev visok > 100vh → mt bude negativan i “uši” sledeću sekciju nagore)
 */
export default function Phase2LiftCut({
  prevRefSelector,
  adjust = 0,
  className,
  children,
}: {
  prevRefSelector: string;
  adjust?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [mt, setMt] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => {
    const prevEl = document.querySelector<HTMLElement>(prevRefSelector);
    if (!prevEl) return;

    const measure = () => {
      const vh = window.innerHeight || 1;
      const h = prevEl.offsetHeight || 0;
      setMt(vh - h + adjust);
    };

    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    measure();

    roRef.current = new ResizeObserver(onResize);
    roRef.current.observe(prevEl);

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { roRef.current?.disconnect(); } catch {}
      roRef.current = null;
    };
  }, [prevRefSelector, adjust]);

  return (
    <section className={className} style={{ marginTop: mt }}>
      {children}
    </section>
  );
}