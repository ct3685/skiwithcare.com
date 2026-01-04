/**
 * Location source type
 */
export type LocationSource = "gps" | "address" | "manual";

/**
 * User's current location
 */
export interface UserLocation {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Human-readable label (e.g., "Denver, CO" or "Your location") */
  label: string;
  /** How the location was obtained */
  source: LocationSource;
}

/**
 * Coordinates (lat/lon pair)
 */
export interface Coordinates {
  lat: number;
  lon: number;
}

