import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "./locales";
import { translate } from "./translate";

function ensureLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    return ensureLocale(store.get(LOCALE_COOKIE)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function t(key: string, vars?: Record<string, string | number>): Promise<string> {
  const locale = await getServerLocale();
  return translate(locale, key, vars);
}

export { translate };
