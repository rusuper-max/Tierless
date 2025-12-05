// src/app/editor/[id]/panels/advanced/types.ts

export const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

/* -------------------------------------------------------------------------- */
/*  Core enums / string literal types                                          */
/* -------------------------------------------------------------------------- */

export type AdvancedNodeKind = "tier" | "addon" | "item" | "slider";

export type CardVariant = "solid" | "outline" | "ghost";

export type Emphasis = "normal" | "featured" | "subtle";

export type BillingPeriod = "once" | "month" | "year";

export type AdvancedTheme = "light" | "dark" | "tierless" | "editorial";

/**
 * Layout varijante za public page:
 * - pricingGrid  – standardna mreža kartica (default)
 * - stacked      – jedna veća featured, ostale ispod / pored
 * - comparison   – 2–3 kolone za uporedni prikaz
 * - wizard       – multi-step (kasnije)
 */
export type AdvancedLayoutVariant =
  | "pricingGrid"
  | "stacked"
  | "comparison"
  | "wizard";

export type AdvancedSummaryPosition = "right" | "bottom";

export type AdvancedCtaMode = "inquiry" | "checkout" | "both";

/**
 * Kako se crtaju outline-i kartica na public page:
 * - brand     – koristi globalni brand gradient / boje
 * - solid     – jedna boja (customColor)
 * - none      – bez outline-a (samo shadow / bg)
 * - gradient  – custom gradient (kasnije, pro feature)
 */
export type CardOutlineMode = "brand" | "solid" | "none" | "gradient";

/**
 * Kako izgleda selektovana kartica:
 * - brandGlow    – ono što trenutno imamo (gradient glow)
 * - solidBg      – punija pozadina u boji
 * - shadow       – jaki shadow + možda suptilni border
 * - outlineGlow  – naglašen outline u boji
 */
export type SelectedHighlightMode =
  | "brandGlow"
  | "solidBg"
  | "shadow"
  | "outlineGlow";

/**
 * Boje za slidere:
 * - brand     – Tierless brand gradient / boje
 * - solid     – jedna custom boja
 * - gradient  – custom gradient (kasnije, pro feature)
 */
export type SliderColorMode = "brand" | "solid" | "gradient";

/**
 * State za feature u tier-u – koristi se kasnije za naprednije legend-e:
 * - included  – normalno uključeno
 * - partial   – delimično uključeno / ograničeno
 * - optional  – dostupno uz doplatu / dogovor
 * - excluded  – eksplicitno nije uključeno
 */
export type FeatureState = "included" | "partial" | "optional" | "excluded";

/**
 * Vrsta CTA za pojedinačni tier (LATER, ali korisno da postoji u šemi):
 * - link      – vodi na URL (booking, checkout, kalendar…)
 * - checkout  – direktan checkout (Stripe/whatever)
 * - email     – otvara mailto ili contact flow
 * - none      – samo informativno, bez dugmeta
 */
export type AdvancedTierCtaKind = "link" | "checkout" | "email" | "none";

/* -------------------------------------------------------------------------- */
/*  Tier features                                                              */
/* -------------------------------------------------------------------------- */

export interface AdvancedTierFeature {
  id: string;
  label: string;
  /**
   * Da li je feature “bubble” highlightovan u UI.
   * Ovo već koristimo – ostaje kompatibilno.
   */
  highlighted?: boolean;
  /**
   * Semantički state (included/optional/etc).
   * Trenutno se ne koristi u rendereru, ali šema je spremna.
   */
  state?: FeatureState;
}

/* -------------------------------------------------------------------------- */
/*  Wizard meta (LATER)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Meta za Wizard layout (multi-step pricing/quiz).
 * Ovo za sada ne koristimo u UI-ju, ali imamo spremnu šemu.
 */
export interface AdvancedWizardStepMeta {
  id: string;
  label: string;
  description?: string | null;
  /**
   * Koji blokovi (tiers/addons/sliders/items) su logički vezani za ovaj korak.
   * Npr. Step 1: odaberi tip klijenta, Step 2: odaberi paket, itd.
   */
  attachedNodeIds?: string[];
}

/* -------------------------------------------------------------------------- */
/*  Glavni node tip – jedan interface za sve kind-ove                          */
/* -------------------------------------------------------------------------- */

