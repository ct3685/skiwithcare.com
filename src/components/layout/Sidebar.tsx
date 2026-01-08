import { useState, useRef, useEffect } from "react";
import { useFilterStore, useSelectionStore, useLocationStore } from "@/stores";
import { geocodeAddress } from "@/stores/locationStore";
import { SearchInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { EmergencyGuide, EmergencyGuideTrigger } from "@/components/ui/EmergencyGuide";
import { trackSearch, trackFilterChange, trackNearMeClick } from "@/utils/analytics";
import type { Coordinates } from "@/types";

interface SidebarProps {
  states: string[];
  children: React.ReactNode;
  /** Number of items currently shown */
  itemCount?: number;
  /** Current sort origin info */
  sortOrigin?: { type: "user" | "map"; coords: Coordinates } | null;
}

export function Sidebar({ states, children, itemCount, sortOrigin }: SidebarProps) {
  const { mode } = useSelectionStore();
  const {
    searchQuery,
    setSearchQuery,
    selectedState,
    setSelectedState,
    maxDistance,
    setMaxDistance,
  } = useFilterStore();

  const {
    userLocation,
    isLoading,
    error: locationError,
    requestLocation,
    clear: clearLocation,
    setUserLocation,
    setError: setLocationError,
  } = useLocationStore();

  const [localDistance, setLocalDistance] = useState(maxDistance);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);

  // Debounced search tracking
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounced tracking
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length > 2) {
        trackSearch(value, mode);
      }
    }, 1000);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setSelectedState(value);
    trackFilterChange("state", value || "all", mode);
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDistance(Number(e.target.value));
  };

  const handleDistanceCommit = () => {
    setMaxDistance(localDistance);
    trackFilterChange("distance", localDistance, mode);
  };

  const handleNearMeClick = async () => {
    trackNearMeClick(mode);
    setShowAddressInput(false);
    setLocationError(null);
    await requestLocation();
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressQuery.trim()) return;

    setIsGeocoding(true);
    setLocationError(null);

    try {
      const result = await geocodeAddress(addressQuery);
      if (result) {
        setUserLocation(result.lat, result.lon, result.label, "manual");
        setShowAddressInput(false);
        setAddressQuery("");
      } else {
        setLocationError("Could not find that address. Try a city, state or ZIP code.");
      }
    } catch {
      setLocationError("Failed to look up address. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleShowAddressInput = () => {
    setShowAddressInput(true);
    setLocationError(null);
  };

  const stateOptions = states.map((s) => ({ value: s, label: s }));

  // Format location label for sort indicator
  const getSortLabel = () => {
    if (!sortOrigin) return null;
    if (sortOrigin.type === "user") {
      return "your location";
    }
    return "map center";
  };

  return (
    <aside className="w-full md:w-96 md:min-w-[340px] md:max-w-[440px] bg-bg-secondary border-r border-border flex flex-col h-full overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search Row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={`Search ${mode}...`}
            />
          </div>
          <Button
            variant={userLocation ? "primary" : "secondary"}
            size="md"
            isLoading={isLoading}
            onClick={handleNearMeClick}
            className="whitespace-nowrap"
          >
            📍 Near Me
          </Button>
        </div>

        {/* Location Banner - Success */}
        {userLocation && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-accent-clinic/10 border border-accent-clinic/30">
            <div className="flex items-center gap-2 text-sm text-accent-clinic font-medium">
              <span>📍</span>
              <span className="truncate">{userLocation.label}</span>
            </div>
            <button
              onClick={clearLocation}
              className="p-1 rounded text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
              aria-label="Clear location"
            >
              ✕
            </button>
          </div>
        )}

        {/* Location Error - Show address input option */}
        {locationError && !showAddressInput && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <span>⚠️</span>
                <span>{locationError}</span>
              </div>
              <button
                onClick={() => setLocationError(null)}
                className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <button
              onClick={handleShowAddressInput}
              className="mt-2 text-xs text-accent-primary hover:text-accent-primary/80 underline"
            >
              Enter address manually instead →
            </button>
          </div>
        )}

        {/* Address Input Fallback */}
        {showAddressInput && (
          <form onSubmit={handleAddressSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-muted font-medium">
                Enter your location:
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddressInput(false);
                  setLocationError(null);
                }}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="City, State or ZIP code"
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                autoFocus
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isGeocoding}
                disabled={!addressQuery.trim()}
              >
                Go
              </Button>
            </div>
            {locationError && (
              <p className="text-xs text-amber-400">{locationError}</p>
            )}
          </form>
        )}

        {/* Filters Row */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-[100px]">
            <Select
              value={selectedState || ""}
              onChange={handleStateChange}
              options={stateOptions}
              placeholder="All States"
            />
          </div>
          <div className="flex-[2] min-w-[150px]">
            <Slider
              label="Max Distance"
              valueLabel={`${localDistance} mi`}
              min={10}
              max={200}
              step={5}
              value={localDistance}
              onChange={handleDistanceChange}
              onMouseUp={handleDistanceCommit}
              onTouchEnd={handleDistanceCommit}
            />
          </div>
        </div>

        {/* Emergency Guide Trigger */}
        <EmergencyGuideTrigger onClick={() => setShowEmergencyGuide(true)} />
      </div>

      {/* Results Header */}
      <div className="px-4 py-2 border-b border-border/50 bg-bg-tertiary/50">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            {itemCount !== undefined ? (
              <>
                <span className="font-semibold text-text-primary">{itemCount}</span>
                {" "}{mode} found
              </>
            ) : (
              `Loading ${mode}...`
            )}
          </span>
          {sortOrigin && (
            <span className="flex items-center gap-1">
              <span className={sortOrigin.type === "user" ? "text-accent-clinic" : "text-text-muted"}>
                {sortOrigin.type === "user" ? "📍" : "🗺️"}
              </span>
              Sorted by {getSortLabel()}
            </span>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {children}
      </div>

      {/* Emergency Guide Modal */}
      <EmergencyGuide
        isOpen={showEmergencyGuide}
        onClose={() => setShowEmergencyGuide(false)}
      />
    </aside>
  );
}
