"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { inviteMemberAction, removeMemberAction } from "@/lib/actions/workspace-members";
import {
  initialsOf,
  mapComment,
  mapIdea,
  mapInitiative,
  mapRoadmapItem,
  mapWorkItem,
} from "@/lib/data/mappers";
import type { WorkspaceSnapshot } from "@/lib/data/workspace-snapshot";
import type {
  ActivityLog,
  Comment,
  Idea,
  IdeaStatus,
  Impact,
  Initiative,
  Priority,
  Profile,
  RoadmapItem,
  Role,
  Standup,
  WorkItem,
  WorkStatus,
  Workspace,
  WorkspaceMember,
} from "@/lib/mock/types";

type NewWorkItemInput = Pick<
  WorkItem,
  "title" | "description" | "type" | "priority" | "impact" | "ownerId" | "dueDate"
> &
  Partial<Pick<WorkItem, "productArea" | "initiativeId" | "jiraId" | "jiraUrl">>;

type NewIdeaInput = Pick<Idea, "title" | "problem" | "description" | "impact"> &
  Partial<Pick<Idea, "productArea">>;

type NewInitiativeInput = Pick<Initiative, "name" | "objective" | "ownerId" | "expectedImpact"> &
  Partial<Pick<Initiative, "metric" | "currentValue" | "targetValue">> & {
    startDate: string;
    targetDate: string;
  };

type StandupInput = Pick<Standup, "yesterday" | "today" | "blocked">;

type InviteMemberInput = {
  name: string;
  email: string;
  role: Role;
};

type WorkspaceDataValue = {
  workspace: Workspace;
  members: WorkspaceMember[];
  profiles: Profile[];
  currentUserId: string;
  currentRole: Role;
  workItems: WorkItem[];
  ideas: Idea[];
  initiatives: Initiative[];
  roadmapItems: RoadmapItem[];
  comments: Comment[];
  standups: Standup[];
  activityLogs: ActivityLog[];
  getProfile: (userId: string) => Profile;
  updateWorkItemStatus: (id: string, status: WorkStatus) => void;
  updateWorkItemPriority: (id: string, priority: Priority) => void;
  updateWorkItemImpact: (id: string, impact: Impact) => void;
  updateWorkItemOwner: (id: string, ownerId: string) => void;
  updateWorkItemDueDate: (id: string, dueDate: string | null) => void;
  updateWorkItemDescription: (id: string, description: string) => void;
  updateWorkItemJira: (id: string, jiraId: string | null, jiraUrl: string | null) => void;
  toggleWorkItemBlocked: (id: string, blocked: boolean, description?: string) => void;
  createWorkItem: (input: NewWorkItemInput) => Promise<WorkItem>;
  addComment: (workItemId: string, content: string) => Promise<void>;
  createIdea: (input: NewIdeaInput) => Promise<Idea>;
  updateIdeaStatus: (id: string, status: IdeaStatus) => void;
  convertIdeaToInitiative: (ideaId: string, input: NewInitiativeInput) => Promise<Initiative>;
  submitStandup: (input: StandupInput) => Promise<void>;
  inviteMember: (input: InviteMemberInput) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
};

const WorkspaceDataContext = createContext<WorkspaceDataValue | null>(null);

const nowIso = () => new Date().toISOString();
const todayDate = () => new Date().toISOString().slice(0, 10);

