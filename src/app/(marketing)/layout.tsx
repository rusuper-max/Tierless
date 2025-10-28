// src/app/(marketing)/layout.tsx
import "@/styles/marketing.css";
import "@/styles/fx-aurora.css";
import type { ReactNode } from "react";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata = {
  title: "Tierless — Pricing pages made simple",
  description: "Create a price page without a website. Share, configure, receive structured inquiries.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* FIXED Aurora (iza svega vizuelnog) */}
      <div className="fx-aurora -tight" aria-hidden="true">
        <span className="spot spot-tl" aria-hidden="true" />
        <span className="l1" />
        <span className="l2" />
        <span className="l3" />
      </div>

      {/* Sadržaj iznad maske */}
      <div className="relative z-[40]">
        <MarketingHeader />
        {/* VAŽNO: transparent da ne prekrije auroru */}
        <div className="marketing-hero-bg" style={{ background: "transparent" }}>
          <main className="relative">{children}</main>
        </div>
      </div>
    </>
  );
}