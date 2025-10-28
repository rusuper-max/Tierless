// src/lib/i18n/index.ts
// No-op i18n helper sa prostom interpolacijom: t("Hello {name}", { name: "Alex" })
export function t(key: string, vars?: Record<string, string | number>) {
  if (!vars) return key;
  return Object.keys(vars).reduce(
    (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k])),
    key
  );
}