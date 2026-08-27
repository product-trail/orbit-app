import { cn } from "@/lib/utils";

type OrbitLogoProps = {
  /** "full" renders the symbol + wordmark. "symbol" renders the mark only. */
  variant?: "full" | "symbol";
  /** Pixel size of the symbol (square). */
  size?: number;
  className?: string;
};

/**
 * Orbit brand mark: a minimalist orbital ring with a small orbiting node,
 * rendered in the purple/indigo brand gradient. Uses `currentColor` for the
 * wordmark so it inherits the surrounding text color in both themes.
 */
export function OrbitLogo({
  variant = "full",
  size = 28,
  className,
}: OrbitLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <OrbitSymbol size={size} />
      {variant === "full" && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Orbit
        </span>
      )}
    </div>
  );
}

export function OrbitSymbol({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Orbit"
    >
      <defs>
        <linearGradient
          id="orbit-ring-gradient"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="url(#orbit-ring-gradient)"
        strokeWidth="2.5"
      />
      <circle cx="16" cy="16" r="2" fill="url(#orbit-ring-gradient)" />
      <circle cx="24.4" cy="8.9" r="3" fill="url(#orbit-ring-gradient)" />
    </svg>
  );
}
