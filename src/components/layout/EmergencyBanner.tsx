import { useState } from "react";

/**
 * Emergency Disclaimer Banner
 *
 * Sticky banner that appears at the top of the page with critical safety info.
 * Can be dismissed but will reappear on page refresh (intentional for safety).
 */
export function EmergencyBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 relative z-[60]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0" aria-hidden="true">
            🚨
          </span>
          <p className="text-sm font-medium">
            <span className="font-bold">Medical Emergency?</span>{" "}
            <span className="hidden sm:inline">
              Call <strong>911</strong> immediately. On-mountain? Contact{" "}
              <strong>Ski Patrol</strong> at any lift or use your resort's
              emergency number.
            </span>
            <span className="sm:hidden">
              Call <strong>911</strong> or Ski Patrol.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick 911 call button on mobile */}
          <a
            href="tel:911"
            className="sm:hidden px-3 py-1.5 bg-white text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
            aria-label="Call 911"
          >
            Call 911
          </a>

          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Dismiss emergency banner"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Not medical advice disclaimer - shown below main message */}
      <div className="max-w-7xl mx-auto mt-1">
        <p className="text-xs text-red-200 opacity-80">
          This site provides general information only—not medical advice. Always
          consult a healthcare professional.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact Emergency Strip (for use in header/footer)
 * Shows just the essentials for ongoing visibility
 */
export function EmergencyStrip() {
  return (
    <div className="bg-red-600/90 text-white px-3 py-1.5 text-center text-xs font-medium">
      <span>
        🚨 Emergency? Call{" "}
        <a href="tel:911" className="underline font-bold hover:text-red-100">
          911
        </a>{" "}
        or contact{" "}
        <span className="font-bold">Ski Patrol</span> at any lift.
      </span>
      <span className="hidden md:inline text-red-200 ml-2">
        • Not medical advice
      </span>
    </div>
  );
}
