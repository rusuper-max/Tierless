import { test, expect } from "@playwright/test";

/**
 * API Smoke Tests
 * 
 * These tests require a running database. In CI without DATABASE_URL,
 * these tests will be skipped automatically.
 * 
 * To run locally: ensure DATABASE_URL is set in your environment.
 */

// Helper to check if we're in a CI environment without database
const skipIfNoDb = !process.env.DATABASE_URL && process.env.CI === "true";

test.describe("API Health Checks", () => {
  test("/_probe endpoint should return 200", async ({ request }) => {
    const response = await request.get("/api/_probe");
    expect(response.status()).toBe(200);
  });

  test("templates API should return JSON", async ({ request }) => {
    const response = await request.get("/api/templates");
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test.skip(skipIfNoDb)("showcase API should return array", async ({ request }) => {
    const response = await request.get("/api/showcase");
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || data.items !== undefined).toBeTruthy();
  });

  test.skip(skipIfNoDb)("examples API should return data", async ({ request }) => {
    const response = await request.get("/api/examples");
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("examples");
  });
});

test.describe("API Error Handling", () => {
  test("protected endpoint should return 401 without auth", async ({ request }) => {
    const response = await request.get("/api/calculators");
    expect(response.status()).toBe(401);
  });

  test.skip(skipIfNoDb)("invalid public page should return 404", async ({ request }) => {
    const response = await request.get("/api/public/definitely-not-a-real-page-12345");
    expect(response.status()).toBe(404);
  });

  test("stats endpoint should require auth", async ({ request }) => {
    const response = await request.get("/api/stats");
    expect(response.status()).toBe(401);
  });
});

test.describe("API Headers", () => {
  test("API should have proper content-type", async ({ request }) => {
    const response = await request.get("/api/templates");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});
