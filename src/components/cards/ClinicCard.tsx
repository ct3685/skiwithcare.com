import { useState } from "react";
import type { Clinic, ResortWithDistance } from "@/types";
import { useSelectionStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge, DistanceBadge, ProviderBadge, ReportForm, DirectionsButton, ShareButton } from "@/components/ui";
import { formatDistance } from "@/utils/formatters";
import { trackItemSelect, trackReportOpen, trackReportSubmit } from "@/utils/analytics";

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
  const { expandedId, highlightedConnectionIndex, toggleExpand, setHighlightedConnection } = useSelectionStore();
  const { distanceUnit } = useSettingsStore();
  const [showReportForm, setShowReportForm] = useState(false);

  const isExpanded = expandedId === clinic.ccn;

  const handleClick = () => {
    toggleExpand(clinic.ccn);
    if (!isExpanded) {
      trackItemSelect("clinic", clinic.facility, clinic.state);
    }
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackReportOpen("clinic", clinic.facility);
    setShowReportForm(true);
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

  const handleResortHover = (index: number) => {
    setHighlightedConnection(index);
  };

  const handleResortLeave = () => {
    setHighlightedConnection(-1);
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="font-semibold text-text-primary">🏥 {clinic.facility}</span>
          <span
            className={`text-xs transition-transform duration-200 flex-shrink-0 mt-0.5 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {nearestResorts.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium">
                Nearest Resorts:
              </p>
              <div className="space-y-2">
                {nearestResorts.slice(0, 5).map((resort, i) => (
                  <div
                    key={resort.id}
                    onClick={(e) => handleResortClick(e, resort)}
                    onMouseEnter={() => handleResortHover(i)}
                    onMouseLeave={handleResortLeave}
                    className={`
                      flex items-center justify-between p-2 rounded-lg 
                      transition-all duration-200 cursor-pointer
                      ${highlightedConnectionIndex === i 
                        ? "bg-amber-500/20 border border-amber-500/40" 
                        : "bg-bg-tertiary hover:bg-bg-secondary border border-transparent"
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {i + 1}. {resort.name}
                      </div>
                      <div className="text-xs text-text-muted">{resort.state}</div>
                    </div>
                    <span className={`text-sm font-semibold ml-2 ${
                      highlightedConnectionIndex === i ? "text-amber-400" : "text-accent-primary"
                    }`}>
                      {formatDistance(resort.distance, distanceUnit)} →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <DirectionsButton
              destLat={clinic.lat}
              destLon={clinic.lon}
              destName={clinic.facility}
              facilityType="clinic"
              className="flex-1"
            />
            <ShareButton
              title={clinic.facility}
              text={`${clinic.city}, ${clinic.state} - Dialysis Clinic`}
              lat={clinic.lat}
              lon={clinic.lon}
              facilityType="clinic"
            />
          </div>

          {/* Report Link */}
          <div className="pt-2 border-t border-border/50 text-right">
            <button
              onClick={handleReportClick}
              className="text-xs text-text-muted hover:text-accent-primary transition-colors"
            >
              Report an issue
            </button>
          </div>
        </div>
      )}

      {/* Report Form Modal */}
      <ReportForm
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        itemType="clinic"
        itemName={clinic.facility}
        itemId={clinic.ccn}
        onSubmit={(report) => {
          trackReportSubmit("clinic", clinic.facility, report.category);
        }}
      />
    </div>
  );
}

