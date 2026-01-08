import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { Resort, Clinic, Hospital, Facility, UserLocation } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { formatDistance } from "@/utils/formatters";
import { haversine } from "@/utils/haversine";

// ============ Icon Creation ============

function createDivIcon(
  html: string,
  size: [number, number] = [32, 32]
): L.DivIcon {
  return L.divIcon({
    html,
    className: "",
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
}

// Resort icons
const resortIcon = createDivIcon(
  `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-bg-card border-2 border-accent-primary shadow-lg text-lg">⛷️</div>`
);
const resortSelectedIcon = createDivIcon(
  `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary shadow-glow-pink text-xl">⛷️</div>`,
  [40, 40]
);

// Clinic icons
const clinicIcon = createDivIcon(
  `<div class="w-5 h-5 rounded-full bg-gradient-to-br from-accent-clinic to-blue-400 border-2 border-white shadow-lg"></div>`,
  [20, 20]
);
const clinicSelectedIcon = createDivIcon(
  `<div class="w-7 h-7 rounded-full bg-gradient-to-br from-accent-clinic to-blue-400 border-2 border-white shadow-glow-cyan"></div>`,
  [28, 28]
);

// Hospital icons
const hospitalIcon = createDivIcon(
  `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-accent-danger border-2 border-white shadow-lg text-xs text-white font-bold">+</div>`,
  [24, 24]
);
const hospitalSelectedIcon = createDivIcon(
  `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-accent-danger border-2 border-white shadow-lg text-sm text-white font-bold">+</div>`,
  [32, 32]
);

// Urgent Care icons
const urgentCareIcon = createDivIcon(
  `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 border-2 border-white shadow-lg text-xs">🩹</div>`,
  [24, 24]
);
const urgentCareSelectedIcon = createDivIcon(
  `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 border-2 border-white shadow-glow-orange text-sm">🩹</div>`,
  [32, 32]
);

// ============ Cluster Icon Creation ============

type MarkerType = "resort" | "clinic" | "hospital" | "urgentCare";

function createClusterIcon(type: MarkerType) {
  return (cluster: L.MarkerCluster): L.DivIcon => {
    const count = cluster.getChildCount();
    let sizeClass = "w-10 h-10 text-sm";
    let size: [number, number] = [40, 40];

    if (count >= 100) {
      sizeClass = "w-14 h-14 text-base";
      size = [56, 56];
    } else if (count >= 10) {
      sizeClass = "w-12 h-12 text-sm";
      size = [48, 48];
    }

    const colorMap: Record<MarkerType, string> = {
      resort: "bg-accent-primary border-accent-primary/50",
      clinic: "bg-accent-clinic border-accent-clinic/50",
      hospital: "bg-accent-danger border-accent-danger/50",
      urgentCare: "bg-orange-500 border-orange-500/50",
    };

    const iconMap: Record<MarkerType, string> = {
      resort: "⛷️",
      clinic: "🏥",
      hospital: "🚑",
      urgentCare: "🩹",
    };

    return L.divIcon({
      html: `<div class="marker-cluster flex items-center justify-center ${sizeClass} rounded-full ${colorMap[type]} border-4 shadow-lg text-white font-bold">
        <span class="mr-0.5">${iconMap[type]}</span>${count}
      </div>`,
      className: "",
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2],
    });
  };
}

// ============ Popup Content Creation ============

function createResortPopup(
  resort: Resort,
  userLocation: UserLocation | null,
  distanceUnit: "mi" | "km"
): string {
  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: resort.lat, lon: resort.lon }
        ),
        distanceUnit
      )
    : null;

  return `
    <div class="min-w-[200px]">
      <div class="font-bold text-base mb-1">🏔️ ${resort.name}</div>
      <div class="text-sm text-gray-600 mb-2">${resort.state}</div>
      ${userDist ? `<div class="text-sm text-blue-600 mb-2">📍 ${userDist} from you</div>` : ""}
      <button class="view-details-btn w-full px-3 py-1.5 bg-pink-500 text-white text-sm font-medium rounded hover:bg-pink-600 transition-colors" data-id="${resort.id}" data-type="resort">
        View Details →
      </button>
    </div>
  `;
}

