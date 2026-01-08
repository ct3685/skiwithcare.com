/**
 * Directions utility - opens native maps app based on platform
 */

interface DirectionsOptions {
  destLat: number;
  destLon: number;
  destName?: string;
  originLat?: number;
  originLon?: number;
}

/**
 * Detect if user is on iOS/macOS (Safari) for Apple Maps preference
 */
function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(ua) && !ua.includes("android");
}

/**
 * Open directions in the user's preferred maps app
 * - iOS/macOS: Apple Maps
 * - Android/Desktop: Google Maps
 */
export function openDirections({
  destLat,
  destLon,
  destName,
  originLat,
  originLon,
}: DirectionsOptions): void {
  const encodedName = destName ? encodeURIComponent(destName) : "";
  
  if (isApplePlatform()) {
    // Apple Maps URL scheme
    let url = `maps://maps.apple.com/?daddr=${destLat},${destLon}`;
    if (originLat !== undefined && originLon !== undefined) {
      url += `&saddr=${originLat},${originLon}`;
    }
    if (encodedName) {
      url += `&q=${encodedName}`;
    }
    window.location.href = url;
  } else {
    // Google Maps (works on Android and desktop)
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;
    if (originLat !== undefined && originLon !== undefined) {
      url += `&origin=${originLat},${originLon}`;
    }
    if (encodedName) {
      url += `&destination_place_id=${encodedName}`;
    }
    window.open(url, "_blank");
  }
}

/**
 * Get a shareable Google Maps link (works universally)
 */
export function getGoogleMapsUrl(lat: number, lon: number, name?: string): string {
  const base = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  return name ? `${base}&query_place_id=${encodeURIComponent(name)}` : base;
}

/**
 * Get a shareable Apple Maps link
 */
export function getAppleMapsUrl(lat: number, lon: number, name?: string): string {
  let url = `https://maps.apple.com/?ll=${lat},${lon}`;
  if (name) {
    url += `&q=${encodeURIComponent(name)}`;
  }
  return url;
}
