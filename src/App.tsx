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
} from "@/components/map";
import { ResortCard, ClinicCard, HospitalCard } from "@/components/cards";
import { Spinner } from "@/components/ui";
import { useData, useFilteredData } from "@/hooks";
import { haversine } from "@/utils/haversine";
import type {
  Resort,
  Clinic,
  Hospital,
  ClinicWithDistance,
  ResortWithDistance,
} from "@/types";

function App() {
  const { colorTheme, darkMode } = useSettingsStore();
  const { mode, selectedId, expandedId, highlightedConnectionIndex, select, toggleExpand } = useSelectionStore();
  const { userLocation } = useLocationStore();
  const mapRef = useRef<LeafletMap | null>(null);

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

  // Get nearest clinics for a resort
  // Returns at least minCount items, prioritizing those within maxMiles
  const getNearestClinics = useCallback(
    (resort: Resort, limit = 5, maxMiles = 100, minCount = 3): ClinicWithDistance[] => {
      const withDistance = clinics
        .map((c) => ({
          ...c,
          distance: haversine(
            { lat: resort.lat, lon: resort.lon },
            { lat: c.lat, lon: c.lon }
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Get items within max distance
      const withinRange = withDistance.filter((c) => c.distance <= maxMiles);
      
      // Ensure at least minCount items (even if beyond maxMiles)
      if (withinRange.length >= minCount) {
        return withinRange.slice(0, limit);
      }
      
      // Need to include some beyond range to meet minimum
      return withDistance.slice(0, Math.max(minCount, Math.min(limit, withinRange.length)));
    },
    [clinics]
  );

  // Get nearest resorts for a clinic
  // Returns at least minCount items, prioritizing those within maxMiles
  const getNearestResorts = useCallback(
    (clinic: Clinic, limit = 5, maxMiles = 100, minCount = 3): ResortWithDistance[] => {
      const withDistance = resorts
        .map((r) => ({
          ...r,
          distance: haversine(
            { lat: clinic.lat, lon: clinic.lon },
            { lat: r.lat, lon: r.lon }
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Get items within max distance
      const withinRange = withDistance.filter((r) => r.distance <= maxMiles);
      
      // Ensure at least minCount items (even if beyond maxMiles)
      if (withinRange.length >= minCount) {
        return withinRange.slice(0, limit);
      }
      
      // Need to include some beyond range to meet minimum
      return withDistance.slice(0, Math.max(minCount, Math.min(limit, withinRange.length)));
    },
    [resorts]
  );

  // Get nearest resorts for a hospital
  // Returns at least minCount items, prioritizing those within maxMiles
  const getNearestResortsFromHospital = useCallback(
    (hospital: Hospital, limit = 5, maxMiles = 100, minCount = 3): ResortWithDistance[] => {
      const withDistance = resorts
        .map((r) => ({
          ...r,
          distance: haversine(
            { lat: hospital.lat, lon: hospital.lon },
            { lat: r.lat, lon: r.lon }
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Get items within max distance
      const withinRange = withDistance.filter((r) => r.distance <= maxMiles);
      
      // Ensure at least minCount items (even if beyond maxMiles)
      if (withinRange.length >= minCount) {
        return withinRange.slice(0, limit);
      }
      
      // Need to include some beyond range to meet minimum
      return withDistance.slice(0, Math.max(minCount, Math.min(limit, withinRange.length)));
    },
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
      const nearestClinics = getNearestClinics(resort);
      return {
        type: "resort" as const,
        item: resort,
        relatedItems: nearestClinics,
      };
    }

    if (mode === "clinics") {
      const clinic = filtered.clinics.find((c) => c.ccn === expandedId);
      if (!clinic) return null;
      const nearestResorts = getNearestResorts(clinic);
      return {
        type: "clinic" as const,
        item: clinic,
        relatedItems: nearestResorts,
      };
    }

    if (mode === "hospitals") {
      const hospital = filtered.hospitals.find((h) => h.id === expandedId);
      if (!hospital) return null;
      const nearestResorts = getNearestResortsFromHospital(hospital);
      return {
        type: "hospital" as const,
        item: hospital,
        relatedItems: nearestResorts,
      };
    }

    return null;
  }, [expandedId, mode, filtered, getNearestClinics, getNearestResorts, getNearestResortsFromHospital]);

  // Fit map bounds to show expanded item and all related items
  useEffect(() => {
    if (!expandedData || !mapRef.current) return;

    const { item, relatedItems } = expandedData;
    
    // If no related items, just fly to the item
    if (relatedItems.length === 0) {
      mapRef.current.flyTo([item.lat, item.lon], 10, { duration: 0.5 });
      return;
    }

    // Create bounds that include all points
    const bounds = L.latLngBounds([]);
    bounds.extend([item.lat, item.lon]);
    relatedItems.forEach((related) => {
      bounds.extend([related.lat, related.lon]);
    });

    // Fit to bounds with padding
    mapRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 10,
      duration: 0.6,
    });
  }, [expandedData]);

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
            nearestClinics={getNearestClinics(resort)}
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
            nearestResorts={getNearestResorts(clinic)}
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
            nearestResorts={getNearestResortsFromHospital(hospital)}
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
          {expandedData && expandedData.relatedItems.length > 0 && (
            <ConnectionLegend
              itemType={expandedData.type === "resort" ? "clinics" : "resorts"}
              count={expandedData.relatedItems.length}
            />
          )}

          <MapView onMapReady={handleMapReady}>
            {/* User Location */}
            {userLocation && <UserLocationMarker location={userLocation} />}

            {/* Connection Lines (render first so they appear behind markers) */}
            {expandedData && expandedData.relatedItems.length > 0 && (
              <ConnectionLines
                origin={{ lat: expandedData.item.lat, lon: expandedData.item.lon }}
                destinations={expandedData.relatedItems.map((item, index) => ({
                  lat: item.lat,
                  lon: item.lon,
                  rank: index,
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
            {mode === "resorts" && expandedData?.type === "resort" &&
              expandedData.relatedItems.map((clinic, index) => (
                <SecondaryClinicMarker
                  key={`secondary-clinic-${clinic.ccn}`}
                  clinic={clinic}
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
            {mode === "clinics" && expandedData?.type === "clinic" &&
              expandedData.relatedItems.map((resort, index) => (
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
            {mode === "hospitals" && expandedData?.type === "hospital" &&
              expandedData.relatedItems.map((resort, index) => (
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
