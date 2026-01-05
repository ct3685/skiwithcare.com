import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useSettingsStore,
  type ColorTheme,
  type DarkMode,
  type DistanceUnit,
} from "@/stores/settingsStore";
import { useSelectionStore, type ViewMode } from "@/stores/selectionStore";
import { Button } from "@/components/ui/Button";
import { trackThemeChange } from "@/utils/analytics";

const colorThemes: { id: ColorTheme; label: string; accent: string }[] = [
  { id: "rose", label: "Rose", accent: "#e879a0" },
  { id: "alpine", label: "Alpine", accent: "#f97316" },
  { id: "glacier", label: "Glacier", accent: "#14b8a6" },
];

const darkModes: { id: DarkMode; label: string; icon: string }[] = [
  { id: "dark", label: "Dark", icon: "🌙" },
  { id: "light", label: "Light", icon: "☀️" },
  { id: "auto", label: "Auto", icon: "🔄" },
];

const distanceUnits: { id: DistanceUnit; label: string }[] = [
  { id: "miles", label: "Miles" },
  { id: "km", label: "Kilometers" },
];

const defaultViews: { id: ViewMode; label: string }[] = [
  { id: "resorts", label: "Resorts" },
  { id: "clinics", label: "Clinics" },
  { id: "hospitals", label: "Hospitals" },
];

const defaultDistances = [25, 50, 75, 100, 150, 200];

export function SettingsDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    colorTheme,
    setColorTheme,
    darkMode,
    setDarkMode,
    distanceUnit,
    setDistanceUnit,
    defaultView,
    setDefaultView,
    defaultMaxDistance,
    setDefaultMaxDistance,
    resetToDefaults,
  } = useSettingsStore();

  const { setMode } = useSelectionStore();

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const handleColorThemeChange = (theme: ColorTheme) => {
    setColorTheme(theme);
    trackThemeChange(theme, darkMode);
  };

  const handleDarkModeChange = (mode: DarkMode) => {
    setDarkMode(mode);
    trackThemeChange(colorTheme, mode);
  };

  const handleDefaultViewChange = (view: ViewMode) => {
    setDefaultView(view);
    setMode(view); // Also update current mode
  };

  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[60]
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 right-0 z-[70]
          h-full w-80 max-w-[90vw]
          bg-bg-secondary border-l border-border
          shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}
          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Appearance Section */}
          <section>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Appearance
            </h3>

            {/* Color Theme */}
            <div className="mb-4">
              <label className="text-sm text-text-secondary mb-2 block">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorThemes.map(({ id, label, accent }) => (
                  <button
                    key={id}
                    onClick={() => handleColorThemeChange(id)}
                    className={`
                      p-3 rounded-lg border text-center transition-all
                      ${
                        colorTheme === id
                          ? "border-accent-primary bg-accent-primary/10"
                          : "border-border hover:border-text-muted"
                      }
                    `}
                  >
                    <div
                      className="w-6 h-6 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-xs text-text-primary">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Mode */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">
                Mode
              </label>
              <div className="flex gap-2">
                {darkModes.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => handleDarkModeChange(id)}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                      ${
                        darkMode === id
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                          : "border-border text-text-muted hover:border-text-muted"
                      }
                    `}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Units Section */}
          <section>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Units
            </h3>

            <div>
              <label className="text-sm text-text-secondary mb-2 block">
                Distance
              </label>
              <div className="flex gap-2">
                {distanceUnits.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setDistanceUnit(id)}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                      ${
                        distanceUnit === id
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                          : "border-border text-text-muted hover:border-text-muted"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Defaults Section */}
          <section>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Defaults
            </h3>

            {/* Default View */}
            <div className="mb-4">
              <label className="text-sm text-text-secondary mb-2 block">
                Default View
              </label>
              <select
                value={defaultView}
                onChange={(e) =>
                  handleDefaultViewChange(e.target.value as ViewMode)
                }
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
              >
                {defaultViews.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Distance */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">
                Default Max Distance
              </label>
              <select
                value={defaultMaxDistance}
                onChange={(e) => setDefaultMaxDistance(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
              >
                {defaultDistances.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist} {distanceUnit === "km" ? "km" : "miles"}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Reset */}
          <section className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="w-full text-text-muted hover:text-accent-danger"
            >
              Reset to Defaults
            </Button>
          </section>
        </div>
      </aside>
    </>,
    portalRoot
  );
}