function createClinicPopup(
  clinic: Clinic,
  userLocation: UserLocation | null,
  distanceUnit: "mi" | "km"
): string {
  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: clinic.lat, lon: clinic.lon }
        ),
        distanceUnit
      )
    : null;

  return `
    <div class="min-w-[200px]">
      <div class="font-bold text-base mb-1">🏥 ${clinic.facility}</div>
      <div class="text-sm text-gray-600 mb-1">
        ${clinic.address}<br/>
        ${clinic.city}, ${clinic.state} ${clinic.zip}
      </div>
      ${userDist ? `<div class="text-sm text-blue-600 mb-2">📍 ${userDist} from you</div>` : ""}
      <button class="view-details-btn w-full px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors" data-id="${clinic.ccn}" data-type="clinic">
        View Details →
      </button>
    </div>
  `;
}

function createHospitalPopup(
  hospital: Hospital,
  userLocation: UserLocation | null,
  distanceUnit: "mi" | "km"
): string {
  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: hospital.lat, lon: hospital.lon }
        ),
        distanceUnit
      )
    : null;

  return `
    <div class="min-w-[200px]">
      <div class="font-bold text-base mb-1">🚑 ${hospital.name}</div>
      <div class="text-sm text-gray-600 mb-1">
        ${hospital.address}<br/>
        ${hospital.city}, ${hospital.state} ${hospital.zip}
      </div>
      ${userDist ? `<div class="text-sm text-blue-600 mb-2">📍 ${userDist} from you</div>` : ""}
      ${hospital.hasEmergency ? '<div class="text-sm text-red-600 font-medium mb-1">✓ Emergency Room</div>' : ""}
      ${hospital.traumaLevel ? `<div class="text-sm text-orange-600 mb-1">Level ${hospital.traumaLevel} Trauma Center</div>` : ""}
      <button class="view-details-btn w-full px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors" data-id="${hospital.id}" data-type="hospital">
        View Details →
      </button>
    </div>
  `;
}

function createUrgentCarePopup(
  urgentCare: Facility,
  userLocation: UserLocation | null,
  distanceUnit: "mi" | "km"
): string {
  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: urgentCare.lat, lon: urgentCare.lon }
        ),
        distanceUnit
      )
    : null;

  return `
    <div class="min-w-[200px]">
      <div class="font-bold text-base mb-1">🩹 ${urgentCare.name}</div>
      <div class="text-sm text-gray-600 mb-1">
        ${urgentCare.address ? `${urgentCare.address}<br/>` : ""}
        ${urgentCare.city}, ${urgentCare.state} ${urgentCare.zip}
      </div>
      ${userDist ? `<div class="text-sm text-blue-600 mb-2">📍 ${userDist} from you</div>` : ""}
      ${urgentCare.nearestResort ? `<div class="text-sm text-green-600 mb-2">⛷️ Near ${urgentCare.nearestResort}</div>` : ""}
      <button class="view-details-btn w-full px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 transition-colors" data-id="${urgentCare.id}" data-type="urgentCare">
        View Details →
      </button>
    </div>
  `;
}

// ============ Component Props ============

interface ResortClusterGroupProps {
  resorts: Resort[];
  selectedId: string | null;
  userLocation: UserLocation | null;
  onSelect: (id: string, lat: number, lon: number) => void;
}

interface ClinicClusterGroupProps {
  clinics: Clinic[];
  selectedId: string | null;
  userLocation: UserLocation | null;
  onSelect: (id: string, lat: number, lon: number) => void;
}

interface HospitalClusterGroupProps {
  hospitals: Hospital[];
  selectedId: string | null;
  userLocation: UserLocation | null;
  onSelect: (id: string, lat: number, lon: number) => void;
}

interface UrgentCareClusterGroupProps {
  urgentCare: Facility[];
  selectedId: string | null;
  userLocation: UserLocation | null;
  onSelect: (id: string, lat: number, lon: number) => void;
}

// ============ Cluster Components ============

