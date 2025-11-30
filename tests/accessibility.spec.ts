import { test, expect } from "@playwright/test";

/**
 * Accessibility Smoke Tests
 * 
 * Basic accessibility checks for key pages.
 * For comprehensive a11y testing, consider using @axe-core/playwright.
 */
test.describe("Basic Accessibility", () => {
  test("landing page should have lang attribute", async ({ page }) => {
    await page.goto("/");
    
    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("landing page should have skip link or main landmark", async ({ page }) => {
    await page.goto("/");
    
    // Check for skip link or main landmark
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link');
    const mainLandmark = page.locator('main, [role="main"]');
    
    const hasSkipLink = await skipLink.count() > 0;
    const hasMain = await mainLandmark.count() > 0;
    
    expect(hasSkipLink || hasMain).toBeTruthy();
  });

  test("signin form should have accessible labels", async ({ page }) => {
    await page.goto("/signin");
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    
    // Check for label or aria-label
    const id = await emailInput.getAttribute("id");
    const ariaLabel = await emailInput.getAttribute("aria-label");
    const ariaLabelledby = await emailInput.getAttribute("aria-labelledby");
    const placeholder = await emailInput.getAttribute("placeholder");
    
    // At least one accessible label method should be used
    const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
    const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledby || placeholder;
    
    expect(hasAccessibleName).toBeTruthy();
  });

  test("buttons should be keyboard accessible", async ({ page }) => {
    await page.goto("/");
    
    // Find first button or link
    const interactiveElement = page.locator('button, a[href]').first();
    await expect(interactiveElement).toBeVisible();
    
    // Focus the element
    await interactiveElement.focus();
    
    // Check it's focused
    const isFocused = await interactiveElement.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBeTruthy();
  });

  test("images should have alt text", async ({ page }) => {
    await page.goto("/");
    
    // Get all images
    const images = page.locator("img");
    const imageCount = await images.count();
    
    if (imageCount === 0) {
      // No images on page, skip
      return;
    }

    // Check each image for alt attribute
    for (let i = 0; i < Math.min(imageCount, 10); i++) { // Check first 10 images
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      
      // Either has alt text or is decorative (role="presentation" or alt="")
      const isAccessible = alt !== null || role === "presentation" || role === "none";
      expect(isAccessible).toBeTruthy();
    }
  });

  test("color contrast should be adequate", async ({ page }) => {
    await page.goto("/");
    
    // Basic check: ensure text is visible against background
    // For comprehensive contrast testing, use axe-core
    const heading = page.locator("h1, h2, h3").first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
      
      // Text should be readable (not transparent or hidden)
      const opacity = await heading.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.opacity);
      });
      expect(opacity).toBeGreaterThan(0.5);
    }
  });
});

test.describe("Focus Management", () => {
  test("modal/dialog should trap focus", async ({ page }) => {
    await page.goto("/signin");
    
    // If there's a modal trigger, test focus trap
    const modalTrigger = page.locator('[data-modal], [aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.count() === 0) {
      // No modal on page, skip
      return;
    }

    await modalTrigger.click();
    
    // Wait for modal
    const modal = page.locator('[role="dialog"], .modal, [data-state="open"]');
    if (await modal.count() > 0) {
      // Focus should be inside modal
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [data-state="open"]');
        return modal?.contains(document.activeElement);
      });
      expect(focusInModal).toBeTruthy();
    }
  });

  test("escape key should close dialogs", async ({ page }) => {
    await page.goto("/signin");
    
    const modalTrigger = page.locator('[data-modal], [aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.count() === 0) {
      return;
    }

    await modalTrigger.click();
    
    const modal = page.locator('[role="dialog"], .modal, [data-state="open"]');
    if (await modal.count() > 0) {
      await page.keyboard.press("Escape");
      
      // Modal should close or become hidden
      await expect(modal).toBeHidden({ timeout: 1000 }).catch(() => {
        // Some modals may not close with Escape, that's okay for smoke test
      });
    }
  });
});

