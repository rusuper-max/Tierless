import type { Locale } from "./locales";
import { getMessages } from "./dictionaries";

type Vars = Record<string, string | number>;

function getByPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc: any, part: string) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

function format(str: string, vars?: Vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? `{${key}}`) as string);
}

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const messages = getMessages(locale);
  const raw = getByPath(messages, key);

  if (typeof raw === "string") {
    return format(raw, vars);
  }

  if (locale !== "en") {
    const fallback = getByPath(getMessages("en"), key);
    if (typeof fallback === "string") {
      return format(fallback, vars);
    }
  }

  return vars ? format(key, vars) : key;
}
