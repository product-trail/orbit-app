/**
 * Hand-written Supabase database types, matching supabase/migrations/*.sql.
 *
 * The Supabase CLI (which can generate this file automatically via
 * `supabase gen types typescript`) is not installed in this environment, so
 * this file must be kept in sync by hand whenever the schema changes.
 * Schema drift between this file and the live database is silent — it only
 * surfaces as a runtime error or a wrong-shaped object, so double-check this
 * file against the migrations after any schema edit.
 */

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
  | "In PRD"
  | "Ready for Tech Walkthrough"
  | "In Development"
  | "QA / Validation"
  | "Completed";

export type WorkPriority = "P0" | "P1" | "P2" | "P3";
export type WorkImpact = "High" | "Medium" | "Low";

export type IdeaStatus = "Captured" | "Exploring" | "Validated" | "Rejected" | "Converted";

export type InitiativeStatus = "Discovery" | "In Progress" | "At Risk" | "Shipped";

export type WorkspaceRole = "owner" | "member";

export type ActivityEntityType = "work_item" | "idea" | "initiative" | "standup";

type ProfilesRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspacesRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceMembersRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

type WorkItemsRow = {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  type: WorkType;
  status: WorkStatus;
  priority: WorkPriority;
  impact: WorkImpact;
  owner_id: string;
  created_by: string;
  due_date: string | null;
  jira_id: string | null;
  jira_url: string | null;
  initiative_id: string | null;
  product_area: string | null;
  blocked: boolean;
  blocker_description: string | null;
  expected_impact: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type IdeasRow = {
  id: string;
  workspace_id: string;
  title: string;
  problem: string;
  description: string;
  impact: WorkImpact;
  status: IdeaStatus;
  created_by: string;
  initiative_id: string | null;
  product_area: string | null;
  created_at: string;
  updated_at: string;
};

type InitiativesRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  objective: string;
  owner_id: string;
  status: InitiativeStatus;
  expected_impact: string;
  metric: string | null;
  current_value: string | null;
  target_value: string | null;
  created_at: string;
  updated_at: string;
};

type RoadmapItemsRow = {
  id: string;
  workspace_id: string;
  initiative_id: string;
  start_date: string;
  target_date: string;
  status: InitiativeStatus;
  created_at: string;
  updated_at: string;
};

type CommentsRow = {
  id: string;
  workspace_id: string;
  work_item_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type StandupsRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  date: string;
  yesterday: string[];
  today: string[];
  blocked: string[];
  created_at: string;
};

type ActivityLogsRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  entity_type: ActivityEntityType;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/** Row fields with a DB default become optional on insert. */
type InsertOf<Row, Defaulted extends keyof Row> = Omit<Row, Defaulted> &
  Partial<Pick<Row, Defaulted>>;

type ProfilesInsert = InsertOf<ProfilesRow, "avatar_url" | "created_at" | "updated_at">;
type WorkspacesInsert = InsertOf<WorkspacesRow, "id" | "created_at" | "updated_at">;
type WorkspaceMembersInsert = InsertOf<
  WorkspaceMembersRow,
  "id" | "role" | "created_at"
>;
type WorkItemsInsert = InsertOf<
  WorkItemsRow,
  | "id"
  | "description"
  | "type"
  | "status"
  | "priority"
  | "impact"
  | "due_date"
  | "jira_id"
  | "jira_url"
  | "initiative_id"
  | "product_area"
  | "blocked"
  | "blocker_description"
  | "expected_impact"
  | "created_at"
  | "updated_at"
  | "completed_at"
>;
type IdeasInsert = InsertOf<
  IdeasRow,
  | "id"
  | "description"
  | "impact"
  | "status"
  | "initiative_id"
  | "product_area"
  | "created_at"
  | "updated_at"
>;
type InitiativesInsert = InsertOf<
  InitiativesRow,
  | "id"
  | "description"
  | "objective"
  | "status"
  | "expected_impact"
  | "metric"
  | "current_value"
  | "target_value"
  | "created_at"
  | "updated_at"
>;
type RoadmapItemsInsert = InsertOf<
  RoadmapItemsRow,
  "id" | "status" | "created_at" | "updated_at"
>;
type CommentsInsert = InsertOf<CommentsRow, "id" | "created_at" | "updated_at">;
type StandupsInsert = InsertOf<
  StandupsRow,
  "id" | "yesterday" | "today" | "blocked" | "created_at"
>;
type ActivityLogsInsert = InsertOf<ActivityLogsRow, "id" | "metadata" | "created_at">;

type UpdateOf<Insert> = Partial<Insert>;

/**
 * postgrest-js's `GenericTable` constraint requires a `Relationships` array
 * (used for typing embedded `.select("foo(*)")` joins). This app doesn't
 * rely on that inference, so it's left empty — but the field must exist or
 * the whole `Database` type fails its constraint and every table's Row type
 * silently collapses to `never` (with no direct error pointing at this file).
 */
type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: UpdateOf<ProfilesInsert>;
      } & NoRelationships;
      workspaces: {
        Row: WorkspacesRow;
        Insert: WorkspacesInsert;
        Update: UpdateOf<WorkspacesInsert>;
      } & NoRelationships;
      workspace_members: {
        Row: WorkspaceMembersRow;
        Insert: WorkspaceMembersInsert;
        Update: UpdateOf<WorkspaceMembersInsert>;
      } & NoRelationships;
      work_items: {
        Row: WorkItemsRow;
        Insert: WorkItemsInsert;
        Update: UpdateOf<WorkItemsInsert>;
      } & NoRelationships;
      ideas: {
        Row: IdeasRow;
        Insert: IdeasInsert;
        Update: UpdateOf<IdeasInsert>;
      } & NoRelationships;
      initiatives: {
        Row: InitiativesRow;
        Insert: InitiativesInsert;
        Update: UpdateOf<InitiativesInsert>;
      } & NoRelationships;
      roadmap_items: {
        Row: RoadmapItemsRow;
        Insert: RoadmapItemsInsert;
        Update: UpdateOf<RoadmapItemsInsert>;
      } & NoRelationships;
      comments: {
        Row: CommentsRow;
        Insert: CommentsInsert;
        Update: UpdateOf<CommentsInsert>;
      } & NoRelationships;
      standups: {
        Row: StandupsRow;
        Insert: StandupsInsert;
        Update: UpdateOf<StandupsInsert>;
      } & NoRelationships;
      activity_logs: {
        Row: ActivityLogsRow;
        Insert: ActivityLogsInsert;
        Update: UpdateOf<ActivityLogsInsert>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace_with_owner: {
        Args: { p_name: string; p_slug: string };
        Returns: WorkspacesRow;
      };
      convert_idea_to_initiative: {
        Args: {
          p_idea_id: string;
          p_name: string;
          p_objective: string;
          p_owner_id: string;
          p_expected_impact: string;
          p_metric: string | null;
          p_current_value: string | null;
          p_target_value: string | null;
        };
        Returns: InitiativesRow;
      };
    };
    Enums: {
      work_type: WorkType;
      work_status: WorkStatus;
      work_priority: WorkPriority;
      work_impact: WorkImpact;
      idea_status: IdeaStatus;
      initiative_status: InitiativeStatus;
      workspace_role: WorkspaceRole;
      activity_entity_type: ActivityEntityType;
    };
    CompositeTypes: Record<string, never>;
  };
};
