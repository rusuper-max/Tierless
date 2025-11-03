// src/ctx/counters.tsx
"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

type Ctx = {
  trash: number;
  setTrash: (n: number) => void;
  bump: number; // inkrementira se kad trash poraste (za animaciju)
};

const C = createContext<Ctx | null>(null);

export function CountersProvider({ children }: { children: React.ReactNode }) {
  const [trash, setTrashState] = useState(0);
  const [bump, setBump] = useState(0);

  const setTrash = (n: number) =>
    setTrashState(prev => {
      if (typeof n === "number" && n > prev) setBump(b => b + 1);
      return n;
    });

  const value = useMemo(() => ({ trash, setTrash, bump }), [trash, bump]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useCounters() {
  const v = useContext(C);
  if (!v) throw new Error("useCounters must be used within CountersProvider");
  return v;
}