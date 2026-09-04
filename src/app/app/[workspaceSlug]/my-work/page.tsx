"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListChecks } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { StatusBadge, PriorityBadge, BlockedBadge, WORK_STATUSES } from "@/components/workspace/badges";
import { WorkItemPanel } from "@/components/workspace/work-item-panel";
import { EmptyState } from "@/components/workspace/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatDueDate,
  formatMonthLabel,
  isOverdue,
  isDueToday,
  reportMonthKey,
} from "@/lib/mock/date-helpers";
import type { WorkItem, WorkStatus } from "@/lib/mock/types";

const FIXED_TABS_BEFORE = ["All", "Today", "Overdue", "Blocked"] as const;
const FIXED_TABS_AFTER = ["Completed"] as const;
type Tab = (typeof FIXED_TABS_BEFORE)[number] | (typeof FIXED_TABS_AFTER)[number] | WorkStatus;

// "Blocked" and "Completed" already have their own dedicated tabs above (the
// former for the independent `blocked` flag, the latter as the fixed final
// stage) — showing them again as a status tab would just be a confusing
// duplicate label, so they're left out of the dynamic set.
const STATUS_TABS_EXCLUDED = new Set<WorkStatus>(["Blocked", "Completed"]);

const SORT_OPTIONS = ["Priority", "Due Date", "Impact", "Status"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const ALL_MONTHS = "all";

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const IMPACT_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function itemsForTab(items: WorkItem[], tab: Tab): WorkItem[] {
  switch (tab) {
    case "All":
      return items;
    case "Today":
      return items.filter(isDueToday);
    case "Overdue":
      return items.filter(isOverdue);
    case "Blocked":
      // Blocked is independent of status — a task marked blocked shows up
      // here regardless of whether it's also Completed. Tabs are filtered
      // views, not mutually-exclusive buckets, so an item can appear under
      // both Blocked and Completed at once.
      return items.filter((w) => w.blocked);
    case "Completed":
      return items.filter((w) => w.status === "Completed");
    default:
      // Any other tab value is one of the actual pipeline statuses (e.g.
      // "In Design", "In Development") added dynamically below.
      return items.filter((w) => w.status === tab);
  }
}

export default function MyWorkPage() {
  const { workItems, currentUserId, initiatives } = useWorkspaceData();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("item"));
  const [tab, setTab] = useState<Tab>("All");
  const [sort, setSort] = useState<SortOption>("Priority");
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS);

  const myItems = useMemo(
    () => workItems.filter((w) => w.ownerId === currentUserId),
    [workItems, currentUserId],
  );

  const monthOptions = useMemo(() => {
    const keys = new Set(myItems.map(reportMonthKey));
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [myItems]);

  // Only show a tab for a pipeline status if the person actually has work
  // sitting in it right now — no point cluttering the row with "QA /
  // Validation" if nothing of theirs is there.
  const tabs = useMemo<Tab[]>(() => {
    const present = new Set(myItems.map((w) => w.status));
    const statusTabs = WORK_STATUSES.filter((s) => present.has(s) && !STATUS_TABS_EXCLUDED.has(s));
    return [...FIXED_TABS_BEFORE, ...statusTabs, ...FIXED_TABS_AFTER];
  }, [myItems]);

  const monthFiltered = useMemo(() => {
    if (monthFilter === ALL_MONTHS) return myItems;
    return myItems.filter((w) => reportMonthKey(w) === monthFilter);
  }, [myItems, monthFilter]);

  const sorted = useMemo(() => {
    const list = [...itemsForTab(monthFiltered, tab)];
    list.sort((a, b) => {
      switch (sort) {
        case "Priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "Due Date":
          return (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99");
        case "Impact":
          return IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
        case "Status":
          return WORK_STATUSES.indexOf(a.status) - WORK_STATUSES.indexOf(b.status);
        default:
          return 0;
      }
    });
    return list;
  }, [monthFiltered, tab, sort]);

  const hasAnyItems = myItems.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Work</h1>
          <p className="text-sm text-muted-foreground">Your personal queue across the workspace.</p>
        </div>

        {hasAnyItems && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Month</span>
              <Select value={monthFilter} onValueChange={(v) => setMonthFilter(v ?? ALL_MONTHS)}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Month">
                    {(v: string) => (v === ALL_MONTHS ? "All time" : formatMonthLabel(v))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_MONTHS}>All time</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Sort by</span>
              <Select value={sort} onValueChange={(v) => v && setSort(v as SortOption)}>
                <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {!hasAnyItems ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing assigned to you yet"
          description="Work items assigned to you will show up here."
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => v && setTab(v as Tab)}>
          {/* Scrolls horizontally instead of wrapping — the status tabs
              below are dynamic per-person, so this row can get long. */}
          <div className="overflow-x-auto pb-1">
            <TabsList>
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {itemsForTab(monthFiltered, t).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={tab} className="mt-4">
            {sorted.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="Nothing here"
                description="No work items match this view."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {sorted.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-brand-indigo/40"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                        {item.blocked && <BlockedBadge />}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.type} · {formatDueDate(item.dueDate)}
                        {item.initiativeId && (
                          <>
                            {" · "}
                            {initiatives.find((i) => i.id === item.initiativeId)?.name ?? ""}
                          </>
                        )}
                      </span>
                      {item.expectedImpact && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.expectedImpact}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <WorkItemPanel itemId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
