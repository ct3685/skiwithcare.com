import { useSelectionStore, useSettingsStore } from "@/stores";
import type { ViewMode } from "@/stores/selectionStore";
import {
  trackModeSwitch,
  trackLogoClick,
  trackSettingsOpen,
} from "@/utils/analytics";

const modes: { id: ViewMode; label: string; icon: string }[] = [
  { id: "resorts", label: "Resorts", icon: "🏔️" },
  { id: "urgent_care", label: "Urgent", icon: "🩹" },
  { id: "hospitals", label: "ER", icon: "🚑" },
  { id: "clinics", label: "Dialysis", icon: "🏥" },
];

export function Header() {
  const { mode, setMode, clearSelection } = useSelectionStore();
  const { openDrawer } = useSettingsStore();

  const handleModeChange = (newMode: ViewMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      trackModeSwitch(newMode);
    }
  };

  const handleLogoClick = () => {
    clearSelection();
    setMode("resorts");
    trackLogoClick();
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleSettingsClick = () => {
    openDrawer();
    trackSettingsOpen();
  };

  return (
    <header className="bg-gradient-to-r from-bg-secondary to-bg-tertiary border-b border-border px-4 py-3 relative z-50">
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <img
            src="/logo-512.png"
            alt="SkiWithCare"
            className="w-12 h-12 rounded-xl shadow-glow-pink"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">
              <span className="text-[#e879a0]">Ski</span>
              <span className="text-[#64d9f7]">WithCare</span>
            </h1>
            <span className="text-xs text-text-muted">
              Care Near the Slopes
            </span>
          </div>
        </button>

        {/* Mode Toggle */}
        <div className="flex bg-bg-tertiary border border-border rounded-full p-1 gap-1">
          {modes.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => handleModeChange(id)}
              className={`
                px-3 py-2 rounded-full
                text-sm font-semibold
                flex items-center gap-1.5
                transition-all duration-300
                ${
                  mode === id
                    ? "bg-gradient-to-r from-accent-primary to-accent-tertiary text-white shadow-glow-pink"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-card"
                }
              `}
            >
              <span className="hidden sm:inline">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Settings Button */}
        <button
          onClick={handleSettingsClick}
          className="p-2.5 rounded-lg bg-bg-tertiary border border-border hover:border-accent-primary hover:bg-bg-card transition-all"
          aria-label="Open settings"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
