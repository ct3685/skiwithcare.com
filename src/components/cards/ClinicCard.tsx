import type { Clinic, ResortWithDistance } from "@/types";
import { useSelectionStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge, DistanceBadge, ProviderBadge } from "@/components/ui/Badge";
import { formatDistance } from "@/utils/formatters";
import { trackItemSelect } from "@/utils/analytics";

interface ClinicCardProps {
  clinic: Clinic;
  userDistance?: number;
  nearestResorts?: ResortWithDistance[];
  onDirectionsClick?: (
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    fromName: string,
    toName: string,
    distance: number
  ) => void;
}

export function ClinicCard({
  clinic,
  userDistance,
  nearestResorts = [],
  onDirectionsClick,
}: ClinicCardProps) {
  const { expandedId, toggleExpand } = useSelectionStore();
  const { distanceUnit } = useSettingsStore();

  const isExpanded = expandedId === clinic.ccn;

  const handleClick = () => {
    toggleExpand(clinic.ccn);
    if (!isExpanded) {
      trackItemSelect("clinic", clinic.facility, clinic.state);
    }
  };

  const handleResortClick = (
    e: React.MouseEvent,
    resort: ResortWithDistance
  ) => {
    e.stopPropagation();
    if (onDirectionsClick) {
      onDirectionsClick(
        clinic.lat,
        clinic.lon,
        resort.lat,
        resort.lon,
        clinic.facility,
        resort.name,
        resort.distance
      );
    }
  };

  return (
    <div
      data-clinic-id={clinic.ccn}
      onClick={handleClick}
      className={`
        p-4 rounded-lg
        bg-bg-card border border-border
        cursor-pointer
        transition-all duration-200
        hover:border-accent-clinic
        ${isExpanded ? "border-accent-clinic ring-1 ring-accent-clinic/20" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text-primary flex items-center gap-2">
          🏥 {clinic.facility}
          <span
            className={`text-xs transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </span>
        <div className="flex items-center gap-2">
          <ProviderBadge provider={clinic.provider} />
          <Badge>{clinic.state}</Badge>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {userDistance !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-clinic/20 border border-accent-clinic/30 text-accent-clinic text-xs font-semibold">
            📍 {formatDistance(userDistance, distanceUnit)} away
          </span>
        )}
        <span className="text-text-muted">
          📍 {clinic.city}, {clinic.state}
        </span>
        {clinic.nearestResortDist !== undefined && (
          <DistanceBadge miles={clinic.nearestResortDist} icon="🏔️" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && nearestResorts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-muted mb-2 font-medium">
            Nearest Resorts:
          </p>
          <div className="space-y-2">
            {nearestResorts.slice(0, 5).map((resort, i) => (
              <div
                key={resort.id}
                onClick={(e) => handleResortClick(e, resort)}
                className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {i + 1}. {resort.name}
                  </div>
                  <div className="text-xs text-text-muted">{resort.state}</div>
                </div>
                <span className="text-sm font-semibold text-accent-primary ml-2">
                  {formatDistance(resort.distance, distanceUnit)} →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

