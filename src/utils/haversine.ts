import type { Coordinates } from "@/types";

/**
 * Earth's radius in miles
 */
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 *
 * @param point1 - First coordinate (lat, lon)
 * @param point2 - Second coordinate (lat, lon)
 * @param unit - Distance unit ('miles' or 'km')
 * @returns Distance between the two points
 */
export function haversine(
  point1: Coordinates,
  point2: Coordinates,
  unit: "miles" | "km" = "miles"
): number {
  const R = unit === "km" ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;

  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lon - point1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate distance using raw lat/lon values (convenience function)
 */
export function haversineRaw(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "miles" | "km" = "miles"
): number {
  return haversine({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }, unit);
}

