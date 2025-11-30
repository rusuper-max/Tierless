export type Mode = "setup" | "simple" | "advanced";
export type BrandTheme = "tierless" | "minimal" | "luxury" | "elegant" | "midnight" | "cafe" | "ocean" | "forest" | "sunset" | "rosegold" | "emerald" | "sapphire" | "obsidian" | "goldluxury" | "classic" | "custom" | "light" | "dark";

export type FeatureOption = { id: string; label: string; highlighted?: boolean };
export type Extra = { id: string; text: string; price?: number; selected?: boolean };
export type RangePricing =
    | { mode: "linear"; deltaPerUnit: number }
    | { mode: "per-step"; perStep: number[] };

export type ContactType = "email" | "whatsapp" | "telegram";

export type ContactInfo = {
    type?: ContactType;
    whatsapp?: string;
    telegram?: string;
    email?: string;
};

export type OptionGroup = {
    id: string;
    title: string;
    type: "features" | "range" | "options";
    pkgId?: string;
    options?: FeatureOption[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    base?: number;
    pricing?: RangePricing;
    color?: string;
};

export type Pkg = {
    id: string;
    label: string;
    basePrice: number | null;
    description?: string;
    featured?: boolean;
    color?: string;
};

export type BusinessInfo = {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    location?: string;
    wifiSsid?: string;
    wifiPass?: string;
    hours?: string;
    logoUrl?: string;
    logoPublicId?: string;
    coverUrl?: string;
    coverPublicId?: string;
};

export type FloatingCta = {
    enabled: boolean;
    label: string;
    link: string;
};

export type SimpleSection = {
    id: string;
    label: string;
    description?: string;
    imageUrl?: string;
    imagePublicId?: string;
    collapsed?: boolean;
};

export type ItemRow = {
    id: string;
    label: string;
    price: number | null;
    note?: string;
    imageUrl?: string;
    imagePublicId?: string;
    simpleSectionId?: string;
    hidden?: boolean;
    soldOut?: boolean;
    tags?: string[];
    badge?: string; // Dodato iz prethodnog zahteva
    discountPercent?: number;
    unit?: string;
    customUnit?: string;
    actionUrl?: string;
    actionLabel?: string;
};

export type SocialNetworks = {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
    website?: string;
};

export type CalcMeta = {
    id?: string;
    name?: string;
    slug?: string;
    editorMode?: Mode;
    theme?: BrandTheme;
    business?: BusinessInfo & { social?: SocialNetworks };
    cta?: FloatingCta;
    simpleCoverImage?: string;
    simpleSections?: SimpleSection[];
    simpleSectionStates?: Record<string, boolean>;
    simpleBg?: string;
    simpleBgGrad1?: string;
    simpleBgGrad2?: string;
    simpleTextColor?: string;
    simpleBorderColor?: string;
    simpleFont?: string;
    autosaveEnabled?: boolean;
    autosaveInterval?: number; // in seconds
    contactOverride?: ContactInfo;
    contact?: ContactInfo;
    [k: string]: unknown;
};

export type CalcJson = {
    meta: CalcMeta;
    packages: Pkg[];
    fields: OptionGroup[];
    addons: Extra[];
    items?: ItemRow[];
    i18n?: { currency?: string; decimals?: number };
    [k: string]: unknown;
};
