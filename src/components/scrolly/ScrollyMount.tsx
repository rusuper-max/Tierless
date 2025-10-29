// src/components/scrolly/ScrollyMount.tsx
"use client";
import dynamic from "next/dynamic";

/** Podesi na STVARNI track tvoje Phase 2 (koliko traje sticky scroll) */
export const PHASE2_TRACK_SVH = 460;

const MainPhase2 = dynamic(() => import("./MainPhase2"), {
  ssr: false,
  // placeholder sa belom pozadinom da ne “proviri” aurora
  loading: () => (
    <div aria-hidden className="bg-white" style={{ height: `${PHASE2_TRACK_SVH}svh` }} />
  ),
});

export default function ScrollyMount(props: {
  headline: string;
  holdDesktop?: number;
  holdMobile?: number;
}) {
  return <MainPhase2 {...props} />;
}