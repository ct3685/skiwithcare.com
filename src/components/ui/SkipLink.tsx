/**
 * Skip Link for keyboard navigation accessibility
 * Allows keyboard users to skip directly to main content
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg
        focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only announcements
 * Used for dynamic content changes
 */
export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * Live region for screen reader announcements
 */
export function LiveRegion({
  message,
  type = "polite",
}: {
  message: string;
  type?: "polite" | "assertive";
}) {
  if (!message) return null;
  
  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
