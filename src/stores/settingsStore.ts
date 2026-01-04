import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ViewMode } from "./selectionStore";

export type ColorTheme = "rose" | "alpine" | "glacier";
export type DarkMode = "dark" | "light" | "auto";
export type DistanceUnit = "miles" | "km";

interface SettingsState {
  // Appearance
  colorTheme: ColorTheme;
  darkMode: DarkMode;

  // Units
  distanceUnit: DistanceUnit;

  // Defaults
  defaultView: ViewMode;
  defaultMaxDistance: number;

  // Drawer state
  isDrawerOpen: boolean;

  // Actions
  setColorTheme: (theme: ColorTheme) => void;
  setDarkMode: (mode: DarkMode) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setDefaultView: (view: ViewMode) => void;
  setDefaultMaxDistance: (distance: number) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  colorTheme: "rose" as ColorTheme,
  darkMode: "dark" as DarkMode,
  distanceUnit: "miles" as DistanceUnit,
  defaultView: "resorts" as ViewMode,
  defaultMaxDistance: 100,
  isDrawerOpen: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setColorTheme: (colorTheme) => set({ colorTheme }),

      setDarkMode: (darkMode) => set({ darkMode }),

      setDistanceUnit: (distanceUnit) => set({ distanceUnit }),

      setDefaultView: (defaultView) => set({ defaultView }),

      setDefaultMaxDistance: (defaultMaxDistance) =>
        set({ defaultMaxDistance }),

      toggleDrawer: () =>
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      openDrawer: () => set({ isDrawerOpen: true }),

      closeDrawer: () => set({ isDrawerOpen: false }),

      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "skiwithcare-settings",
      version: 1,
      // Only persist these fields (not drawer state)
      partialize: (state) => ({
        colorTheme: state.colorTheme,
        darkMode: state.darkMode,
        distanceUnit: state.distanceUnit,
        defaultView: state.defaultView,
        defaultMaxDistance: state.defaultMaxDistance,
      }),
      // Ensure drawer is always closed on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDrawerOpen = false;
        }
      },
    }
  )
);
