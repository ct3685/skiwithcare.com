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
  | "pacific-northwest"
  | "other";

/**
 * Resort Size Category
 * - major: Large destination resorts (Vail, Park City, etc.)
 * - regional: Mid-size resorts serving regional visitors
 * - local: Small local hills and ski areas
 */
export type ResortSize = "major" | "regional" | "local";

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
  /** Pass network affiliation (optional - many resorts are independent) */
  passNetwork?: PassNetwork;
  /** Geographic region */
  region: Region;

  // Size and categorization
  /** Resort size category */
  size?: ResortSize;

  // Emergency contact information
  /** Ski patrol direct phone number */
  skiPatrolPhone?: string;
  /** Ski patrol location description (e.g., "Base of Chair 1") */
  skiPatrolLocation?: string;
  /** Main resort phone number (fallback for patrol) */
  resortPhone?: string;
  /** Resort website URL */
  website?: string;

  // On-mountain medical
  /** ID of on-mountain clinic facility (if any) */
  onMountainClinicId?: string;

  // Trust signals
  /** ISO date string of last data verification */
  lastVerified?: string;
  /** URL to official source for this data */
  sourceUrl?: string;
}

/**
 * Resort with computed distance (used in lists/search results)
 */
export interface ResortWithDistance extends Resort {
  /** Distance from reference point in miles */
  distance: number;
}

