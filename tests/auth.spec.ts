import { test, expect } from "@playwright/test";

/**
 * Authentication Smoke Tests
 * 
 * Verifies the auth flow works correctly.
 * Note: These are smoke tests, not full auth tests (which would require email verification).
 */
test.describe("Authentication Flow", () => {
  test("signin page should load with email input", async ({ page }) => {
    await page.goto("/signin");
    
    // Should have email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    // Should have submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Continue"), button:has-text("Send")');
    await expect(submitButton.first()).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    await page.goto("/signin");
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Continue"), button:has-text("Send")').first();
    
    // Enter invalid email
    await emailInput.fill("invalid-email");
    await submitButton.click();
    
    // Should show some form of validation (HTML5 or custom)
    // Either the input is invalid or an error message appears
    const isInputInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const errorMessage = page.locator('[role="alert"], .error, .text-red, .text-destructive');
    
    const hasValidation = isInputInvalid || await errorMessage.count() > 0;
    expect(hasValidation).toBeTruthy();
  });

  test("should accept valid email format", async ({ page }) => {
    await page.goto("/signin");
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    
    // Enter valid email
    await emailInput.fill("test@example.com");
    
    // Check input validity
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBeTruthy();
  });

  test("logout page should exist", async ({ page }) => {
    const response = await page.goto("/logout");
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("Protected Routes (Unauthenticated)", () => {
  test("dashboard should redirect to signin", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Should either redirect to signin or show signin form
    await page.waitForTimeout(1000); // Wait for potential redirect
    
    const url = page.url();
    const hasSignin = url.includes("signin") || url.includes("login");
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
    
    // Either redirected to signin or showing login form
    expect(hasSignin || hasEmailInput).toBeTruthy();
  });

  test("editor should redirect to signin", async ({ page }) => {
    await page.goto("/editor/test-page");
    
    await page.waitForTimeout(1000);
    
    const url = page.url();
    const hasSignin = url.includes("signin") || url.includes("login");
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
    const has401 = await page.locator('text=/unauthorized|401|login/i').count() > 0;
    
    expect(hasSignin || hasEmailInput || has401).toBeTruthy();
  });
});

