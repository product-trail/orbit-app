import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IdeaStatus, InitiativeStatus, Priority, WorkStatus } from "@/lib/mock/types";

const STATUS_STYLES: Record<WorkStatus, string> = {
  Backlog: "bg-muted text-muted-foreground",
  "In Progress": "bg-brand-indigo/10 text-brand-indigo",
  "In Design": "bg-secondary text-secondary-foreground",
  "In PRD": "bg-accent text-accent-foreground",
  "PRD Complete": "bg-teal/10 text-teal",
  "Ready for Tech Walkthrough": "bg-brand-purple/10 text-brand-purple",
  "In Development": "bg-info/10 text-info",
  "QA / Validation": "bg-warning/10 text-warning",
  Blocked: "bg-danger/10 text-danger",
  Completed: "bg-success/10 text-success",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  P0: "bg-danger/10 text-danger",
  P1: "bg-warning/10 text-warning",
  P2: "bg-info/10 text-info",
  P3: "bg-muted text-muted-foreground",
};

const IDEA_STATUS_STYLES: Record<IdeaStatus, string> = {
  Captured: "bg-muted text-muted-foreground",
  Exploring: "bg-info/10 text-info",
  Validated: "bg-success/10 text-success",
  Rejected: "bg-danger/10 text-danger",
  Converted: "bg-brand-purple/10 text-brand-purple",
};

const INITIATIVE_STATUS_STYLES: Record<InitiativeStatus, string> = {
  Discovery: "bg-info/10 text-info",
  "In Progress": "bg-brand-indigo/10 text-brand-indigo",
  "At Risk": "bg-warning/10 text-warning",
  Shipped: "bg-success/10 text-success",
};

function BadgePill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkStatus }) {
  return <BadgePill className={STATUS_STYLES[status]}>{status}</BadgePill>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <BadgePill className={PRIORITY_STYLES[priority]}>{priority}</BadgePill>;
}

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  return <BadgePill className={IDEA_STATUS_STYLES[status]}>{status}</BadgePill>;
}

export function InitiativeStatusBadge({ status }: { status: InitiativeStatus }) {
  return <BadgePill className={INITIATIVE_STATUS_STYLES[status]}>{status}</BadgePill>;
}

export function BlockedBadge() {
  return (
    <BadgePill className="bg-danger/10 text-danger">
      <AlertTriangle className="size-3" />
      Blocked
    </BadgePill>
  );
}

export const WORK_STATUSES: WorkStatus[] = [
  "Backlog",
  "In Progress",
  "In Design",
  "In PRD",
  "PRD Complete",
  "Ready for Tech Walkthrough",
  "In Development",
  "QA / Validation",
  "Blocked",
  "Completed",
];

export const PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
