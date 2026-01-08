import { useState, useEffect, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Check if dismissed from sessionStorage (sync, no setState needed)
function getIsDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem("pwa-install-dismissed") === "true";
}

// Check if already installed as PWA
function getIsInstalled(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

// Simple subscribe for useSyncExternalStore (no-op since we only read once)
function subscribe() {
  return () => {};
}

/**
 * PWA Install Prompt - Shows a banner to install the app
 * Only appears on supported browsers that haven't installed yet
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Read initial dismissed state without triggering re-renders
  const initiallyDismissed = useSyncExternalStore(subscribe, getIsDismissed, () => true);
  const isInstalled = useSyncExternalStore(subscribe, getIsInstalled, () => true);

  useEffect(() => {
    // Skip if already dismissed or installed
    if (initiallyDismissed || isInstalled) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [initiallyDismissed, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!isVisible || isDismissed || initiallyDismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-bg-card border border-accent-primary/30 rounded-xl p-4 shadow-lg shadow-accent-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary to-accent-tertiary flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⛷️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary text-sm">
              Install SkiWithCare
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Add to home screen for quick access—works offline at ski resorts!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-primary p-1 -mr-1 -mt-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg
              bg-gradient-to-r from-accent-primary to-accent-tertiary text-white
              hover:opacity-90 transition-opacity"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium rounded-lg
              bg-bg-tertiary text-text-secondary hover:text-text-primary
              border border-border hover:border-accent-primary/30 transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
