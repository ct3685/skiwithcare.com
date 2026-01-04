/**
 * Trauma Center Level
 * Level I: Highest level, comprehensive care
 * Level II: Can initiate definitive care
 * Level III: Prompt assessment, resuscitation, emergency surgery
 * Level IV: Initial evaluation and stabilization
 */
export type TraumaLevel = 1 | 2 | 3 | 4;

/**
 * Hospital / Emergency Care Facility
 */
export interface Hospital {
  /** CMS Provider ID (unique identifier) */
  id: string;
  /** Hospital name */
  name: string;
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
  /** Has emergency department */
  hasEmergency: boolean;
  /** Trauma center level (if designated) */
  traumaLevel?: TraumaLevel;
  /** Phone number (optional) */
  phone?: string;
  /** Nearest resort name (pre-computed) */
  nearestResort?: string;
  /** Distance to nearest resort in miles (pre-computed) */
  nearestResortDist?: number;
}

/**
 * Hospital with computed distance (used in lists/search results)
 */
export interface HospitalWithDistance extends Hospital {
  /** Distance from reference point in miles */
  distance: number;
}

