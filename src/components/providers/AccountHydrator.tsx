// src/components/providers/AccountHydrator.tsx
"use client";

import { useEffect } from "react";
import { injectInitialAccountSnapshot, type AccountSnapshot } from "@/hooks/useAccount";

export default function AccountHydrator({ initial }: { initial: AccountSnapshot | null }) {
  useEffect(() => {
    if (initial) injectInitialAccountSnapshot(initial);
  }, [initial]);
  return null; // ništa vizuelno
}