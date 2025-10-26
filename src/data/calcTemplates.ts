// Pricing-first templates (bez ROI kalkulator fora)
export type PricingTemplate = {
  slug: string;
  name: string;
  defaultName?: string;
  description?: string;
  mode: "packages" | "list";
  config: any; // koristi se u calcFromMetaConfig
};

export const CALC_TEMPLATES: PricingTemplate[] = [
  {
    slug: "personal-trainer-list",
    name: "Personal Trainer — Price List",
    defaultName: "PT Pricelist",
    description:
      "Jednostavna lista stavki za ličnog trenera (procena, 1:1 trening, mesečni plan…).",
    mode: "list",
    config: {
      pricingMode: "list",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#14b8a6", layout: "list" },
      items: [
        { id: "assess", label: "Initial assessment", unit: "session", price: 30, qty: 1, note: "45 min" },
        { id: "one2one", label: "1:1 training", unit: "session", price: 25, qty: 0 },
        { id: "plan", label: "Monthly plan", unit: "month", price: 89, qty: 0, note: "Remote coaching" },
      ],
      addons: [],
      fields: [],
    },
  },
  {
    slug: "web-agency-packages",
    name: "Web Agency — Packages",
    defaultName: "Website Packages",
    description:
      "Tri paketa (Starter/Growth/Pro) za izradu sajta. Jasne stavke pokrivene paketom.",
    mode: "packages",
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#2563eb", layout: "cards" },
      packages: [
        {
          id: "starter",
          label: "Starter",
          description: "Do 5 stranica, osnovni dizajn, osnovni SEO.",
          basePrice: 600,
          featured: true,
          covers: [
            { text: "Up to 5 pages" },
            { text: "Basic design" },
            { text: "Basic SEO" },
          ],
        },
        {
          id: "growth",
          label: "Growth",
          description: "Do 12 stranica, custom dizajn, napredni SEO.",
          basePrice: 1200,
          covers: [
            { text: "Up to 12 pages", premium: true },
            { text: "Custom design", premium: true },
            { text: "Advanced SEO", premium: true },
          ],
        },
        {
          id: "pro",
          label: "Pro",
          description: "Sve iz Growth + blog + integracije.",
          basePrice: 2200,
          covers: [
            { text: "Everything in Growth" },
            { text: "Blog / CMS", premium: true },
            { text: "Integrations", premium: true },
          ],
        },
      ],
      addons: [],
      fields: [],
    },
  },
  {
    slug: "cleaning-service-packages",
    name: "Cleaning Service — Packages",
    defaultName: "Cleaning Plans",
    description:
      "Redovno čišćenje (Basic/Standard/Premium) za servis čišćenja stanova i poslovnog prostora.",
    mode: "packages",
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#16a34a", layout: "cards" },
      packages: [
        {
          id: "basic",
          label: "Basic",
          description: "Osnovno sedmično čišćenje do 60 m².",
          basePrice: 45,
          featured: true,
          covers: [{ text: "Weekly cleaning" }, { text: "Up to 60 m²" }],
        },
        {
          id: "standard",
          label: "Standard",
          description: "Dva termina nedeljno, do 90 m².",
          basePrice: 80,
          covers: [{ text: "2× weekly" }, { text: "Up to 90 m²", premium: true }],
        },
        {
          id: "premium",
          label: "Premium",
          description: "Tri termina nedeljno, dubinsko jednom mesečno.",
          basePrice: 140,
          covers: [
            { text: "3× weekly", premium: true },
            { text: "Monthly deep clean", premium: true },
          ],
        },
      ],
      addons: [],
      fields: [],
    },
  },
];