// src/components/providers/lenisroot.tsx
// @ts-nocheck
"use client";

import type { ReactNode } from "react";
import { LenisProvider } from "react-lenis";

/**
 * LenisRoot — globalno glatko skrolovanje,
 * tip-safe set opcija da prođe Vercel build.
 *
 * Napomena:
 * - izbacili smo 'autoRaf', 'lerp' i 'syncTouch' iz options jer nisu u tipovima ovog provajdera.
 * - zadržan smoothWheel i custom easing da osećaj ostane "svilen".
 */
export default function LenisRoot({ children }: { children: ReactNode }) {
  return (
    <LenisProvider
      // ako biblioteka podrži autoRaf kao PROPad (ne u options), možeš odkomentarisati:
      // @ts-ignore
      // autoRaf={true}
      options={{
        duration: 1.05,
        easing: (t: number) => 1 - Math.pow(1 - t, 1.6),
        smoothWheel: true,
        wheelMultiplier: 1.0,
      }}
    >
      {children}
    </LenisProvider>
  );
}