export function WorkspaceDataProvider({
  snapshot,
  children,
}: {
  snapshot: WorkspaceSnapshot;
  children: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const currentUserId = snapshot.currentUserId;

  const [members, setMembers] = useState<WorkspaceMember[]>(snapshot.members);
  const [profiles, setProfiles] = useState<Profile[]>(snapshot.profiles);
  const [workItems, setWorkItems] = useState<WorkItem[]>(snapshot.workItems);
  const [ideas, setIdeas] = useState<Idea[]>(snapshot.ideas);
  const [initiatives, setInitiatives] = useState<Initiative[]>(snapshot.initiatives);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>(snapshot.roadmapItems);
  const [comments, setComments] = useState<Comment[]>(snapshot.comments);
  const [standups, setStandups] = useState<Standup[]>(snapshot.standups);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(snapshot.activityLogs);

  const currentRole: Role = members.find((m) => m.userId === currentUserId)?.role ?? "member";

  const getProfile = (userId: string): Profile =>
    profiles.find((p) => p.id === userId) ?? {
      id: userId,
      name: "Unknown",
      initials: "?",
    };

  // Best-effort — the main action has already succeeded in the DB by the
  // time this runs, so a logging failure shouldn't surface as a user-facing
  // error. Only "work_item" | "idea" | "initiative" | "standup" are valid
  // activity_entity_type values in Postgres; "member" actions (invite/
  // remove) are intentionally not persisted (see activity_logs schema).
  const logActivity = (
    entry: Omit<ActivityLog, "id" | "workspaceId" | "createdAt" | "userId">,
  ) => {
    if (entry.entityType === "member") return;
    // Reassigned to a local const so the narrowing above (excluding "member")
    // survives inside the async closure below — TS doesn't retain property
    // narrowing on `entry.entityType` itself across a closure boundary.
    const entityType = entry.entityType;
    void (async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert({
          workspace_id: snapshot.workspace.id,
          user_id: currentUserId,
          entity_type: entityType,
          entity_id: entry.entityId,
          action: entry.action,
        })
        .select()
        .single();
      if (error || !data) {
        console.error("Failed to log activity", error);
        return;
      }
      setActivityLogs((prev) => [
        {
          id: data.id,
          workspaceId: data.workspace_id,
          userId: data.user_id,
          entityType: data.entity_type,
          entityId: data.entity_id,
          action: data.action,
          createdAt: data.created_at,
        },
        ...prev,
      ]);
    })();
  };

  const value = useMemo<WorkspaceDataValue>(
    () => ({
      workspace: snapshot.workspace,
      members,
      profiles,
      currentUserId,
      currentRole,
      workItems,
      ideas,
      initiatives,
      roadmapItems,
      comments,
      standups,
      activityLogs,
      getProfile,

      updateWorkItemStatus: (id, status) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        const completedAt = status === "Completed" ? nowIso() : previous.completedAt;
        setWorkItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status, updatedAt: nowIso(), completedAt } : item,
          ),
        );
        logActivity({
          entityType: "work_item",
          entityId: id,
          action: `changed status: "${previous.status}" → "${status}"`,
        });
        void (async () => {
          const { error } = await supabase
            .from("work_items")
            .update({ status, completed_at: completedAt })
            .eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update status", { description: error.message });
          }
        })();
      },

      updateWorkItemPriority: (id, priority) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        setWorkItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, priority, updatedAt: nowIso() } : item)),
        );
        void (async () => {
          const { error } = await supabase.from("work_items").update({ priority }).eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update priority", { description: error.message });
          }
        })();
      },

      updateWorkItemImpact: (id, impact) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        setWorkItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, impact, updatedAt: nowIso() } : item)),
        );
        void (async () => {
          const { error } = await supabase.from("work_items").update({ impact }).eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update impact", { description: error.message });
          }
        })();
      },

      updateWorkItemDueDate: (id, dueDate) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        setWorkItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, dueDate, updatedAt: nowIso() } : item)),
        );
        void (async () => {
          const { error } = await supabase
            .from("work_items")
            .update({ due_date: dueDate })
            .eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update due date", { description: error.message });
          }
        })();
      },

      updateWorkItemDescription: (id, description) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        setWorkItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, description, updatedAt: nowIso() } : item,
          ),
        );
        void (async () => {
          const { error } = await supabase
            .from("work_items")
            .update({ description })
            .eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update description", { description: error.message });
          }
        })();
      },

      updateWorkItemJira: (id, jiraId, jiraUrl) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        setWorkItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, jiraId, jiraUrl, updatedAt: nowIso() } : item,
          ),
        );
        logActivity({
          entityType: "work_item",
          entityId: id,
          action: jiraId ? `added JIRA: ${jiraId}` : "removed JIRA link",
        });
        void (async () => {
          const { error } = await supabase
            .from("work_items")
            .update({ jira_id: jiraId, jira_url: jiraUrl })
            .eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update JIRA link", { description: error.message });
          }
        })();
      },

      updateWorkItemOwner: (id, ownerId) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        setWorkItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ownerId, updatedAt: nowIso() } : item)),
        );
        logActivity({
          entityType: "work_item",
          entityId: id,
          action: `assigned work to ${getProfile(ownerId).name}`,
        });
        void (async () => {
          const { error } = await supabase
            .from("work_items")
            .update({ owner_id: ownerId })
            .eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't reassign owner", { description: error.message });
          }
        })();
      },

      toggleWorkItemBlocked: (id, blocked, description) => {
        const previous = workItems.find((w) => w.id === id);
        if (!previous) return;
        const blockerDescription = blocked
          ? (description ?? previous.blockerDescription)
          : null;
        setWorkItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, blocked, blockerDescription, updatedAt: nowIso() } : item,
          ),
        );
        logActivity({
          entityType: "work_item",
          entityId: id,
          action: blocked ? "marked task blocked" : "cleared blocker",
        });
        void (async () => {
          const { error } = await supabase
            .from("work_items")
            .update({ blocked, blocker_description: blockerDescription })
            .eq("id", id);
          if (error) {
            setWorkItems((prev) => prev.map((item) => (item.id === id ? previous : item)));
            toast.error("Couldn't update blocker", { description: error.message });
          }
        })();
      },

      createWorkItem: async (input) => {
        const { data, error } = await supabase
          .from("work_items")
          .insert({
            workspace_id: snapshot.workspace.id,
            title: input.title,
            description: input.description,
            type: input.type,
            status: "Backlog",
            priority: input.priority,
            impact: input.impact,
            owner_id: input.ownerId,
            created_by: currentUserId,
            due_date: input.dueDate,
            jira_id: input.jiraId ?? null,
            jira_url: input.jiraUrl ?? null,
            initiative_id: input.initiativeId ?? null,
            product_area: input.productArea ?? null,
            blocked: false,
            blocker_description: null,
          })
          .select()
          .single();
        if (error || !data) {
          throw new Error(error?.message ?? "Couldn't create work item.");
        }
        const item = mapWorkItem(data);
        setWorkItems((prev) => [item, ...prev]);
        logActivity({ entityType: "work_item", entityId: item.id, action: "created this work item" });
        return item;
      },

      addComment: async (workItemId, content) => {
        const { data, error } = await supabase
          .from("comments")
          .insert({
            workspace_id: snapshot.workspace.id,
            work_item_id: workItemId,
            user_id: currentUserId,
            content,
          })
          .select()
          .single();
        if (error || !data) {
          throw new Error(error?.message ?? "Couldn't add comment.");
        }
        setComments((prev) => [...prev, mapComment(data)]);
      },

      createIdea: async (input) => {
        const { data, error } = await supabase
          .from("ideas")
          .insert({
            workspace_id: snapshot.workspace.id,
            title: input.title,
            problem: input.problem,
            description: input.description,
            impact: input.impact,
            status: "Captured",
            created_by: currentUserId,
            initiative_id: null,
            product_area: input.productArea ?? null,
          })
          .select()
          .single();
        if (error || !data) {
          throw new Error(error?.message ?? "Couldn't capture idea.");
        }
        const idea = mapIdea(data);
        setIdeas((prev) => [idea, ...prev]);
        return idea;
      },

      updateIdeaStatus: (id, status) => {
        const previous = ideas.find((i) => i.id === id);
        if (!previous) return;
        setIdeas((prev) =>
          prev.map((idea) => (idea.id === id ? { ...idea, status, updatedAt: nowIso() } : idea)),
        );
        void (async () => {
          const { error } = await supabase.from("ideas").update({ status }).eq("id", id);
          if (error) {
            setIdeas((prev) => prev.map((idea) => (idea.id === id ? previous : idea)));
            toast.error("Couldn't update idea status", { description: error.message });
          }
        })();
      },

      convertIdeaToInitiative: async (ideaId, input) => {
        const { data: initiativeRow, error: rpcError } = await supabase.rpc(
          "convert_idea_to_initiative",
          {
            p_idea_id: ideaId,
            p_name: input.name,
            p_objective: input.objective,
            p_owner_id: input.ownerId,
            p_expected_impact: input.expectedImpact,
            p_metric: input.metric ?? null,
            p_current_value: input.currentValue ?? null,
            p_target_value: input.targetValue ?? null,
          },
        );
        if (rpcError || !initiativeRow) {
          throw new Error(rpcError?.message ?? "Couldn't convert idea to initiative.");
        }
        const initiative = mapInitiative(initiativeRow);

        const { data: roadmapRow, error: roadmapError } = await supabase
          .from("roadmap_items")
          .insert({
            workspace_id: snapshot.workspace.id,
            initiative_id: initiative.id,
            start_date: input.startDate,
            target_date: input.targetDate,
            status: initiative.status,
          })
          .select()
          .single();
        if (roadmapError || !roadmapRow) {
          toast.error("Initiative created, but the roadmap entry failed", {
            description: roadmapError?.message,
          });
        } else {
          setRoadmapItems((prev) => [mapRoadmapItem(roadmapRow), ...prev]);
        }

        setInitiatives((prev) => [initiative, ...prev]);
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === ideaId
              ? { ...idea, status: "Converted", initiativeId: initiative.id, updatedAt: nowIso() }
              : idea,
          ),
        );
        logActivity({
          entityType: "idea",
          entityId: ideaId,
          action: `converted idea to initiative: ${initiative.name}`,
        });
        return initiative;
      },

      submitStandup: async (input) => {
        const today = todayDate();
        const { data, error } = await supabase
          .from("standups")
          .upsert(
            {
              workspace_id: snapshot.workspace.id,
              user_id: currentUserId,
              date: today,
              yesterday: input.yesterday,
              today: input.today,
              blocked: input.blocked,
            },
            { onConflict: "workspace_id,user_id,date" },
          )
          .select()
          .single();
        if (error || !data) {
          throw new Error(error?.message ?? "Couldn't share standup.");
        }
        setStandups((prev) => [
          {
            id: data.id,
            workspaceId: data.workspace_id,
            userId: data.user_id,
            date: data.date,
            yesterday: data.yesterday,
            today: data.today,
            blocked: data.blocked,
            createdAt: data.created_at,
          },
          ...prev.filter((s) => !(s.userId === currentUserId && s.date === today)),
        ]);
      },

      inviteMember: async ({ name, email, role }) => {
        const result = await inviteMemberAction(snapshot.workspace.id, { name, email, role });
        if (!result.ok) {
          throw new Error(result.error);
        }
        setProfiles((prev) =>
          prev.some((p) => p.id === result.userId)
            ? prev
            : [...prev, { id: result.userId, name: result.name, initials: initialsOf(result.name) }],
        );
        setMembers((prev) => [
          ...prev,
          { id: result.memberId, workspaceId: snapshot.workspace.id, userId: result.userId, role: result.role },
        ]);
      },

      removeMember: async (userId) => {
        const profile = profiles.find((p) => p.id === userId);
        const result = await removeMemberAction(snapshot.workspace.id, userId);
        if (!result.ok) {
          throw new Error(result.error);
        }
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        void profile;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      snapshot,
      currentUserId,
      currentRole,
      members,
      profiles,
      workItems,
      ideas,
      initiatives,
      roadmapItems,
      comments,
      standups,
      activityLogs,
      supabase,
    ],
  );

  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>;
}

export function useWorkspaceData() {
  const ctx = useContext(WorkspaceDataContext);
  if (!ctx) throw new Error("useWorkspaceData must be used within a WorkspaceDataProvider");
  return ctx;
}
