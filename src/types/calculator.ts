export type Theme = "light" | "dark";
export type PricingMode = "packages" | "list";

export type Branding = {
  theme?: Theme;
  accent?: string;
  layout?: string; // "cards" | "list" | custom
  hideBadge?: boolean;
};

export type I18n = {
  locale?: string;
  currency?: string;
  decimals?: number;
};

export type PackageCover = { text: string; premium?: boolean };

export type Package = {
  id: string;
  label: string;
  description?: string;
  basePrice?: number;
  featured?: boolean;
  covers?: PackageCover[];
};

export type Item = {
  id: string;
  label: string;
  unit?: string;     // npr. "h", "pcs"
  price?: number;    // cena po jedinici
  qty?: number;      // količina
  note?: string;     // napomena
};

/** Blocks v1 */
export type BlockBase<T extends string> = {
  id: string;
  type: T;
  title?: string;
  /** U budućnosti možemo dodati: visibility, plan gating itd. */
};

export type PackagesBlock = BlockBase<"packages"> & {
  layout?: "cards" | "list";
};

export type ItemsBlock = BlockBase<"items"> & {
  showTotals?: boolean;
};

export type OptionsBlock = BlockBase<"options">;
export type ExtrasBlock = BlockBase<"extras">;

// (Za kasnije – placeholderi)
export type TextBlock = BlockBase<"text"> & { content?: string };
export type HeroBlock = BlockBase<"hero"> & { headline?: string; sub?: string };
export type FAQBlock = BlockBase<"faq"> & { items?: Array<{ q: string; a: string }> };
export type CTABlock = BlockBase<"cta"> & { label?: string; href?: string };

export type Block =
  | PackagesBlock
  | ItemsBlock
  | OptionsBlock
  | ExtrasBlock
  | TextBlock
  | HeroBlock
  | FAQBlock
  | CTABlock;

export type Calculator = {
  meta: {
    name: string;
    slug: string;
    branding?: Branding;
    allowRating?: boolean;
    listInExamples?: boolean;
    avgRating?: number;
    ratingsCount?: number;
  };
  i18n?: I18n;

  /** Stari prikaz (ostaje kompatibilno) */
  pricingMode?: PricingMode; // default: "packages"
  packages?: Package[];
  items?: Item[];

  addons?: any[];
  fields?: any[];

  /** NOVO: Blocks v1 */
  blocks?: Block[];

  [k: string]: any;
};