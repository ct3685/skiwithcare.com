import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Resort, Clinic, Hospital, UserLocation } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { formatDistance } from "@/utils/formatters";
import { haversine } from "@/utils/haversine";
import { useRef } from "react";

// ============ Custom Icon Creation ============

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

// Resort marker icon
const resortIcon = createDivIcon(
  `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-bg-card border-2 border-accent-primary shadow-lg text-lg">⛷️</div>`
);

const resortSelectedIcon = createDivIcon(
  `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary shadow-glow-pink text-xl">⛷️</div>`,
  [40, 40]
);

// Clinic marker icon
const clinicIcon = createDivIcon(
  `<div class="w-5 h-5 rounded-full bg-gradient-to-br from-accent-clinic to-blue-400 border-2 border-white shadow-lg"></div>`,
  [20, 20]
);

const clinicSelectedIcon = createDivIcon(
  `<div class="w-7 h-7 rounded-full bg-gradient-to-br from-accent-clinic to-blue-400 border-2 border-white shadow-glow-cyan"></div>`,
  [28, 28]
);

// Hospital marker icon
const hospitalIcon = createDivIcon(
  `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-accent-danger border-2 border-white shadow-lg text-xs text-white font-bold">+</div>`,
  [24, 24]
);

const hospitalSelectedIcon = createDivIcon(
  `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-accent-danger border-2 border-white shadow-lg text-sm text-white font-bold">+</div>`,
  [32, 32]
);

// User location marker icon
const userLocationIcon = createDivIcon(
  `<div class="user-location-marker relative">
    <div class="absolute w-10 h-10 bg-accent-clinic/30 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring"></div>
    <div class="relative w-4 h-4 bg-gradient-to-br from-accent-clinic to-blue-400 border-2 border-white rounded-full shadow-lg"></div>
  </div>`,
  [16, 16]
);

// ============ Marker Components ============

interface ResortMarkerProps {
  resort: Resort;
  isSelected?: boolean;
  userLocation?: UserLocation | null;
  onClick?: () => void;
}

export function ResortMarker({
  resort,
  isSelected = false,
  userLocation,
  onClick,
}: ResortMarkerProps) {
  const { distanceUnit } = useSettingsStore();
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();

  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: resort.lat, lon: resort.lon }
        ),
        distanceUnit
      )
    : null;

  const handleViewDetails = () => {
    // Close popup
    map.closePopup();
    
    // Call onClick to expand card in sidebar
    onClick?.();
    
    // Scroll to card in sidebar
    setTimeout(() => {
      const card = document.querySelector(`[data-resort-id="${resort.id}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <Marker
      ref={markerRef}
      position={[resort.lat, resort.lon]}
      icon={isSelected ? resortSelectedIcon : resortIcon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <div className="font-bold text-base mb-1">🏔️ {resort.name}</div>
          <div className="text-sm text-gray-600 mb-2">{resort.state}</div>
          {userDist && (
            <div className="text-sm text-blue-600 mb-2">
              📍 {userDist} from you
            </div>
          )}
          <button
            onClick={handleViewDetails}
            className="w-full px-3 py-1.5 bg-pink-500 text-white text-sm font-medium rounded hover:bg-pink-600 transition-colors"
          >
            View Details →
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

interface ClinicMarkerProps {
  clinic: Clinic;
  isSelected?: boolean;
  userLocation?: UserLocation | null;
  onClick?: () => void;
}

export function ClinicMarker({
  clinic,
  isSelected = false,
  userLocation,
  onClick,
}: ClinicMarkerProps) {
  const { distanceUnit } = useSettingsStore();
  const map = useMap();

  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: clinic.lat, lon: clinic.lon }
        ),
        distanceUnit
      )
    : null;

  const handleViewDetails = () => {
    map.closePopup();
    onClick?.();
    setTimeout(() => {
      const card = document.querySelector(`[data-clinic-id="${clinic.ccn}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <Marker
      position={[clinic.lat, clinic.lon]}
      icon={isSelected ? clinicSelectedIcon : clinicIcon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <div className="font-bold text-base mb-1">🏥 {clinic.facility}</div>
          <div className="text-sm text-gray-600 mb-1">
            {clinic.address}
            <br />
            {clinic.city}, {clinic.state} {clinic.zip}
          </div>
          {userDist && (
            <div className="text-sm text-blue-600 mb-2">
              📍 {userDist} from you
            </div>
          )}
          <button
            onClick={handleViewDetails}
            className="w-full px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors"
          >
            View Details →
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

interface HospitalMarkerProps {
  hospital: Hospital;
  isSelected?: boolean;
  userLocation?: UserLocation | null;
  onClick?: () => void;
}

export function HospitalMarker({
  hospital,
  isSelected = false,
  userLocation,
  onClick,
}: HospitalMarkerProps) {
  const { distanceUnit } = useSettingsStore();
  const map = useMap();

  const userDist = userLocation
    ? formatDistance(
        haversine(
          { lat: userLocation.lat, lon: userLocation.lon },
          { lat: hospital.lat, lon: hospital.lon }
        ),
        distanceUnit
      )
    : null;

  const handleViewDetails = () => {
    map.closePopup();
    onClick?.();
    setTimeout(() => {
      const card = document.querySelector(`[data-hospital-id="${hospital.id}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <Marker
      position={[hospital.lat, hospital.lon]}
      icon={isSelected ? hospitalSelectedIcon : hospitalIcon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <div className="font-bold text-base mb-1">🚑 {hospital.name}</div>
          <div className="text-sm text-gray-600 mb-1">
            {hospital.address}
            <br />
            {hospital.city}, {hospital.state} {hospital.zip}
          </div>
          {userDist && (
            <div className="text-sm text-blue-600 mb-2">
              📍 {userDist} from you
            </div>
          )}
          {hospital.hasEmergency && (
            <div className="text-sm text-red-600 font-medium mb-1">
              ✓ Emergency Room
            </div>
          )}
          {hospital.traumaLevel && (
            <div className="text-sm text-orange-600 mb-1">
              Level {hospital.traumaLevel} Trauma Center
            </div>
          )}
          <button
            onClick={handleViewDetails}
            className="w-full px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
          >
            View Details →
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

interface UserLocationMarkerProps {
  location: UserLocation;
}

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <Marker
      position={[location.lat, location.lon]}
      icon={userLocationIcon}
      zIndexOffset={1000}
    >
      <Popup>
        <div className="font-medium">📍 {location.label}</div>
      </Popup>
    </Marker>
  );
}
