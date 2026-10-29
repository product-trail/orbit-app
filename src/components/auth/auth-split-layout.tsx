import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Shared chrome for /login and /signup (spec section 26: unauthenticated
 * users should only reach Landing/Login/Signup/Password-reset). Left panel
 * is the brand banner, hidden below `lg` so the form stays full-width and
 * readable on small screens.
 *
 * The banner image is scaled to always match the panel's full *width*
 * (`w-full h-auto`, no `max-w` cap) so it reaches edge-to-edge with no
 * padded gap before the white form panel starts - a `max-w-xl` cap used to
 * leave a flat margin of the panel's background color around it instead.
 * `items-center` lets it float vertically centered if its proportional
 * height comes up short of the panel's height, rather than stretching it to
 * fill the full height: an `object-cover`-style fill was tried and rejected
 * because at narrower `lg`-range window widths the panel is taller relative
 * to its width than this image's own aspect ratio, so filling the full
 * height would force a crop wide enough to cut into the "Where product work
 * comes together" tagline baked into the artwork.
 */
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <div className="hidden w-1/2 shrink-0 items-center overflow-hidden bg-[#000612] lg:flex">
        <Image
          src="/auth-banner.png"
          alt="Orbits - where product work comes together"
          width={1672}
          height={941}
          priority
          className="h-auto w-full"
        />
      </div>
      <div className="flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
