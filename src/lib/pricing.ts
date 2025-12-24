// src/lib/pricing.ts
// Core pricing calculation logic - extracted for testing

export type PricingItem = {
  id: string;
  price: number | null;
  badge?: string;
  discountPercent?: number;
  unit?: string;
  /** Slug of another page to link to (for inter-page navigation) */
  linkSlug?: string;
};

export type PricingAddon = {
  id: string;
  price: number;
  selected?: boolean;
};

/**
 * Calculate discounted price for an item
 * Uses floor rounding for discount prices to avoid showing higher than actual
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): number {
  if (discountPercent <= 0 || discountPercent > 100) {
    return originalPrice;
  }

  const rawDiscounted = originalPrice * (1 - discountPercent / 100);
  // Floor to 2 decimal places
  return Math.floor(rawDiscounted * 100) / 100;
}

/**
 * Get the final price for an item (considering badge/discount)
 */
export function getItemFinalPrice(item: PricingItem): number {
  const basePrice = Number(item.price) || 0;

  if (item.badge === 'sale' && item.discountPercent && item.discountPercent > 0) {
    return calculateDiscountedPrice(basePrice, item.discountPercent);
  }

  return basePrice;
}

/**
 * Calculate total for a cart/order
 */
export function calculateOrderTotal(
  items: PricingItem[],
  quantities: Record<string, number>,
  addons?: PricingAddon[]
): number {
  let total = 0;

  // Sum item prices
  for (const item of items) {
    const qty = quantities[item.id] || 0;
    if (qty <= 0) continue;

    const finalPrice = getItemFinalPrice(item);
    total += finalPrice * qty;
  }

  // Add addons
  if (addons) {
    for (const addon of addons) {
      if (addon.selected) {
        total += addon.price;
      }
    }
  }

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Format price with proper decimal places
 */
export function formatPriceValue(
  price: number,
  decimals: number = 2,
  currency: string = ""
): string {
  const formatted = price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * Get step value based on unit type
 */
export function getUnitStep(unit?: string): number {
  if (!unit || unit === "pcs") return 1;
  if (unit === "kg" || unit === "l") return 0.1; // 100g or 100ml steps
  if (unit === "g" || unit === "ml") return 1;
  return 1; // custom units default to 1
}

/**
 * Format quantity display (removes trailing zeros)
 */
export function formatQuantity(value: number): string {
  return Number(value.toFixed(2)).toString();
}

