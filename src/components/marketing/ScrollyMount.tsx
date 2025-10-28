"use client";
import dynamic from "next/dynamic";

const ScrollPricingIntro = dynamic(
  () => import("@/components/scrolly/ScrollPricingIntro"),
  { ssr: false, loading: () => <div aria-hidden className="h-[460vh]" /> }
);

export default function ScrollyMount({ headline }: { headline: string }) {
  return <ScrollPricingIntro headline={headline} />;
}