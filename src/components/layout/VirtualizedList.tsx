import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualizedListProps<T> {
  items: T[];
  estimateSize: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  className?: string;
  overscan?: number;
}

/**
 * Virtualized list component for rendering large lists efficiently.
 * Only renders items that are visible in the viewport.
 */
export function VirtualizedList<T>({
  items,
  estimateSize,
  renderItem,
  getKey,
  className = "",
  overscan = 5,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => getKey(items[index]),
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto ${className}`}
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to get virtualized list stats for display
 */
export function useVirtualizedStats(
  totalCount: number,
  visibleCount: number
): { showingCount: number; totalCount: number; isVirtualized: boolean } {
  return {
    showingCount: visibleCount,
    totalCount,
    isVirtualized: visibleCount < totalCount,
  };
}
