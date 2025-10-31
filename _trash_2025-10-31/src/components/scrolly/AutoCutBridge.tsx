"use client";

import { PropsWithChildren, useLayoutEffect, useRef, useState } from "react";

/**
 * AutoCutBridge automatski "uštuca" sledeću sekciju tako da nema gapa
 * u odnosu na PRETHODNU sekciju.
 *
 * - prima prevRef (RefObject na WRAPPER prethodne sekcije)
 * - meri njegovu ukupnu visinu u px
 * - postavlja margin-top = window.innerHeight - prevHeight (negativno -> uvlači nagore)
 *
 * Radi i na iOS-u; sluša resize/orientationchange + ResizeObserver.
 */
export default function AutoCutBridge({
  prevRef,
  className,
  children,
}: PropsWithChildren<{
  prevRef: React.RefObject<HTMLElement | null>; // <<< ispravljeno
  className?: string;
}>) {
  const [mt, setMt] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => {
    const el = prevRef.current;
    if (!el) return;

    const measure = () => {
      const vh = window.innerHeight;
      const h = el.offsetHeight;
      setMt(vh - h);
    };

    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    // inicijalno merenje
    measure();

    // osluškuj promene layout-a prethodne sekcije
    roRef.current = new ResizeObserver(() => onResize());
    roRef.current.observe(el);

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
  }, [prevRef]);

  return (
    <section className={className} style={{ marginTop: mt }}>
      {children}
    </section>
  );
}