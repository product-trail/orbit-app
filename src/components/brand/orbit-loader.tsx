import { cn } from "@/lib/utils";

type OrbitLoaderProps = {
  /** Pixel size of the whole animation (square). */
  size?: number;
  className?: string;
};

/**
 * On-brand loading animation: a central "planet" with small bodies
 * orbiting it in circular motion, echoing the product name/logo. Pure CSS
 * (keyframes defined in globals.css) — no animation library needed for
 * something this small.
 *
 * Each orbit is a full-bleed absolutely-positioned div that rotates; the
 * dot sits at its edge, so rotating the wrapper traces a circle around the
 * shared center. Alternating cw/ccw directions and durations keep the
 * three bodies from ever lining up, which is what sells the "orbiting"
 * read instead of looking like a single spinner.
 */
export function OrbitLoader({ size = 96, className }: OrbitLoaderProps) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {/* Orbit path rings — faint, purely decorative. */}
      <div className="absolute inset-0 rounded-full border border-border/50" />
      <div className="absolute inset-[16%] rounded-full border border-border/35" />

      {/* Central planet */}
      <div
        className="absolute inset-0 m-auto rounded-full bg-gradient-to-br from-brand-indigo to-brand-purple shadow-[0_0_18px_-2px_var(--brand-indigo)]"
        style={{
          width: size * 0.34,
          height: size * 0.34,
          animation: "orbit-pulse 2.2s ease-in-out infinite",
        }}
      />

      {/* Outer orbit — clockwise */}
      <div
        className="absolute inset-0"
        style={{ animation: "orbit-spin-cw 2.6s linear infinite" }}
      >
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-brand-indigo"
          style={{ width: size * 0.1, height: size * 0.1 }}
        />
      </div>

      {/* Middle orbit — counter-clockwise */}
      <div
        className="absolute inset-[9%]"
        style={{ animation: "orbit-spin-ccw 1.9s linear infinite" }}
      >
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-info"
          style={{ width: size * 0.08, height: size * 0.08 }}
        />
      </div>

      {/* Inner orbit — clockwise, fastest */}
      <div
        className="absolute inset-[16%]"
        style={{ animation: "orbit-spin-cw 1.3s linear infinite" }}
      >
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-brand-purple"
          style={{ width: size * 0.065, height: size * 0.065 }}
        />
      </div>
    </div>
  );
}
