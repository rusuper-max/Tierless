import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import ThemeProvider from "./theme-provider";
import DnaGlow2D from "@/components/AuroraFX";
import AuroraFX from "@/components/AuroraFX";

export const metadata: Metadata = {
  title: { default: "Tierless", template: "%s • Tierless" },
  description: "Create, edit and share pricing/offer pages with Tierless.",
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {/* glow ispod sadržaja */}
        <ThemeProvider>
          <div className="relative z-[1]">
            <Nav />
            {children}
          </div>
        </ThemeProvider>
        <AuroraFX/>
      </body>
    </html>
  );
}