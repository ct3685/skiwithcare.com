import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSettingsStore.getState().resetToDefaults();
  });

  describe("initial state", () => {
    it("has correct default values", () => {
      const state = useSettingsStore.getState();

      expect(state.colorTheme).toBe("rose");
      expect(state.darkMode).toBe("auto");
      expect(state.distanceUnit).toBe("miles");
      expect(state.defaultView).toBe("resorts");
      expect(state.defaultMaxDistance).toBe(100);
      expect(state.isDrawerOpen).toBe(false);
    });
  });

  describe("setColorTheme()", () => {
    it("changes color theme", () => {
      useSettingsStore.getState().setColorTheme("alpine");
      expect(useSettingsStore.getState().colorTheme).toBe("alpine");

      useSettingsStore.getState().setColorTheme("glacier");
      expect(useSettingsStore.getState().colorTheme).toBe("glacier");
    });
  });

  describe("setDarkMode()", () => {
    it("changes dark mode setting", () => {
      useSettingsStore.getState().setDarkMode("light");
      expect(useSettingsStore.getState().darkMode).toBe("light");

      useSettingsStore.getState().setDarkMode("auto");
      expect(useSettingsStore.getState().darkMode).toBe("auto");
    });
  });

  describe("setDistanceUnit()", () => {
    it("changes distance unit", () => {
      useSettingsStore.getState().setDistanceUnit("km");
      expect(useSettingsStore.getState().distanceUnit).toBe("km");
    });
  });

  describe("setDefaultView()", () => {
    it("changes default view", () => {
      useSettingsStore.getState().setDefaultView("clinics");
      expect(useSettingsStore.getState().defaultView).toBe("clinics");

      useSettingsStore.getState().setDefaultView("hospitals");
      expect(useSettingsStore.getState().defaultView).toBe("hospitals");
    });
  });

  describe("setDefaultMaxDistance()", () => {
    it("changes default max distance", () => {
      useSettingsStore.getState().setDefaultMaxDistance(50);
      expect(useSettingsStore.getState().defaultMaxDistance).toBe(50);
    });
  });

  describe("drawer actions", () => {
    it("toggleDrawer() toggles drawer state", () => {
      expect(useSettingsStore.getState().isDrawerOpen).toBe(false);

      useSettingsStore.getState().toggleDrawer();
      expect(useSettingsStore.getState().isDrawerOpen).toBe(true);

      useSettingsStore.getState().toggleDrawer();
      expect(useSettingsStore.getState().isDrawerOpen).toBe(false);
    });

    it("openDrawer() opens drawer", () => {
      useSettingsStore.getState().openDrawer();
      expect(useSettingsStore.getState().isDrawerOpen).toBe(true);
    });

    it("closeDrawer() closes drawer", () => {
      useSettingsStore.getState().openDrawer();
      useSettingsStore.getState().closeDrawer();
      expect(useSettingsStore.getState().isDrawerOpen).toBe(false);
    });
  });

  describe("resetToDefaults()", () => {
    it("resets all settings to defaults", () => {
      // Change all settings
      const store = useSettingsStore.getState();
      store.setColorTheme("glacier");
      store.setDarkMode("light");
      store.setDistanceUnit("km");
      store.setDefaultView("hospitals");
      store.setDefaultMaxDistance(25);
      store.openDrawer();

      // Reset
      useSettingsStore.getState().resetToDefaults();

      // Verify defaults restored
      const state = useSettingsStore.getState();
      expect(state.colorTheme).toBe("rose");
      expect(state.darkMode).toBe("auto");
      expect(state.distanceUnit).toBe("miles");
      expect(state.defaultView).toBe("resorts");
      expect(state.defaultMaxDistance).toBe(100);
      expect(state.isDrawerOpen).toBe(false);
    });
  });
});

