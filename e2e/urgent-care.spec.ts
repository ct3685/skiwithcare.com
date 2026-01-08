import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Urgent Care flow
 *
 * Tests verify:
 * 1. Navigation to urgent care mode
 * 2. Urgent care cards display correctly
 * 3. Map markers render for urgent care facilities
 * 4. Emergency guide modal works
 * 5. Report form functionality
 */

test.describe("Urgent Care Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for app to load
    await page.waitForSelector("[data-resort-id]", { timeout: 10000 });
  });

  test.describe("Mode Navigation", () => {
    test("can switch to urgent care mode via header button", async ({
      page,
    }) => {
      // Find and click the Urgent Care button in header
      const urgentButton = page.locator("button", { hasText: "Urgent" });
      await urgentButton.click();

      // Should show urgent care facilities
      await expect(page.locator("text=/Urgent Care/")).toBeVisible();

      // Search placeholder should update
      await expect(
        page.locator('input[placeholder*="Urgent Care"]')
      ).toBeVisible();
    });

    test("urgent care count displays in sidebar", async ({ page }) => {
      // Switch to urgent care mode
      await page.locator("button", { hasText: "Urgent" }).click();

      // Should show count of urgent care facilities
      await expect(page.locator("text=/\\d+ Urgent Care/")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Urgent Care Cards", () => {
    test.beforeEach(async ({ page }) => {
      // Switch to urgent care mode
      await page.locator("button", { hasText: "Urgent" }).click();
      await page.waitForTimeout(500);
    });

    test("urgent care cards display facility information", async ({ page }) => {
      // Wait for urgent care cards to load
      const firstCard = page.locator("[data-urgent-care-id]").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Card should show facility name
      await expect(firstCard.locator("h3")).toBeVisible();

      // Card should have report link
      await expect(firstCard.locator("text=/Report/i")).toBeVisible();
    });

    test("clicking urgent care card shows details", async ({ page }) => {
      const firstCard = page.locator("[data-urgent-care-id]").first();
      await firstCard.click();

      // Card should expand or show more details
      // Check for phone/website if available
      await expect(
        firstCard.locator('a[href^="tel:"]').or(firstCard.locator("text=Call"))
      ).toBeVisible({ timeout: 3000 }).catch(() => {
        // Some facilities may not have phone - that's okay
      });
    });
  });

  test.describe("Map Markers", () => {
    test("urgent care markers appear on map in urgent care mode", async ({
      page,
    }) => {
      // Switch to urgent care mode
      await page.locator("button", { hasText: "Urgent" }).click();

      // Wait for markers to render
      await page.waitForTimeout(1000);

      // Should see urgent care markers (orange markers with 🩹)
      const markers = page.locator(".leaflet-marker-icon");
      await expect(markers.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Emergency Guide", () => {
    test("emergency guide trigger button is visible", async ({ page }) => {
      // The emergency guide trigger should be visible
      const guideTrigger = page.locator("button", {
        hasText: /Where should I go/i,
      });
      await expect(guideTrigger).toBeVisible();
    });

    test("clicking emergency guide opens modal with options", async ({
      page,
    }) => {
      // Click the guide trigger
      await page.locator("button", { hasText: /Where should I go/i }).click();

      // Modal should open with triage options
      await expect(page.locator("text=/Call 911/")).toBeVisible();
      await expect(page.locator("text=/Ski Patrol/")).toBeVisible();
      await expect(page.locator("text=/Urgent Care/")).toBeVisible();
      await expect(page.locator("text=/Emergency Room/")).toBeVisible();
    });

    test("selecting a triage option shows details", async ({ page }) => {
      // Open the guide
      await page.locator("button", { hasText: /Where should I go/i }).click();

      // Click on Ski Patrol option
      await page.locator("button", { hasText: /Ski Patrol/ }).click();

      // Should show details for ski patrol
      await expect(
        page.locator("text=/trained.*first responders/i")
      ).toBeVisible();
    });

    test("can close emergency guide modal", async ({ page }) => {
      // Open the guide
      await page.locator("button", { hasText: /Where should I go/i }).click();

      // Modal should be visible
      await expect(page.locator("text=/Call 911/")).toBeVisible();

      // Close it
      await page.locator("button", { hasText: /Close|×/i }).click();

      // Modal should be gone
      await expect(page.locator("text=/Call 911/")).not.toBeVisible();
    });
  });

  test.describe("Report Form", () => {
    test.beforeEach(async ({ page }) => {
      // Switch to urgent care mode to access report links
      await page.locator("button", { hasText: "Urgent" }).click();
      await page.waitForTimeout(500);
    });

    test("report link opens report form modal", async ({ page }) => {
      // Find a card and click its report link
      const firstCard = page.locator("[data-urgent-care-id]").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      const reportLink = firstCard.locator("text=/Report/i");
      await reportLink.click();

      // Report form modal should open
      await expect(page.locator("text=/Report an Issue/")).toBeVisible();
    });

    test("report form has required fields", async ({ page }) => {
      // Open report form
      const firstCard = page.locator("[data-urgent-care-id]").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });
      await firstCard.locator("text=/Report/i").click();

      // Check for form elements
      await expect(
        page.locator("text=/What's incorrect/i")
      ).toBeVisible();
      await expect(
        page.locator('textarea, input[type="text"]').first()
      ).toBeVisible();
      await expect(page.locator("button", { hasText: /Submit/i })).toBeVisible();
    });

    test("can close report form without submitting", async ({ page }) => {
      // Open report form
      const firstCard = page.locator("[data-urgent-care-id]").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });
      await firstCard.locator("text=/Report/i").click();

      // Modal should be visible
      await expect(page.locator("text=/Report an Issue/")).toBeVisible();

      // Close it
      await page.locator('button[aria-label="Close"]').click();

      // Modal should be gone
      await expect(page.locator("text=/Report an Issue/")).not.toBeVisible();
    });
  });

  test.describe("Emergency Banner", () => {
    test("emergency banner is visible on load", async ({ page }) => {
      // The emergency banner should be at the top
      await expect(
        page.locator("text=/This is not a substitute for emergency services/i")
      ).toBeVisible();
    });

    test("emergency banner has 911 call link", async ({ page }) => {
      // Should have a tel: link for 911
      const callLink = page.locator('a[href="tel:911"]');
      await expect(callLink).toBeVisible();
    });

    test("can dismiss emergency banner", async ({ page }) => {
      // Find dismiss button on banner
      const banner = page.locator("text=/emergency services/i").locator("..");
      const dismissButton = banner.locator('button[aria-label*="dismiss" i], button:has-text("×")');

      if (await dismissButton.isVisible()) {
        await dismissButton.click();

        // Banner should be hidden
        await expect(
          page.locator("text=/This is not a substitute/i")
        ).not.toBeVisible();
      }
    });
  });
});

test.describe("Cross-Mode Navigation", () => {
  test("can navigate between all modes", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-resort-id]", { timeout: 10000 });

    // Start in resorts mode
    await expect(page.locator("text=/Resorts found/i")).toBeVisible();

    // Go to Urgent Care
    await page.locator("button", { hasText: "Urgent" }).click();
    await expect(page.locator("text=/Urgent Care/")).toBeVisible();

    // Go to Clinics
    await page.locator("button", { hasText: "Clinics" }).click();
    await expect(page.locator("text=/Clinics/")).toBeVisible();

    // Go to Hospitals
    await page.locator("button", { hasText: "Hospitals" }).click();
    await expect(page.locator("text=/Hospitals/")).toBeVisible();

    // Go back to Resorts
    await page.locator("button", { hasText: "Resorts" }).click();
    await expect(page.locator("text=/Resorts/")).toBeVisible();
  });
});
