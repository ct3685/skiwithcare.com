import { useMemo } from "react";
import type { Resort, Clinic, Hospital, UserLocation } from "@/types";
import { useFilterStore } from "@/stores/filterStore";
import { useLocationStore } from "@/stores/locationStore";
import { haversine } from "@/utils/haversine";

interface FilteredData {
  resorts: (Resort & { distance?: number })[];
  clinics: (Clinic & { distance?: number })[];
  hospitals: (Hospital & { distance?: number })[];
}

/**
 * Hook to filter and sort data based on current filters and user location
 */
export function useFilteredData(
  resorts: Resort[],
  clinics: Clinic[],
  hospitals: Hospital[]
): FilteredData {
  const { searchQuery, selectedState, maxDistance, passNetworks, careTypes } =
    useFilterStore();
  const { userLocation } = useLocationStore();

  return useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();

    // Helper to calculate distance
    const withDistance = <T extends { lat: number; lon: number }>(
      items: T[],
      location: UserLocation | null
    ): (T & { distance?: number })[] => {
      if (!location) return items;
      return items.map((item) => ({
        ...item,
        distance: haversine(
          { lat: location.lat, lon: location.lon },
          { lat: item.lat, lon: item.lon }
        ),
      }));
    };

    // Filter resorts
    let filteredResorts = withDistance(resorts, userLocation);

    if (searchLower) {
      filteredResorts = filteredResorts.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.state.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredResorts = filteredResorts.filter((r) => r.state === selectedState);
    }

    if (passNetworks.size > 0) {
      filteredResorts = filteredResorts.filter((r) =>
        passNetworks.has(r.passNetwork)
      );
    }

    if (userLocation && maxDistance < 200) {
      filteredResorts = filteredResorts.filter(
        (r) => r.distance !== undefined && r.distance <= maxDistance
      );
    }

    // Sort by distance if location available
    if (userLocation) {
      filteredResorts.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    // Filter clinics
    let filteredClinics = withDistance(clinics, userLocation);

    if (searchLower) {
      filteredClinics = filteredClinics.filter(
        (c) =>
          c.facility.toLowerCase().includes(searchLower) ||
          c.city.toLowerCase().includes(searchLower) ||
          c.provider.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredClinics = filteredClinics.filter((c) => c.state === selectedState);
    }

    if (careTypes.size > 0 && !careTypes.has("dialysis")) {
      filteredClinics = [];
    }

    if (userLocation && maxDistance < 200) {
      filteredClinics = filteredClinics.filter(
        (c) => c.distance !== undefined && c.distance <= maxDistance
      );
    }

    if (userLocation) {
      filteredClinics.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    // Filter hospitals
    let filteredHospitals = withDistance(hospitals, userLocation);

    if (searchLower) {
      filteredHospitals = filteredHospitals.filter(
        (h) =>
          h.name.toLowerCase().includes(searchLower) ||
          h.city.toLowerCase().includes(searchLower)
      );
    }

    if (selectedState) {
      filteredHospitals = filteredHospitals.filter((h) => h.state === selectedState);
    }

    if (careTypes.size > 0 && !careTypes.has("hospital")) {
      filteredHospitals = [];
    }

    if (userLocation && maxDistance < 200) {
      filteredHospitals = filteredHospitals.filter(
        (h) => h.distance !== undefined && h.distance <= maxDistance
      );
    }

    if (userLocation) {
      filteredHospitals.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    return {
      resorts: filteredResorts,
      clinics: filteredClinics,
      hospitals: filteredHospitals,
    };
  }, [
    resorts,
    clinics,
    hospitals,
    searchQuery,
    selectedState,
    maxDistance,
    passNetworks,
    careTypes,
    userLocation,
  ]);
}

export default useFilteredData;
