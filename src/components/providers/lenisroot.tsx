// src/components/providers/LenisRoot.tsx
"use client";
import { LenisProvider } from "./lenis-provider";

export default function LenisRoot({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider
      options={{
        autoRaf: true,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        // duration i easing koristiš samo ako NE koristiš lerp
      }}
    >
      {children}
    </LenisProvider>
  );
}