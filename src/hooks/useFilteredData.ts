import { useMemo } from "react";
import type { Resort, Clinic, Hospital, Facility, Coordinates } from "@/types";
import { useFilterStore } from "@/stores/filterStore";
import { useLocationStore } from "@/stores/locationStore";
import { haversine } from "@/utils/haversine";

interface FilteredData {
  resorts: (Resort & { distance?: number })[];
  clinics: (Clinic & { distance?: number })[];
  hospitals: (Hospital & { distance?: number })[];
  urgentCare: (Facility & { distance?: number })[];
  /** Location used for distance calculations (user location or map center) */
  sortOrigin: { type: "user" | "map"; coords: Coordinates } | null;
}

/**
 * Hook to filter and sort data based on current filters and location
 * 
 * Priority for distance sorting:
 * 1. User location (if "Near Me" clicked)
 * 2. Map center (as user pans around)
 */
export function useFilteredData(
  resorts: Resort[],
  clinics: Clinic[],
  hospitals: Hospital[],
  urgentCare: Facility[] = []
): FilteredData {
  const { searchQuery, selectedState, maxDistance, passNetworks, careTypes } =
    useFilterStore();
  const { userLocation, mapCenter } = useLocationStore();

  return useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();

    // Determine which location to use for distance calculations
    // User location takes priority, then map center
    const sortOrigin: FilteredData["sortOrigin"] = userLocation
      ? { type: "user", coords: { lat: userLocation.lat, lon: userLocation.lon } }
      : mapCenter
      ? { type: "map", coords: mapCenter }
      : null;

    // Helper to calculate distance from sort origin
    const withDistance = <T extends { lat: number; lon: number }>(
      items: T[]
    ): (T & { distance?: number })[] => {
      if (!sortOrigin) return items;
      return items.map((item) => ({
        ...item,
        distance: haversine(sortOrigin.coords, { lat: item.lat, lon: item.lon }),
      }));
    };

    // Filter resorts
    let filteredResorts = withDistance(resorts);

    if (searchLower) {
      filteredResorts = filteredResorts.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.state.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredResorts = filteredResorts.filter(
        (r) => r.state === selectedState
      );
    }

    if (passNetworks.size > 0) {
      filteredResorts = filteredResorts.filter((r) => {
        // Independent resorts (no passNetwork) are always shown
        if (!r.passNetwork) {
          return true;
        }
        // "both" should match if either epic or ikon is selected
        if (r.passNetwork === "both") {
          return passNetworks.has("epic") || passNetworks.has("ikon");
        }
        return passNetworks.has(r.passNetwork);
      });
    }

    // Only filter by max distance if user location is set (not map center)
    if (userLocation && maxDistance < 200) {
      filteredResorts = filteredResorts.filter(
        (r) => r.distance !== undefined && r.distance <= maxDistance
      );
    }

    // Sort by distance if we have a sort origin
    if (sortOrigin) {
      filteredResorts.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    // Filter clinics
    let filteredClinics = withDistance(clinics);

    if (searchLower) {
      filteredClinics = filteredClinics.filter(
        (c) =>
          c.facility.toLowerCase().includes(searchLower) ||
          c.city.toLowerCase().includes(searchLower) ||
          c.provider.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredClinics = filteredClinics.filter(
        (c) => c.state === selectedState
      );
    }

    if (careTypes.size > 0 && !careTypes.has("dialysis")) {
      filteredClinics = [];
    }

    if (userLocation && maxDistance < 200) {
      filteredClinics = filteredClinics.filter(
        (c) => c.distance !== undefined && c.distance <= maxDistance
      );
    }

    if (sortOrigin) {
      filteredClinics.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    // Filter hospitals
    let filteredHospitals = withDistance(hospitals);

    if (searchLower) {
      filteredHospitals = filteredHospitals.filter(
        (h) =>
          h.name.toLowerCase().includes(searchLower) ||
          h.city.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredHospitals = filteredHospitals.filter(
        (h) => h.state === selectedState
      );
    }

    if (careTypes.size > 0 && !careTypes.has("hospital")) {
      filteredHospitals = [];
    }

    if (userLocation && maxDistance < 200) {
      filteredHospitals = filteredHospitals.filter(
        (h) => h.distance !== undefined && h.distance <= maxDistance
      );
    }

    if (sortOrigin) {
      filteredHospitals.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    // Filter urgent care facilities
    // Note: urgent_care has its own view mode, so no careTypes filter needed
    let filteredUrgentCare = withDistance(urgentCare);

    if (searchLower) {
      filteredUrgentCare = filteredUrgentCare.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.city.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredUrgentCare = filteredUrgentCare.filter(
        (f) => f.state === selectedState
      );
    }

    if (userLocation && maxDistance < 200) {
      filteredUrgentCare = filteredUrgentCare.filter(
        (f) => f.distance !== undefined && f.distance <= maxDistance
      );
    }

    if (sortOrigin) {
      filteredUrgentCare.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return {
      resorts: filteredResorts,
      clinics: filteredClinics,
      hospitals: filteredHospitals,
      urgentCare: filteredUrgentCare,
      sortOrigin,
    };
  }, [
    resorts,
    clinics,
    hospitals,
    urgentCare,
    searchQuery,
    selectedState,
    maxDistance,
    passNetworks,
    careTypes,
    userLocation,
    mapCenter,
  ]);
}

export default useFilteredData;
