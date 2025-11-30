import { test, expect } from "@playwright/test";

/**
 * Landing Page Smoke Tests
 * 
 * Verifies the marketing homepage loads correctly and has key elements.
 */
test.describe("Landing Page", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");
    
    // Check page loads without error
    await expect(page).toHaveTitle(/Tierless/i);
    
    // Check main heading exists
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("should have navigation elements", async ({ page }) => {
    await page.goto("/");
    
    // Check logo/brand is present
    const logo = page.locator('a[href="/"]').first();
    await expect(logo).toBeVisible();
    
    // Check CTA buttons exist
    const ctaButtons = page.locator('a[href*="start"], a[href*="signin"], button:has-text("Get Started"), button:has-text("Sign")');
    await expect(ctaButtons.first()).toBeVisible();
  });

  test("should have footer", async ({ page }) => {
    await page.goto("/");
    
    // Scroll to bottom and check footer exists
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Page should still load and be functional
    await expect(page).toHaveTitle(/Tierless/i);
    
    // Content should be visible
    const mainContent = page.locator("main, [role='main'], body > div").first();
    await expect(mainContent).toBeVisible();
  });
});

test.describe("Static Pages", () => {
  test("examples page should load", async ({ page }) => {
    const response = await page.goto("/examples");
    expect(response?.status()).toBeLessThan(400);
  });

  test("templates page should load", async ({ page }) => {
    const response = await page.goto("/templates");
    expect(response?.status()).toBeLessThan(400);
  });

  test("signin page should load", async ({ page }) => {
    const response = await page.goto("/signin");
    expect(response?.status()).toBeLessThan(400);
    
    // Should have email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });
});

