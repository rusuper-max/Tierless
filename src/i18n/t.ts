// src/i18n/t.ts
// No-op i18n: trenutno čita samo EN poruke iz en.json.
// Ključevi su "dot-notation" (npr. "hero.title"). Ako nema ključa, vraća sam ključ.

import en from "./messages/en.json";

type Messages = Record<string, any>;

const MESSAGES: Messages = en as Messages;

function getByPath(obj: Messages, path: string): any {
  return path.split(".").reduce((acc: any, part: string) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, obj);
}

function formatVars(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`) as string);
}

/** Primarni prevodilački helper. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = getByPath(MESSAGES, key);
  if (typeof raw === "string") return formatVars(raw, vars);
  // fallback: ako nema string, vrati ključ (lako se uoči u UI-u)
  return key;
}

/** Hook varijanta; zgodno u client komponentama. */
export function useT() {
  return t;
}