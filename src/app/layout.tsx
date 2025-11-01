import "./globals.css";
import type { ReactNode } from "react";
import UpgradeSheetMount from "./_providers/UpgradeSheetMount";
import Toaster from "@/components/toast/Toaster";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <UpgradeSheetMount />
        <Toaster />
      </body>
    </html>
  );
}