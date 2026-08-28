import { redirect } from "next/navigation";
import { getMyWorkspaces } from "@/lib/data/workspace-snapshot";

/**
 * Post-login landing point. There's no per-user "last visited workspace"
 * yet, so this always sends people to their first workspace (stable order —
 * see getMyWorkspaces), or into onboarding if they don't have one yet.
 * Unauthenticated requests never reach here: proxy.ts (src/proxy.ts) redirects
 * them to /login first.
 */
export default async function AppIndexPage() {
  const workspaces = await getMyWorkspaces();

  if (workspaces.length === 0) {
    redirect("/onboarding/workspace");
  }

  redirect(`/app/${workspaces[0]!.slug}`);
}
