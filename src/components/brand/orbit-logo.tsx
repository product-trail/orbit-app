import Image from "next/image";
import { cn } from "@/lib/utils";

type OrbitLogoProps = {
  /** "full" renders the symbol + wordmark. "symbol" renders the mark only. */
  variant?: "full" | "symbol";
  /** Pixel size of the symbol (square). */
  size?: number;
  className?: string;
};

/**
 * Orbit brand mark: the orbital ring + node icon (real logo asset,
 * `public/logo-mark.png`) paired with an "Orbit" wordmark rendered as
 * styled text so it inherits `text-foreground` and adapts across themes.
 */
export function OrbitLogo({
  variant = "full",
  size = 34,
  className,
}: OrbitLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <OrbitSymbol size={size} />
      {variant === "full" && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Orbits
        </span>
      )}
    </div>
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
