"use client";
import { ThemeProvider as NextThemes } from "next-themes";
import { PropsWithChildren } from "react";

export default function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemes
      attribute="class"       // dodaje/uklanja "dark" na <html>
      defaultTheme="system"   // poštuj OS
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemes>
  );
}