import { useState, useRef, useEffect } from "react";
import { useFilterStore, useSelectionStore, useLocationStore } from "@/stores";
import { SearchInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
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

  const { userLocation, isLoading, requestLocation, clear: clearLocation } = useLocationStore();

  const [localDistance, setLocalDistance] = useState(maxDistance);

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
    await requestLocation();
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

        {/* Location Banner */}
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
    </aside>
  );
}
