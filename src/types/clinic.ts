/**
 * Dialysis Provider Chain
 */
export type DialysisProvider = "davita" | "fresenius" | "independent" | "other";

/**
 * Dialysis Clinic
 */
export interface Clinic {
  /** CMS Certification Number (unique identifier) */
  ccn: string;
  /** Facility name */
  facility: string;
  /** Provider chain */
  provider: DialysisProvider;
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** State abbreviation */
  state: string;
  /** ZIP code */
  zip: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Phone number (optional) */
  phone?: string;
  /** Nearest resort name (pre-computed) */
  nearestResort?: string;
  /** Distance to nearest resort in miles (pre-computed) */
  nearestResortDist?: number;
}

/**
 * Clinic with computed distance (used in lists/search results)
 */
export interface ClinicWithDistance extends Clinic {
  /** Distance from reference point in miles */
  distance: number;
}

