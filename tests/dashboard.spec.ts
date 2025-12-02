import { test, expect } from "@playwright/test";

/**
 * Dashboard Smoke Tests
 * 
 * Tests the dashboard functionality and protected routes.
 */
test.describe("Dashboard Access (Unauthenticated)", () => {
  test("should redirect to signin when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    
    await page.waitForTimeout(1500);
    
    const url = page.url();
    const isRedirected = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(isRedirected).toBeTruthy();
  });

  test("dashboard/stats should require auth", async ({ page }) => {
    await page.goto("/dashboard/stats");
    
    await page.waitForTimeout(1500);
    
    const url = page.url();
    const requiresAuth = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(requiresAuth).toBeTruthy();
  });

  test("dashboard/account should require auth", async ({ page }) => {
    await page.goto("/dashboard/account");
    
    await page.waitForTimeout(1500);
    
    const url = page.url();
    const requiresAuth = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(requiresAuth).toBeTruthy();
  });

  test("dashboard/settings should require auth", async ({ page }) => {
    await page.goto("/dashboard/settings");
    
    await page.waitForTimeout(1500);
    
    const url = page.url();
    const requiresAuth = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(requiresAuth).toBeTruthy();
  });

  test("dashboard/trash should require auth", async ({ page }) => {
    await page.goto("/dashboard/trash");
    
    await page.waitForTimeout(1500);
    
    const url = page.url();
    const requiresAuth = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(requiresAuth).toBeTruthy();
  });
});

test.describe("Dashboard Route Structure", () => {
  test("all dashboard routes should exist (not 500)", async ({ page }) => {
    const routes = [
      "/dashboard",
      "/dashboard/stats",
      "/dashboard/account",
      "/dashboard/settings",
      "/dashboard/trash",
      "/dashboard/integrations",
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      const status = response?.status() || 0;
      
      // Routes should return 200, 302, 307 (redirect) but NOT 500
      expect(status, `Route ${route} returned ${status}`).toBeLessThan(500);
    }
  });
});

test.describe("Dashboard Navigation", () => {
  test.skip("authenticated dashboard should have navigation", async ({ page }) => {
    // This test requires authentication
    // Skip if dev-login is not available (production)
    
    const loginResponse = await page.request.post("/api/dev-login", {
      data: { email: "test@example.com" },
    });
    
    if (loginResponse.status() === 403) {
      test.skip();
      return;
    }

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should have sidebar or navigation
    const hasNav = 
      await page.locator('nav, [role="navigation"], .sidebar, [class*="sidebar"]').count() > 0;
    
    // Should have user-related elements
    const hasUserElements = 
      await page.locator('[class*="avatar"], [class*="user"], button:has-text("Account")').count() > 0;

    expect(hasNav || hasUserElements).toBeTruthy();
  });
});



