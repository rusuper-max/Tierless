// src/lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateDiscountedPrice,
  getItemFinalPrice,
  calculateOrderTotal,
  formatPriceValue,
  getUnitStep,
  formatQuantity,
} from './pricing';

describe('calculateDiscountedPrice', () => {
  it('applies 10% discount correctly', () => {
    expect(calculateDiscountedPrice(100, 10)).toBe(90);
  });

  it('applies 25% discount correctly', () => {
    expect(calculateDiscountedPrice(100, 25)).toBe(75);
  });

  it('floors decimal results to avoid rounding up', () => {
    // 3 EUR - 10% = 2.7, should floor to 2.70
    expect(calculateDiscountedPrice(3, 10)).toBe(2.7);
    
    // 9.99 - 15% = 8.4915, should floor to 8.49
    expect(calculateDiscountedPrice(9.99, 15)).toBe(8.49);
  });

  it('returns original price for 0% discount', () => {
    expect(calculateDiscountedPrice(100, 0)).toBe(100);
  });

  it('returns original price for negative discount', () => {
    expect(calculateDiscountedPrice(100, -10)).toBe(100);
  });

  it('returns original price for discount > 100%', () => {
    expect(calculateDiscountedPrice(100, 150)).toBe(100);
  });

  it('handles 100% discount (free item)', () => {
    expect(calculateDiscountedPrice(100, 100)).toBe(0);
  });
});

describe('getItemFinalPrice', () => {
  it('returns base price for item without sale badge', () => {
    const item = { id: '1', price: 50 };
    expect(getItemFinalPrice(item)).toBe(50);
  });

  it('returns base price for sale badge without discount percent', () => {
    const item = { id: '1', price: 50, badge: 'sale' };
    expect(getItemFinalPrice(item)).toBe(50);
  });

  it('applies discount for sale badge with discount percent', () => {
    const item = { id: '1', price: 100, badge: 'sale', discountPercent: 20 };
    expect(getItemFinalPrice(item)).toBe(80);
  });

  it('handles null price', () => {
    const item = { id: '1', price: null };
    expect(getItemFinalPrice(item)).toBe(0);
  });

  it('ignores discount for non-sale badges', () => {
    const item = { id: '1', price: 100, badge: 'popular', discountPercent: 20 };
    expect(getItemFinalPrice(item)).toBe(100);
  });
});

describe('calculateOrderTotal', () => {
  const items = [
    { id: 'a', price: 10 },
    { id: 'b', price: 20 },
    { id: 'c', price: 15, badge: 'sale' as const, discountPercent: 10 },
  ];

  it('calculates total for single item', () => {
    const quantities = { a: 1 };
    expect(calculateOrderTotal(items, quantities)).toBe(10);
  });

  it('calculates total for multiple items', () => {
    const quantities = { a: 2, b: 1 };
    expect(calculateOrderTotal(items, quantities)).toBe(40);
  });

  it('applies discounts in total', () => {
    const quantities = { c: 1 };
    // 15 - 10% = 13.50
    expect(calculateOrderTotal(items, quantities)).toBe(13.5);
  });

  it('handles zero quantities', () => {
    const quantities = { a: 0, b: 0 };
    expect(calculateOrderTotal(items, quantities)).toBe(0);
  });

  it('ignores items not in quantities', () => {
    const quantities = { a: 1 };
    expect(calculateOrderTotal(items, quantities)).toBe(10);
  });

  it('adds selected addons', () => {
    const quantities = { a: 1 };
    const addons = [
      { id: 'x', price: 5, selected: true },
      { id: 'y', price: 3, selected: false },
    ];
    expect(calculateOrderTotal(items, quantities, addons)).toBe(15);
  });

  it('handles complex order with discounts and addons', () => {
    const quantities = { a: 2, c: 1 }; // 2*10 + 13.5 = 33.5
    const addons = [
      { id: 'x', price: 5, selected: true },
      { id: 'y', price: 2.50, selected: true },
    ];
    // 33.5 + 5 + 2.50 = 41
    expect(calculateOrderTotal(items, quantities, addons)).toBe(41);
  });

  it('rounds final total to 2 decimals', () => {
    const items = [{ id: 'a', price: 1.333 }];
    const quantities = { a: 3 };
    // 1.333 * 3 = 3.999, rounds to 4.00
    expect(calculateOrderTotal(items, quantities)).toBe(4);
  });
});

describe('formatPriceValue', () => {
  it('formats with 2 decimals by default', () => {
    expect(formatPriceValue(10)).toBe('10.00');
  });

  it('formats with 0 decimals', () => {
    expect(formatPriceValue(10.99, 0)).toBe('11');
  });

  it('adds currency suffix', () => {
    expect(formatPriceValue(10, 2, 'EUR')).toBe('10.00 EUR');
  });

  it('formats large numbers with thousand separators', () => {
    expect(formatPriceValue(1000, 2)).toBe('1,000.00');
  });
});

describe('getUnitStep', () => {
  it('returns 1 for pcs', () => {
    expect(getUnitStep('pcs')).toBe(1);
  });

  it('returns 1 for undefined', () => {
    expect(getUnitStep(undefined)).toBe(1);
  });

  it('returns 0.1 for kg (100g increments)', () => {
    expect(getUnitStep('kg')).toBe(0.1);
  });

  it('returns 0.1 for l (100ml increments)', () => {
    expect(getUnitStep('l')).toBe(0.1);
  });

  it('returns 1 for g and ml', () => {
    expect(getUnitStep('g')).toBe(1);
    expect(getUnitStep('ml')).toBe(1);
  });

  it('returns 1 for custom units', () => {
    expect(getUnitStep('custom')).toBe(1);
  });
});

describe('formatQuantity', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatQuantity(5)).toBe('5');
  });

  it('formats decimals correctly', () => {
    expect(formatQuantity(2.5)).toBe('2.5');
  });

  it('removes trailing zeros', () => {
    expect(formatQuantity(3.00)).toBe('3');
    expect(formatQuantity(2.10)).toBe('2.1');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatQuantity(1.999)).toBe('2');
    expect(formatQuantity(1.234)).toBe('1.23');
  });
});

