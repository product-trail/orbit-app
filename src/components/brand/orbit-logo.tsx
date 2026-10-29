import Image from "next/image";
import { cn } from "@/lib/utils";

// Full lockup's natural aspect ratio (public/orbit-logo-full.png is
// 1200x350) - used to derive height from a given width, or vice versa,
// without distorting the image.
const FULL_LOGO_ASPECT = 1200 / 350;

type OrbitLogoProps = {
  /** "full" renders the single combined mark+wordmark lockup image.
   * "symbol" renders the ring mark only. */
  variant?: "full" | "symbol";
  /** Pixel size of the symbol (square) when variant="symbol". */
  size?: number;
  /** Pixel width of the lockup image when variant="full". */
  width?: number;
  className?: string;
};

/**
 * Orbit brand mark. `variant="full"` renders the single pre-composed
 * lockup image (`public/orbit-logo-full.png` - ring mark + "Orbits"
 * wordmark baked into one asset by design, not text rendered alongside an
 * icon) so the wordmark's custom typography/weight always matches the
 * brand exactly. `variant="symbol"` renders just the ring mark
 * (`public/logo-mark.png`) for places too cramped for the full lockup.
 */
export function OrbitLogo({
  variant = "full",
  size = 34,
  width = 160,
  className,
}: OrbitLogoProps) {
  if (variant === "symbol") {
    return <OrbitSymbol size={size} className={className} />;
  }

  return (
    <Image
      src="/orbit-logo-full.png"
      alt="Orbits"
      width={width}
      height={Math.round(width / FULL_LOGO_ASPECT)}
      className={cn("shrink-0", className)}
      priority
    />
  );
}

export function OrbitSymbol({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Orbits"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
