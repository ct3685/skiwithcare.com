import { openDirections } from "@/utils/directions";
import { useLocationStore } from "@/stores";
import { trackDirectionsButtonClick } from "@/utils/analytics";

interface DirectionsButtonProps {
  destLat: number;
  destLon: number;
  destName: string;
  facilityType: "resort" | "clinic" | "hospital" | "urgent_care";
  variant?: "primary" | "compact";
  className?: string;
}

/**
 * One-tap directions button that opens native maps app
 */
export function DirectionsButton({
  destLat,
  destLon,
  destName,
  facilityType,
  variant = "primary",
  className = "",
}: DirectionsButtonProps) {
  const { userLocation } = useLocationStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    trackDirectionsButtonClick(facilityType, destName);
    
    openDirections({
      destLat,
      destLon,
      destName,
      originLat: userLocation?.lat,
      originLon: userLocation?.lon,
    });
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md
          bg-accent-primary/10 text-accent-primary border border-accent-primary/30
          hover:bg-accent-primary/20 hover:border-accent-primary/50
          transition-all duration-200 ${className}`}
        title="Get Directions"
      >
        <span>🧭</span>
        <span>Directions</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 
        text-sm font-semibold rounded-lg
        bg-gradient-to-r from-accent-primary to-accent-tertiary text-white
        hover:from-accent-primary/90 hover:to-accent-tertiary/90
        shadow-md hover:shadow-lg
        transition-all duration-200 ${className}`}
    >
      <span className="text-lg">🧭</span>
      <span>Get Directions</span>
    </button>
  );
}
