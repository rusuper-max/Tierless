export type Locale = "en" | "sr" | "es" | "fr" | "de" | "ru";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "sr", "es", "fr", "de", "ru"] as const;

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "tierless_locale";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  sr: "Srpski",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
};
