import type { DistanceUnit } from "@/stores/settingsStore";

/**
 * Miles to kilometers conversion factor
 */
const MILES_TO_KM = 1.60934;

/**
 * Format a distance value with unit
 *
 * @param miles - Distance in miles
 * @param unit - Display unit preference
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted distance string (e.g., "12.5 mi" or "20.1 km")
 */
export function formatDistance(
  miles: number,
  unit: DistanceUnit = "miles",
  decimals: number = 1
): string {
  if (unit === "km") {
    const km = miles * MILES_TO_KM;
    return `${km.toFixed(decimals)} km`;
  }
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Format an address for display
 *
 * @param address - Street address
 * @param city - City
 * @param state - State abbreviation
 * @param zip - ZIP code
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  city: string,
  state: string,
  zip?: string
): string {
  const cityState = `${city}, ${state}`;
  if (zip) {
    return `${address}\n${cityState} ${zip}`;
  }
  return `${address}\n${cityState}`;
}

/**
 * Format a phone number for display
 *
 * @param phone - Raw phone number
 * @returns Formatted phone number or original if parsing fails
 */
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Format as +1 (XXX) XXX-XXXX if 11 digits starting with 1
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Get distance color class based on distance value
 *
 * @param miles - Distance in miles
 * @returns Tailwind color class
 */
export function getDistanceColorClass(miles: number): string {
  if (miles < 25) return "text-accent-success";
  if (miles < 75) return "text-accent-warning";
  return "text-accent-danger";
}

