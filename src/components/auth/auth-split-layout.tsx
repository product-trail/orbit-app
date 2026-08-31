import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Shared chrome for /login and /signup (spec section 26: unauthenticated
 * users should only reach Landing/Login/Signup/Password-reset). Left panel
 * is the brand banner, hidden below `lg` so the form stays full-width and
 * readable on small screens. The panel background (#000612) is sampled from
 * the banner artwork itself so the image blends into the panel with no
 * visible seam regardless of viewport height.
 */
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <div className="relative hidden w-1/2 shrink-0 items-center justify-center bg-[#000612] p-12 lg:flex">
        <Image
          src="/auth-banner.png"
          alt="Orbits - where product work comes together"
          width={1983}
          height={793}
          priority
          className="h-auto w-full max-w-xl"
        />
      </div>
      <div className="flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
