// src/lib/localeHref.ts
// Danas samo vraća prosleđeni path. Sutra lako prebacimo na "/{locale}{path}".
export function localeHref(path: string) {
  return path; // kasnije: `/${activeLocale}${path}`
}