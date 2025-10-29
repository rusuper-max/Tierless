"use client";
import { LenisProvider } from "@/components/providers/lenis-provider";

export default function LenisRoot({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider
      options={{
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
      }}
    >
      {children}
    </LenisProvider>
  );
}