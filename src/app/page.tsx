import { redirect } from "next/navigation";

/**
 * Phase 1 has no marketing/landing page yet — send visitors straight into
 * the demo workspace so the full product experience is reachable from `/`.
 */
export default function RootPage() {
  redirect("/app/postpaid-product-team");
}
