import "./globals.css";
import type { ReactNode } from "react";
import UpgradeSheetMount from "./_providers/UpgradeSheetMount";
import Toaster from "@/components/toast/Toaster";
import ThemeProvider from "./_providers/ThemeProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <UpgradeSheetMount />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}