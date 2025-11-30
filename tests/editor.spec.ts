import { test, expect } from "@playwright/test";

/**
 * Editor Smoke Tests
 * 
 * Tests the editor functionality with mock authentication.
 * Uses dev-login endpoint for testing (disabled in production).
 */
test.describe("Editor Access (Unauthenticated)", () => {
  test("should redirect to signin when not authenticated", async ({ page }) => {
    await page.goto("/editor/new");
    
    await page.waitForTimeout(1000);
    
    const url = page.url();
    const isRedirected = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(isRedirected).toBeTruthy();
  });

  test("editor/[id] should redirect when not authenticated", async ({ page }) => {
    await page.goto("/editor/test-page-123");
    
    await page.waitForTimeout(1000);
    
    const url = page.url();
    const isRedirected = 
      url.includes("signin") || 
      url.includes("login") ||
      await page.locator('input[type="email"]').count() > 0;
    
    expect(isRedirected).toBeTruthy();
  });
});

test.describe("Editor UI Elements", () => {
  test.skip("editor should have main panels when authenticated", async ({ page, context }) => {
    // This test requires authentication
    // Skip if dev-login is not available (production)
    
    // Try to authenticate via dev-login
    const loginResponse = await page.request.post("/api/dev-login", {
      data: { email: "test@example.com" },
    });
    
    if (loginResponse.status() === 403) {
      test.skip();
      return;
    }
    
    // Navigate to editor
    await page.goto("/editor/new");
    await page.waitForLoadState("networkidle");
    
    // Should have editor layout
    const hasEditorLayout = 
      await page.locator('[data-editor], .editor, [class*="editor"]').count() > 0 ||
      await page.locator('[data-panel], .panel').count() > 0;
    
    expect(hasEditorLayout).toBeTruthy();
  });
});

test.describe("Editor Route Structure", () => {
  test("/editor/new route exists", async ({ page }) => {
    const response = await page.goto("/editor/new");
    // Should return 200 (page loads) or 302/307 (redirect to signin)
    // Should NOT return 404 or 500
    expect([200, 302, 307]).toContain(response?.status());
  });

  test("/editor/[slug] route exists", async ({ page }) => {
    const response = await page.goto("/editor/any-slug");
    // Should return 200, 302, 307, or 404 (page not found)
    // Should NOT return 500
    const status = response?.status() || 0;
    expect(status).toBeLessThan(500);
  });
});

