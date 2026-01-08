import { trackEvent } from "@/utils/analytics";

interface CallButtonProps {
  phone: string;
  label?: string;
  sublabel?: string;
  variant?: "primary" | "secondary" | "emergency";
  facilityType?: string;
  facilityName?: string;
  className?: string;
}

/**
 * One-tap call button with formatted phone number
 */
export function CallButton({
  phone,
  label = "Call",
  sublabel,
  variant = "secondary",
  facilityType,
  facilityName,
  className = "",
}: CallButtonProps) {
  // Clean phone number for tel: link
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (facilityType && facilityName) {
      trackEvent("call_click", {
        event_category: "engagement",
        facility_type: facilityType,
        facility_name: facilityName,
        phone_number: cleanPhone,
      });
    }
    
    window.location.href = `tel:${cleanPhone}`;
  };

  const variants = {
    primary: `bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 
              text-white shadow-md hover:shadow-lg`,
    secondary: `bg-bg-tertiary hover:bg-green-500/10 border border-border hover:border-green-500/30 
                text-text-primary`,
    emergency: `bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20`,
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center gap-2 px-4 py-2.5 
        text-sm font-semibold rounded-lg
        transition-all duration-200
        ${variants[variant]}
        ${className}
      `}
    >
      <span className="text-lg">📞</span>
      <div className="text-left">
        <div>{label}</div>
        {sublabel && (
          <div className="text-xs opacity-80 font-normal">{sublabel}</div>
        )}
      </div>
    </button>
  );
}

/**
 * Compact inline call link
 */
export function CallLink({
  phone,
  className = "",
}: {
  phone: string;
  className?: string;
}) {
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  return (
    <a
      href={`tel:${cleanPhone}`}
      onClick={(e) => e.stopPropagation()}
      className={`text-green-400 hover:text-green-300 hover:underline ${className}`}
    >
      {phone}
    </a>
  );
}
