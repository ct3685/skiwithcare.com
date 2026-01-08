/**
 * Skeleton loading components for better perceived performance
 */

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-bg-tertiary rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton card matching the structure of facility cards
 */
export function SkeletonCard() {
  return (
    <div className="p-4 rounded-lg bg-bg-card border border-border space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/**
 * Multiple skeleton cards for list loading state
 */
export function SkeletonCardList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for the sidebar header/stats
 */
export function SkeletonSidebarHeader() {
  return (
    <div className="flex items-center justify-between py-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
