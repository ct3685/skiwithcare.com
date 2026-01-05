import { useEffect, useCallback, useRef, useMemo } from "react";
import L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { useLocationStore } from "@/stores/locationStore";
import { Header, Sidebar, SettingsDrawer } from "@/components/layout";
import {
  MapView,
  ResortMarker,
  ClinicMarker,
  HospitalMarker,
  UserLocationMarker,
  ConnectionLines,
  ConnectionLegend,
  SecondaryClinicMarker,
  SecondaryResortMarker,
  SecondaryHospitalMarker,
} from "@/components/map";
import { ResortCard, ClinicCard, HospitalCard } from "@/components/cards";
import { Spinner } from "@/components/ui";
import { useData, useFilteredData } from "@/hooks";
import {
  getNearestClinics,
  getNearestHospitals,
  getNearestResorts,
  getNearestResortsFromHospital,
} from "@/utils/nearestLocations";
import type { Resort, Clinic, Hospital } from "@/types";

function App() {
  const { colorTheme, darkMode } = useSettingsStore();
  const {
    mode,
    selectedId,
    expandedId,
    highlightedConnectionIndex,
    select,
    toggleExpand,
  } = useSelectionStore();
  const { userLocation } = useLocationStore();
  const mapRef = useRef<LeafletMap | null>(null);
  const prevExpandedIdRef = useRef<string | null>(null);

  // Load data
  const { resorts, clinics, hospitals, isLoading, error } = useData();
  const filtered = useFilteredData(resorts, clinics, hospitals);

  // Extract unique states for filter dropdown
  const states = useMemo(() => {
    const allStates = new Set<string>();
    resorts.forEach((r) => allStates.add(r.state));
    clinics.forEach((c) => allStates.add(c.state));
    hospitals.forEach((h) => allStates.add(h.state));
    return Array.from(allStates).sort();
  }, [resorts, clinics, hospitals]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove(
      "theme-rose",
      "theme-alpine",
      "theme-glacier",
      "light-theme",
      "dark-theme"
    );

    // Apply color theme
    root.classList.add(`theme-${colorTheme}`);

    // Apply dark/light mode
    if (darkMode === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.add(prefersDark ? "dark-theme" : "light-theme");
    } else {
      root.classList.add(`${darkMode}-theme`);
    }
  }, [colorTheme, darkMode]);

  // Handle map ready
  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
  }, []);

  // Fly to selected item
  const flyToItem = useCallback((lat: number, lon: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 10, { duration: 0.5 });
    }
  }, []);

  // Handle item selection on map
  const handleMapSelect = useCallback(
    (id: string, lat: number, lon: number) => {
      select(id);
      toggleExpand(id);
      flyToItem(lat, lon);
    },
    [select, toggleExpand, flyToItem]
  );

  // Wrapper functions for nearest location queries (using extracted utility)
  const getNearbyClinics = useCallback(
    (resort: Resort) => getNearestClinics(resort, clinics),
    [clinics]
  );

  const getNearbyHospitals = useCallback(
    (resort: Resort) => getNearestHospitals(resort, hospitals),
    [hospitals]
  );

  const getNearbyResorts = useCallback(
    (clinic: Clinic) => getNearestResorts(clinic, resorts),
    [resorts]
  );

  const getNearbyResortsFromHospital = useCallback(
    (hospital: Hospital) => getNearestResortsFromHospital(hospital, resorts),
    [resorts]
  );

  // Handle directions click
  const handleDirections = useCallback(
    (
      fromLat: number,
      fromLon: number,
      toLat: number,
      toLon: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _fromName: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _toName: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _distance: number
    ) => {
      const url = `https://www.google.com/maps/dir/${fromLat},${fromLon}/${toLat},${toLon}`;
      window.open(url, "_blank");
    },
    []
  );

  // Compute expanded item and its nearest related items for map visualization
  const expandedData = useMemo(() => {
    if (!expandedId) return null;

    if (mode === "resorts") {
      const resort = filtered.resorts.find((r) => r.id === expandedId);
      if (!resort) return null;
      const nearestClinics = getNearbyClinics(resort);
      const nearestHospitals = getNearbyHospitals(resort);
      return {
        type: "resort" as const,
        item: resort,
        relatedClinics: nearestClinics,
        relatedHospitals: nearestHospitals,
        // Combined for bounds fitting and connection lines
        allRelatedItems: [
          ...nearestClinics.map((c, i) => ({
            ...c,
            itemType: "clinic" as const,
            rank: i,
          })),
          ...nearestHospitals.map((h, i) => ({
            ...h,
            itemType: "hospital" as const,
            rank: i,
          })),
        ],
      };
    }

    if (mode === "clinics") {
      const clinic = filtered.clinics.find((c) => c.ccn === expandedId);
      if (!clinic) return null;
      const nearestResorts = getNearbyResorts(clinic);
      return {
        type: "clinic" as const,
        item: clinic,
        relatedResorts: nearestResorts,
        allRelatedItems: nearestResorts.map((r, i) => ({
          ...r,
          itemType: "resort" as const,
          rank: i,
        })),
      };
    }

    if (mode === "hospitals") {
      const hospital = filtered.hospitals.find((h) => h.id === expandedId);
      if (!hospital) return null;
      const nearestResorts = getNearbyResortsFromHospital(hospital);
      return {
        type: "hospital" as const,
        item: hospital,
        relatedResorts: nearestResorts,
        allRelatedItems: nearestResorts.map((r, i) => ({
          ...r,
          itemType: "resort" as const,
          rank: i,
        })),
      };
    }

    return null;
  }, [
    expandedId,
    mode,
    filtered,
    getNearbyClinics,
    getNearbyHospitals,
    getNearbyResorts,
    getNearbyResortsFromHospital,
  ]);

  // Fit map bounds to show expanded item and all related items
  // Only runs when expandedId actually changes, not on every expandedData reference change
  useEffect(() => {
    // Skip if expandedId hasn't changed (prevents focus hijacking on re-renders)
    if (expandedId === prevExpandedIdRef.current) return;
    prevExpandedIdRef.current = expandedId;

    if (!expandedData || !mapRef.current) return;

    const { item, allRelatedItems } = expandedData;

    // If no related items, just fly to the item
    if (allRelatedItems.length === 0) {
      mapRef.current.flyTo([item.lat, item.lon], 10, { duration: 0.5 });
      return;
    }

    // Create bounds that include all points
    const bounds = L.latLngBounds([]);
    bounds.extend([item.lat, item.lon]);
    allRelatedItems.forEach((related) => {
      bounds.extend([related.lat, related.lon]);
    });

    // Fit to bounds with padding
    mapRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 10,
      duration: 0.6,
    });
  }, [expandedId, expandedData]);

  // Render card list based on mode
  const renderCards = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-text-muted">
          <p className="text-2xl mb-2">❌</p>
          <p>{error}</p>
        </div>
      );
    }

    switch (mode) {
      case "resorts":
        if (filtered.resorts.length === 0) {
          return (
            <div className="text-center py-12 text-text-muted">
              <p className="text-2xl mb-2">🏔️</p>
              <p>No resorts found</p>
            </div>
          );
        }
        return filtered.resorts.map((resort) => (
          <ResortCard
            key={resort.id}
            resort={resort}
            userDistance={resort.distance}
            nearestClinics={getNearbyClinics(resort)}
            nearestHospitals={getNearbyHospitals(resort)}
            onDirectionsClick={handleDirections}
          />
        ));

      case "clinics":
        if (filtered.clinics.length === 0) {
          return (
            <div className="text-center py-12 text-text-muted">
              <p className="text-2xl mb-2">🏥</p>
              <p>No clinics found</p>
            </div>
          );
        }
        return filtered.clinics.map((clinic) => (
          <ClinicCard
            key={clinic.ccn}
            clinic={clinic}
            userDistance={clinic.distance}
            nearestResorts={getNearbyResorts(clinic)}
            onDirectionsClick={handleDirections}
          />
        ));

      case "hospitals":
        if (filtered.hospitals.length === 0) {
          return (
            <div className="text-center py-12 text-text-muted">
              <p className="text-2xl mb-2">🚑</p>
              <p>No hospitals found</p>
            </div>
          );
        }
        return filtered.hospitals.map((hospital) => (
          <HospitalCard
            key={hospital.id}
            hospital={hospital}
            userDistance={hospital.distance}
            nearestResorts={getNearbyResortsFromHospital(hospital)}
            onDirectionsClick={handleDirections}
          />
        ));

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden">
      {/* Settings Drawer */}
      <SettingsDrawer />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex h-[calc(100vh-66px)]">
        {/* Sidebar */}
        <Sidebar
          states={states}
          itemCount={
            mode === "resorts"
              ? filtered.resorts.length
              : mode === "clinics"
              ? filtered.clinics.length
              : filtered.hospitals.length
          }
          sortOrigin={filtered.sortOrigin}
        >
          <div className="space-y-3">{renderCards()}</div>
        </Sidebar>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Connection Legend */}
          {expandedData && expandedData.allRelatedItems.length > 0 && (
            <ConnectionLegend
              itemType={
                expandedData.type === "resort" ? "facilities" : "resorts"
              }
              count={expandedData.allRelatedItems.length}
              clinicCount={
                expandedData.type === "resort"
                  ? expandedData.relatedClinics?.length
                  : undefined
              }
              hospitalCount={
                expandedData.type === "resort"
                  ? expandedData.relatedHospitals?.length
                  : undefined
              }
            />
          )}

          <MapView onMapReady={handleMapReady}>
            {/* User Location */}
            {userLocation && <UserLocationMarker location={userLocation} />}

            {/* Connection Lines (render first so they appear behind markers) */}
            {expandedData && expandedData.allRelatedItems.length > 0 && (
              <ConnectionLines
                origin={{
                  lat: expandedData.item.lat,
                  lon: expandedData.item.lon,
                }}
                destinations={expandedData.allRelatedItems.map((item) => ({
                  lat: item.lat,
                  lon: item.lon,
                  rank: item.rank,
                  itemType: item.itemType,
                }))}
                highlightedIndex={highlightedConnectionIndex}
              />
            )}

            {/* Resort Markers */}
            {mode === "resorts" &&
              filtered.resorts.map((resort) => (
                <ResortMarker
                  key={resort.id}
                  resort={resort}
                  isSelected={selectedId === resort.id}
                  userLocation={userLocation}
                  onClick={() =>
                    handleMapSelect(resort.id, resort.lat, resort.lon)
                  }
                />
              ))}

            {/* Secondary Clinic Markers (when a resort is expanded) */}
            {mode === "resorts" &&
              expandedData?.type === "resort" &&
              expandedData.relatedClinics &&
              expandedData.relatedClinics.map((clinic, index) => (
                <SecondaryClinicMarker
                  key={`secondary-clinic-${clinic.ccn}`}
                  clinic={clinic}
                  rank={index}
                />
              ))}

            {/* Secondary Hospital Markers (when a resort is expanded) */}
            {mode === "resorts" &&
              expandedData?.type === "resort" &&
              expandedData.relatedHospitals &&
              expandedData.relatedHospitals.map((hospital, index) => (
                <SecondaryHospitalMarker
                  key={`secondary-hospital-${hospital.id}`}
                  hospital={hospital}
                  rank={index}
                />
              ))}

            {/* Clinic Markers */}
            {mode === "clinics" &&
              filtered.clinics.map((clinic) => (
                <ClinicMarker
                  key={clinic.ccn}
                  clinic={clinic}
                  isSelected={selectedId === clinic.ccn}
                  userLocation={userLocation}
                  onClick={() =>
                    handleMapSelect(clinic.ccn, clinic.lat, clinic.lon)
                  }
                />
              ))}

            {/* Secondary Resort Markers (when a clinic is expanded) */}
            {mode === "clinics" &&
              expandedData?.type === "clinic" &&
              expandedData.relatedResorts &&
              expandedData.relatedResorts.map((resort, index) => (
                <SecondaryResortMarker
                  key={`secondary-resort-${resort.id}`}
                  resort={resort}
                  rank={index}
                />
              ))}

            {/* Hospital Markers */}
            {mode === "hospitals" &&
              filtered.hospitals.map((hospital) => (
                <HospitalMarker
                  key={hospital.id}
                  hospital={hospital}
                  isSelected={selectedId === hospital.id}
                  onClick={() =>
                    handleMapSelect(hospital.id, hospital.lat, hospital.lon)
                  }
                />
              ))}

            {/* Secondary Resort Markers (when a hospital is expanded) */}
            {mode === "hospitals" &&
              expandedData?.type === "hospital" &&
              expandedData.relatedResorts &&
              expandedData.relatedResorts.map((resort, index) => (
                <SecondaryResortMarker
                  key={`secondary-resort-${resort.id}`}
                  resort={resort}
                  rank={index}
                />
              ))}
          </MapView>
        </div>
      </main>
    </div>
  );
}

export default App;
