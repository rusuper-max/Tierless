// Pricing-first templates (no ROI calculator tricks)
export type PricingTemplate = {
  slug: string;
  name: string;
  defaultName?: string;
  description?: string;
  mode: "packages" | "list";
  config: any; // used in calcFromMetaConfig
};

export const CALC_TEMPLATES: PricingTemplate[] = [
  {
    slug: "personal-trainer-list",
    name: "Personal Trainer — Price List",
    defaultName: "PT Pricelist",
    description:
      "Simple item list for personal trainers (assessment, 1:1 training, monthly plan...).",
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
      "Three packages (Starter/Growth/Pro) for website creation. Clear items covered by each package.",
    mode: "packages",
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#2563eb", layout: "cards" },
      packages: [
        {
          id: "starter",
          label: "Starter",
          description: "Up to 5 pages, basic design, basic SEO.",
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
          description: "Up to 12 pages, custom design, advanced SEO.",
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
          description: "Everything in Growth + blog + integrations.",
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
      "Regular cleaning (Basic/Standard/Premium) for apartment and office cleaning services.",
    mode: "packages",
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#16a34a", layout: "cards" },
      packages: [
        {
          id: "basic",
          label: "Basic",
          description: "Basic weekly cleaning up to 60 m².",
          basePrice: 45,
          featured: true,
          covers: [{ text: "Weekly cleaning" }, { text: "Up to 60 m²" }],
        },
        {
          id: "standard",
          label: "Standard",
          description: "Two sessions weekly, up to 90 m².",
          basePrice: 80,
          covers: [{ text: "2× weekly" }, { text: "Up to 90 m²", premium: true }],
        },
        {
          id: "premium",
          label: "Premium",
          description: "Three sessions weekly, deep cleaning once a month.",
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
  {
    slug: "wedding-photographer",
    name: "Wedding Photographer — Editorial",
    defaultName: "Wedding Packages",
    description: "Exclusive dark mode template for photographers. Three packages + addons.",
    mode: "packages",
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "dark", accent: "#fdba74", layout: "cards" },
      packages: [], // We use advancedNodes for this template
      advanced: {
        publicTheme: "editorial",
        publicTitle: "Capture the Moment.",
        publicSubtitle: "Transparent pricing for memories that last forever.",
        publicDescription: "Create a package that perfectly matches your vision.",
        supportNote: "We check availability within 1h.",
        layoutVariant: "pricingGrid",
        columnsDesktop: 3,
        showSummary: true,
        summaryPosition: "right",
        showInquiry: true,
        advancedNodes: [
          // --- TIERS ---
          {
            id: "tier_intimate",
            kind: "tier",
            label: "Intimate",
            description: "Perfect for smaller, intimate weddings focused on emotion.",
            price: 490,
            badgeText: "Basic Package",
            badgeColor: "#a8a29e", // stone-400
            features: [
              { id: "f1", label: "300+ photos" },
              { id: "f2", label: "4h coverage" },
              { id: "f3", label: "Online gallery" },
            ],
            cardVariant: "solid",
            emphasis: "normal",
          },
          {
            id: "tier_cinematic",
            kind: "tier",
            label: "Cinematic",
            description: "Complete story of your day, from preparation to the cake.",
            price: 990,
            badgeText: "Most Popular",
            badgeColor: "#fdba74", // orange-300
            features: [
              { id: "f1", label: "Unlimited photos", highlighted: true },
              { id: "f2", label: "8h coverage" },
              { id: "f3", label: "Highlight Video (4min)" },
            ],
            cardVariant: "solid",
            emphasis: "featured",
            accentColor: "#fdba74",
          },
          {
            id: "tier_editorial",
            kind: "tier",
            label: "Editorial",
            description: "VIP treatment for grand celebrations deserving a cover page.",
            price: 1890,
            badgeText: "All Inclusive",
            badgeColor: "#fff",
            features: [
              { id: "f1", label: "All photos edited" },
              { id: "f2", label: "All day coverage (12h)" },
              { id: "f3", label: "Video (15min) + Drone", highlighted: true },
            ],
            cardVariant: "solid",
            emphasis: "normal",
          },
          // --- EXTRAS ---
          {
            id: "extra_shooter",
            kind: "addon",
            label: "Second Photographer",
            description: "More angles, more spontaneous smiles.",
            price: 250,
            cardVariant: "outline",
          },
          {
            id: "extra_drone",
            kind: "addon",
            label: "Drone Session",
            description: "Cinematic aerial shots.",
            price: 150,
            cardVariant: "outline",
          },
          {
            id: "extra_express",
            kind: "addon",
            label: "48h Delivery",
            description: "First 50 photos the next day.",
            price: 200,
            cardVariant: "outline",
          },
          {
            id: "extra_album",
            kind: "addon",
            label: "Premium Album",
            description: "30x30cm, leather binding, 50 pages.",
            price: 300,
            cardVariant: "outline",
          },
        ],
      },
    },
  },
];