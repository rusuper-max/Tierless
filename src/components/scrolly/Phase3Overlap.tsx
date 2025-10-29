// src/components/scrolly/Phase3Overlap.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Phase3Overlap — nežno "navlači" početak P3 preko kraja P2 (negativni margin-top).
 * - Izbegavaš vizuelni gap i dobiješ lep kontinuitet (kao P1→P2).
 */
export default function Phase3Overlap({
  prevRefSelector,
  overlapPx = -120, // negativna vrednost: koliko P3 vučeš naviše
  children,
}: {
  prevRefSelector: string; // npr '#phase2 section[aria-label="Scroll storytelling pricing intro"]'
  overlapPx?: number;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [mt, setMt] = useState<number>(overlapPx);

  useEffect(() => {
    const prev = document.querySelector<HTMLElement>(prevRefSelector);
    if (!prev) {
      setMt(overlapPx);
      return;
    }

    const recalc = () => {
      // Osnovno: samo primeni zadati overlap (možeš fino da dotežeš broj).
      setMt(overlapPx);
    };

    recalc();
    window.addEventListener("resize", recalc, { passive: true });
    return () => window.removeEventListener("resize", recalc);
  }, [prevRefSelector, overlapPx]);

  return (
    <div ref={wrapRef} style={{ marginTop: `${mt}px` }}>
      {children}
    </div>
  );
}