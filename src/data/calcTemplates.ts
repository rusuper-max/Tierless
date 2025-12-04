// src/data/calcTemplates.ts
// Template system with Basic (free, fully editable) and Premium (locked style) templates

export type LockedStyle = {
  // Visual style that CANNOT be changed by user
  theme: "light" | "dark" | "editorial";
  fontFamily: string;
  accentColor: string;
  accentGradient?: string;
  backgroundColor: string;
  backgroundGradient?: string;
  cardStyle: "solid" | "glass" | "outline" | "gradient";
  borderRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  headerStyle?: "minimal" | "centered" | "editorial" | "split";
  animations?: "none" | "fade" | "slide" | "stagger" | "neon";
};

export type PricingTemplate = {
  slug: string;
  name: string;
  defaultName?: string;
  description?: string;
  mode: "packages" | "list" | "advanced";
  
  // Template type
  isPremium: boolean;  // true = locked style, false = basic (fully editable)
  lockedStyle?: LockedStyle;  // Only used when isPremium: true
  
  config: any;
};

// ============================================================================
// LOCKED STYLES - Premium templates reference these by ID
// ============================================================================
export const LOCKED_STYLES: Record<string, LockedStyle> = {
  "wedding-editorial": {
    theme: "dark",
    fontFamily: "'Cormorant Garamond', serif",
    accentColor: "#fdba74",
    accentGradient: "linear-gradient(135deg, #fdba74 0%, #fcd34d 100%)",
    backgroundColor: "#0a0a0a",
    backgroundGradient: "linear-gradient(180deg, #0a0a0a 0%, #18181b 50%, #0a0a0a 100%)",
    cardStyle: "glass",
    borderRadius: "2xl",
    headerStyle: "editorial",
    animations: "stagger",
  },
  "luxury-restaurant": {
    theme: "dark",
    fontFamily: "'Playfair Display', serif",
    accentColor: "#d4af37",
    accentGradient: "linear-gradient(135deg, #d4af37 0%, #f5d67b 100%)",
    backgroundColor: "#1a1a1a",
    backgroundGradient: "radial-gradient(ellipse at top, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    cardStyle: "outline",
    borderRadius: "lg",
    headerStyle: "centered",
    animations: "fade",
  },
  // 🔥 NEON CREATIVE - Ultra premium with custom animations
  "neon-creative": {
    theme: "dark",
    fontFamily: "'Space Grotesk', sans-serif",
    accentColor: "#06b6d4",
    accentGradient: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
    backgroundColor: "#030712",
    backgroundGradient: "radial-gradient(ellipse at 20% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), linear-gradient(180deg, #030712 0%, #0f0f1a 50%, #030712 100%)",
    cardStyle: "glass",
    borderRadius: "2xl",
    headerStyle: "centered",
    animations: "neon", // Special animation type
  },
};

