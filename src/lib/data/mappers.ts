/**
 * Pure snake_case (Postgres row) -> camelCase (app/mock type) converters.
 *
 * Deliberately has no "server-only" guard (unlike workspace-snapshot.ts) —
 * it's imported from WorkspaceDataProvider ("use client") to shape rows
 * returned by inserts/updates fired from the browser client.
 */
import type { Database } from "@/types/database";
import type {
  ActivityLog,
  Comment,
  Idea,
  Initiative,
  Profile,
  RoadmapItem,
  Standup,
  WorkItem,
  Workspace,
  WorkspaceMember,
} from "@/lib/mock/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceMemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];
type WorkItemRow = Database["public"]["Tables"]["work_items"]["Row"];
type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"];
type InitiativeRow = Database["public"]["Tables"]["initiatives"]["Row"];
type RoadmapItemRow = Database["public"]["Tables"]["roadmap_items"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type StandupRow = Database["public"]["Tables"]["standups"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]!.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

export function mapWorkspace(w: WorkspaceRow): Workspace {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    createdBy: w.created_by,
    createdAt: w.created_at,
  };
}

export function mapMember(m: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: m.id,
    workspaceId: m.workspace_id,
    userId: m.user_id,
    role: m.role,
  };
}

/** `email` is only ever known for the signed-in user's own row. */
export function mapProfile(p: ProfileRow, email?: string): Profile {
  return { id: p.id, name: p.name, initials: initialsOf(p.name), email };
}

export function mapWorkItem(w: WorkItemRow): WorkItem {
  return {
    id: w.id,
    workspaceId: w.workspace_id,
    title: w.title,
    description: w.description,
    type: w.type,
    status: w.status,
    priority: w.priority,
    impact: w.impact,
    ownerId: w.owner_id,
    createdBy: w.created_by,
    dueDate: w.due_date,
    jiraId: w.jira_id,
    jiraUrl: w.jira_url,
    initiativeId: w.initiative_id,
    productArea: w.product_area,
    blocked: w.blocked,
    blockerDescription: w.blocker_description,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    completedAt: w.completed_at,
  };
}

export function mapIdea(i: IdeaRow): Idea {
  return {
    id: i.id,
    workspaceId: i.workspace_id,
    title: i.title,
    problem: i.problem,
    description: i.description,
    impact: i.impact,
    status: i.status,
    createdBy: i.created_by,
    initiativeId: i.initiative_id,
    productArea: i.product_area,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  };
}

export function mapInitiative(i: InitiativeRow): Initiative {
  return {
    id: i.id,
    workspaceId: i.workspace_id,
    name: i.name,
    description: i.description,
    objective: i.objective,
    ownerId: i.owner_id,
    status: i.status,
    expectedImpact: i.expected_impact,
    metric: i.metric,
    currentValue: i.current_value,
    targetValue: i.target_value,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  };
}

export function mapRoadmapItem(r: RoadmapItemRow): RoadmapItem {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    initiativeId: r.initiative_id,
    startDate: r.start_date,
    targetDate: r.target_date,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapComment(c: CommentRow): Comment {
  return {
    id: c.id,
    workspaceId: c.workspace_id,
    workItemId: c.work_item_id,
    userId: c.user_id,
    content: c.content,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export function mapStandup(s: StandupRow): Standup {
  return {
    id: s.id,
    workspaceId: s.workspace_id,
    userId: s.user_id,
    date: s.date,
    yesterday: s.yesterday,
    today: s.today,
    blocked: s.blocked,
    createdAt: s.created_at,
  };
}

export function mapActivityLog(a: ActivityLogRow): ActivityLog {
  return {
    id: a.id,
    workspaceId: a.workspace_id,
    userId: a.user_id,
    entityType: a.entity_type,
    entityId: a.entity_id,
    action: a.action,
    createdAt: a.created_at,
  };
}
