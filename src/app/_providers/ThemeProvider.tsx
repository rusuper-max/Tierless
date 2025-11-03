"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"         // dodaje/uklanja .dark na <html>
      defaultTheme="system"     // startujemo sa sistemskom
      enableSystem
      disableTransitionOnChange // bez flickera pri promeni
    >
      {children}
    </NextThemesProvider>
  );
}