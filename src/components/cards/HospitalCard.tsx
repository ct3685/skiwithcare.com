import { useState } from "react";
import type { Hospital, ResortWithDistance } from "@/types";
import { useSelectionStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge, DistanceBadge, ReportForm } from "@/components/ui";
import { formatDistance } from "@/utils/formatters";
import { trackItemSelect, trackReportOpen, trackReportSubmit } from "@/utils/analytics";

interface HospitalCardProps {
  hospital: Hospital;
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

/**
 * Trauma level badge
 */
function TraumaLevelBadge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    1: "bg-red-500/20 text-red-400 border-red-500/30",
    2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    3: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    4: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border
        ${colors[level] || colors[4]}
      `}
    >
      Level {level} Trauma
    </span>
  );
}

export function HospitalCard({
  hospital,
  userDistance,
  nearestResorts = [],
  onDirectionsClick,
}: HospitalCardProps) {
  const { expandedId, highlightedConnectionIndex, toggleExpand, setHighlightedConnection } = useSelectionStore();
  const { distanceUnit } = useSettingsStore();
  const [showReportForm, setShowReportForm] = useState(false);

  const isExpanded = expandedId === hospital.id;

  const handleClick = () => {
    toggleExpand(hospital.id);
    if (!isExpanded) {
      trackItemSelect("hospital", hospital.name, hospital.state);
    }
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackReportOpen("hospital", hospital.name);
    setShowReportForm(true);
  };

  const handleResortClick = (
    e: React.MouseEvent,
    resort: ResortWithDistance
  ) => {
    e.stopPropagation();
    if (onDirectionsClick) {
      onDirectionsClick(
        hospital.lat,
        hospital.lon,
        resort.lat,
        resort.lon,
        hospital.name,
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
      data-hospital-id={hospital.id}
      onClick={handleClick}
      className={`
        p-4 rounded-lg
        bg-bg-card border border-border
        cursor-pointer
        transition-all duration-200
        hover:border-accent-danger
        ${isExpanded ? "border-accent-danger ring-1 ring-accent-danger/20" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="font-semibold text-text-primary">🚑 {hospital.name}</span>
          <span
            className={`text-xs transition-transform duration-200 flex-shrink-0 mt-0.5 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hospital.hasEmergency && (
            <Badge variant="danger">ER</Badge>
          )}
          <Badge>{hospital.state}</Badge>
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
          📍 {hospital.city}, {hospital.state}
        </span>
        {hospital.traumaLevel && (
          <TraumaLevelBadge level={hospital.traumaLevel} />
        )}
        {hospital.nearestResortDist !== undefined && (
          <DistanceBadge miles={hospital.nearestResortDist} icon="🏔️" />
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
        itemType="hospital"
        itemName={hospital.name}
        itemId={hospital.id}
        onSubmit={(report) => {
          trackReportSubmit("hospital", hospital.name, report.category);
        }}
      />
    </div>
  );
}