export function ResortClusterGroup({
  resorts,
  selectedId,
  userLocation,
  onSelect,
}: ResortClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { distanceUnit } = useSettingsStore();

  const handleViewDetails = useCallback(
    (id: string, type: string) => {
      const resort = resorts.find((r) => r.id === id);
      if (resort && type === "resort") {
        map.closePopup();
        onSelect(id, resort.lat, resort.lon);
        setTimeout(() => {
          const card = document.querySelector(`[data-resort-id="${id}"]`);
          card?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    },
    [resorts, map, onSelect]
  );

  useEffect(() => {
    // Create cluster group
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 12,
      iconCreateFunction: createClusterIcon("resort"),
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    // Capture ref value for cleanup
    const markers = markersRef.current;

    // Handle popup button clicks
    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("view-details-btn")) {
        const id = target.dataset.id;
        const type = target.dataset.type;
        if (id && type) {
          handleViewDetails(id, type);
        }
      }
    };
    document.addEventListener("click", handlePopupClick);

    return () => {
      document.removeEventListener("click", handlePopupClick);
      map.removeLayer(cluster);
      clusterRef.current = null;
      markers.clear();
    };
  }, [map, handleViewDetails]);

  // Update markers when data changes
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const existingMarkers = markersRef.current;
    const newIds = new Set(resorts.map((r) => r.id));

    // Remove markers that no longer exist
    existingMarkers.forEach((marker, id) => {
      if (!newIds.has(id)) {
        cluster.removeLayer(marker);
        existingMarkers.delete(id);
      }
    });

    // Add or update markers
    resorts.forEach((resort) => {
      const existing = existingMarkers.get(resort.id);
      const isSelected = selectedId === resort.id;
      const icon = isSelected ? resortSelectedIcon : resortIcon;

      if (existing) {
        // Update icon if selection changed
        existing.setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker([resort.lat, resort.lon], { icon });
        marker.bindPopup(createResortPopup(resort, userLocation, distanceUnit));
        marker.on("click", () => {
          onSelect(resort.id, resort.lat, resort.lon);
        });
        cluster.addLayer(marker);
        existingMarkers.set(resort.id, marker);
      }
    });
  }, [resorts, selectedId, userLocation, distanceUnit, onSelect]);

  return null;
}

export function ClinicClusterGroup({
  clinics,
  selectedId,
  userLocation,
  onSelect,
}: ClinicClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { distanceUnit } = useSettingsStore();

  const handleViewDetails = useCallback(
    (id: string, type: string) => {
      const clinic = clinics.find((c) => c.ccn === id);
      if (clinic && type === "clinic") {
        map.closePopup();
        onSelect(id, clinic.lat, clinic.lon);
        setTimeout(() => {
          const card = document.querySelector(`[data-clinic-id="${id}"]`);
          card?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    },
    [clinics, map, onSelect]
  );

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 13,
      iconCreateFunction: createClusterIcon("clinic"),
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    // Capture ref value for cleanup
    const markers = markersRef.current;

    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("view-details-btn")) {
        const id = target.dataset.id;
        const type = target.dataset.type;
        if (id && type) {
          handleViewDetails(id, type);
        }
      }
    };
    document.addEventListener("click", handlePopupClick);

    return () => {
      document.removeEventListener("click", handlePopupClick);
      map.removeLayer(cluster);
      clusterRef.current = null;
      markers.clear();
    };
  }, [map, handleViewDetails]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const existingMarkers = markersRef.current;
    const newIds = new Set(clinics.map((c) => c.ccn));

    existingMarkers.forEach((marker, id) => {
      if (!newIds.has(id)) {
        cluster.removeLayer(marker);
        existingMarkers.delete(id);
      }
    });

    clinics.forEach((clinic) => {
      const existing = existingMarkers.get(clinic.ccn);
      const isSelected = selectedId === clinic.ccn;
      const icon = isSelected ? clinicSelectedIcon : clinicIcon;

      if (existing) {
        existing.setIcon(icon);
      } else {
        const marker = L.marker([clinic.lat, clinic.lon], { icon });
        marker.bindPopup(createClinicPopup(clinic, userLocation, distanceUnit));
        marker.on("click", () => {
          onSelect(clinic.ccn, clinic.lat, clinic.lon);
        });
        cluster.addLayer(marker);
        existingMarkers.set(clinic.ccn, marker);
      }
    });
  }, [clinics, selectedId, userLocation, distanceUnit, onSelect]);

  return null;
}

