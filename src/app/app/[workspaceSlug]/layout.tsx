import { notFound } from "next/navigation";
import { getMyWorkspaces, getWorkspaceSnapshot } from "@/lib/data/workspace-snapshot";
import { WorkspaceDataProvider } from "@/components/workspace/workspace-data-provider";
import { AppShell } from "@/components/workspace/app-shell";

/**
 * Workspace-aware app shell (spec section 67 routing pattern:
 * /app/[workspaceSlug]/...). Every protected route resolves through this
 * single choke point: getWorkspaceSnapshot returns null for a signed-out
 * user, an unknown slug, or a slug the caller isn't a member of (RLS makes
 * those three cases indistinguishable, which is intentional — see its
 * doc comment) — all three 404 rather than leak which slugs exist.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const [snapshot, workspaces] = await Promise.all([
    getWorkspaceSnapshot(workspaceSlug),
    getMyWorkspaces(),
  ]);

  if (!snapshot) {
    notFound();
  }

  return (
    <WorkspaceDataProvider snapshot={snapshot}>
      <AppShell slug={workspaceSlug} workspaces={workspaces}>
        {children}
      </AppShell>
    </WorkspaceDataProvider>
  );
}
