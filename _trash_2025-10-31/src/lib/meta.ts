// src/lib/meta.ts
import { t } from "@/i18n/t";

/** Vrati lokalizovan title/description za stranu (npr. keyBase="home"). */
export function getLocalizedMeta(keyBase: string) {
  return {
    title: t(`meta.${keyBase}.title`),
    description: t(`meta.${keyBase}.description`)
  };
}