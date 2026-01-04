import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-tertiary text-text-muted",
  success: "bg-accent-success/20 text-accent-success border border-accent-success/30",
  warning: "bg-accent-warning/20 text-accent-warning border border-accent-warning/30",
  danger: "bg-accent-danger/20 text-accent-danger border border-accent-danger/30",
  info: "bg-accent-clinic/20 text-accent-clinic border border-accent-clinic/30",
  outline: "bg-transparent border border-border text-text-secondary",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-medium
        rounded-md
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/**
 * Distance badge with automatic color coding
 */
interface DistanceBadgeProps {
  miles: number;
  icon?: string;
  className?: string;
}

export function DistanceBadge({ miles, icon = "📍", className = "" }: DistanceBadgeProps) {
  const variant: BadgeVariant = miles < 25 ? "success" : miles < 75 ? "warning" : "danger";
  
  return (
    <Badge variant={variant} className={className}>
      {icon} {miles.toFixed(1)} mi
    </Badge>
  );
}

/**
 * Pass network badge
 */
interface PassBadgeProps {
  pass: "epic" | "ikon" | "both" | "independent";
  className?: string;
}

const passColors: Record<string, string> = {
  epic: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  ikon: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  both: "bg-gradient-to-r from-purple-500/20 to-orange-500/20 text-text-primary border border-purple-500/30",
  independent: "bg-bg-tertiary text-text-muted",
};

export function PassBadge({ pass, className = "" }: PassBadgeProps) {
  const label = pass === "both" ? "Epic + Ikon" : pass.charAt(0).toUpperCase() + pass.slice(1);
  
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-medium
        rounded-md
        ${passColors[pass]}
        ${className}
      `}
    >
      {label}
    </span>
  );
}

/**
 * Provider badge for dialysis clinics
 */
interface ProviderBadgeProps {
  provider: "davita" | "fresenius" | "independent" | "other";
  className?: string;
}

const providerColors: Record<string, string> = {
  davita: "bg-green-500/20 text-green-400 border border-green-500/30",
  fresenius: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  independent: "bg-bg-tertiary text-text-muted",
  other: "bg-bg-tertiary text-text-muted",
};

export function ProviderBadge({ provider, className = "" }: ProviderBadgeProps) {
  // Handle undefined/missing provider - default to DaVita for existing data
  const safeProvider = provider || "davita";
  const label = safeProvider === "davita" ? "DaVita" : 
                safeProvider === "fresenius" ? "Fresenius" :
                safeProvider.charAt(0).toUpperCase() + safeProvider.slice(1);
  
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-medium
        rounded-md
        ${providerColors[safeProvider] || providerColors.other}
        ${className}
      `}
    >
      {label}
    </span>
  );
}

