import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import ThemeProvider from "./theme-provider";

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
      {/* Tailwind dark radi preko .dark klase na <html>; time upravlja next-themes */}
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}