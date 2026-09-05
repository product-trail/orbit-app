"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { StatusBadge, PriorityBadge, BlockedBadge } from "@/components/workspace/badges";
import { WorkItemPanel } from "@/components/workspace/work-item-panel";
import { EmptyState } from "@/components/workspace/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDueDate } from "@/lib/mock/date-helpers";
import { cn } from "@/lib/utils";
import type { WorkItem } from "@/lib/mock/types";

// Sentinel drop-zone id for "drop below the last row" (moves an item to the
// very end of the queue) — distinct from any real work item id.
const END_ZONE = "__end__";

export default function BusinessPrioritizationPage() {
  const {
    workItems,
    getProfile,
    updateWorkItemExpectedSignups,
    removeFromBusinessPrioritization,
    reorderBusinessPrioritization,
  } = useWorkspaceData();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("item"));
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingSignupsId, setEditingSignupsId] = useState<string | null>(null);
  const [signupsDraft, setSignupsDraft] = useState("");

  // Only items moved here (via the CTA on a "PRD Complete" item) show up —
  // this is a curated queue, not a filtered view of the full backlog.
  const queued = useMemo(
    () =>
      workItems
        .filter((w): w is WorkItem & { businessRank: number } => w.businessRank != null)
        .sort((a, b) => a.businessRank - b.businessRank),
    [workItems],
  );

  // Reordering never renumbers the whole list — it just gives the dropped
  // item a rank that's the midpoint of its new neighbors (or half the first
  // item's rank if dropped at the very top, or +1000 past the last item if
  // dropped at the very end).
  function dropBefore(targetId: string) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverId(null);
      const draggedId = e.dataTransfer.getData("text/work-item-id");
      if (!draggedId || draggedId === targetId) return;
      const withoutDragged = queued.filter((i) => i.id !== draggedId);
      const targetIndex = withoutDragged.findIndex((i) => i.id === targetId);
      if (targetIndex === -1) return;
      const before = withoutDragged[targetIndex - 1];
      const target = withoutDragged[targetIndex];
      const newRank = before ? (before.businessRank + target.businessRank) / 2 : target.businessRank - 1000;
      reorderBusinessPrioritization(draggedId, newRank);
    };
  }

  function dropAtEnd(e: React.DragEvent) {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData("text/work-item-id");
    if (!draggedId) return;
    const withoutDragged = queued.filter((i) => i.id !== draggedId);
    const last = withoutDragged[withoutDragged.length - 1];
    if (!last) return;
    reorderBusinessPrioritization(draggedId, last.businessRank + 1000);
  }

  function saveSignups(id: string) {
    const n = signupsDraft.trim() ? Number(signupsDraft) : null;
    updateWorkItemExpectedSignups(id, n != null && !Number.isNaN(n) ? n : null);
    setEditingSignupsId(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Business Prioritization</h1>
        <p className="text-sm text-muted-foreground">
          Stack-ranked with the business team by impact — separate from engineering&apos;s own priority
          order. Drag rows to reorder.
        </p>
      </div>

      {queued.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title="Nothing here yet"
          description='Work items become eligible once their status is "PRD Complete" — add one from its detail panel in Product Backlog.'
        />
      ) : (
        <>
          {/* Table — tablet and up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Work</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Impact (Signups)</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {queued.map((item, index) => (
                  <TableRow
                    key={item.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/work-item-id", item.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverId(item.id);
                    }}
                    onDragLeave={() => setDragOverId((id) => (id === item.id ? null : id))}
                    onDrop={dropBefore(item.id)}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "cursor-grab active:cursor-grabbing",
                      dragOverId === item.id && "bg-brand-indigo/5",
                    )}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{index + 1}</TableCell>
                    <TableCell className="max-w-64">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">{item.title}</span>
                        {item.blocked && <BlockedBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Avatar size="sm">
                          <AvatarFallback>{getProfile(item.ownerId).initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{getProfile(item.ownerId).name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={item.priority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDueDate(item.dueDate)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {editingSignupsId === item.id ? (
                        <Input
                          type="number"
                          min="0"
                          autoFocus
                          value={signupsDraft}
                          onChange={(e) => setSignupsDraft(e.target.value)}
                          onBlur={() => saveSignups(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            else if (e.key === "Escape") setEditingSignupsId(null);
                          }}
                          className="h-8 w-28"
                        />
                      ) : (
                        <button
                          type="button"
                          className="text-sm text-foreground hover:text-brand-indigo hover:underline"
                          onClick={() => {
                            setSignupsDraft(item.expectedSignups != null ? String(item.expectedSignups) : "");
                            setEditingSignupsId(item.id);
                          }}
                        >
                          {item.expectedSignups != null ? `${item.expectedSignups.toLocaleString()} signups` : "Set"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="text-xs font-medium text-danger hover:underline"
                        onClick={() => removeFromBusinessPrioritization(item.id)}
                      >
                        Remove
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Drop target for moving an item below the last row. */}
                <TableRow
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(END_ZONE);
                  }}
                  onDragLeave={() => setDragOverId((id) => (id === END_ZONE ? null : id))}
                  onDrop={dropAtEnd}
                  className={cn("h-6 hover:bg-transparent", dragOverId === END_ZONE && "bg-brand-indigo/5")}
                >
                  <TableCell colSpan={9} />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Cards — phones only. Reordering is desktop-only (native drag
              and drop doesn't work well on touch), same limitation as the
              Kanban board elsewhere in the app. */}
          <div className="flex flex-col gap-2 md:hidden">
            {queued.map((item, index) => (
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
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">#{index + 1}</span>
                    <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                  </span>
                  {item.blocked && <BlockedBadge />}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {item.type} · {formatDueDate(item.dueDate)}
                  </span>
                  <span className="shrink-0">
                    {item.expectedSignups != null ? `${item.expectedSignups.toLocaleString()} signups` : "Impact not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Avatar size="sm">
                      <AvatarFallback>{getProfile(item.ownerId).initials}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs text-muted-foreground">{getProfile(item.ownerId).name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <WorkItemPanel itemId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
