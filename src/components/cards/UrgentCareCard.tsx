import { useState } from "react";
import type { Facility, ResortWithDistance } from "@/types";
import { useSelectionStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge, DistanceBadge, ReportForm } from "@/components/ui";
import { formatDistance } from "@/utils/formatters";
import { trackItemSelect, trackReportOpen, trackReportSubmit } from "@/utils/analytics";

interface UrgentCareCardProps {
  facility: Facility;
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

export function UrgentCareCard({
  facility,
  userDistance,
  nearestResorts = [],
  onDirectionsClick,
}: UrgentCareCardProps) {
  const { expandedId, highlightedConnectionIndex, toggleExpand, setHighlightedConnection } = useSelectionStore();
  const { distanceUnit } = useSettingsStore();
  const [showReportForm, setShowReportForm] = useState(false);

  const isExpanded = expandedId === facility.id;

  const handleClick = () => {
    toggleExpand(facility.id);
    if (!isExpanded) {
      trackItemSelect("urgent_care", facility.name, facility.state);
    }
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackReportOpen("urgent_care", facility.name);
    setShowReportForm(true);
  };

  const handleResortClick = (
    e: React.MouseEvent,
    resort: ResortWithDistance
  ) => {
    e.stopPropagation();
    if (onDirectionsClick) {
      onDirectionsClick(
        facility.lat,
        facility.lon,
        resort.lat,
        resort.lon,
        facility.name,
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
      data-urgent-care-id={facility.id}
      onClick={handleClick}
      className={`
        p-4 rounded-lg
        bg-bg-card border border-border
        cursor-pointer
        transition-all duration-200
        hover:border-orange-500
        ${isExpanded ? "border-orange-500 ring-1 ring-orange-500/20" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="font-semibold text-text-primary">🩹 {facility.name}</span>
          <span
            className={`text-xs transition-transform duration-200 flex-shrink-0 mt-0.5 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="warning">Urgent Care</Badge>
          <Badge>{facility.state}</Badge>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {userDistance !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            📍 {formatDistance(userDistance, distanceUnit)} away
          </span>
        )}
        {facility.city && (
          <span className="text-text-muted">
            📍 {facility.city}, {facility.state}
          </span>
        )}
        {facility.open24Hours && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">
            24/7
          </span>
        )}
        {facility.nearestResortDist !== undefined && (
          <DistanceBadge miles={facility.nearestResortDist} icon="🏔️" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Contact Info */}
          <div className="space-y-2 text-sm">
            {facility.address && (
              <p className="text-text-secondary">
                📍 {facility.address}, {facility.city}, {facility.state} {facility.zip}
              </p>
            )}
            {facility.phone && (
              <p>
                📞{" "}
                <a
                  href={`tel:${facility.phone.replace(/[^0-9+]/g, "")}`}
                  className="text-orange-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {facility.phone}
                </a>
              </p>
            )}
            {facility.website && (
              <p>
                🌐{" "}
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Website
                </a>
              </p>
            )}
          </div>

          {/* Nearest Resorts */}
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
                      highlightedConnectionIndex === i ? "text-amber-400" : "text-orange-400"
                    }`}>
                      {formatDistance(resort.distance, distanceUnit)} →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification & Report */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            {facility.lastVerified ? (
              <p className="text-xs text-text-muted">
                ✓ Last verified: {facility.lastVerified}
                {facility.sourceUrl && (
                  <>
                    {" "}•{" "}
                    <a
                      href={facility.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent-primary hover:underline"
                    >
                      Source
                    </a>
                  </>
                )}
              </p>
            ) : (
              <span />
            )}
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
        itemName={facility.name}
        itemId={facility.id}
        onSubmit={(report) => {
          trackReportSubmit("urgent_care", facility.name, report.category);
        }}
      />
    </div>
  );
}
