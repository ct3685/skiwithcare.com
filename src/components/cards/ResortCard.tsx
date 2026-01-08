import { useState } from "react";
import type { Resort, ClinicWithDistance, HospitalWithDistance } from "@/types";
import { useSelectionStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { Badge, DistanceBadge, PassBadge, ReportForm } from "@/components/ui";
import { formatDistance } from "@/utils/formatters";
import { trackItemSelect, trackReportOpen, trackReportSubmit } from "@/utils/analytics";

interface ResortCardProps {
  resort: Resort;
  userDistance?: number;
  nearestClinics?: ClinicWithDistance[];
  nearestHospitals?: HospitalWithDistance[];
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
  nearestHospitals = [],
  onDirectionsClick,
}: ResortCardProps) {
  const { expandedId, toggleExpand, setHighlightedConnectionIndex } =
    useSelectionStore();
  const { distanceUnit } = useSettingsStore();
  const [showReportForm, setShowReportForm] = useState(false);

  const isExpanded = expandedId === resort.id;
  const nearestHospital = nearestHospitals[0];
  const hasSkiPatrol = !!resort.skiPatrolPhone;

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackReportOpen("resort", resort.name);
    setShowReportForm(true);
  };

  const handleClick = () => {
    toggleExpand(resort.id);
    if (!isExpanded) {
      trackItemSelect("resort", resort.name, resort.state);
    }
  };

  const handleCallClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, "")}`;
  };

  const handleHospitalClick = (
    e: React.MouseEvent,
    hospital: HospitalWithDistance,
    index: number
  ) => {
    e.stopPropagation();
    setHighlightedConnectionIndex(index);
    if (onDirectionsClick) {
      onDirectionsClick(
        resort.lat,
        resort.lon,
        hospital.lat,
        hospital.lon,
        resort.name,
        hospital.name,
        hospital.distance
      );
    }
  };

  const handleClinicClick = (
    e: React.MouseEvent,
    clinic: ClinicWithDistance,
    index: number
  ) => {
    e.stopPropagation();
    // Clinics come after hospitals in the connection list
    setHighlightedConnectionIndex(nearestHospitals.length + index);
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
        ${
          isExpanded
            ? "border-accent-primary ring-1 ring-accent-primary/20"
            : ""
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="font-semibold text-text-primary">
            🏔️ {resort.name}
          </span>
          <span
            className={`text-xs transition-transform duration-200 flex-shrink-0 mt-0.5 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PassBadge pass={resort.passNetwork} />
          <Badge>{resort.state}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {userDistance !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-clinic/20 border border-accent-clinic/30 text-accent-clinic text-xs font-semibold">
            📍 {formatDistance(userDistance, distanceUnit)} away
          </span>
        )}
        {hasSkiPatrol && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">
            ⛑️ Patrol Info
          </span>
        )}
        {nearestHospital && (
          <DistanceBadge miles={nearestHospital.distance} icon="🚑" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Ski Patrol Section - Primary Emergency Contact */}
          {(hasSkiPatrol || resort.resortPhone) && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
              <p className="text-xs text-green-400 mb-2 font-bold flex items-center gap-1">
                ⛑️ ON-MOUNTAIN EMERGENCY
              </p>

              {/* Ski Patrol Call Button */}
              {resort.skiPatrolPhone && (
                <button
                  onClick={(e) => handleCallClick(e, resort.skiPatrolPhone!)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📞</span>
                    <div className="text-left">
                      <div className="text-sm">Call Ski Patrol</div>
                      <div className="text-xs opacity-80">
                        {resort.skiPatrolPhone}
                      </div>
                    </div>
                  </div>
                  <span className="text-lg">→</span>
                </button>
              )}

              {/* Ski Patrol Location */}
              {resort.skiPatrolLocation && (
                <p className="text-xs text-text-muted">
                  📍 {resort.skiPatrolLocation}
                </p>
              )}

              {/* Resort Phone Fallback */}
              {resort.resortPhone && !resort.skiPatrolPhone && (
                <button
                  onClick={(e) => handleCallClick(e, resort.resortPhone!)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-green-500/20 border border-green-500/30 text-text-primary font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📞</span>
                    <div className="text-left">
                      <div className="text-sm">Call Resort</div>
                      <div className="text-xs text-text-muted">
                        {resort.resortPhone}
                      </div>
                    </div>
                  </div>
                  <span>→</span>
                </button>
              )}

              {/* Resort Website */}
              {resort.website && (
                <a
                  href={resort.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-green-400 hover:text-green-300 mt-2 inline-block"
                >
                  🌐 Resort Website →
                </a>
              )}
            </div>
          )}

          {/* No Patrol Info Message */}
          {!hasSkiPatrol && !resort.resortPhone && (
            <div className="bg-bg-tertiary rounded-lg p-3 border border-border">
              <p className="text-xs text-text-muted mb-1 font-medium">
                ⛑️ Ski Patrol Contact
              </p>
              <p className="text-sm text-text-secondary">
                Contact info not yet verified. In an emergency, call{" "}
                <span className="font-bold">911</span> or speak to any lift
                operator.
              </p>
            </div>
          )}

          {/* Nearest Hospitals - Emergency Rooms */}
          {nearestHospitals.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Nearest Emergency Rooms:
              </p>
              <div className="space-y-2">
                {nearestHospitals.slice(0, 3).map((hospital, i) => (
                  <div
                    key={hospital.id}
                    onClick={(e) => handleHospitalClick(e, hospital, i)}
                    onMouseEnter={() => setHighlightedConnectionIndex(i)}
                    onMouseLeave={() => setHighlightedConnectionIndex(null)}
                    className="flex items-center justify-between p-2 rounded-lg 
                    transition-all duration-200 cursor-pointer
                    bg-bg-tertiary hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {i + 1}. {hospital.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {hospital.city}, {hospital.state}
                        {hospital.traumaLevel && (
                          <span className="ml-1 text-red-400">
                            • Level {hospital.traumaLevel} Trauma
                          </span>
                        )}
                        {hospital.phone && (
                          <span className="ml-1">• {hospital.phone}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold ml-2 text-red-400">
                      {formatDistance(hospital.distance, distanceUnit)} →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearest Dialysis Clinics - Secondary Care */}
          {nearestClinics.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Dialysis Clinics Nearby:
              </p>
              <div className="space-y-2">
                {nearestClinics.slice(0, 2).map((clinic, i) => (
                  <div
                    key={clinic.ccn}
                    onClick={(e) => handleClinicClick(e, clinic, i)}
                    onMouseEnter={() =>
                      setHighlightedConnectionIndex(nearestHospitals.length + i)
                    }
                    onMouseLeave={() => setHighlightedConnectionIndex(null)}
                    className="flex items-center justify-between p-2 rounded-lg 
                    transition-all duration-200 cursor-pointer
                    bg-bg-tertiary hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {clinic.facility}
                      </div>
                      <div className="text-xs text-text-muted">
                        {clinic.city}, {clinic.state}
                      </div>
                    </div>
                    <span className="text-sm font-semibold ml-2 text-cyan-400">
                      {formatDistance(clinic.distance, distanceUnit)} →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Info & Report Link */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            {resort.lastVerified ? (
              <p className="text-xs text-text-muted">
                ✓ Last verified: {resort.lastVerified}
                {resort.sourceUrl && (
                  <>
                    {" "}
                    •{" "}
                    <a
                      href={resort.sourceUrl}
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
        itemType="resort"
        itemName={resort.name}
        itemId={resort.id}
        onSubmit={(report) => {
          trackReportSubmit("resort", resort.name, report.category);
        }}
      />
    </div>
  );
}
