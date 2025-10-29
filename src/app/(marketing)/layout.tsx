import "@/styles/marketing.css";
import type { ReactNode } from "react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import LenisRoot from "./LenisRoot";

export const metadata = {
  title: "Tierless — Pricing pages made simple",
  description: "Create a price page without a website. Share, configure, receive structured inquiries.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="relative z-[40]">
        <MarketingHeader />
        <LenisRoot>
          {/* Ostavi svoj shell/wrapper kako si već imao */}
          <div className="marketing-shell">
            <main className="relative">{children}</main>
          </div>
        </LenisRoot>
      </div>
    </>
  );
}