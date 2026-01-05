interface ConnectionLegendProps {
  itemType: "clinics" | "resorts";
  count: number;
}

/**
 * Legend showing connection line color meanings
 * Appears in bottom-left corner when connections are displayed
 */
export function ConnectionLegend({ itemType, count }: ConnectionLegendProps) {
  if (count === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-[1000] map-legend">
      <div className="text-xs font-medium text-text-primary mb-2">
        {count} nearby {itemType}
      </div>
      <div className="space-y-1.5">
        <div className="map-legend-item">
          <div className="map-legend-line map-legend-line--nearest" />
          <span>Nearest</span>
        </div>
        {count > 1 && (
          <div className="map-legend-item">
            <div className="map-legend-line map-legend-line--close" />
            <span>2nd-3rd closest</span>
          </div>
        )}
        {count > 3 && (
          <div className="map-legend-item">
            <div className="map-legend-line map-legend-line--other" />
            <span>Others</span>
          </div>
        )}
      </div>
    </div>
  );
}