/**
 * Jedan “block” u advanced editoru.
 * Koristimo jedan interface sa optional poljima da ne razbijamo postojeći kod.
 * Discriminant je `kind`.
 */
export interface AdvancedNode {
  id: string;
  kind: AdvancedNodeKind;

  /* ------------------------ Osnovni meta podaci --------------------------- */
  label: string;
  description?: string | null;

  badgeText?: string | null;
  badgeColor?: string | null;

  iconEmoji?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;

  /* ------------------------ Kartica – vizuelni stil ---------------------- */
  cardVariant?: CardVariant | null; // solid | outline | ghost
  emphasis?: Emphasis | null; // normal | featured | subtle

  /**
   * Per-tier/accent boja za card (override globalnog).
   */
  accentColor?: string | null;

  /**
   * Primarna boja teksta za naslov kartice – ako nije setovano,
   * renderer koristi var(--text).
   */
  textColor?: string | null;

  /**
   * Da li se akcent boja koristi i na outline-u kartice.
   * Ako je false, outline se vraća na neutralan.
   */
  useAccentOutline?: boolean;

  /**
   * Da li kartica uvek ima akcent boju (i kad nije selektovana).
   * Ako je true, kartica će uvek biti obojena u accentColor.
   */
  alwaysColored?: boolean;

  /* ------------------------ Cena / billing / unit ------------------------ */

  /**
   * Base price – koristi se za tier i addon (i po potrebi item).
   */
  price?: number | null;

  /**
   * Sale price – prikazuje se sa strikethrough na old price.
   * Ako postoji, koristi se ovaj price umesto base price za total.
   */
  salePrice?: number | null;

  /**
   * Billing period – once | month | year.
   */
  billingPeriod?: BillingPeriod | null;

  /**
   * Npr. "per hour", "per project", "per m²".
   */
  unitLabel?: string | null;

  /**
   * Unit of measurement for sliders (e.g. "hours", "km", "pcs").
   */
  unit?: string | null;

  /**
   * Da li ovaj block ulazi u total kalkulaciju.
   * Ako je false – “Info only”.
   */
  includeInTotal?: boolean;

  /* ------------------------ Slider-specific fields ----------------------- */

  min?: number | null;
  max?: number | null;
  step?: number | null;

  /**
   * Cena po step-u slajdera.
   * LATER: možemo dodati formulu umesto plain number-a.
   */
  pricePerStep?: number | null;

  /* ------------------------ Tier-specific: features & CTA ---------------- */

  /**
   * Lista feature-a za tier.
   */
  features?: AdvancedTierFeature[];

  /**
   * Per-tier CTA (LATER).
   * Ako nije setovano – koristi se globalni CTA iz meta.
   */
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  ctaKind?: AdvancedTierCtaKind | null;

  /* ------------------------ Misc – proširenja u budućnosti --------------- */

  /**
   * Generic buckets za future-proofs – da ne cepamo šemu svaki put.
   * Npr. per-node flags, eksperimenti itd.
   */
  experimentalFlags?: string[];
}

/* -------------------------------------------------------------------------- */
/*  Globalna meta za advanced / public price page                             */
/* -------------------------------------------------------------------------- */

export interface AdvancedPublicMeta {
  /* ------------------------ Identitet stranice --------------------------- */

  /**
   * Interni naziv stranice u dashboardu – ne mora nužno da se prikazuje
   * posetiocima.
   */
  publicName?: string | null;

  /**
   * Naslov na public page (H1).
   */
  publicTitle?: string | null;

  /**
   * Podnaslov odmah ispod naslova.
   */
  publicSubtitle?: string | null;

  /**
   * Kratak opis / uvod – trenutno ga koristimo kao description u rendereru.
   */
  publicDescription?: string | null;

  /**
   * Mali tekst u dnu (tax note, custom offers, support contact…)
   */
  supportNote?: string | null;

  /* ------------------------ Tema & layout ------------------------------- */

  /**
   * Tema samo za public page (ne utiče na dashboard).
   */
  theme?: AdvancedTheme;

