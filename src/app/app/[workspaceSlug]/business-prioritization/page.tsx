"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { StatusBadge, BlockedBadge } from "@/components/workspace/badges";
import { WorkItemPanel } from "@/components/workspace/work-item-panel";
import { EmptyState } from "@/components/workspace/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_BIZ_COLUMN_LABELS } from "@/lib/business-prioritization";
import { cn } from "@/lib/utils";
import type { CustomFieldType, WorkItem } from "@/lib/mock/types";

// Sentinel drop-zone id for "drop below the last row" (moves an item to the
// very end of the queue) — distinct from any real work item id.
const END_ZONE = "__end__";

/** Formats a "YYYY-MM-DD" date for display, without the "No due date"
 * fallback wording used elsewhere — this cell has its own placeholder. */
function formatShortDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Click-to-edit table cell shared by Impact (Signups), Go-Live Date, and
 * any workspace-defined custom columns — one component instead of three
 * near-identical bits of state/markup. */
function InlineEditCell({
  value,
  type,
  placeholder,
  format,
  onSave,
}: {
  value: string | number | null;
  type: CustomFieldType;
  placeholder: string;
  format?: (value: string | number) => string;
  onSave: (value: string | number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function startEditing() {
    setDraft(value != null ? String(value) : "");
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      onSave(null);
    } else if (type === "number") {
      const n = Number(trimmed);
      onSave(Number.isNaN(n) ? null : n);
    } else {
      onSave(trimmed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        type={type}
        min={type === "number" ? "0" : undefined}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          else if (e.key === "Escape") setEditing(false);
        }}
        className="h-8 w-32"
      />
    );
  }

  return (
    <button
      type="button"
      className="text-sm text-foreground hover:text-brand-indigo hover:underline"
      onClick={startEditing}
    >
      {value != null && value !== "" ? (format ? format(value) : String(value)) : placeholder}
    </button>
  );
}

export default function BusinessPrioritizationPage() {
  const {
    workspace,
    workItems,
    businessPrioritizationFields,
    getProfile,
    updateWorkItemExpectedSignups,
    updateWorkItemGoLiveDate,
    updateWorkItemCustomField,
    removeFromBusinessPrioritization,
    reorderBusinessPrioritization,
  } = useWorkspaceData();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("item"));
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const labels = useMemo(
    () => ({ ...DEFAULT_BIZ_COLUMN_LABELS, ...workspace.settings.businessPrioritizationLabels }),
    [workspace.settings.businessPrioritizationLabels],
  );

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

  const columnCount = 6 + businessPrioritizationFields.length + 1;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task Prioritization</h1>
        <p className="text-sm text-muted-foreground">
          Stack-ranked with the business team by impact. Drag rows to reorder.
        </p>
      </div>

      {queued.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title="Nothing here yet"
          description='Work items become eligible once their status is "PRD Complete". Add one from its detail panel in Product Backlog.'
        />
      ) : (
        <>
          {/* Table — tablet and up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{labels.rank}</TableHead>
                  <TableHead>{labels.work}</TableHead>
                  <TableHead>{labels.impact}</TableHead>
                  <TableHead>{labels.status}</TableHead>
                  <TableHead>{labels.goLive}</TableHead>
                  <TableHead>{labels.owner}</TableHead>
                  {businessPrioritizationFields.map((field) => (
                    <TableHead key={field.id}>{field.label}</TableHead>
                  ))}
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
                    <TableCell className="font-mono text-xs text-muted-foreground">#{index}</TableCell>
                    <TableCell className="max-w-64">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">{item.title}</span>
                        {item.blocked && <BlockedBadge />}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InlineEditCell
                        value={item.expectedSignups}
                        type="number"
                        placeholder="Set"
                        format={(v) => `${Number(v).toLocaleString()} signups`}
                        onSave={(v) => updateWorkItemExpectedSignups(item.id, v as number | null)}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InlineEditCell
                        value={item.goLiveDate}
                        type="date"
                        placeholder="Update date"
                        format={(v) => formatShortDate(String(v))}
                        onSave={(v) => updateWorkItemGoLiveDate(item.id, v as string | null)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Avatar size="sm">
                          <AvatarFallback>{getProfile(item.ownerId).initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{getProfile(item.ownerId).name}</span>
                      </div>
                    </TableCell>
                    {businessPrioritizationFields.map((field) => (
                      <TableCell key={field.id} onClick={(e) => e.stopPropagation()}>
                        <InlineEditCell
                          value={item.customFieldValues[field.key] ?? null}
                          type={field.type}
                          placeholder="Set"
                          format={field.type === "date" ? (v) => formatShortDate(String(v)) : undefined}
                          onSave={(v) => updateWorkItemCustomField(item.id, field.key, v)}
                        />
                      </TableCell>
                    ))}
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
                  <TableCell colSpan={columnCount} />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Cards — phones only. Reordering is desktop-only (native drag
              and drop doesn't work well on touch), same limitation as the
              Kanban board elsewhere in the app. Custom columns are left off
              this compact view to keep it scannable on a phone. */}
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
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">#{index}</span>
                    <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                  </span>
                  {item.blocked && <BlockedBadge />}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {item.goLiveDate ? formatShortDate(item.goLiveDate) : "Go-live date not set"}
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
                  <StatusBadge status={item.status} />
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
