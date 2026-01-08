import { useState } from "react";
import { trackShare } from "@/utils/analytics";
import { getGoogleMapsUrl } from "@/utils/directions";

interface ShareButtonProps {
  title: string;
  text: string;
  lat: number;
  lon: number;
  facilityType: "resort" | "clinic" | "hospital" | "urgent_care";
  className?: string;
}

/**
 * Share button using Web Share API with clipboard fallback
 */
export function ShareButton({
  title,
  text,
  lat,
  lon,
  facilityType,
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = getGoogleMapsUrl(lat, lon, title);
  const shareData = {
    title,
    text: `${text}\n`,
    url,
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Try native share API first (mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        trackShare(facilityType, title, "native");
        return;
      } catch (err) {
        // User cancelled or error - fall through to clipboard
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      setCopied(true);
      trackShare(facilityType, title, "clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort - select and copy
      const textArea = document.createElement("textarea");
      textArea.value = `${title}\n${text}\n${url}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      trackShare(facilityType, title, "fallback");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md
        bg-bg-tertiary text-text-secondary border border-border
        hover:bg-bg-card hover:text-text-primary hover:border-accent-primary/30
        transition-all duration-200 ${className}`}
      title={copied ? "Copied!" : "Share location"}
    >
      <span>{copied ? "✓" : "📤"}</span>
      <span>{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
