import "@/app/globals.css";
import "@/styles/landing.css";

import type { ReactNode } from "react";
import LenisRoot from "./LenisRoot";
import { LanguageProvider } from "@/i18n/LanguageContext";

export const metadata = {
  title: "Tierless — Your prices. Online. Beautiful.",
  description: "Create a price page without a website.",
  themeColor: "#020617",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    // UKLONIO SAM "overflow-x-hidden" i "flex" odavde jer mogu da pokvare sticky
    <div className="relative min-h-screen bg-[#020617] text-white antialiased selection:bg-indigo-500/30 selection:text-white">

      <LanguageProvider>
        <LenisRoot>
          {/* Main mora da bude 'block', ne flex, da bi sticky radio pouzdano */}
          <main className="relative w-full block">
            {children}
          </main>
        </LenisRoot>
      </LanguageProvider>

    </div>
  );
}