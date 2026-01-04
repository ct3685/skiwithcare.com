/**
 * Ski Pass Network
 */
export type PassNetwork = "epic" | "ikon" | "both" | "independent";

/**
 * Geographic Region
 */
export type Region =
  | "rockies"
  | "west"
  | "northeast"
  | "midwest"
  | "southeast"
  | "pacific-northwest";

/**
 * Ski Resort
 */
export interface Resort {
  /** Unique identifier (name|state) */
  id: string;
  /** Resort name */
  name: string;
  /** State abbreviation (e.g., "CO", "UT", "CA/NV") */
  state: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Pass network affiliation */
  passNetwork: PassNetwork;
  /** Geographic region */
  region: Region;
}

/**
 * Resort with computed distance (used in lists/search results)
 */
export interface ResortWithDistance extends Resort {
  /** Distance from reference point in miles */
  distance: number;
}

