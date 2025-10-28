// src/app/(marketing)/layout.tsx
import "@/styles/marketing.css";
import type { ReactNode } from "react";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata = {
  title: "Tierless — Pricing pages made simple",
  description: "Create a price page without a website. Share, configure, receive structured inquiries.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <div className="marketing-hero-bg">
        <main className="relative z-10">{children}</main>
      </div>
    </>
  );
}