  /**
   * Layout varijanta – pricingGrid, stacked, comparison, wizard.
   */
  layoutVariant?: AdvancedLayoutVariant;

  /**
   * Broj kolona na desktopu (1–4). Na mobilnom svakako idemo na 1.
   */
  columnsDesktop?: 1 | 2 | 3 | 4;

  /* ------------------------ Summary & CTA behavior ---------------------- */

  /**
   * Da li prikazujemo summary box.
   */
  showSummary?: boolean;

  /**
   * Gde stoji summary: desno od sadržaja ili na dnu.
   */
  summaryPosition?: AdvancedSummaryPosition;

  /**
   * Da li na public page-u postoji CTA sekcija uopšte.
   */
  showInquiry?: boolean;

  /**
   * Globalni režim CTA:
   * - inquiry   – samo inquiry forma
   * - checkout  – direktan checkout (LATER)
   * - both      – prikazuje oba (LATER)
   */
  ctaMode?: AdvancedCtaMode;

  /**
   * Globalni CTA label (npr. “Send inquiry”, “Request a quote”).
   * Per-tier CTA ga može override-ovati.
   */
  globalCtaLabel?: string | null;

  /**
   * Da li je Powered by Tierless badge prikazan.
   * Planovi mogu ovo nadjačati:
   * - Free: ignoriše false, uvek prikazuje
   * - Plaćeni: koriste ovo polje
   */
  showPoweredBy?: boolean;

  /* ------------------------ Billing & yearly popusti --------------------- */

  /**
   * Da li uopšte postoji yearly opcija za ovu stranicu.
   */
  enableYearly?: boolean;

  /**
   * Default billing period za renderer (npr. month ili year).
   */
  defaultBillingPeriod?: BillingPeriod;

  /**
   * Popust u procentima koji se primenjuje na yearly u odnosu na monthly.
   * Npr. 20 => 2 meseca free.
   */
  yearlyDiscountPercent?: number | null;

  /* ------------------------ Global styling knobs ------------------------ */

  /**
   * Globalni režim outline-a za kartice.
   */
  cardOutlineMode?: CardOutlineMode;

  /**
   * Ako je cardOutlineMode === "solid", koristi se ova boja.
   */
  cardOutlineColor?: string | null;

  /**
   * Kako izgleda selektovana kartica.
   */
  selectedHighlightMode?: SelectedHighlightMode;

  /**
   * Custom boja za selektovani highlight (solidBg / outlineGlow).
   */
  selectedHighlightColor?: string | null;

  /**
   * Globalni režim za slider boje.
   */
  sliderColorMode?: SliderColorMode;

  /**
   * Ako je sliderColorMode === "solid", koristi se ova boja.
   */
  sliderSolidColor?: string | null;

  /**
   * Ako je sliderColorMode === "gradient", koristimo from/to boje.
   */
  sliderGradientFrom?: string | null;
  sliderGradientTo?: string | null;

  /* ------------------------ Wizard meta (LATER) ------------------------- */

  /**
   * Da li je wizard layout uključen za ovu stranicu.
   * Kada krenemo da ga koristimo, layoutVariant će biti "wizard".
   */
  enableWizardLayout?: boolean;

  /**
   * Konfiguracija koraka u wizardu (LATER).
   */
  wizardSteps?: AdvancedWizardStepMeta[];

  /* ------------------------ Eksperimentalne / future stvari ------------- */

  /**
   * Generic flags za feature gating, A/B testove itd.
   */
  experimentalFlags?: string[];

  /**
   * Interval za autosave u sekundama (default 60).
   */
  autosaveInterval?: number;

  /**
   * Da li je autosave uključen.
   */
  autosaveEnabled?: boolean;

  /**
   * Da li je dozvoljeno ocenjivanje stranice.
   */
  allowRating?: boolean;

  /**
   * Da li se stranica prikazuje u "See examples" listi.
   */
  listInExamples?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helper tip za kompletan advanced config na jednoj strani                  */
/* -------------------------------------------------------------------------- */

export interface AdvancedConfig {
  /**
   * Globalne meta postavke za public page.
   */
  meta: AdvancedPublicMeta;

  /**
   * Svi blokovi (tiers, addons, items, sliders).
   */
  nodes: AdvancedNode[];
}
