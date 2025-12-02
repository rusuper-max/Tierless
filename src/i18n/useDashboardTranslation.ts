import { useLocale, type Locale } from "./LanguageProvider";
import enDashboard from "./messages/dashboard-en.json";
import srDashboard from "./messages/dashboard-sr.json";
import esDashboard from "./messages/dashboard-es.json";
import frDashboard from "./messages/dashboard-fr.json";
import deDashboard from "./messages/dashboard-de.json";
import ruDashboard from "./messages/dashboard-ru.json";

const DASHBOARD_MESSAGES: Record<Locale, any> = {
    en: enDashboard,
    sr: srDashboard,
    es: esDashboard,
    fr: frDashboard,
    de: deDashboard,
    ru: ruDashboard,
};

export function useDashboardTranslation() {
    const { locale } = useLocale();
    const messages = DASHBOARD_MESSAGES[locale] || DASHBOARD_MESSAGES["en"];

    function t(key: string, vars?: Record<string, string | number>): string {
        const keys = key.split(".");
        let value = messages;

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            } else {
                // Fallback to EN if missing in current locale
                let fallback = DASHBOARD_MESSAGES["en"];
                for (const fk of keys) {
                    if (fallback && typeof fallback === "object" && fk in fallback) {
                        fallback = fallback[fk];
                    } else {
                        return key; // Return key if not found in fallback either
                    }
                }
                value = fallback;
                break;
            }
        }

        if (typeof value !== "string") return key;

        if (vars) {
            return value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`) as string);
        }

        return value;
    }

    return { t, locale };
}
