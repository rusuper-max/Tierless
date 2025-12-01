// src/i18n/t.ts
// Real i18n implementation with dynamic locale support

import { useLocale, type Locale } from './LanguageProvider';

// Import all message files
import en from './messages/en.json';
import sr from './messages/sr.json';
import es from './messages/es.json';
import fr from './messages/fr.json';
import de from './messages/de.json';
import ru from './messages/ru.json';

// Dashboard messages (optional, for dashboard-specific translations)
import dashboardEn from './messages/dashboard-en.json';
import dashboardSr from './messages/dashboard-sr.json';
import dashboardEs from './messages/dashboard-es.json';
import dashboardFr from './messages/dashboard-fr.json';
import dashboardDe from './messages/dashboard-de.json';
import dashboardRu from './messages/dashboard-ru.json';

type Messages = Record<string, any>;

// Combine main and dashboard messages for each locale
const MESSAGES: Record<Locale, Messages> = {
  en: { ...en, ...dashboardEn },
  sr: { ...sr, ...dashboardSr },
  es: { ...es, ...dashboardEs },
  fr: { ...fr, ...dashboardFr },
  de: { ...de, ...dashboardDe },
  ru: { ...ru, ...dashboardRu },
};

/**
 * Navigate through nested object using dot notation path
 * Example: getByPath(obj, "hero.title") -> obj.hero.title
 */
function getByPath(obj: Messages, path: string): any {
  return path.split(".").reduce((acc: any, part: string) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, obj);
}

/**
 * Replace {variable} placeholders in strings
 * Example: formatVars("Hello {name}", {name: "Alice"}) -> "Hello Alice"
 */
function formatVars(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`) as string);
}

/**
 * Translate a key for a specific locale
 * @param locale - The locale to translate to
 * @param key - Dot-notation key (e.g., "hero.title")
 * @param vars - Optional variables to interpolate
 */
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const messages = MESSAGES[locale] || MESSAGES.en;
  const raw = getByPath(messages, key);

  if (typeof raw === "string") {
    return formatVars(raw, vars);
  }

  // Fallback: try English if translation missing
  if (locale !== 'en') {
    const fallback = getByPath(MESSAGES.en, key);
    if (typeof fallback === "string") {
      return formatVars(fallback, vars);
    }
  }

  // Last resort: return the key itself so it's visible in UI
  return key;
}

/**
 * Hook for client components - uses current locale from context
 */
export function useT() {
  const { locale } = useLocale();

  return (key: string, vars?: Record<string, string | number>): string => {
    return translate(locale, key, vars);
  };
}

/**
 * Server-side translation (static - always English)
 * For server components that don't have access to client context
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  return translate('en', key, vars);
}