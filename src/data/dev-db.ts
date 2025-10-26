import type { Calculator } from "@/types/calculator";

const demo: Calculator = {
  meta: {
    name: "Wedding Quote (Demo)",
    slug: "demo",
    branding: { theme: "dark", accent: "#14b8a6", layout: "cards" },
  },
  i18n: { locale: "en", currency: "EUR", decimals: 0 },
  packages: [
    {
      id: "basic",
      label: "Basic",
      description: "4h, 50 edited photos",
      basePrice: 700,
      covers: [
        { text: "Coverage 4h" },
        { text: "50 edited photos" },
        { text: "Online gallery", premium: true },
      ],
    },
    {
      id: "classic",
      label: "Classic",
      description: "8h, 150 edited photos, gallery",
      basePrice: 1200,
      featured: true,
      covers: [
        { text: "Coverage 8h", premium: true },
        { text: "150 edited photos", premium: true },
        { text: "Online gallery", premium: true },
      ],
    },
  ],
  addons: [
    { id: "second", label: "Second photographer", type: "fixed", value: 200, recommended: true },
    { id: "drone", label: "Drone", type: "fixed", value: 120 },
    { id: "extra", label: "Extra hour", type: "unit", unitLabel: "h", unitPrice: 70, min: 0, max: 10, step: 1 },
  ],
  fields: [
    { key: "hours", type: "slider", label: "Hours on site", min: 4, max: 14, step: 1, default: 8, deltaPerUnit: 70 },
    {
      key: "album",
      type: "select",
      label: "Album",
      options: [
        { value: "none", label: "No album", delta: 0 },
        { value: "basic", label: "Basic album", delta: 120 },
        { value: "premium", label: "Premium album", delta: 220 },
      ],
      default: "none",
    },
    { key: "express", type: "checkbox", label: "Express delivery (7 days)", delta: 120, default: false },
  ],
};

export function getDemoCalculator(slug: string) {
  if (slug === demo.meta.slug) return demo;
  return null;
}