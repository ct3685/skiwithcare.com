import type { Resort, ClinicWithDistance } from "@/types";
import { useSelectionStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge, DistanceBadge, PassBadge } from "@/components/ui/Badge";
import { formatDistance } from "@/utils/formatters";
import { trackItemSelect } from "@/utils/analytics";

interface ResortCardProps {
  resort: Resort;
  userDistance?: number;
  nearestClinics?: ClinicWithDistance[];
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

export function ResortCard({
  resort,
  userDistance,
  nearestClinics = [],
  onDirectionsClick,
}: ResortCardProps) {
  const { expandedId, toggleExpand } = useSelectionStore();
  const { distanceUnit } = useSettingsStore();

  const isExpanded = expandedId === resort.id;
  const nearestClinic = nearestClinics[0];

  const handleClick = () => {
    toggleExpand(resort.id);
    if (!isExpanded) {
      trackItemSelect("resort", resort.name, resort.state);
    }
  };

  const handleClinicClick = (
    e: React.MouseEvent,
    clinic: ClinicWithDistance
  ) => {
    e.stopPropagation();
    if (onDirectionsClick) {
      onDirectionsClick(
        resort.lat,
        resort.lon,
        clinic.lat,
        clinic.lon,
        resort.name,
        clinic.facility,
        clinic.distance
      );
    }
  };

  return (
    <div
      data-resort-id={resort.id}
      onClick={handleClick}
      className={`
        p-4 rounded-lg
        bg-bg-card border border-border
        cursor-pointer
        transition-all duration-200
        hover:border-accent-primary
        ${isExpanded ? "border-accent-primary ring-1 ring-accent-primary/20" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text-primary flex items-center gap-2">
          🏔️ {resort.name}
          <span
            className={`text-xs transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </span>
        <div className="flex items-center gap-2">
          <PassBadge pass={resort.passNetwork} />
          <Badge>{resort.state}</Badge>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {userDistance !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-clinic/20 border border-accent-clinic/30 text-accent-clinic text-xs font-semibold">
            📍 {formatDistance(userDistance, distanceUnit)} away
          </span>
        )}
        {nearestClinic && (
          <DistanceBadge miles={nearestClinic.distance} icon="🏥" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && nearestClinics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-muted mb-2 font-medium">
            Nearest Clinics:
          </p>
          <div className="space-y-2">
            {nearestClinics.slice(0, 5).map((clinic, i) => (
              <div
                key={clinic.ccn}
                onClick={(e) => handleClinicClick(e, clinic)}
                className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {i + 1}. {clinic.facility}
                  </div>
                  <div className="text-xs text-text-muted">
                    {clinic.city}, {clinic.state}
                  </div>
                </div>
                <span className="text-sm font-semibold text-accent-clinic ml-2">
                  {formatDistance(clinic.distance, distanceUnit)} →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

