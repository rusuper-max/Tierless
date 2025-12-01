import "./globals.css";
import type { ReactNode } from "react";
import UpgradeSheetMount from "./_providers/UpgradeSheetMount";
import Toaster from "@/components/toast/Toaster";
import ThemeProvider from "./_providers/ThemeProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <UpgradeSheetMount />
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}