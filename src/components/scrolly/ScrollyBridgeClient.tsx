// src/components/scrolly/ScrollyBridgeClient.tsx
"use client";

import { useRef } from "react";
import ScrollyMount from "@/components/scrolly/ScrollyMount";
import MainPhase3 from "@/components/scrolly/MainPhase3";
import AutoCutBridge from "@/components/scrolly/AutoCutBridge";

export default function ScrollyBridgeClient({ headline }: { headline: string }) {
  const phase2WrapRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <section ref={phase2WrapRef} className="relative z-10 bg-white isolate">
        <ScrollyMount headline={headline} />
      </section>

      <AutoCutBridge prevRef={phase2WrapRef} className="relative z-0 bg-white">
        <MainPhase3 />
      </AutoCutBridge>
    </>
  );
}