// src/components/providers/CountersBoundary.tsx
"use client";

import { CountersProvider } from "@/ctx/counters";
import type { ReactNode } from "react";

export default function CountersBoundary({ children }: { children: ReactNode }) {
  return <CountersProvider>{children}</CountersProvider>;
}