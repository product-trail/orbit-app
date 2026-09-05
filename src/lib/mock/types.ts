// Types mirror the Orbit database schema (spec section 31) so this mock
// layer can be swapped for real Supabase queries later without reshaping
// the UI. Dates are ISO strings ("YYYY-MM-DD") for simplicity.

export type Role = "owner" | "member";

export type WorkType =
  | "Task"
  | "Analysis"
  | "PRD"
  | "Experiment"
  | "Stakeholder"
  | "Launch"
  | "Review"
  | "Other";

export type WorkStatus =
  | "Backlog"
  | "In Progress"
  | "In Design"
  | "In PRD"
  | "PRD Complete"
  | "Ready for Tech Walkthrough"
  | "In Development"
  | "QA / Validation"
  | "Blocked"
  | "Completed";

export type Priority = "P0" | "P1" | "P2" | "P3";
export type Impact = "High" | "Medium" | "Low";

export type IdeaStatus =
  | "Captured"
  | "Exploring"
  | "Validated"
  | "Rejected"
  | "Converted";

export type InitiativeStatus = "Discovery" | "In Progress" | "At Risk" | "Shipped";

export type Profile = {
  id: string;
  name: string;
  initials: string;
  // Only populated for the signed-in user (from their auth session) — other
  // members' emails aren't exposed by the schema (see profiles table).
  email?: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
};

export type WorkItem = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: WorkType;
  status: WorkStatus;
  priority: Priority;
  impact: Impact;
  ownerId: string;
  createdBy: string;
  dueDate: string | null;
  /** The due date this item had before it was rescheduled while overdue —
   * kept as a visible "missed" record, not cleared on reschedule. */
  previousDueDate: string | null;
  jiraId: string | null;
  jiraUrl: string | null;
  initiativeId: string | null;
  productArea: string | null;
  blocked: boolean;
  blockerDescription: string | null;
  /** Narrative description of the expected business outcome, e.g. "increase
   * landing page conversion by 2%" — distinct from the coarse `impact` enum. */
  expectedImpact: string | null;
  /** Fractional stack-rank order within the Business Prioritization queue.
   * `null` means the item hasn't been moved there. Reordering sets this to
   * the midpoint of its new neighbors' ranks, so drags never require
   * renumbering the whole list. */
  businessRank: number | null;
  /** Absolute-value business impact for the Business Prioritization view
   * (e.g. "No. of Signups" in the Paytm Postpaid use case) — distinct from
   * the coarse High/Medium/Low `impact` enum. */
  expectedSignups: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type Idea = {
  id: string;
  workspaceId: string;
  title: string;
  problem: string;
  description: string;
  impact: Impact;
  status: IdeaStatus;
  createdBy: string;
  initiativeId: string | null;
  productArea: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Initiative = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  objective: string;
  ownerId: string;
  status: InitiativeStatus;
  expectedImpact: string;
  metric: string | null;
  currentValue: string | null;
  targetValue: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoadmapItem = {
  id: string;
  workspaceId: string;
  initiativeId: string;
  startDate: string;
  targetDate: string;
  status: InitiativeStatus;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  workspaceId: string;
  workItemId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Standup = {
  id: string;
  workspaceId: string;
  userId: string;
  date: string;
  yesterday: string[];
  today: string[];
  blocked: string[];
  createdAt: string;
};

export type ActivityLog = {
  id: string;
  workspaceId: string;
  userId: string;
  entityType: "work_item" | "idea" | "initiative" | "standup" | "member";
  entityId: string;
  action: string;
  createdAt: string;
};

export type WorkspaceSeed = {
  workspace: Workspace;
  members: WorkspaceMember[];
  profiles: Profile[];
  workItems: WorkItem[];
  ideas: Idea[];
  initiatives: Initiative[];
  roadmapItems: RoadmapItem[];
  comments: Comment[];
  standups: Standup[];
  activityLogs: ActivityLog[];
};
