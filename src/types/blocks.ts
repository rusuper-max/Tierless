// Unified block model (Plan A)
export type BlockType = "packages" | "items" | "options" | "extras";

export type BaseBlock<T extends BlockType = BlockType, D = any> = {
  id: string;
  type: T;
  title?: string;
  data?: D;
};

// Packages
export type PackageRow = {
  id: string;
  label: string;
  description?: string;
  basePrice: number | null; // null => "Custom"
  featured?: boolean;
};

export type PackagesBlockData = {
  layout?: "cards" | "cards-3" | "cards-4" | "list";
  showYearly?: boolean;
  packages: PackageRow[];
};

export type PackagesBlock = BaseBlock<"packages", PackagesBlockData>;

// Items (light MVP)
export type ItemRow = {
  id: string;
  label: string;
  price: number | null;
  note?: string;
};

export type ItemsBlockData = {
  columns?: number;
  rows: ItemRow[];
};

export type ItemsBlock = BaseBlock<"items", ItemsBlockData>;

// Options (MVP)
export type OptionRow = {
  id: string;
  label: string;
  delta?: number | null; // +/- price delta
};

export type OptionsBlockData = {
  multiple?: boolean;
  showPriceDelta?: boolean;
  rows: OptionRow[];
};

export type OptionsBlock = BaseBlock<"options", OptionsBlockData>;

// Extras (MVP)
export type ExtrasBlockData = {
  title?: string;
  note?: string;
};

export type ExtrasBlock = BaseBlock<"extras", ExtrasBlockData>;

export type AnyBlock = PackagesBlock | ItemsBlock | OptionsBlock | ExtrasBlock;

// Calc JSON shape (public/full)
export type CalcJson = {
  meta?: {
    id?: string;
    slug?: string;
    name?: string;
    description?: string;
    branding?: { theme?: "light" | "dark" };
  };
  i18n?: { locale?: string; currency?: string; decimals?: number };
  pricingMode?: "packages" | "list";
  // legacy root fields (fallbacks)
  packages?: PackageRow[];
  items?: ItemRow[];
  addons?: any[];
  fields?: any[];
  // Plan A:
  blocks?: AnyBlock[];
};