// ============================================================================
// TEMPLATES
// ============================================================================
export const CALC_TEMPLATES: PricingTemplate[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 🔥 NEON CREATIVE STUDIO (Premium, Advanced/Tier mode) - UBER TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "neon-creative-studio",
    name: "⚡ Neon Creative Studio 🔥",
    defaultName: "Creative Services",
    description: "Ultra-premium template with neon gradients, glass morphism, and stunning animations. The ultimate wow factor.",
    mode: "advanced",
    isPremium: true,
    lockedStyle: LOCKED_STYLES["neon-creative"],
    config: {
      pricingMode: "packages",
      i18n: { currency: "USD" },
      branding: { theme: "dark", accent: "#06b6d4", layout: "cards" },
      packages: [],
      meta: {
        editorMode: "advanced",
        templateLocked: true,
        templateStyleId: "neon-creative",
        allowRating: true,
        listInExamples: true,
        customAnimations: "neon",
        business: {
          name: "Neon Studio",
        },
      },
      advanced: {
        publicTheme: "neon",
        publicTitle: "Create Without Limits.",
        publicSubtitle: "Where imagination meets execution.",
        publicDescription: "Premium creative services tailored to your vision.",
        supportNote: "Let's bring your vision to life.",
        layoutVariant: "pricingGrid",
        columnsDesktop: 3,
        showSummary: true,
        summaryPosition: "right",
        showInquiry: true,
        advancedNodes: [
          {
            id: "tier_starter",
            kind: "tier",
            label: "Starter",
            description: "Perfect for small projects and quick turnarounds.",
            price: 299,
            badgeText: "",
            features: [
              { id: "f1", label: "1 concept design" },
              { id: "f2", label: "2 revision rounds" },
              { id: "f3", label: "Source files" },
              { id: "f4", label: "5-day delivery" },
            ],
            cardVariant: "solid",
            emphasis: "normal",
            accentColor: "#06b6d4",
          },
          {
            id: "tier_pro",
            kind: "tier",
            label: "Pro",
            description: "Full creative package for serious brands.",
            price: 799,
            badgeText: "Most Popular",
            badgeColor: "#8b5cf6",
            features: [
              { id: "f1", label: "3 concept designs", highlighted: true },
              { id: "f2", label: "Unlimited revisions", highlighted: true },
              { id: "f3", label: "Brand guidelines" },
              { id: "f4", label: "Social media kit" },
              { id: "f5", label: "3-day delivery" },
            ],
            cardVariant: "solid",
            emphasis: "featured",
            accentColor: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
          },
          {
            id: "tier_enterprise",
            kind: "tier",
            label: "Enterprise",
            description: "Complete brand transformation experience.",
            price: 2499,
            badgeText: "All Inclusive",
            badgeColor: "#ec4899",
            features: [
              { id: "f1", label: "Full brand identity", highlighted: true },
              { id: "f2", label: "Motion graphics", highlighted: true },
              { id: "f3", label: "Website design" },
              { id: "f4", label: "Marketing collateral" },
              { id: "f5", label: "1 month support" },
              { id: "f6", label: "Priority delivery" },
            ],
            cardVariant: "solid",
            emphasis: "normal",
            accentColor: "#ec4899",
          },
          {
            id: "extra_motion",
            kind: "addon",
            label: "Motion Graphics",
            description: "Animated logos and social content.",
            price: 350,
            cardVariant: "outline",
          },
          {
            id: "extra_photo",
            kind: "addon",
            label: "Photo Editing",
            description: "Professional retouching (up to 20 photos).",
            price: 150,
            cardVariant: "outline",
          },
          {
            id: "extra_rush",
            kind: "addon",
            label: "Rush Delivery",
            description: "Get your project in 24 hours.",
            price: 200,
            cardVariant: "outline",
          },
          {
            id: "extra_consult",
            kind: "addon",
            label: "Strategy Session",
            description: "1-hour brand strategy consultation.",
            price: 100,
            cardVariant: "outline",
          },
        ],
      },
      items: [],
      addons: [],
      fields: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. COFFEE SHOP MENU (Basic, List mode)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "coffee-shop-menu",
    name: "☕ Coffee Shop Menu",
    defaultName: "The Daily Grind",
    description: "Perfect for cafes and coffee shops. Pre-filled with drinks, pastries, and sections.",
    mode: "list",
    isPremium: false,
    config: {
      pricingMode: "list",
      i18n: { currency: "USD" },
      branding: { theme: "light", accent: "#78350f", layout: "list" },
      meta: {
        editorMode: "simple",
        enableCalculations: true,
        allowRating: true,
        listInExamples: true,
        simpleSections: [
          { id: "sec_coffee", label: "☕ Coffee & Espresso", collapsed: false },
          { id: "sec_tea", label: "🍵 Tea & Specialty", collapsed: false },
          { id: "sec_pastry", label: "🥐 Pastries & Snacks", collapsed: false },
        ],
        business: {
          name: "The Daily Grind",
          tagline: "Freshly roasted, locally loved",
        },
      },
      items: [
        // ☕ Coffee section
        { id: "item_1", label: "Espresso", price: 2.50, simpleSectionId: "sec_coffee", note: "Single shot" },
        { id: "item_2", label: "Americano", price: 3.00, simpleSectionId: "sec_coffee" },
        { id: "item_3", label: "Caffè Latte", price: 4.50, simpleSectionId: "sec_coffee", note: "12oz", badge: "popular" },
        { id: "item_4", label: "Cappuccino", price: 4.50, simpleSectionId: "sec_coffee" },
        { id: "item_5", label: "Mocha", price: 5.00, simpleSectionId: "sec_coffee", note: "With chocolate" },
        { id: "item_6", label: "Cold Brew", price: 4.00, simpleSectionId: "sec_coffee", badge: "new" },
        { id: "item_7", label: "Flat White", price: 4.50, simpleSectionId: "sec_coffee" },
        // 🍵 Tea section
        { id: "item_8", label: "Green Tea", price: 3.00, simpleSectionId: "sec_tea" },
        { id: "item_9", label: "Chai Latte", price: 4.50, simpleSectionId: "sec_tea", badge: "popular" },
        { id: "item_10", label: "Matcha Latte", price: 5.50, simpleSectionId: "sec_tea" },
        { id: "item_11", label: "Earl Grey", price: 3.00, simpleSectionId: "sec_tea" },
        { id: "item_12", label: "Hot Chocolate", price: 4.00, simpleSectionId: "sec_tea", note: "With whipped cream" },
        // 🥐 Pastry section
        { id: "item_13", label: "Butter Croissant", price: 3.50, simpleSectionId: "sec_pastry" },
        { id: "item_14", label: "Blueberry Muffin", price: 3.00, simpleSectionId: "sec_pastry" },
        { id: "item_15", label: "Banana Bread", price: 3.50, simpleSectionId: "sec_pastry", badge: "popular" },
        { id: "item_16", label: "Chocolate Chip Cookie", price: 2.50, simpleSectionId: "sec_pastry" },
        { id: "item_17", label: "Almond Danish", price: 4.00, simpleSectionId: "sec_pastry" },
        { id: "item_18", label: "Avocado Toast", price: 8.50, simpleSectionId: "sec_pastry", badge: "new", note: "With eggs +$2" },
      ],
      addons: [],
      fields: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PERSONAL TRAINER (Basic, List mode)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "personal-trainer-list",
    name: "💪 Personal Trainer",
    defaultName: "PT Pricelist",
    description: "Simple item list for personal trainers (assessment, 1:1 training, monthly plan...).",
    mode: "list",
    isPremium: false,
    config: {
      pricingMode: "list",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#14b8a6", layout: "list" },
      meta: {
        editorMode: "simple",
        enableCalculations: true,
        allowRating: true,
        listInExamples: true,
        simpleSections: [
          { id: "sec_sessions", label: "🏋️ Training Sessions", collapsed: false },
          { id: "sec_plans", label: "📋 Monthly Plans", collapsed: false },
          { id: "sec_extras", label: "✨ Extras", collapsed: false },
        ],
        business: {
          name: "FitPro Training",
          tagline: "Your goals, our mission",
        },
      },
      items: [
        // Training Sessions
        { id: "item_1", label: "Initial Assessment", price: 30, simpleSectionId: "sec_sessions", note: "45 min • Goals & body analysis" },
        { id: "item_2", label: "1:1 Training Session", price: 25, simpleSectionId: "sec_sessions", note: "60 min", badge: "popular" },
        { id: "item_3", label: "Partner Training (2 ppl)", price: 40, simpleSectionId: "sec_sessions", note: "60 min" },
        { id: "item_4", label: "Small Group (3-5 ppl)", price: 15, simpleSectionId: "sec_sessions", note: "Per person" },
        { id: "item_5", label: "Online Training Session", price: 20, simpleSectionId: "sec_sessions", note: "Via Zoom" },
        // Monthly Plans
        { id: "item_6", label: "Basic Plan", price: 89, simpleSectionId: "sec_plans", note: "4 sessions/month", badge: "popular" },
        { id: "item_7", label: "Standard Plan", price: 159, simpleSectionId: "sec_plans", note: "8 sessions/month + nutrition" },
        { id: "item_8", label: "Premium Plan", price: 249, simpleSectionId: "sec_plans", note: "12 sessions + meal plan + 24/7 support", badge: "new" },
        { id: "item_9", label: "Online Coaching", price: 69, simpleSectionId: "sec_plans", note: "Custom plan + weekly check-ins" },
        // Extras
        { id: "item_10", label: "Nutrition Consultation", price: 45, simpleSectionId: "sec_extras", note: "60 min deep dive" },
        { id: "item_11", label: "Custom Meal Plan", price: 35, simpleSectionId: "sec_extras", note: "Weekly plan" },
        { id: "item_12", label: "Body Composition Scan", price: 25, simpleSectionId: "sec_extras" },
      ],
      addons: [],
      fields: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. WEB AGENCY PACKAGES (Basic, Packages mode)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "web-agency-packages",
    name: "🌐 Web Agency Packages",
    defaultName: "Website Packages",
    description: "Three packages (Starter/Growth/Pro) for website creation.",
    mode: "packages",
    isPremium: false,
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "dark", accent: "#6366f1", layout: "cards" },
      meta: {
        editorMode: "simple",
        enableCalculations: true,
        allowRating: true,
        listInExamples: true,
        business: {
          name: "WebCraft Studio",
          tagline: "We build digital experiences",
        },
      },
      packages: [
        {
          id: "pkg_starter",
          label: "Starter",
          description: "Perfect for small businesses getting online.",
          basePrice: 600,
          featured: false,
          covers: [
            { text: "Up to 5 pages" },
            { text: "Mobile responsive" },
            { text: "Contact form" },
            { text: "Basic SEO setup" },
            { text: "1 revision round" },
          ],
        },
        {
          id: "pkg_growth",
          label: "Growth",
          description: "For growing businesses that need more.",
          basePrice: 1200,
          featured: true,
          covers: [
            { text: "Up to 12 pages", premium: true },
            { text: "Custom design", premium: true },
            { text: "Blog integration" },
            { text: "Advanced SEO", premium: true },
            { text: "Analytics setup" },
            { text: "3 revision rounds" },
          ],
        },
        {
          id: "pkg_pro",
          label: "Pro",
          description: "Full-service solution for established brands.",
          basePrice: 2200,
          featured: false,
          covers: [
            { text: "Unlimited pages", premium: true },
            { text: "E-commerce ready", premium: true },
            { text: "Custom animations" },
            { text: "CMS integration", premium: true },
            { text: "3rd party integrations" },
            { text: "Priority support", premium: true },
            { text: "Unlimited revisions" },
          ],
        },
      ],
      addons: [
        { id: "addon_1", label: "Logo Design", price: 150 },
        { id: "addon_2", label: "Copywriting (per page)", price: 50 },
        { id: "addon_3", label: "Monthly Maintenance", price: 99, note: "/month" },
        { id: "addon_4", label: "Social Media Kit", price: 200 },
      ],
      fields: [],
      items: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CLEANING SERVICE (Basic, Packages mode)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "cleaning-service-packages",
    name: "🧹 Cleaning Service",
    defaultName: "Cleaning Plans",
    description: "Regular cleaning packages for residential and commercial services.",
    mode: "packages",
    isPremium: false,
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "light", accent: "#0891b2", layout: "cards" },
      meta: {
        editorMode: "simple",
        enableCalculations: true,
        allowRating: true,
        listInExamples: true,
        business: {
          name: "SparkleClean",
          tagline: "Your home, spotless",
        },
      },
      packages: [
        {
          id: "pkg_basic",
          label: "Basic",
          description: "Essential cleaning for small spaces.",
          basePrice: 45,
          featured: false,
          covers: [
            { text: "Weekly visit" },
            { text: "Up to 60 m²" },
            { text: "Kitchen & bathroom" },
            { text: "Vacuuming & mopping" },
            { text: "Dusting" },
          ],
        },
        {
          id: "pkg_standard",
          label: "Standard",
          description: "Our most popular choice for families.",
          basePrice: 80,
          featured: true,
          covers: [
            { text: "2× per week", premium: true },
            { text: "Up to 90 m²", premium: true },
            { text: "All rooms included" },
            { text: "Window cleaning (inside)" },
            { text: "Laundry folding" },
            { text: "Bed making" },
          ],
        },
        {
          id: "pkg_premium",
          label: "Premium",
          description: "White-glove service for pristine homes.",
          basePrice: 140,
          featured: false,
          covers: [
            { text: "3× per week", premium: true },
            { text: "Up to 150 m²", premium: true },
            { text: "Deep cleaning monthly", premium: true },
            { text: "Appliance cleaning" },
            { text: "Closet organization" },
            { text: "Eco-friendly products", premium: true },
          ],
        },
      ],
      addons: [
        { id: "addon_1", label: "Oven Deep Clean", price: 25 },
        { id: "addon_2", label: "Fridge Cleaning", price: 20 },
        { id: "addon_3", label: "Window Cleaning (outside)", price: 35 },
        { id: "addon_4", label: "Carpet Shampooing", price: 45 },
        { id: "addon_5", label: "Move-in/Move-out Clean", price: 150 },
      ],
      fields: [],
      items: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. WEDDING EDITORIAL (Premium, Advanced/Tier mode)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "wedding-photographer",
    name: "📸 Wedding Editorial ✨",
    defaultName: "Wedding Packages",
    description: "Exclusive dark editorial template for photographers. Locked premium styling with elegant amber accents.",
    mode: "advanced",
    isPremium: true,
    lockedStyle: LOCKED_STYLES["wedding-editorial"],
    config: {
      pricingMode: "packages",
      i18n: { currency: "EUR" },
      branding: { theme: "dark", accent: "#fdba74", layout: "cards" },
      packages: [],
      meta: {
        editorMode: "advanced",
        templateLocked: true,
        templateStyleId: "wedding-editorial",
        allowRating: true,
        listInExamples: true,
        business: {
          name: "Lumen Photography",
        },
      },
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
            badgeText: "",
            features: [
              { id: "f1", label: "300+ edited photos" },
              { id: "f2", label: "4 hours coverage" },
              { id: "f3", label: "Online gallery" },
              { id: "f4", label: "1 location" },
            ],
            cardVariant: "solid",
            emphasis: "normal",
          },
          {
            id: "tier_cinematic",
            kind: "tier",
            label: "Cinematic",
            description: "Complete story of your day, from preparation to the first dance.",
            price: 990,
            badgeText: "Most Popular",
            badgeColor: "#fdba74",
            features: [
              { id: "f1", label: "Unlimited photos", highlighted: true },
              { id: "f2", label: "8 hours coverage" },
              { id: "f3", label: "Highlight video (4min)", highlighted: true },
              { id: "f4", label: "2 locations" },
              { id: "f5", label: "Engagement session" },
            ],
            cardVariant: "solid",
            emphasis: "featured",
            accentColor: "#fdba74",
          },
          {
            id: "tier_editorial",
            kind: "tier",
            label: "Editorial",
            description: "VIP treatment for celebrations deserving magazine covers.",
            price: 1890,
            badgeText: "All Inclusive",
            badgeColor: "#fff",
            features: [
              { id: "f1", label: "All photos hand-edited" },
              { id: "f2", label: "Full day (12h)", highlighted: true },
              { id: "f3", label: "Cinematic video (15min)", highlighted: true },
              { id: "f4", label: "Drone footage" },
              { id: "f5", label: "Premium album included" },
              { id: "f6", label: "Second photographer" },
            ],
            cardVariant: "solid",
            emphasis: "normal",
          },
          // --- EXTRAS ---
          {
            id: "extra_shooter",
            kind: "addon",
            label: "Second Photographer",
            description: "More angles, more spontaneous moments captured.",
            price: 250,
            cardVariant: "outline",
          },
          {
            id: "extra_drone",
            kind: "addon",
            label: "Drone Session",
            description: "Cinematic aerial shots of your venue.",
            price: 150,
            cardVariant: "outline",
          },
          {
            id: "extra_express",
            kind: "addon",
            label: "48h Express Delivery",
            description: "First 50 photos delivered next day.",
            price: 200,
            cardVariant: "outline",
          },
          {
            id: "extra_album",
            kind: "addon",
            label: "Premium Album",
            description: "30×30cm leather-bound, 50 pages.",
            price: 300,
            cardVariant: "outline",
          },
        ],
      },
      items: [],
      addons: [],
      fields: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SAAS PRICING PRO (Basic, Packages mode)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "saas-pricing-pro",
    name: "💻 SaaS Pricing Pro",
    defaultName: "Pricing Plans",
    description: "Advanced tiered pricing for software companies with monthly/yearly toggle.",
    mode: "packages",
    isPremium: false,
    config: {
      pricingMode: "packages",
      i18n: { currency: "USD" },
      branding: { theme: "dark", accent: "#8b5cf6", layout: "cards" },
      meta: {
        editorMode: "simple",
        enableCalculations: true,
        allowRating: true,
        listInExamples: true,
        business: {
          name: "CloudApp",
          tagline: "Scale your business",
        },
      },
      packages: [
        {
          id: "pkg_free",
          label: "Free",
          description: "Get started with essential features.",
          basePrice: 0,
          featured: false,
          covers: [
            { text: "Up to 3 users" },
            { text: "5 GB storage" },
            { text: "Basic analytics" },
            { text: "Community support" },
            { text: "API access (100 calls/day)" },
          ],
        },
        {
          id: "pkg_pro",
          label: "Pro",
          description: "Everything you need to grow.",
          basePrice: 29,
          featured: true,
          covers: [
            { text: "Up to 20 users", premium: true },
            { text: "100 GB storage", premium: true },
            { text: "Advanced analytics", premium: true },
            { text: "Email support" },
            { text: "API access (10K calls/day)" },
            { text: "Custom integrations" },
            { text: "Remove branding" },
          ],
        },
        {
          id: "pkg_enterprise",
          label: "Enterprise",
          description: "For large teams with custom needs.",
          basePrice: 99,
          featured: false,
          covers: [
            { text: "Unlimited users", premium: true },
            { text: "Unlimited storage", premium: true },
            { text: "White-label solution", premium: true },
            { text: "Dedicated support", premium: true },
            { text: "SLA guarantee" },
            { text: "SSO & SAML" },
            { text: "Custom contracts" },
          ],
        },
      ],
      addons: [
        { id: "addon_1", label: "Extra Storage (100GB)", price: 9, note: "/month" },
        { id: "addon_2", label: "Priority Support", price: 49, note: "/month" },
        { id: "addon_3", label: "Custom Development", price: 150, note: "/hour" },
        { id: "addon_4", label: "Training Session", price: 200, note: "2 hours" },
      ],
      fields: [],
      items: [],
    },
  },

];

// Helper to get template by slug
export function getTemplate(slug: string): PricingTemplate | undefined {
  return CALC_TEMPLATES.find(t => t.slug === slug);
}

// Helper to check if a calc has a locked template
export function isTemplateLocked(meta: any): boolean {
  return meta?.templateLocked === true && !!meta?.templateStyleId;
}

// Helper to get locked style for a calc
export function getLockedStyle(meta: any): LockedStyle | null {
  if (!isTemplateLocked(meta)) return null;
  return LOCKED_STYLES[meta.templateStyleId] || null;
}
