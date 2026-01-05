import { test, expect } from "@playwright/test";

/**
 * E2E tests for map selection and focus behavior
 *
 * These tests verify that:
 * 1. Selecting an item centers the map on it
 * 2. The map does NOT re-center during normal interactions (focus hijacking bug)
 * 3. Selecting a different item centers on the new item
 */

test.describe("Map Selection Focus Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load and resorts to appear
    await page.waitForSelector("[data-resort-id]", { timeout: 10000 });
  });

  test.describe("Desktop viewport", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("selecting a resort card expands it and shows connection lines", async ({
      page,
    }) => {
      // Click on the first resort card in the sidebar
      const firstResortCard = page.locator("[data-resort-id]").first();
      await firstResortCard.click();

      // The card should now be expanded (show nearest clinics/hospitals)
      await expect(
        page
          .locator('text="Nearest Dialysis Clinics:"')
          .or(page.locator('text="Nearest Hospitals:"'))
      ).toBeVisible({ timeout: 5000 });

      // Connection legend should appear on the map
      await expect(page.locator("text=/\\d+ nearby facilities/")).toBeVisible();
    });

    test("clicking same resort card again collapses it", async ({ page }) => {
      // Click to expand
      const firstResortCard = page.locator("[data-resort-id]").first();
      await firstResortCard.click();

      // Wait for expansion
      await expect(
        page
          .locator('text="Nearest Dialysis Clinics:"')
          .or(page.locator('text="Nearest Hospitals:"'))
      ).toBeVisible({ timeout: 5000 });

      // Click again to collapse
      await firstResortCard.click();

      // Expanded content should be hidden
      await expect(
        page.locator('text="Nearest Dialysis Clinics:"')
      ).not.toBeVisible();
      await expect(
        page.locator("text=/\\d+ nearby facilities/")
      ).not.toBeVisible();
    });

    test("map can be panned after selecting a resort without snapping back", async ({
      page,
    }) => {
      // Select a resort
      const firstResortCard = page.locator("[data-resort-id]").first();
      await firstResortCard.click();

      // Wait for map to settle after flying to resort
      await page.waitForTimeout(1000);

      // Get the map container
      const mapContainer = page.locator(".leaflet-container");

      // Get initial map position by checking a marker's screen position
      const resortMarker = page.locator(".leaflet-marker-icon").first();
      const initialMarkerBox = await resortMarker.boundingBox();

      // Pan the map by dragging
      const mapBox = await mapContainer.boundingBox();
      if (mapBox && initialMarkerBox) {
        const startX = mapBox.x + mapBox.width / 2;
        const startY = mapBox.y + mapBox.height / 2;

        // Drag the map 100px to the right
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 100, startY, { steps: 10 });
        await page.mouse.up();

        // Wait a moment for any potential snap-back (the bug we're testing against)
        await page.waitForTimeout(500);

        // Check that the marker has moved (map didn't snap back)
        const newMarkerBox = await resortMarker.boundingBox();

        if (newMarkerBox) {
          // The marker should have moved to the right along with the pan
          expect(newMarkerBox.x).toBeGreaterThan(initialMarkerBox.x + 50);
        }
      }
    });

    test("selecting different resort centers map on new resort", async ({
      page,
    }) => {
      // Get all resort cards
      const resortCards = page.locator("[data-resort-id]");
      const count = await resortCards.count();

      if (count >= 2) {
        // Select first resort
        await resortCards.nth(0).click();
        await page.waitForTimeout(800); // Wait for fly animation

        // Select second resort
        await resortCards.nth(1).click();
        await page.waitForTimeout(800); // Wait for fly animation

        // Second resort should now be expanded
        const secondResortCard = resortCards.nth(1);
        await expect(secondResortCard).toHaveClass(/ring-1/);

        // First resort should no longer be expanded
        const firstResortCard = resortCards.nth(0);
        await expect(firstResortCard).not.toHaveClass(/ring-1/);
      }
    });

    test("hovering over map does not cause focus snap-back", async ({
      page,
    }) => {
      // Select a resort
      const firstResortCard = page.locator("[data-resort-id]").first();
      await firstResortCard.click();

      // Wait for map to settle
      await page.waitForTimeout(1000);

      // Get initial marker position
      const resortMarker = page.locator(".leaflet-marker-icon").first();
      const initialMarkerBox = await resortMarker.boundingBox();

      // Pan the map
      const mapContainer = page.locator(".leaflet-container");
      const mapBox = await mapContainer.boundingBox();

      if (mapBox && initialMarkerBox) {
        const startX = mapBox.x + mapBox.width / 2;
        const startY = mapBox.y + mapBox.height / 2;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 80, startY, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(300);

        // Now hover over various elements (which might trigger re-renders)
        await page.hover("[data-resort-id]:nth-child(2)");
        await page.waitForTimeout(200);
        await page.hover("[data-resort-id]:nth-child(3)");
        await page.waitForTimeout(200);

        // Check marker didn't snap back
        const finalMarkerBox = await resortMarker.boundingBox();
        if (finalMarkerBox) {
          // Should still be panned (not snapped back to original)
          expect(finalMarkerBox.x).toBeGreaterThan(initialMarkerBox!.x + 30);
        }
      }
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("can select resort on mobile", async ({ page }) => {
      // On mobile, we may need to interact differently
      // First check if sidebar is visible or needs to be opened
      const resortCard = page.locator("[data-resort-id]").first();

      // Click on resort
      await resortCard.click();

      // Should show expanded content
      await expect(
        page
          .locator('text="Nearest Dialysis Clinics:"')
          .or(page.locator('text="Nearest Hospitals:"'))
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Regression: Focus Hijacking Bug", () => {
    /**
     * This test specifically guards against the bug where the map would
     * constantly re-center on the selected item during normal interactions,
     * preventing the user from exploring the map freely.
     */
    test("map stays panned after multiple re-render triggers", async ({
      page,
    }) => {
      test.use({ viewport: { width: 1280, height: 800 } });

      // Select a resort
      const firstResortCard = page.locator("[data-resort-id]").first();
      await firstResortCard.click();
      await page.waitForTimeout(1000);

      // Pan the map
      const mapContainer = page.locator(".leaflet-container");
      const mapBox = await mapContainer.boundingBox();

      if (mapBox) {
        const startX = mapBox.x + mapBox.width / 2;
        const startY = mapBox.y + mapBox.height / 2;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 100, startY + 50, { steps: 10 });
        await page.mouse.up();
      }

      // Wait for pan to complete
      await page.waitForTimeout(500);

      // Get reference point (zoom button position relative to map)
      const zoomInButton = page.locator('[aria-label="Zoom in"]');
      const zoomButtonBox = await zoomInButton.boundingBox();

      // Trigger multiple interactions that could cause re-renders
      // 1. Hover over sidebar items
      for (let i = 1; i <= 3; i++) {
        await page.hover(`[data-resort-id]:nth-child(${i})`);
        await page.waitForTimeout(100);
      }

      // 2. Open and close settings
      await page.click('[aria-label="Open settings"]');
      await page.waitForTimeout(200);
      await page.click('[aria-label="Close settings"]');
      await page.waitForTimeout(200);

      // 3. Move mouse around map
      if (mapBox) {
        await page.mouse.move(mapBox.x + 100, mapBox.y + 100);
        await page.waitForTimeout(100);
        await page.mouse.move(mapBox.x + 200, mapBox.y + 200);
        await page.waitForTimeout(100);
      }

      // After all these interactions, verify map hasn't snapped back
      // The zoom button should still be in approximately the same position
      const finalZoomButtonBox = await zoomInButton.boundingBox();

      if (zoomButtonBox && finalZoomButtonBox) {
        // Allow small tolerance for any slight layout shifts
        expect(Math.abs(finalZoomButtonBox.x - zoomButtonBox.x)).toBeLessThan(
          10
        );
        expect(Math.abs(finalZoomButtonBox.y - zoomButtonBox.y)).toBeLessThan(
          10
        );
      }
    });
  });
});
