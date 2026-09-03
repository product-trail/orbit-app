"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutDashboard, AlertTriangle, Clock, CheckCircle2, Flame } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { StatusBadge, PriorityBadge, BlockedBadge, byPriority } from "@/components/workspace/badges";
import { EmptyState } from "@/components/workspace/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  isOverdue,
  isDueToday,
  isCompletedThisWeek,
  isUpcoming,
  formatDueDate,
  timeAgo,
} from "@/lib/mock/date-helpers";
import type { Priority, WorkStatus } from "@/lib/mock/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { workItems, currentUserId, getProfile, activityLogs } = useWorkspaceData();

  const myWork = workItems.filter((w) => w.ownerId === currentUserId);
  // Blocked is independent of status — an item marked blocked counts here
  // regardless of completion. Active excludes both completed and blocked
  // items so it only reflects work that's actively movable right now.
  const blocked = myWork.filter((w) => w.blocked).sort(byPriority);
  const active = myWork.filter((w) => w.status !== "Completed" && !w.blocked);
  const dueToday = myWork.filter(isDueToday).sort(byPriority);
  const overdue = myWork.filter(isOverdue);
  const completedThisWeek = myWork.filter(isCompletedThisWeek);
  const upcoming = myWork.filter((w) => isUpcoming(w) && !isDueToday(w)).sort(byPriority);

  const stats = [
    { label: "Active", value: active.length, icon: LayoutDashboard, tone: "text-brand-indigo" },
    { label: "Due Today", value: dueToday.length, icon: Clock, tone: "text-info" },
    { label: "Overdue", value: overdue.length, icon: Flame, tone: "text-danger" },
    { label: "Blocked", value: blocked.length, icon: AlertTriangle, tone: "text-warning" },
    {
      label: "Completed This Week",
      value: completedThisWeek.length,
      icon: CheckCircle2,
      tone: "text-success",
    },
  ];

  const me = getProfile(currentUserId);
  const recentActivity = [...activityLogs]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {me.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your product work today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <s.icon className={`size-4 ${s.tone}`} />
              <div className="text-2xl font-semibold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Today
            </h2>
            {dueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due today. Nice.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {dueToday.map((item) => (
                  <WorkRow
                    key={item.id}
                    slug={workspaceSlug}
                    id={item.id}
                    title={item.title}
                    status={item.status}
                    priority={item.priority}
                    dueLabel="Due today"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing else on the horizon this week.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((item) => (
                  <WorkRow
                    key={item.id}
                    slug={workspaceSlug}
                    id={item.id}
                    title={item.title}
                    status={item.status}
                    priority={item.priority}
                    dueLabel={formatDueDate(item.dueDate)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Blocked
            </h2>
            {blocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing blocked right now.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {blocked.map((item) => (
                  <Link
                    key={item.id}
                    href={`/app/${workspaceSlug}/my-work?item=${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-brand-indigo/40"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.blockerDescription}</span>
                    </div>
                    <BlockedBadge />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="No activity yet"
              description="Activity across the workspace will show up here."
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col divide-y divide-border pt-0">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex flex-col gap-0.5 py-3 first:pt-4">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{getProfile(log.userId).name}</span>{" "}
                      {log.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkRow({
  slug,
  id,
  title,
  status,
  priority,
  dueLabel,
}: {
  slug: string;
  id: string;
  title: string;
  status: WorkStatus;
  priority: Priority;
  dueLabel: string;
}) {
  return (
    <Link
      href={`/app/${slug}/my-work?item=${id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-brand-indigo/40"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{dueLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <PriorityBadge priority={priority} />
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}
