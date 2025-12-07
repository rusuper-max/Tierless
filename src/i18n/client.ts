"use client";

import { useLocale } from "./LanguageProvider";
import { translate } from "./translate";

export function useT() {
  const { locale } = useLocale();

  return (key: string, vars?: Record<string, string | number>) => {
    return translate(locale, key, vars);
  };
}
