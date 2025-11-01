// src/components/scrolly/LiftCut.tsx
"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * LiftCut v2 — bezbedan "negativni margin" koji podiže P3,
 * ali ne prelazi maksimalnu dozvoljenu vrednost i ne remeti z-index slojeve.
 *
 * marginTop = - max(0, prevHeight - viewportHeight - bleed)
 * - clamp-ujemo na najviše 0.92 * viewportHeight po “koraku” da ne "pojede" P2
 * - ne koristi scroll listenere; meri na resize/RO
 *
 * VAŽNO: P2 mora imati veći z-index od P3 (sređeno u CSS-u).
 */
export default function LiftCut({
  prevRefSelector,
  bleed = 48,        // px “fini šav”: smanji na 24 ako previše podiže
  capVH = 0.92,     // max koliko smemo da “pojedemo” po viewportu
  className,
  children,
}: {
  prevRefSelector: string;
  bleed?: number;
  capVH?: number;   // 0.92 = najviše ~92vh negativnog margina
  className?: string;
  children: React.ReactNode;
}) {
  const [mt, setMt] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const roRef  = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => {
    const prevEl = document.querySelector<HTMLElement>(prevRefSelector);
    if (!prevEl) return;

    const measure = () => {
      const vh = window.innerHeight || 1;
      const h  = prevEl.offsetHeight || 0;

      // osnovni negativni margin
      const raw = -(Math.max(0, h - vh - bleed));

      // gornji limit (da ne može “previše” da podigne)
      const cap = -(Math.round(vh * capVH));

      // mt je NAJMANJE cap (negativnije ne sme), NAJVIŠE 0
      const mtPx = Math.max(raw, cap);
      setMt(Math.min(mtPx, 0));
    };

    const schedule = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    schedule();

    roRef.current = new ResizeObserver(schedule);
    roRef.current.observe(prevEl);
    roRef.current.observe(document.documentElement);

    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });

    return () => {
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { roRef.current?.disconnect(); } catch {}
      roRef.current = null;
    };
  }, [prevRefSelector, bleed, capVH]);

  // Wrapper je običan <div> da ne remeti <section> iz P3
  return (
    <div className={className} style={{ marginTop: mt }}>
      {children}
    </div>
  );
}