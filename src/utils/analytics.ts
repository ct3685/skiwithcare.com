/**
 * Google Analytics 4 Event Tracking Wrapper
 *
 * All events use snake_case naming convention.
 * Categories: engagement, navigation, error
 */

// Declare gtag on window (loaded via index.html)
declare global {
  interface Window {
    gtag: (
      command: "event" | "config" | "js",
      action: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

/**
 * Check if gtag is available
 */
function isGtagAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGtagAvailable()) return;

  window.gtag("event", eventName, {
    ...params,
  });
}

// ============ Engagement Events ============

/**
 * Track mode switch (resorts/clinics/hospitals)
 */
export function trackModeSwitch(mode: string): void {
  trackEvent("mode_switch", {
    event_category: "engagement",
    mode,
  });
}

/**
 * Track search query
 */
export function trackSearch(searchTerm: string, mode: string): void {
  trackEvent("search", {
    event_category: "engagement",
    search_term: searchTerm,
    mode,
  });
}

/**
 * Track item selection (resort, clinic, hospital)
 */
export function trackItemSelect(
  itemType: string,
  itemName: string,
  itemState: string
): void {
  trackEvent("item_select", {
    event_category: "engagement",
    item_type: itemType,
    item_name: itemName,
    item_state: itemState,
  });
}

/**
 * Track filter change
 */
export function trackFilterChange(
  filterType: string,
  value: string | number,
  mode: string
): void {
  trackEvent(`filter_${filterType}`, {
    event_category: "engagement",
    value,
    mode,
  });
}

/**
 * Track "Near Me" location request
 */
export function trackNearMeClick(mode: string): void {
  trackEvent("near_me_click", {
    event_category: "engagement",
    mode,
  });
}

/**
 * Track successful location set
 */
export function trackLocationSet(
  locationType: string,
  locationLabel: string,
  mode: string
): void {
  trackEvent("location_set", {
    event_category: "engagement",
    location_type: locationType,
    location_label: locationLabel,
    mode,
  });
}

/**
 * Track location cleared
 */
export function trackLocationClear(mode: string): void {
  trackEvent("clear_location", {
    event_category: "engagement",
    mode,
  });
}

/**
 * Track directions click
 */
export function trackDirectionsClick(
  fromName: string,
  toName: string,
  distanceMiles: number,
  mode: string
): void {
  trackEvent("directions_click", {
    event_category: "engagement",
    from_name: fromName,
    to_name: toName,
    distance_miles: distanceMiles,
    mode,
  });
}

/**
 * Track share action
 */
export function trackShare(
  itemType: string,
  itemName: string,
  method: string
): void {
  trackEvent("share_success", {
    event_category: "engagement",
    item_type: itemType,
    item_name: itemName,
    method,
  });
}

/**
 * Track theme change
 */
export function trackThemeChange(
  colorTheme: string,
  darkMode: string
): void {
  trackEvent("theme_change", {
    event_category: "engagement",
    theme_color: colorTheme,
    theme_mode: darkMode,
  });
}

/**
 * Track settings drawer open
 */
export function trackSettingsOpen(): void {
  trackEvent("settings_open", {
    event_category: "engagement",
  });
}

/**
 * Track popup open on map
 */
export function trackPopupOpen(
  itemType: string,
  itemName: string,
  itemState: string,
  mode: string
): void {
  trackEvent("popup_open", {
    event_category: "engagement",
    item_type: itemType,
    item_name: itemName,
    item_state: itemState,
    mode,
  });
}

// ============ Navigation Events ============

/**
 * Track logo click (app reset)
 */
export function trackLogoClick(): void {
  trackEvent("logo_click", {
    event_category: "navigation",
    action: "reset_app",
  });
}

/**
 * Track sidebar toggle (mobile)
 */
export function trackSidebarToggle(state: "collapsed" | "expanded", mode: string): void {
  trackEvent("sidebar_toggle", {
    event_category: "engagement",
    state,
    mode,
  });
}

// ============ Error Events ============

/**
 * Track location error/fallback
 */
export function trackLocationFallback(reason: string): void {
  trackEvent("location_fallback", {
    event_category: "error",
    reason,
  });
}

/**
 * Track data load error
 */
export function trackDataError(dataType: string, error: string): void {
  trackEvent("data_error", {
    event_category: "error",
    data_type: dataType,
    error_message: error,
  });
}

