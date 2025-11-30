import { test, expect } from "@playwright/test";

/**
 * Public Page Smoke Tests
 * 
 * Verifies that public calculator/menu pages render correctly.
 * Note: These tests work with example pages if they exist.
 */
test.describe("Public Page Rendering", () => {
  test("non-existent page should return 404", async ({ page }) => {
    const response = await page.goto("/p/definitely-not-a-real-page-xyz123");
    expect(response?.status()).toBe(404);
  });

  test("public page route should be accessible", async ({ page }) => {
    // Try to access the public page route
    // Even if the page doesn't exist, the route should handle it gracefully
    const response = await page.goto("/p/test");
    
    // Should return either 200 (page exists) or 404 (page not found)
    // Should NOT return 500 (server error)
    expect([200, 404]).toContain(response?.status());
  });

  test("c/ route should also work for public pages", async ({ page }) => {
    const response = await page.goto("/c/test");
    expect([200, 404]).toContain(response?.status());
  });
});

test.describe("Public Page SEO", () => {
  test.skip("existing public page should have meta tags", async ({ page }) => {
    // This test requires an existing public page
    // Skip if no examples are available
    const response = await page.goto("/examples");
    if (response?.status() !== 200) {
      test.skip();
      return;
    }

    // Try to find a link to a public page
    const pageLink = page.locator('a[href^="/p/"]').first();
    if (await pageLink.count() === 0) {
      test.skip();
      return;
    }

    const href = await pageLink.getAttribute("href");
    if (!href) {
      test.skip();
      return;
    }

    await page.goto(href);
    
    // Check for basic SEO elements
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
  });
});

test.describe("Public Page Functionality", () => {
  test.skip("public page should have interactive elements", async ({ page }) => {
    // This test requires an existing public page with items
    // We'll try the examples page first
    const examplesResponse = await page.goto("/examples");
    if (examplesResponse?.status() !== 200) {
      test.skip();
      return;
    }

    const pageLink = page.locator('a[href^="/p/"]').first();
    if (await pageLink.count() === 0) {
      test.skip();
      return;
    }

    const href = await pageLink.getAttribute("href");
    if (!href) {
      test.skip();
      return;
    }

    await page.goto(href);

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for common interactive elements
    const hasItems = await page.locator('[data-item], .item, .menu-item, .product').count() > 0;
    const hasSections = await page.locator('[data-section], .section, .category').count() > 0;
    const hasButtons = await page.locator('button').count() > 0;

    // At least one of these should be present
    expect(hasItems || hasSections || hasButtons).toBeTruthy();
  });
});

