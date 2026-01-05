import { Polyline } from "react-leaflet";

/**
 * Connection destination with coordinates and rank
 */
interface ConnectionDestination {
  lat: number;
  lon: number;
  rank: number;
}

interface ConnectionLinesProps {
  /** Origin point coordinates */
  origin: { lat: number; lon: number };
  /** Array of destination points with rank (0-indexed) */
  destinations: ConnectionDestination[];
  /** Optional highlighted destination index (-1 for none) */
  highlightedIndex?: number;
}

/**
 * Get line style based on rank
 * - Rank 0 (nearest): Green, solid, thick
 * - Rank 1-2: Blue, solid, medium
 * - Rank 3+: Gray, dashed, thin
 */
function getLineStyle(rank: number, isHighlighted: boolean) {
  if (isHighlighted) {
    return {
      color: "#fbbf24", // Yellow/amber for highlighted
      weight: 4,
      opacity: 1,
      dashArray: undefined,
    };
  }

  if (rank === 0) {
    return {
      color: "#4ade80", // Green
      weight: 3,
      opacity: 0.9,
      dashArray: undefined,
    };
  }

  if (rank < 3) {
    return {
      color: "#60a5fa", // Blue
      weight: 2,
      opacity: 0.6,
      dashArray: undefined,
    };
  }

  return {
    color: "#6b7280", // Gray
    weight: 2,
    opacity: 0.5,
    dashArray: "6,6",
  };
}

/**
 * Renders polylines connecting an origin point to multiple destinations.
 * Lines are color-coded by rank (distance order).
 */
export function ConnectionLines({
  origin,
  destinations,
  highlightedIndex = -1,
}: ConnectionLinesProps) {
  if (!destinations.length) return null;

  return (
    <>
      {destinations.map((dest, index) => {
        const isHighlighted = index === highlightedIndex;
        const style = getLineStyle(dest.rank, isHighlighted);

        return (
          <Polyline
            key={`connection-${index}`}
            positions={[
              [origin.lat, origin.lon],
              [dest.lat, dest.lon],
            ]}
            pathOptions={{
              color: style.color,
              weight: style.weight,
              opacity: style.opacity,
              dashArray: style.dashArray,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        );
      })}
    </>
  );
}

