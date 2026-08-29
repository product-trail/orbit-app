import { redirect } from "next/navigation";

/**
 * No public marketing/landing page yet — send visitors into the app
 * resolver. Middleware (src/lib/supabase/middleware.ts) redirects
 * unauthenticated requests to /login before they ever reach here;
 * signed-in users get routed to their first real workspace (or
 * onboarding) by /app's resolver (src/app/app/page.tsx).
 */
export default function RootPage() {
  redirect("/app");
}
