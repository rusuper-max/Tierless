"use client";

import dynamic from "next/dynamic";

// VAŽNO: uskladi sa visinom u MainPhase3 root <section> (svh)
export const PHASE3_TRACK_SVH = 320;

const MainPhase3 = dynamic(() => import("./MainPhase3"), {
  ssr: false,
  loading: () => (
    <div aria-hidden style={{ height: `${PHASE3_TRACK_SVH}svh` }} />
  ),
});

export default function ScrollyPhase3Mount(props: any) {
  return <MainPhase3 {...props} />;
}