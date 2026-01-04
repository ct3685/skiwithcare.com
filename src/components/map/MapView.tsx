import { useEffect, useRef, useCallback } from "react";
import { MapContainer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { useSettingsStore } from "@/stores/settingsStore";
import { useLocationStore } from "@/stores/locationStore";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Default US center
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

// Tile layer URLs
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = "© OpenStreetMap, © CARTO";

// Debounce delay for map center updates (ms)
const MAP_CENTER_DEBOUNCE = 300;

interface MapViewProps {
  children?: React.ReactNode;
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: LeafletMap) => void;
}

/**
 * Component to sync tile layer with theme
 */
function TileLayerSync() {
  const map = useMap();
  const { darkMode } = useSettingsStore();
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    // Determine if we should use dark tiles
    const useDarkTiles =
      darkMode === "dark" ||
      (darkMode === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const tileUrl = useDarkTiles ? DARK_TILES : LIGHT_TILES;

    // Remove existing tile layer if any
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
    };
  }, [darkMode, map]);

  return null;
}

/**
 * Component to handle map ready callback
 */
function MapReadyHandler({
  onMapReady,
}: {
  onMapReady?: (map: LeafletMap) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

/**
 * Component to track map center and update store
 */
function MapCenterTracker() {
  const { setMapCenter } = useLocationStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMapCenter = useCallback(
    (map: LeafletMap) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the update
      debounceRef.current = setTimeout(() => {
        const center = map.getCenter();
        setMapCenter(center.lat, center.lng);
      }, MAP_CENTER_DEBOUNCE);
    },
    [setMapCenter]
  );

  // Listen to map events
  const map = useMapEvents({
    moveend: () => updateMapCenter(map),
    zoomend: () => updateMapCenter(map),
    load: () => updateMapCenter(map),
  });

  // Set initial center on mount
  useEffect(() => {
    const center = map.getCenter();
    setMapCenter(center.lat, center.lng);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [map, setMapCenter]);

  return null;
}

export function MapView({
  children,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapReady,
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayerSync />
      <MapReadyHandler onMapReady={onMapReady} />
      <MapCenterTracker />
      {children}
    </MapContainer>
  );
}

export { DEFAULT_CENTER, DEFAULT_ZOOM };
