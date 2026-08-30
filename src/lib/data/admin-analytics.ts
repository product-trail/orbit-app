import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Product-level analytics — signups & activity across every workspace.
 *
 * Deliberately separate from workspace-snapshot.ts: that module is scoped to
 * a single workspace via RLS, but this needs to see across all of them, so
 * it goes through the service-role client (see admin.ts) instead. Access is
 * gated by ADMIN_EMAILS (server-only env var, comma-separated) rather than
 * any in-app role — this is a founder/ops view, not a workspace permission.
 *
 * There's no link to this page anywhere in the app nav; it's reached by
 * typing the URL directly, and even then only renders for an allow-listed
 * email. Everyone else gets treated the same as "page doesn't exist."
 */

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

export type AdminAnalytics = {
  viewerEmail: string;
  totals: {
    signups: number;
    workspaces: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
  };
  dailyActivity: { date: string; count: number }[];
  recentSignups: {
    id: string;
    name: string;
    email: string | null;
    createdAt: string;
    lastSignInAt: string | null;
  }[];
  workspaces: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    memberCount: number;
    workItemCount: number;
    ideaCount: number;
    initiativeCount: number;
  }[];
};

/**
 * Returns null for anyone who isn't signed in as an allow-listed admin —
 * callers should 404 rather than distinguish "not signed in" from "signed in
 * but not admin" (same treatment as getWorkspaceSnapshot's null case).
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;

  const admin = createAdminClient();

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cutoff30 = new Date(now - 30 * dayMs).toISOString();

  const [profilesRes, workspacesRes, membersRes, workItemsRes, ideasRes, initiativesRes, activityRes, authUsers] =
    await Promise.all([
      admin.from("profiles").select("id, name, created_at").order("created_at", { ascending: false }),
      admin.from("workspaces").select("id, name, slug, created_at").order("created_at", { ascending: false }),
      admin.from("workspace_members").select("workspace_id, user_id"),
      admin.from("work_items").select("workspace_id"),
      admin.from("ideas").select("workspace_id"),
      admin.from("initiatives").select("workspace_id"),
      admin
        .from("activity_logs")
        .select("user_id, created_at")
        .gte("created_at", cutoff30)
        .order("created_at", { ascending: false }),
      // Emails/last-login live in auth.users, not exposed via the public
      // REST schema — the admin API is the only way to read them.
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const profiles = profilesRes.data ?? [];
  const workspaces = workspacesRes.data ?? [];
  const members = membersRes.data ?? [];
  const workItems = workItemsRes.data ?? [];
  const ideas = ideasRes.data ?? [];
  const initiatives = initiativesRes.data ?? [];
  const activity = activityRes.data ?? [];
  const usersById = new Map(authUsers.data.users.map((u) => [u.id, u]));

  const activeSince = (cutoffMs: number) =>
    new Set(activity.filter((a) => new Date(a.created_at).getTime() >= cutoffMs).map((a) => a.user_id)).size;

  const dailyBuckets = new Map<string, number>();
  for (const row of activity) {
    const day = row.created_at.slice(0, 10);
    dailyBuckets.set(day, (dailyBuckets.get(day) ?? 0) + 1);
  }
  const dailyActivity = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * dayMs);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: dailyBuckets.get(key) ?? 0 };
  });

  const countByWorkspace = (rows: { workspace_id: string }[]) => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.workspace_id, (map.get(r.workspace_id) ?? 0) + 1);
    return map;
  };
  const memberCounts = countByWorkspace(members);
  const workItemCounts = countByWorkspace(workItems);
  const ideaCounts = countByWorkspace(ideas);
  const initiativeCounts = countByWorkspace(initiatives);

  return {
    viewerEmail: user.email ?? "",
    totals: {
      signups: profiles.length,
      workspaces: workspaces.length,
      activeToday: activeSince(now - dayMs),
      activeThisWeek: activeSince(now - 7 * dayMs),
      activeThisMonth: activeSince(now - 30 * dayMs),
    },
    dailyActivity,
    recentSignups: profiles.slice(0, 30).map((p) => {
      const authUser = usersById.get(p.id);
      return {
        id: p.id,
        name: p.name,
        email: authUser?.email ?? null,
        createdAt: p.created_at,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
      };
    }),
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      createdAt: w.created_at,
      memberCount: memberCounts.get(w.id) ?? 0,
      workItemCount: workItemCounts.get(w.id) ?? 0,
      ideaCount: ideaCounts.get(w.id) ?? 0,
      initiativeCount: initiativeCounts.get(w.id) ?? 0,
    })),
  };
}
