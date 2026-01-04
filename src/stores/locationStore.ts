import { create } from "zustand";
import type { UserLocation, LocationSource, Coordinates } from "@/types";

/**
 * Location state for user's position and map center
 */
interface LocationState {
  /** User's current location (null if not set) */
  userLocation: UserLocation | null;
  /** Map center position (for sorting by proximity) */
  mapCenter: Coordinates | null;
  /** Whether we're currently fetching location */
  isLoading: boolean;
  /** Error message if location fetch failed */
  error: string | null;

  // Actions
  setUserLocation: (
    lat: number,
    lon: number,
    label: string,
    source: LocationSource
  ) => void;
  setMapCenter: (lat: number, lon: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
  requestLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>()((set, get) => ({
  userLocation: null,
  mapCenter: null,
  isLoading: false,
  error: null,

  setUserLocation: (lat, lon, label, source) =>
    set({
      userLocation: { lat, lon, label, source },
      isLoading: false,
      error: null,
    }),

  setMapCenter: (lat, lon) =>
    set({
      mapCenter: { lat, lon },
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clear: () =>
    set({
      userLocation: null,
      isLoading: false,
      error: null,
    }),

  requestLocation: async () => {
    const { setUserLocation, setError, setLoading } = get();

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          });
        }
      );

      setUserLocation(
        position.coords.latitude,
        position.coords.longitude,
        "Your location",
        "gps"
      );
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      let message = "Unable to get your location";

      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          message = "Location permission denied";
          break;
        case geoError.POSITION_UNAVAILABLE:
          message = "Location information unavailable";
          break;
        case geoError.TIMEOUT:
          message = "Location request timed out";
          break;
      }

      setError(message);
    }
  },
}));

/**
 * Geocode an address using OpenStreetMap Nominatim
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lon: number;
  label: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&countrycodes=us&limit=1`,
      {
        headers: {
          "User-Agent": "SkiWithCare/2.0 (https://skiwithcare.com)",
        },
      }
    );

    const results = await response.json();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const label = result.display_name.split(",").slice(0, 2).join(",");

    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      label,
    };
  } catch {
    return null;
  }
}
