"use client";

import { OrbitLoader } from "@/components/brand/orbit-loader";

type AuthLoadingOverlayProps = {
  title: string;
  description?: string;
};

/**
 * Full-viewport loading state shown while an auth request (sign in, sign
 * up, OAuth redirect) is in flight. Those calls chain a Supabase Auth
 * round-trip with a follow-up server render of the destination page, which
 * can take a few seconds — long enough that, with no visual feedback, the
 * previous UI looked frozen and invited people to reload or double-submit.
 * Covering the screen (rather than just disabling the button) gives
 * continuous motion + a status message, and blocks stray clicks on the
 * form underneath for the same reason a modal would.
 *
 * Kept mostly see-through (light dim + light blur) rather than an opaque
 * panel — the form stays recognizable behind it, which reads as "still
 * there, just waiting" instead of replacing the screen outright.
 */
export function AuthLoadingOverlay({ title, description }: AuthLoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[2px]"
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card/95 px-10 py-8 shadow-xl">
        <OrbitLoader size={104} />
        <div className="flex flex-col items-center gap-1 px-6 text-center">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  );
}
