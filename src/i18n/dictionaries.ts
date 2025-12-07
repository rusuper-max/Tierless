import type { Locale } from "./locales";

import en from "./messages/en.json";
import sr from "./messages/sr.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";
import ru from "./messages/ru.json";

import dashboardEn from "./messages/dashboard-en.json";
import dashboardSr from "./messages/dashboard-sr.json";
import dashboardEs from "./messages/dashboard-es.json";
import dashboardFr from "./messages/dashboard-fr.json";
import dashboardDe from "./messages/dashboard-de.json";
import dashboardRu from "./messages/dashboard-ru.json";

export type Messages = Record<string, any>;

const BASE_MESSAGES: Record<Locale, Messages> = {
  en,
  sr,
  es,
  fr,
  de,
  ru,
};

const DASHBOARD_MESSAGES: Record<Locale, Messages> = {
  en: dashboardEn,
  sr: dashboardSr,
  es: dashboardEs,
  fr: dashboardFr,
  de: dashboardDe,
  ru: dashboardRu,
};

export const DICTIONARIES: Record<Locale, Messages> = {
  en: { ...BASE_MESSAGES.en, ...DASHBOARD_MESSAGES.en },
  sr: { ...BASE_MESSAGES.sr, ...DASHBOARD_MESSAGES.sr },
  es: { ...BASE_MESSAGES.es, ...DASHBOARD_MESSAGES.es },
  fr: { ...BASE_MESSAGES.fr, ...DASHBOARD_MESSAGES.fr },
  de: { ...BASE_MESSAGES.de, ...DASHBOARD_MESSAGES.de },
  ru: { ...BASE_MESSAGES.ru, ...DASHBOARD_MESSAGES.ru },
};

export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}
