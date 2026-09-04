"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { List, Columns3, Search, ListTodo } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { StatusBadge, PriorityBadge, BlockedBadge, WORK_STATUSES, PRIORITIES, byPriority } from "@/components/workspace/badges";
import { WorkItemPanel } from "@/components/workspace/work-item-panel";
import { NewWorkItemDialog } from "@/components/workspace/new-work-item-dialog";
import { EmptyState } from "@/components/workspace/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDueDate, formatMonthLabel, reportMonthKey } from "@/lib/mock/date-helpers";
import type { WorkStatus } from "@/lib/mock/types";
import { cn, shortJiraId } from "@/lib/utils";

const ALL = "all";

export default function BacklogPage() {
  const { workItems, members, getProfile, initiatives, updateWorkItemStatus } = useWorkspaceData();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("item"));
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [monthFilter, setMonthFilter] = useState(ALL);

  const monthOptions = useMemo(() => {
    const keys = new Set(workItems.map(reportMonthKey));
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [workItems]);

  const filtered = useMemo(() => {
    return workItems
      .filter((item) => {
        if (search && !`${item.title} ${item.jiraId ?? ""}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (ownerFilter !== ALL && item.ownerId !== ownerFilter) return false;
        if (statusFilter !== ALL && item.status !== statusFilter) return false;
        if (priorityFilter !== ALL && item.priority !== priorityFilter) return false;
        if (monthFilter !== ALL && reportMonthKey(item) !== monthFilter) return false;
        return true;
      })
      .sort(byPriority);
  }, [workItems, search, ownerFilter, statusFilter, priorityFilter, monthFilter]);

  const hasAnyItems = workItems.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Product Backlog</h1>
          <p className="text-sm text-muted-foreground">
            Everything the team is working on - with or without a JIRA ticket.
          </p>
        </div>
        <NewWorkItemDialog />
      </div>

      {!hasAnyItems ? (
        <EmptyState
          icon={ListTodo}
          title="No work items yet"
          description="Create your first piece of product work - analysis, a PRD, a stakeholder follow-up, anything that isn't a JIRA ticket yet."
          action={<NewWorkItemDialog trigger={<Button size="sm">+ Add work item</Button>} />}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search work…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v ?? ALL)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Owner">
                  {(v: string) => (v === ALL ? "All owners" : getProfile(v).name)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All owners</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>{getProfile(m.userId).name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Status">
                  {(v: string) => (v === ALL ? "All statuses" : v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {WORK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? ALL)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Priority">
                  {(v: string) => (v === ALL ? "All priorities" : v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={(v) => setMonthFilter(v ?? ALL)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Month">
                  {(v: string) => (v === ALL ? "All time" : formatMonthLabel(v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All time</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Table view"
                onClick={() => setView("table")}
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Kanban view"
                onClick={() => setView("kanban")}
              >
                <Columns3 className="size-4" />
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching work"
              description="Try clearing a filter or searching a different term."
            />
          ) : view === "table" ? (
            <>
              {/* Table — tablet and up. Hidden on phones in favor of cards
                  below, since a 9-column table can't shrink to fit without
                  either horizontal scroll or unreadably cramped cells. */}
              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work</TableHead>
                      <TableHead>Initiative</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>JIRA</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <TableCell className="max-w-64">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-foreground">{item.title}</span>
                              {item.blocked && <BlockedBadge />}
                            </div>
                            {item.expectedImpact && (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.expectedImpact}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-muted-foreground">
                          {item.initiativeId
                            ? (initiatives.find((i) => i.id === item.initiativeId)?.name ?? "-")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.type}</TableCell>
                        <TableCell className="text-muted-foreground">{item.impact}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <PriorityBadge priority={item.priority} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Avatar size="sm">
                              <AvatarFallback>{getProfile(item.ownerId).initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {getProfile(item.ownerId).name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={item.status}
                            onValueChange={(v) => v && updateWorkItemStatus(item.id, v as WorkStatus)}
                          >
                            <SelectTrigger size="sm" className="border-none bg-transparent p-0 shadow-none">
                              <StatusBadge status={item.status} />
                            </SelectTrigger>
                            <SelectContent>
                              {WORK_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.jiraId ? shortJiraId(item.jiraId) : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{formatDueDate(item.dueDate)}</span>
                            {item.previousDueDate && (
                              <span className="text-xs text-muted-foreground/70 line-through">
                                {formatDueDate(item.previousDueDate)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards — phones only. */}
              <div className="flex flex-col gap-2 md:hidden">
                {filtered.map((item) => (
                  // A native <button> can't be used here — the Select below
                  // renders its own <button> trigger, and nested interactive
                  // buttons are invalid HTML. A div with a click handler
                  // (same pattern as the desktop table's clickable <tr>)
                  // avoids that while staying keyboard-accessible.
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedId(item.id);
                    }}
                    className="flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-brand-indigo/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                      {item.blocked && <BlockedBadge />}
                    </div>
                    {item.expectedImpact && (
                      <span className="truncate text-xs text-muted-foreground">{item.expectedImpact}</span>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">
                        {item.type}
                        {item.initiativeId && (
                          <>
                            {" · "}
                            {initiatives.find((i) => i.id === item.initiativeId)?.name ?? ""}
                          </>
                        )}
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <span>{formatDueDate(item.dueDate)}</span>
                        {item.previousDueDate && (
                          <span className="text-muted-foreground/70 line-through">
                            {formatDueDate(item.previousDueDate)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Avatar size="sm">
                          <AvatarFallback>{getProfile(item.ownerId).initials}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs text-muted-foreground">
                          {getProfile(item.ownerId).name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <PriorityBadge priority={item.priority} />
                        <Select
                          value={item.status}
                          onValueChange={(v) => v && updateWorkItemStatus(item.id, v as WorkStatus)}
                        >
                          <SelectTrigger size="sm" className="border-none bg-transparent p-0 shadow-none">
                            <StatusBadge status={item.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {WORK_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <KanbanBoard items={filtered} onOpen={setSelectedId} />
          )}
        </>
      )}

      <WorkItemPanel itemId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function KanbanBoard({
  items,
  onOpen,
}: {
  items: ReturnType<typeof useWorkspaceData>["workItems"];
  onOpen: (id: string) => void;
}) {
  const { getProfile, initiatives, updateWorkItemStatus } = useWorkspaceData();
  const [dragOverStatus, setDragOverStatus] = useState<WorkStatus | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {WORK_STATUSES.map((status) => {
        const columnItems = items.filter((i) => i.status === status).sort(byPriority);
        return (
          <div
            key={status}
            className={cn(
              "flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2",
              dragOverStatus === status && "border-brand-indigo bg-brand-indigo/5",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/work-item-id");
              if (id) updateWorkItemStatus(id, status);
              setDragOverStatus(null);
            }}
          >
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs font-semibold text-foreground">{status}</span>
              <span className="text-xs text-muted-foreground">{columnItems.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/work-item-id", item.id)}
                  onClick={() => onOpen(item.id)}
                  className="flex cursor-pointer flex-col gap-2 rounded-md border border-border bg-card p-2.5 shadow-sm hover:border-brand-indigo/40"
                >
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.initiativeId && (
                    <span className="truncate text-xs text-brand-indigo">
                      {initiatives.find((i) => i.id === item.initiativeId)?.name ?? ""}
                    </span>
                  )}
                  {item.expectedImpact && (
                    <span className="truncate text-xs text-muted-foreground">{item.expectedImpact}</span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={item.priority} />
                      {item.blocked && <BlockedBadge />}
                    </div>
                    <Avatar size="sm">
                      <AvatarFallback>{getProfile(item.ownerId).initials}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ))}
              {columnItems.length === 0 && (
                <p className="px-1 py-2 text-center text-xs text-muted-foreground">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
