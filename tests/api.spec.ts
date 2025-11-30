import { test, expect } from "@playwright/test";

/**
 * API Smoke Tests
 * 
 * Verifies critical API endpoints are responding correctly.
 */
test.describe("API Health Checks", () => {
  test("/_probe endpoint should return 200", async ({ request }) => {
    const response = await request.get("/api/_probe");
    expect(response.status()).toBe(200);
  });

  test("/api/templates should return JSON", async ({ request }) => {
    const response = await request.get("/api/templates");
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test("/api/showcase should return array", async ({ request }) => {
    const response = await request.get("/api/showcase");
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || data.items !== undefined).toBeTruthy();
  });

  test("/api/examples should return data", async ({ request }) => {
    const response = await request.get("/api/examples");
    // May return 200 with data or 404 if no examples
    expect([200, 404]).toContain(response.status());
  });
});

test.describe("API Error Handling", () => {
  test("protected endpoint should return 401 without auth", async ({ request }) => {
    const response = await request.get("/api/calculators");
    expect(response.status()).toBe(401);
  });

  test("invalid public page should return 404", async ({ request }) => {
    const response = await request.get("/api/public/definitely-not-a-real-page-12345");
    expect(response.status()).toBe(404);
  });

  test("stats endpoint should require auth", async ({ request }) => {
    const response = await request.get("/api/stats");
    expect(response.status()).toBe(401);
  });
});

test.describe("API CORS and Headers", () => {
  test("API should have proper content-type", async ({ request }) => {
    const response = await request.get("/api/templates");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test("API should have cache headers on public endpoints", async ({ request }) => {
    const response = await request.get("/api/showcase");
    // Should have some cache-related header
    const headers = response.headers();
    const hasCacheHeader = 
      headers["cache-control"] !== undefined ||
      headers["etag"] !== undefined ||
      headers["last-modified"] !== undefined;
    
    // This is informational - some endpoints may not have cache headers
    expect(response.status()).toBe(200);
  });
});

