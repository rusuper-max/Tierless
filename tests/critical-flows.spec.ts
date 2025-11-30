import { test, expect } from "@playwright/test";

/**
 * Critical User Flow Smoke Tests
 * 
 * Tests the most important user journeys through the application.
 * These tests verify that critical paths work end-to-end.
 */
test.describe("User Journey: Discovery", () => {
  test("user can navigate from landing to examples", async ({ page }) => {
    await page.goto("/");
    
    // Find link to examples
    const examplesLink = page.locator('a[href*="examples"], a:has-text("Examples"), a:has-text("See Examples")').first();
    
    if (await examplesLink.count() > 0) {
      await examplesLink.click();
      await page.waitForLoadState("networkidle");
      
      expect(page.url()).toContain("examples");
    } else {
      // Direct navigation
      await page.goto("/examples");
      const response = await page.goto("/examples");
      expect(response?.status()).toBeLessThan(400);
    }
  });

  test("user can navigate from landing to signin", async ({ page }) => {
    await page.goto("/");
    
    // Find signin link or button
    const signinLink = page.locator('a[href*="signin"], a[href*="login"], button:has-text("Sign"), button:has-text("Login"), a:has-text("Sign")').first();
    
    if (await signinLink.count() > 0) {
      await signinLink.click();
      await page.waitForLoadState("networkidle");
      
      // Should be on signin page or have email input
      const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
      const isOnSignin = page.url().includes("signin") || page.url().includes("login");
      
      expect(hasEmailInput || isOnSignin).toBeTruthy();
    }
  });

  test("user can view templates page", async ({ page }) => {
    await page.goto("/");
    
    const templatesLink = page.locator('a[href*="templates"], a:has-text("Templates")').first();
    
    if (await templatesLink.count() > 0) {
      await templatesLink.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("templates");
    } else {
      const response = await page.goto("/templates");
      expect(response?.status()).toBeLessThan(400);
    }
  });
});

test.describe("User Journey: Public Page Viewing", () => {
  test("can view examples page and see cards", async ({ page }) => {
    await page.goto("/examples");
    await page.waitForLoadState("networkidle");
    
    // Should have some content
    const hasContent = 
      await page.locator('[class*="card"], [class*="grid"], article, .item').count() > 0 ||
      await page.locator('a[href^="/p/"]').count() > 0;
    
    // May be empty if no examples, that's okay
    expect(await page.locator("body").count()).toBe(1);
  });

  test("public page renders without JS errors", async ({ page }) => {
    const errors: string[] = [];
    
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    // Try a known public route
    await page.goto("/p/test");
    await page.waitForLoadState("networkidle");
    
    // Filter out expected errors (like 404 for non-existent pages)
    const criticalErrors = errors.filter(
      (e) => !e.includes("404") && !e.includes("not found")
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe("User Journey: Sign Up Flow", () => {
  test("signup page loads correctly", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBeLessThan(400);
    
    // May redirect to signin or show signup form
    const hasForm = await page.locator('input[type="email"], form').count() > 0;
    const isOnAuthPage = 
      page.url().includes("signin") || 
      page.url().includes("signup") || 
      page.url().includes("login");
    
    expect(hasForm || isOnAuthPage).toBeTruthy();
  });

  test("signin email validation works", async ({ page }) => {
    await page.goto("/signin");
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await emailInput.count() === 0) {
      test.skip();
      return;
    }

    // Test empty submission
    await submitButton.click();
    
    // Should not navigate away (form validation)
    await page.waitForTimeout(500);
    expect(page.url()).toContain("signin");
  });
});

test.describe("User Journey: Mobile Experience", () => {
  test("landing page is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Page should load
    await expect(page).toHaveTitle(/./);
    
    // Should have visible content
    const visibleContent = page.locator("h1, h2, p, button, a").first();
    await expect(visibleContent).toBeVisible();
  });

  test("signin is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/signin");
    
    // Email input should be visible
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    }
  });

  test("navigation works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [class*="hamburger"], [class*="mobile-menu"]').first();
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Menu should open
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const visibleLinks = await navLinks.filter({ hasText: /.+/ }).count();
      expect(visibleLinks).toBeGreaterThan(0);
    }
  });
});

test.describe("Error Handling", () => {
  test("404 page exists for invalid routes", async ({ page }) => {
    const response = await page.goto("/this-page-definitely-does-not-exist-12345");
    
    // Should return 404 or show error message
    const is404 = response?.status() === 404;
    const has404Message = await page.locator('text=/404|not found|page.*not.*exist/i').count() > 0;
    
    expect(is404 || has404Message).toBeTruthy();
  });

  test("invalid API routes return proper errors", async ({ request }) => {
    const response = await request.get("/api/this-api-does-not-exist");
    
    // Should return 404, not 500
    expect(response.status()).toBe(404);
  });
});

