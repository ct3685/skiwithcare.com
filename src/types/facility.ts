/**
 * Facility Types
 * - urgent_care: Walk-in clinics for non-life-threatening injuries
 * - er: Emergency rooms (hospital emergency departments)
 * - on_mountain: Resort-operated medical clinics on the mountain
 * - dialysis: Dialysis centers (legacy support)
 */
export type FacilityType = "urgent_care" | "er" | "on_mountain" | "dialysis";

/**
 * Verification status for trust signals
 */
export type VerificationStatus =
  | "unverified"
  | "verified_by_staff"
  | "verified_by_facility"
  | "verified_by_resort";

/**
 * Facility capabilities (for filtering)
 */
export type FacilityCapability =
  | "xray"
  | "ortho"
  | "peds"
  | "sutures"
  | "casting"
  | "mri"
  | "ct";

/**
 * Hours of operation for a single day
 */
export interface DayHours {
  open: string; // "08:00" 24h format
  close: string; // "20:00" 24h format
  closed?: boolean;
}

/**
 * Weekly hours of operation
 */
export interface HoursOfOperation {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  /** Seasonal closure info */
  seasonalNote?: string;
  /** True if hours vary by season */
  seasonal?: boolean;
}

/**
 * Healthcare Facility (Unified type for all care locations)
 *
 * Replaces the separate Clinic and Hospital types with a unified
 * structure that supports urgent care, ERs, on-mountain clinics,
 * and dialysis centers.
 */
export interface Facility {
  /** Unique identifier */
  id: string;
  /** Facility name */
  name: string;
  /** Type of facility */
  type: FacilityType;
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
  /** Phone number */
  phone?: string;
  /** Website URL */
  website?: string;

  // Trust signals
  /** Verification status */
  verificationStatus?: VerificationStatus;
  /** ISO date string of last verification */
  lastVerified?: string;
  /** URL to official source for this data */
  sourceUrl?: string;

  // Capabilities (P2 feature)
  /** Available medical capabilities */
  capabilities?: FacilityCapability[];

  // Hours (P2 feature)
  /** Hours of operation */
  hours?: HoursOfOperation;
  /** True if facility is 24/7 */
  open24Hours?: boolean;

  // ER-specific fields
  /** Trauma center level (1-4, Level 1 is highest) */
  traumaLevel?: 1 | 2 | 3 | 4;
  /** Has emergency department */
  hasEmergency?: boolean;

  // Dialysis-specific fields (legacy support)
  /** Dialysis provider chain */
  dialysisProvider?: "davita" | "fresenius" | "independent" | "other";

  // Pre-computed relationships
  /** Nearest resort name */
  nearestResort?: string;
  /** Distance to nearest resort in miles */
  nearestResortDist?: number;
}

/**
 * Facility with computed distance (used in lists/search results)
 */
export interface FacilityWithDistance extends Facility {
  /** Distance from reference point in miles */
  distance: number;
}
