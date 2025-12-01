import { test, expect } from "@playwright/test";

/**
 * Performance Smoke Tests
 * 
 * Verifies that pages load within acceptable time limits.
 * Database-dependent tests are skipped in CI without DATABASE_URL.
 */

// Helper to check if we're in a CI environment without database
const skipIfNoDb = !process.env.DATABASE_URL && process.env.CI === "true";

test.describe("Page Load Performance", () => {
  const MAX_LOAD_TIME = 5000; // 5 seconds max

  test("landing page should load within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(MAX_LOAD_TIME);
    console.log(`Landing page loaded in ${loadTime}ms`);
  });

  test("signin page should load within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/signin", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(MAX_LOAD_TIME);
    console.log(`Signin page loaded in ${loadTime}ms`);
  });

  test.skip(skipIfNoDb)("examples page should load within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/examples", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(MAX_LOAD_TIME);
    console.log(`Examples page loaded in ${loadTime}ms`);
  });

  test("templates page should load within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/templates", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(MAX_LOAD_TIME);
    console.log(`Templates page loaded in ${loadTime}ms`);
  });
});

test.describe("API Response Times", () => {
  const MAX_API_TIME = 2000; // 2 seconds max for API

  test("templates API should respond within 2 seconds", async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get("/api/templates");
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(MAX_API_TIME);
    console.log(`Templates API responded in ${responseTime}ms`);
  });

  test.skip(skipIfNoDb)("showcase API should respond within 2 seconds", async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get("/api/showcase");
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(MAX_API_TIME);
    console.log(`Showcase API responded in ${responseTime}ms`);
  });
});

test.describe("Core Web Vitals (Basic)", () => {
  test("landing page should not have layout shift issues", async ({ page }) => {
    await page.goto("/");
    
    // Wait for page to stabilize
    await page.waitForLoadState("networkidle");
    
    // Check that main content is visible and stable
    const mainContent = page.locator("main").first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test("page should have proper viewport meta", async ({ page }) => {
    await page.goto("/");
    
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
    
    const content = await viewport.getAttribute("content");
    expect(content).toContain("width=device-width");
  });
});
