import "@/styles/marketing.css";
import type { ReactNode } from "react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import LenisRoot from "./LenisRoot";

export const metadata = {
  title: "Tierless — Pricing pages made simple",
  description: "Create a price page without a website. Share, configure, receive structured inquiries.",
  // ensure Safari/Chrome top bar matches theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" }
  ],
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="relative z-[40] min-h-[100svh] lg:min-h-screen bg-white dark:bg-[#0b0b0c] transition-colors duration-300">
        <MarketingHeader />
        <LenisRoot>
          {/* Ostavi svoj shell/wrapper kako si već imao */}
          <div className="marketing-shell bg-transparent">
            <main className="relative">{children}</main>
          </div>
        </LenisRoot>
      </div>
    </>
  );
}