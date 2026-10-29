import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyWorkspaces, getWorkspaceSnapshot } from "@/lib/data/workspace-snapshot";
import { WorkspaceDataProvider } from "@/components/workspace/workspace-data-provider";
import { AppShell } from "@/components/workspace/app-shell";

/**
 * Workspace-aware app shell (spec section 67 routing pattern:
 * /app/[workspaceSlug]/...). Every protected route resolves through this
 * single choke point: getWorkspaceSnapshot returns null for an unknown slug
 * or a slug the caller isn't a member of (RLS makes those two cases
 * indistinguishable, which is intentional - see its doc comment).
 *
 * Those two cases don't 404 - they redirect to /app, which re-resolves to a
 * workspace the signed-in user actually belongs to (or onboarding if they
 * have none). This matters for the common "stale/shared link" case: someone
 * sends a teammate a link to one workspace, the teammate is signed in but
 * belongs to a *different* one (or was removed from this one) - they should
 * land on their own workspace, not a dead-end 404. A truly signed-out
 * request should never reach here at all (proxy.ts redirects to /login
 * first), but we check explicitly anyway rather than assume that always
 * holds, and send them to /login if it somehow doesn't.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [snapshot, workspaces] = await Promise.all([
    getWorkspaceSnapshot(workspaceSlug),
    getMyWorkspaces(),
  ]);

  if (!snapshot) {
    redirect("/app");
  }

  return (
    <WorkspaceDataProvider snapshot={snapshot}>
      <AppShell slug={workspaceSlug} workspaces={workspaces}>
        {children}
      </AppShell>
    </WorkspaceDataProvider>
  );
}
