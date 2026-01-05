import { test, expect } from "@playwright/test";

test.describe("Settings Drawer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector('[aria-label="Open settings"]');
  });

  test.describe("Desktop viewport", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("drawer opens and shows all content sections", async ({ page }) => {
      // Click the settings button
      await page.click('[aria-label="Open settings"]');

      // Wait for drawer to open
      await page.waitForSelector('text="Settings"');

      // Verify all sections are visible
      await expect(page.locator("text=Appearance")).toBeVisible();
      await expect(page.locator("text=Theme")).toBeVisible();
      await expect(page.locator("text=Mode")).toBeVisible();
      await expect(page.locator("text=Units")).toBeVisible();
      await expect(page.locator("text=Distance")).toBeVisible();
      await expect(page.locator("text=Defaults")).toBeVisible();
      await expect(page.locator("text=Reset to Defaults")).toBeVisible();
    });

    test("drawer shows theme buttons", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      await expect(page.locator("text=Rose")).toBeVisible();
      await expect(page.locator("text=Alpine")).toBeVisible();
      await expect(page.locator("text=Glacier")).toBeVisible();
    });

    test("drawer shows mode buttons", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      await expect(page.locator("text=🌙 Dark")).toBeVisible();
      await expect(page.locator("text=☀️ Light")).toBeVisible();
      await expect(page.locator("text=🔄 Auto")).toBeVisible();
    });

    test("drawer shows unit buttons", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      await expect(page.locator("text=Miles")).toBeVisible();
      await expect(page.locator("text=Kilometers")).toBeVisible();
    });

    test("theme change applies correctly", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      // Click Alpine theme
      await page.click("text=Alpine");

      // Close drawer
      await page.click('[aria-label="Close settings"]');

      // Verify theme class is applied to document
      const htmlElement = page.locator("html");
      await expect(htmlElement).toHaveClass(/theme-alpine/);
    });

    test("drawer closes on backdrop click", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      // Click the backdrop (outside the drawer)
      await page.click(".bg-black\\/60");

      // Drawer should be closed - Settings header should not be visible
      await expect(page.locator('[data-testid="settings-content"]')).not.toBeVisible();
    });

    test("drawer closes on Escape key", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      // Press Escape
      await page.keyboard.press("Escape");

      // Drawer should be closed
      await expect(page.locator('[data-testid="settings-content"]')).not.toBeVisible();
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("drawer opens and shows all content on mobile", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      // All sections should be visible on mobile too
      await expect(page.locator("text=Appearance")).toBeVisible();
      await expect(page.locator("text=Theme")).toBeVisible();
      await expect(page.locator("text=Mode")).toBeVisible();
      await expect(page.locator("text=Units")).toBeVisible();
      await expect(page.locator("text=Defaults")).toBeVisible();
    });

    test("drawer shows theme options on mobile", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      await expect(page.locator("text=Rose")).toBeVisible();
      await expect(page.locator("text=Alpine")).toBeVisible();
      await expect(page.locator("text=Glacier")).toBeVisible();
    });
  });

  test.describe("Content visibility regression test", () => {
    /**
     * This test specifically guards against the bug where drawer content
     * was invisible on desktop due to CSS layout issues.
     * The content was in the DOM but not visually rendered.
     */
    test("drawer content is visually rendered, not just in DOM", async ({ page }) => {
      await page.click('[aria-label="Open settings"]');
      await page.waitForSelector('text="Settings"');

      // Get the content container
      const contentContainer = page.locator('[data-testid="settings-content"]');

      // Verify it's visible
      await expect(contentContainer).toBeVisible();

      // Verify it has non-zero dimensions
      const box = await contentContainer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(100); // Content should have substantial height
      expect(box!.width).toBeGreaterThan(100); // Content should have substantial width

      // Verify the Appearance section heading is within the visible viewport
      const appearanceHeading = page.locator("text=Appearance");
      await expect(appearanceHeading).toBeVisible();
      const appearanceBox = await appearanceHeading.boundingBox();
      expect(appearanceBox).not.toBeNull();
      
      // The heading should be positioned below the drawer header (roughly y > 50)
      expect(appearanceBox!.y).toBeGreaterThan(50);
    });
  });
});

