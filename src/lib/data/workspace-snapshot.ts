import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  initialsOf,
  mapActivityLog,
  mapBusinessPrioritizationField,
  mapComment,
  mapIdea,
  mapInitiative,
  mapMember,
  mapProfile,
  mapRoadmapItem,
  mapStandup,
  mapWorkItem,
  mapWorkspace,
} from "@/lib/data/mappers";
import type { Profile, WorkspaceSeed, WorkspaceSummary } from "@/lib/mock/types";

export { initialsOf };

export type WorkspaceSnapshot = WorkspaceSeed & { currentUserId: string };

/**
 * Loads everything a workspace's app shell needs in one pass, straight from
 * Postgres (RLS-gated). Returns null if there's no signed-in user, the slug
 * doesn't resolve to a workspace, or the signed-in user isn't a member of it
 * — callers should treat all three the same way (redirect/404).
 */
export async function getWorkspaceSnapshot(slug: string): Promise<WorkspaceSnapshot | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workspaceRow } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!workspaceRow) return null;

  const workspaceId = workspaceRow.id;

  const [
    memberRes,
    workItemsRes,
    ideasRes,
    initiativesRes,
    roadmapRes,
    commentsRes,
    standupsRes,
    activityRes,
    bizFieldsRes,
  ] = await Promise.all([
    supabase.from("workspace_members").select("*").eq("workspace_id", workspaceId),
    supabase
      .from("work_items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase.from("ideas").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase
      .from("initiatives")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase.from("roadmap_items").select("*").eq("workspace_id", workspaceId),
    supabase.from("comments").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
    supabase.from("standups").select("*").eq("workspace_id", workspaceId).order("date", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("business_prioritization_fields")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true }),
  ]);

  // RLS returns an empty set here for anyone who isn't a member (see
  // is_workspace_member in 0002_rls_policies.sql) — a workspace always has
  // at least its owner as a member, so an empty result means "not a member",
  // not "no members yet".
  const memberRows = memberRes.data ?? [];
  if (memberRows.length === 0) return null;

  const userIds = memberRows.map((m) => m.user_id);
  const { data: profileRows } = await supabase.from("profiles").select("*").in("id", userIds);

  const workspace = mapWorkspace(workspaceRow);
  const members = memberRows.map(mapMember);
  const profiles: Profile[] = (profileRows ?? []).map((p) =>
    mapProfile(p, p.id === user.id ? (user.email ?? undefined) : undefined),
  );
  const workItems = (workItemsRes.data ?? []).map(mapWorkItem);
  const ideas = (ideasRes.data ?? []).map(mapIdea);
  const initiatives = (initiativesRes.data ?? []).map(mapInitiative);
  const roadmapItems = (roadmapRes.data ?? []).map(mapRoadmapItem);
  const comments = (commentsRes.data ?? []).map(mapComment);
  const standups = (standupsRes.data ?? []).map(mapStandup);
  const activityLogs = (activityRes.data ?? []).map(mapActivityLog);
  const businessPrioritizationFields = (bizFieldsRes.data ?? []).map(mapBusinessPrioritizationField);

  return {
    workspace,
    members,
    profiles,
    workItems,
    ideas,
    initiatives,
    roadmapItems,
    comments,
    standups,
    activityLogs,
    businessPrioritizationFields,
    currentUserId: user.id,
  };
}

/** All workspaces the signed-in user belongs to (for the workspace switcher / post-login routing). */
export async function getMyWorkspaces(): Promise<WorkspaceSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberRows } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id);
  const workspaceIds = (memberRows ?? []).map((m) => m.workspace_id);
  if (workspaceIds.length === 0) return [];

  const { data: workspaceRows } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .in("id", workspaceIds)
    .order("created_at", { ascending: true });

  return (workspaceRows ?? []).map((w) => ({ id: w.id, name: w.name, slug: w.slug }));
}
