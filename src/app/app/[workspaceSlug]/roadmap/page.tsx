"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Milestone } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { InitiativeStatusBadge } from "@/components/workspace/badges";
import { InitiativePanel } from "@/components/workspace/initiative-panel";
import { WorkItemPanel } from "@/components/workspace/work-item-panel";
import { EmptyState } from "@/components/workspace/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDueDate } from "@/lib/mock/date-helpers";
import { cn } from "@/lib/utils";

const BAR_COLORS: Record<string, string> = {
  Discovery: "bg-info",
  "In Progress": "bg-brand-indigo",
  "At Risk": "bg-warning",
  Shipped: "bg-success",
};

function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export default function RoadmapPage() {
  const { initiatives, roadmapItems, workItems, getProfile } = useWorkspaceData();
  const searchParams = useSearchParams();
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(
    searchParams.get("item"),
  );
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      roadmapItems
        .map((rm) => ({
          roadmapItem: rm,
          initiative: initiatives.find((i) => i.id === rm.initiativeId),
        }))
        .filter((r) => r.initiative)
        .sort((a, b) => a.roadmapItem.startDate.localeCompare(b.roadmapItem.startDate)),
    [roadmapItems, initiatives],
  );

  const timeline = useMemo(() => {
    if (rows.length === 0) return null;
    const rangeStart = startOfMonth(
      parseDate(rows.reduce((min, r) => (r.roadmapItem.startDate < min ? r.roadmapItem.startDate : min), rows[0].roadmapItem.startDate)),
    );
    const latestTarget = rows.reduce(
      (max, r) => (r.roadmapItem.targetDate > max ? r.roadmapItem.targetDate : max),
      rows[0].roadmapItem.targetDate,
    );
    const rangeEnd = addMonths(startOfMonth(parseDate(latestTarget)), 1);
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    const percent = (d: Date) => ((d.getTime() - rangeStart.getTime()) / totalMs) * 100;

    const months: { label: string; left: number; width: number }[] = [];
    let cursor = rangeStart;
    while (cursor < rangeEnd) {
      const next = addMonths(cursor, 1);
      months.push({
        label: cursor.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        left: percent(cursor),
        width: percent(next) - percent(cursor),
      });
      cursor = next;
    }

    const bars = rows.map((r) => ({
      ...r,
      left: percent(parseDate(r.roadmapItem.startDate)),
      width: Math.max(percent(parseDate(r.roadmapItem.targetDate)) - percent(parseDate(r.roadmapItem.startDate)), 3),
    }));

    return { months, bars };
  }, [rows]);

  const linkedCount = (initiativeId: string) => workItems.filter((w) => w.initiativeId === initiativeId).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Roadmap</h1>
        <p className="text-sm text-muted-foreground">Where initiatives sit across the quarter.</p>
      </div>

      {rows.length === 0 || !timeline ? (
        <EmptyState
          icon={Milestone}
          title="Nothing on the roadmap yet"
          description="Convert an idea into an initiative to see it appear here."
        />
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="relative ml-48 h-6 border-b border-border">
                  {timeline.months.map((m) => (
                    <span
                      key={m.label + m.left}
                      className="absolute text-xs font-medium text-muted-foreground"
                      style={{ left: `${m.left}%` }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {timeline.bars.map(({ roadmapItem, initiative, left, width }) => {
                    if (!initiative) return null;
                    return (
                      <div key={roadmapItem.id} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedInitiativeId(initiative.id)}
                          className="w-48 shrink-0 truncate text-left text-sm font-medium text-foreground hover:text-brand-indigo"
                        >
                          {initiative.name}
                        </button>
                        <div className="relative h-6 flex-1">
                          <button
                            type="button"
                            onClick={() => setSelectedInitiativeId(initiative.id)}
                            className={cn(
                              "absolute h-6 rounded-md opacity-80 transition-opacity hover:opacity-100",
                              BAR_COLORS[roadmapItem.status] ?? "bg-muted",
                            )}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            aria-label={`${initiative.name} timeline`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Initiative</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Expected Impact</TableHead>
                  <TableHead>Linked Work</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ roadmapItem, initiative }) => {
                  if (!initiative) return null;
                  return (
                    <TableRow
                      key={initiative.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedInitiativeId(initiative.id)}
                    >
                      <TableCell className="max-w-64">
                        <span className="truncate font-medium text-foreground">{initiative.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Avatar size="sm">
                            <AvatarFallback>{getProfile(initiative.ownerId).initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {getProfile(initiative.ownerId).name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InitiativeStatusBadge status={initiative.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDueDate(roadmapItem.targetDate)}
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">
                        {initiative.expectedImpact}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{linkedCount(initiative.id)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <InitiativePanel
        initiativeId={selectedInitiativeId}
        onClose={() => setSelectedInitiativeId(null)}
        onOpenWorkItem={(id) => {
          setSelectedInitiativeId(null);
          setSelectedWorkItemId(id);
        }}
      />
      <WorkItemPanel itemId={selectedWorkItemId} onClose={() => setSelectedWorkItemId(null)} />
    </div>
  );
}
