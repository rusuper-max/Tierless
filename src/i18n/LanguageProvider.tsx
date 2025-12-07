// src/i18n/LanguageProvider.tsx
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "./locales";

// Re-export Locale type for convenience
export type { Locale };

// Context type
interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

// Create context with default value
const LanguageContext = createContext<LanguageContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LanguageProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale || DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LOCALE_COOKIE);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale) && stored !== locale) {
      setLocaleState(stored as Locale);
    }
  }, []);

  const persistLocale = useCallback((next: Locale) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_COOKIE, next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return <LanguageContext.Provider value={{ locale, setLocale: persistLocale }}>{children}</LanguageContext.Provider>;
}

// Hook to use language context
export function useLocale() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLocale must be used within LanguageProvider");
  }
  return context;
}
