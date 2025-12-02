import { useLocale, type Locale } from "./LanguageProvider";
import en from "./messages/en.json";
import sr from "./messages/sr.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";
import ru from "./messages/ru.json";

const MESSAGES: Record<Locale, any> = {
    en,
    sr,
    es,
    fr,
    de,
    ru,
};

export function useTranslation() {
    const { locale } = useLocale();
    const messages = MESSAGES[locale] || MESSAGES["en"];

    function t(key: string, vars?: Record<string, string | number>): string {
        const keys = key.split(".");
        let value = messages;

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            } else {
                // Fallback to EN if missing in current locale
                let fallback = MESSAGES["en"];
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
