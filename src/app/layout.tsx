import "./globals.css";
import type { ReactNode } from "react";
import UpgradeSheetMount from "./_providers/UpgradeSheetMount";
import Toaster from "@/components/toast/Toaster";
import ThemeProvider from "./_providers/ThemeProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import DevPlanSwitcher from "@/components/DevPlanSwitcher";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--bg)] text-[var(--text)]">
        <a
          href="#main"
          className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg"
        >
          Skip to main content
        </a>
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <UpgradeSheetMount />
            <Toaster />
            <DevPlanSwitcher />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