export function HospitalClusterGroup({
  hospitals,
  selectedId,
  userLocation,
  onSelect,
}: HospitalClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { distanceUnit } = useSettingsStore();

  const handleViewDetails = useCallback(
    (id: string, type: string) => {
      const hospital = hospitals.find((h) => h.id === id);
      if (hospital && type === "hospital") {
        map.closePopup();
        onSelect(id, hospital.lat, hospital.lon);
        setTimeout(() => {
          const card = document.querySelector(`[data-hospital-id="${id}"]`);
          card?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    },
    [hospitals, map, onSelect]
  );

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 13,
      iconCreateFunction: createClusterIcon("hospital"),
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    // Capture ref value for cleanup
    const markers = markersRef.current;

    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("view-details-btn")) {
        const id = target.dataset.id;
        const type = target.dataset.type;
        if (id && type) {
          handleViewDetails(id, type);
        }
      }
    };
    document.addEventListener("click", handlePopupClick);

    return () => {
      document.removeEventListener("click", handlePopupClick);
      map.removeLayer(cluster);
      clusterRef.current = null;
      markers.clear();
    };
  }, [map, handleViewDetails]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const existingMarkers = markersRef.current;
    const newIds = new Set(hospitals.map((h) => h.id));

    existingMarkers.forEach((marker, id) => {
      if (!newIds.has(id)) {
        cluster.removeLayer(marker);
        existingMarkers.delete(id);
      }
    });

    hospitals.forEach((hospital) => {
      const existing = existingMarkers.get(hospital.id);
      const isSelected = selectedId === hospital.id;
      const icon = isSelected ? hospitalSelectedIcon : hospitalIcon;

      if (existing) {
        existing.setIcon(icon);
      } else {
        const marker = L.marker([hospital.lat, hospital.lon], { icon });
        marker.bindPopup(
          createHospitalPopup(hospital, userLocation, distanceUnit)
        );
        marker.on("click", () => {
          onSelect(hospital.id, hospital.lat, hospital.lon);
        });
        cluster.addLayer(marker);
        existingMarkers.set(hospital.id, marker);
      }
    });
  }, [hospitals, selectedId, userLocation, distanceUnit, onSelect]);

  return null;
}

export function UrgentCareClusterGroup({
  urgentCare,
  selectedId,
  userLocation,
  onSelect,
}: UrgentCareClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { distanceUnit } = useSettingsStore();

  const handleViewDetails = useCallback(
    (id: string, type: string) => {
      const uc = urgentCare.find((u) => u.id === id);
      if (uc && type === "urgentCare") {
        map.closePopup();
        onSelect(id, uc.lat, uc.lon);
        setTimeout(() => {
          const card = document.querySelector(`[data-urgentcare-id="${id}"]`);
          card?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    },
    [urgentCare, map, onSelect]
  );

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 13,
      iconCreateFunction: createClusterIcon("urgentCare"),
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    // Capture ref value for cleanup
    const markers = markersRef.current;

    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("view-details-btn")) {
        const id = target.dataset.id;
        const type = target.dataset.type;
        if (id && type) {
          handleViewDetails(id, type);
        }
      }
    };
    document.addEventListener("click", handlePopupClick);

    return () => {
      document.removeEventListener("click", handlePopupClick);
      map.removeLayer(cluster);
      clusterRef.current = null;
      markers.clear();
    };
  }, [map, handleViewDetails]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const existingMarkers = markersRef.current;
    const newIds = new Set(urgentCare.map((u) => u.id));

    existingMarkers.forEach((marker, id) => {
      if (!newIds.has(id)) {
        cluster.removeLayer(marker);
        existingMarkers.delete(id);
      }
    });

    urgentCare.forEach((uc) => {
      const existing = existingMarkers.get(uc.id);
      const isSelected = selectedId === uc.id;
      const icon = isSelected ? urgentCareSelectedIcon : urgentCareIcon;

      if (existing) {
        existing.setIcon(icon);
      } else {
        const marker = L.marker([uc.lat, uc.lon], { icon });
        marker.bindPopup(createUrgentCarePopup(uc, userLocation, distanceUnit));
        marker.on("click", () => {
          onSelect(uc.id, uc.lat, uc.lon);
        });
        cluster.addLayer(marker);
        existingMarkers.set(uc.id, marker);
      }
    });
  }, [urgentCare, selectedId, userLocation, distanceUnit, onSelect]);

  return null;
}
